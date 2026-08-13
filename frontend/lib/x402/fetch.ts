import { avmWalletManager, PaymentDetails } from './avm'
import { API_BASE_URL, getApiBaseUrl } from '../apiConfig'

// Default request timeout (60 seconds for Render free tier cold starts)
const REQUEST_TIMEOUT_MS = 60_000

export interface OptimizationRequest {
  code: string
  language: string
  transactionId?: string
  requestId?: string
  stdin?: string
  testCases?: any[]
}

export interface OptimizationResponse {
  requestId: string
  optimizationId: string
  status: string
  payment?: {
    status: string
    transactionId: string
    amount: number
    asset: number
    network: string
  }
  optimization?: {
    originalCode: string
    optimizedCode: string
    reasoning: string
    estimatedTimeComplexity: { original: string; optimized: string }
    estimatedSpaceComplexity: { original: string; optimized: string }
    optimizationScore: number
    aiEstimate: { isEstimate: boolean; disclaimer: string }
  }
  verification?: {
    correctnessVerified: boolean
    verificationMethod: string
    verificationLevel: string
    testsRun: number
    testsPassed: number
    testsFailed: number
    testDetails: any[]
  }
  benchmark?: {
    originalMedianMs: number
    optimizedMedianMs: number
    improvementPct: number
    p95OriginalMs: number
    p95OptimizedMs: number
    speedupMultiplier: number
    originalStats: any
    optimizedStats: any
    confidenceLevel: string
  }
  // Backward compatibility fields for UI components
  optimizedCode: string
  reasoning: string
  timeComplexity?: { original: string; optimized: string }
  spaceComplexity?: { original: string; optimized: string }
  optimizationScore?: number
  scoreBreakdown?: {
    performance: number
    readability: number
    maintainability: number
    memory: number
    scalability: number
  }
  detectedBottlenecks?: string[]
  optimizationSuggestions?: string[]
  estimatedMemoryMb?: { original: number; optimized: number }
  optimizationConfidence?: number
  confidenceReasoning?: string
  metrics: {
    originalTimeMs: number
    optimizedTimeMs: number
    improvementPct: number
    correctnessVerified: boolean
    originalStdout?: string
    optimizedStdout?: string
    testsRun?: number
    testsPassed?: number
    testsFailed?: number
    verificationLevel?: string
  }
  transaction: {
    id: string
    amount: number
    asset: number
    explorerUrl: string
    settled: boolean
    facilitator: string
  }
}

export interface TestCaseItem {
  id: string
  category: string
  input: string
  expectedOutput: string
  actualOutput?: string
  timeMs?: number
  status?: 'PASS' | 'FAIL' | 'PENDING'
  importance?: string
}

export interface X402PaymentError {
  error: string
  status?: string
  payment: PaymentDetails
  requestId: string
}

/**
 * Wraps a fetch call with an AbortController timeout.
 * Returns a clear error message on timeout, network failure, or CORS issues.
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number = REQUEST_TIMEOUT_MS
): Promise<Response> {
  if (!API_BASE_URL) {
    throw new Error(
      'Optima AI backend is not configured. ' +
      (process.env.NODE_ENV === 'production'
        ? 'The NEXT_PUBLIC_API_URL environment variable must be set in the Vercel deployment.'
        : 'Set NEXT_PUBLIC_API_URL in your .env file or start the backend with npm run dev:backend.')
    )
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    })
    return response
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      throw new Error(
        isLocal
          ? 'Backend request timed out on local server (http://localhost:3001). Please check that the local backend server is running.'
          : 'Backend request timed out. Free hosting platforms (like Render) take 45–60 seconds to wake up from cold start. Please try clicking again now that the server is awake.'
      )
    }

    // Network error or CORS failure
    const message = err instanceof Error ? err.message : String(err)
    if (message.includes('Failed to fetch') || message.includes('NetworkError') || message.includes('fetch')) {
      throw new Error(
        `Unable to connect to Optima AI backend at ${API_BASE_URL}. ` +
        'Please check that the API server is deployed and accessible.'
      )
    }

    throw err
  } finally {
    clearTimeout(timeout)
  }
}

/**
 * Reads and returns a descriptive error message from an HTTP error response.
 */
async function parseHttpError(response: Response, fallbackMessage: string): Promise<string> {
  try {
    const body = await response.json()
    if (body.error) return body.error
    if (body.message) return body.message
  } catch {
    // Response body is not JSON
    try {
      const text = await response.text()
      if (text.length > 0 && text.length < 500) return text
    } catch {
      // Could not read body
    }
  }

  // Map common HTTP status codes to user-friendly messages
  switch (response.status) {
    case 400: return `Bad Request: ${fallbackMessage}`
    case 402: return 'Payment required to proceed with optimization.'
    case 413: return 'Payload Too Large: Source code exceeds maximum allowed size.'
    case 429: return 'Too Many Requests: Rate limit exceeded. Please wait a minute and try again.'
    case 500: return 'Internal Server Error: The backend encountered an unexpected error.'
    case 502: return 'Bad Gateway: The backend server may be starting up. Please try again in a moment.'
    case 503: return 'Service Unavailable: The backend is temporarily unavailable.'
    default: return `${fallbackMessage} (HTTP ${response.status})`
  }
}

class X402Client {
  get baseUrl(): string {
    return getApiBaseUrl()
  }

  async connectWallet(): Promise<string> {
    return await avmWalletManager.connectPera()
  }

  async disconnectWallet(): Promise<void> {
    await avmWalletManager.disconnect()
  }

  async reconnectWallet(): Promise<string | null> {
    return await avmWalletManager.reconnectPera()
  }

  async executeCode(code: string, language: string, stdin?: string): Promise<{ stdout: string; stderr: string; exitCode: number; timeMs: number }> {
    const res = await fetchWithTimeout(`${this.baseUrl}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, language, stdin }),
    })
    if (!res.ok) {
      const msg = await parseHttpError(res, 'Code execution failed')
      throw new Error(msg)
    }
    return await res.json()
  }

  async generateTestCases(code: string, language: string): Promise<TestCaseItem[]> {
    const res = await fetchWithTimeout(`${this.baseUrl}/generate-test-cases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, language }),
    })
    if (!res.ok) {
      const msg = await parseHttpError(res, 'Failed to generate test cases')
      throw new Error(msg)
    }
    const data = await res.json()
    return (data.testCases || []).map(
      (tc: { category?: string; input?: string; expectedOutput?: string; importance?: string }, idx: number) => ({
        id: `tc_${Date.now()}_${idx}`,
        category: tc.category || 'Normal Input',
        input: tc.input || '',
        expectedOutput: tc.expectedOutput || '',
        status: 'PENDING',
        importance: tc.importance || 'Edge case testing',
      })
    )
  }

  async sendChatMessage(message: string, history: Array<{ role: string; content: string }> = []): Promise<string> {
    const res = await fetchWithTimeout(`${this.baseUrl}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history }),
    })
    if (!res.ok) {
      const msg = await parseHttpError(res, 'Failed to send message to AI Assistant')
      throw new Error(msg)
    }
    const data = await res.json()
    return data.reply
  }

  async createChallenge(code: string, language: string): Promise<PaymentDetails> {
    const res = await fetchWithTimeout(`${this.baseUrl}/payment/challenge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, language }),
    })
    if (!res.ok) {
      const msg = await parseHttpError(res, 'Failed to issue payment challenge')
      throw new Error(msg)
    }
    const data = await res.json()
    return data.payment
  }

  async optimize(
    request: OptimizationRequest,
    onPaymentRequired?: (payment: PaymentDetails) => Promise<boolean>
  ): Promise<OptimizationResponse> {
    const isDevBypass = process.env.NEXT_PUBLIC_DEV_BYPASS_PAYMENT === 'true'

    // ── Pay-First Flow: Always collect Pera Wallet payment BEFORE optimization ──
    let txId = ''
    const priceAlgo = parseFloat(process.env.NEXT_PUBLIC_OPTIMIZATION_PRICE_USDC || '0.001')
    const assetId = parseInt(process.env.NEXT_PUBLIC_USDC_ASSET_ID || '0', 10)
    const serviceAddress =
      process.env.NEXT_PUBLIC_ALGORAND_SERVICE_ADDRESS ||
      avmWalletManager.getConnectedAddress() ||
      ''

    if (!isDevBypass && onPaymentRequired) {
      // Build a local payment challenge (no backend 402 needed)
      const requestId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
      const paymentDetails: PaymentDetails = {
        address: serviceAddress,
        amount: priceAlgo,
        asset: assetId,
        note: `Optima AI Optimization: ${requestId}`,
        facilitator: 'local',
        requestId,
        expiresAt: Date.now() + 300_000,
      }

      // Show modal and wait for user approval
      const approved = await onPaymentRequired(paymentDetails)
      if (!approved) {
        throw new Error('Payment was cancelled by user')
      }

      // Sign and broadcast the transaction via Pera Wallet
      txId = await avmWalletManager.payUSDC(paymentDetails)
    }

    // ── Call the backend with the signed transaction ID ──
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (txId) {
      headers['X-Payment-TxID'] = txId
    }

    const response = await fetchWithTimeout(`${this.baseUrl}/optimize`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ...request,
        ...(txId ? { transactionId: txId } : {}),
      }),
    })

    if (!response.ok) {
      const msg = await parseHttpError(response, 'Optimization request failed')
      throw new Error(msg)
    }

    const data = await response.json()

    // Attach transaction info to the response for the receipt card
    if (txId) {
      data.transaction = {
        id: txId,
        amount: priceAlgo,
        asset: assetId,
        explorerUrl: `https://testnet.algoexplorer.io/tx/${txId}`,
        settled: true,
        facilitator: 'Algorand Testnet',
      }
    }

    return data
  }

  /**
   * Check if the backend is reachable. Returns the health response or null on failure.
   */
  async checkHealth(): Promise<{ status: string; [key: string]: unknown } | null> {
    if (!this.baseUrl) return null
    try {
      const res = await fetchWithTimeout(`${this.baseUrl}/health`, {
        method: 'GET',
      }, 5000) // 5 second timeout for health checks
      if (!res.ok) return null
      return await res.json()
    } catch {
      return null
    }
  }
}

export const x402Client = new X402Client()
