import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { CONFIG, getMaskedApiKey } from './config.js'
import { testGroqConnection, optimizeCode, chatWithGroq } from './services/groq.js'
import { benchmarkCode, runCode } from './services/piston.js'
import {
  saveOptimization,
  saveTransaction,
  generatePaymentDetails,
  verifyTransaction,
  testFirebaseConnection,
  getOptimizationHistory,
} from './services/firebase.js'
import Groq from 'groq-sdk'

const app = new Hono()

// Enable CORS for frontend requests
app.use(
  '*',
  cors({
    origin: '*',
    allowHeaders: ['Content-Type', 'X-Payment-TxID', 'Authorization'],
    allowMethods: ['GET', 'POST', 'OPTIONS'],
  })
)

// Health Diagnostic Endpoints
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    environment: CONFIG.NODE_ENV,
    devBypassPayment: CONFIG.DEV_BYPASS_PAYMENT,
    port: CONFIG.PORT,
    groqApiKeyConfigured: Boolean(CONFIG.GROQ.API_KEY),
    groqApiKeyMasked: getMaskedApiKey(CONFIG.GROQ.API_KEY),
    timestamp: new Date().toISOString(),
  })
})

app.get('/health/groq', async (c) => {
  const result = await testGroqConnection()
  return c.json(result, result.success ? 200 : 500)
})

app.get('/health/firebase', async (c) => {
  const result = await testFirebaseConnection()
  return c.json(result, result.success ? 200 : 500)
})

app.get('/health/database', async (c) => {
  const result = await testFirebaseConnection()
  return c.json(result, result.success ? 200 : 500)
})

app.get('/health/chatbot', async (c) => {
  try {
    const reply = await chatWithGroq('Hello diagnostic test')
    return c.json({ success: true, model: CONFIG.GROQ.MODEL, reply })
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500)
  }
})

// Optimization History Endpoint
app.get('/history', async (c) => {
  try {
    const history = await getOptimizationHistory(50)
    return c.json({ success: true, count: history.length, history })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Standalone Code Execution Endpoint (Piston Engine)
app.post('/execute', async (c) => {
  try {
    const { code, language, stdin } = await c.req.json()
    if (!code) {
      return c.json({ error: 'Code is required' }, 400)
    }
    const result = await runCode(code, language || 'python', stdin || '')
    return c.json(result)
  } catch (err: any) {
    return c.json({ error: err.message || 'Execution failed' }, 500)
  }
})

// AI Test Case Generator Endpoint (Groq API)
app.post('/generate-test-cases', async (c) => {
  try {
    const { code, language } = await c.req.json()
    if (!code) {
      return c.json({ error: 'Code is required' }, 400)
    }

    if (!CONFIG.GROQ.API_KEY) {
      return c.json({ error: 'GROQ_API_KEY missing' }, 500)
    }

    const groq = new Groq({ apiKey: CONFIG.GROQ.API_KEY })
    const prompt = `Analyze this ${language || 'code'} snippet:\n${code}\n\nGenerate 5 diverse test cases (Normal Case, Boundary Case, Edge Case, Large Input, Invalid/Negative Input).
Return strictly a JSON array of objects with schema:
[
  {
    "category": "Normal Input",
    "input": "string representation of stdin or input data",
    "expectedOutput": "expected string output",
    "importance": "brief explanation why this test case is vital"
  }
]`

    const res = await groq.chat.completions.create({
      model: CONFIG.GROQ.MODEL,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    })

    const raw = res.choices[0]?.message?.content || '[]'
    let testCases: any[] = []
    try {
      const parsed = JSON.parse(raw)
      testCases = Array.isArray(parsed) ? parsed : parsed.test_cases || parsed.testCases || []
    } catch {
      testCases = []
    }

    return c.json({ success: true, testCases })
  } catch (err: any) {
    return c.json({ error: err.message || 'Failed to generate test cases' }, 500)
  }
})

// Interactive AI Assistant Chat Endpoint
app.post('/chat', async (c) => {
  try {
    const { message, history } = await c.req.json()
    if (!message) {
      return c.json({ error: 'Message is required' }, 400)
    }
    const reply = await chatWithGroq(message, history || [])
    return c.json({ reply, timestamp: new Date().toISOString() })
  } catch (error: any) {
    console.error('[Server] Chat API Error:', error)
    return c.json({ error: error.message || 'Chat assistance request failed' }, 500)
  }
})

// Primary Optimization Endpoint (Supports x402 Payment & Dev Bypass)
app.post('/optimize', async (c) => {
  const isDevBypass = CONFIG.DEV_BYPASS_PAYMENT
  const body = await c.req.json().catch(() => ({}))
  const { code, language, transactionId, stdin } = body

  if (!code || typeof code !== 'string' || !code.trim()) {
    return c.json({ error: 'Missing or empty "code" field in request body.' }, 400)
  }

  const lang = language || 'python'
  const requestId = `opt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
  const price = CONFIG.ALGORAND.REQUIRED_PAYMENT_AMOUNT
  const headerTxId = c.req.header('X-Payment-TxID')
  let activeTxId = transactionId || headerTxId

  if (isDevBypass) {
    activeTxId = activeTxId || `dev_bypass_tx_${requestId}`
  } else {
    if (!activeTxId) {
      const paymentDetails = generatePaymentDetails(price, requestId)
      return c.json(
        {
          error: 'PAYMENT_REQUIRED',
          payment: paymentDetails,
          requestId,
        },
        402
      )
    }

    const verification = await verifyTransaction(activeTxId, requestId)
    if (!verification.valid) {
      return c.json(
        {
          error: 'INVALID_TRANSACTION',
          details: verification.error || 'Transaction verification failed',
        },
        400
      )
    }
  }

  // Process code optimization via Groq and benchmark via Piston
  try {
    const optimization = await optimizeCode(code, lang, requestId)
    const benchmark = await benchmarkCode(code, optimization.optimizedCode, lang, stdin)

    const optRecord = await saveOptimization({
      requestId,
      code,
      optimizedCode: optimization.optimizedCode,
      language: lang,
      reasoning: optimization.reasoning,
      metrics: benchmark,
      transactionId: activeTxId,
    })

    await saveTransaction({
      requestId,
      transactionId: activeTxId,
      amount: isDevBypass ? 0 : price,
      assetId: CONFIG.ALGORAND.USDC_ASSET_ID,
      status: 'settled',
    })

    const explorerUrl = isDevBypass
      ? 'https://testnet.algorand.com'
      : `https://${CONFIG.ALGORAND.NETWORK === 'mainnet' ? '' : CONFIG.ALGORAND.NETWORK + '.'}algorand.com/tx/${activeTxId}`

    return c.json({
      requestId,
      optimizationId: optRecord.id,
      optimizedCode: optimization.optimizedCode,
      reasoning: optimization.reasoning,
      timeComplexity: optimization.timeComplexity,
      spaceComplexity: optimization.spaceComplexity,
      optimizationScore: optimization.optimizationScore,
      scoreBreakdown: optimization.scoreBreakdown,
      detectedBottlenecks: optimization.detectedBottlenecks,
      optimizationSuggestions: optimization.optimizationSuggestions,
      estimatedMemoryMb: optimization.estimatedMemoryMb,
      optimizationConfidence: optimization.optimizationConfidence,
      confidenceReasoning: optimization.confidenceReasoning,
      metrics: benchmark,
      transaction: {
        id: activeTxId,
        amount: isDevBypass ? 0 : price,
        asset: CONFIG.ALGORAND.USDC_ASSET_ID,
        explorerUrl,
        settled: true,
        facilitator: isDevBypass ? 'Development Mode Bypass' : CONFIG.FACILITATOR.URL,
      },
    })
  } catch (error: any) {
    console.error(`[Server] Optimization processing failed for ${requestId}:`, error)
    return c.json(
      {
        error: 'OPTIMIZATION_FAILED',
        message: error.message || 'Groq optimization pipeline failed',
        requestId,
      },
      500
    )
  }
})

const port = CONFIG.PORT
console.log(`====================================================`)
console.log(`✓ Server started on http://localhost:${port}`)
console.log(`✓ Environment loaded: ${CONFIG.NODE_ENV}`)
console.log(`✓ Dev Payment Bypass: ${CONFIG.DEV_BYPASS_PAYMENT ? 'ENABLED ✓' : 'DISABLED 🔒'}`)
console.log(`✓ GROQ_API_KEY detected: ${getMaskedApiKey(CONFIG.GROQ.API_KEY)}`)
console.log(`✓ Groq Model: ${CONFIG.GROQ.MODEL}`)
console.log(`✓ Database: Firebase Cloud Firestore`)
console.log(`====================================================`)

serve({
  fetch: app.fetch,
  port,
})
