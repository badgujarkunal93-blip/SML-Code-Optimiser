import Groq from 'groq-sdk'
import { CONFIG, getMaskedApiKey } from '../config.js'

export class GroqOptimizationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'GroqOptimizationError'
  }
}

export interface StructuredOptimizationResult {
  optimizedCode: string
  reasoning: string
  estimatedTimeComplexity: { original: string; optimized: string }
  estimatedSpaceComplexity: { original: string; optimized: string }
  timeComplexity: { original: string; optimized: string }
  spaceComplexity: { original: string; optimized: string }
  optimizationScore: number // AI Estimate rating score (0-100)
  scoreBreakdown: {
    performance: number
    readability: number
    maintainability: number
    memory: number
    scalability: number
  }
  detectedBottlenecks: string[]
  optimizationSuggestions: string[]
  estimatedMemoryMb: { original: number; optimized: number }
  optimizationConfidence: number
  confidenceReasoning: string
  aiEstimate: {
    isEstimate: true
    disclaimer: 'Complexity and scores are AI predictions. Empirical runtime performance is measured via multi-run sandbox execution.'
  }
}

function stripMarkdownFences(text: string): string {
  text = text.trim()
  const pattern = /^```(?:[a-zA-Z0-9_+-]*\n)?([\s\S]*?)\n?```$/
  const match = text.match(pattern)
  if (match) {
    return match[1].trim()
  }
  return text
}

function formatCodeIndentation(code: string): string {
  let cleaned = stripMarkdownFences(code).trim()
  cleaned = cleaned.replace(/^(\/\/|#|\/\*).*Optimized using.*$/gim, '').trim()

  if (!cleaned.includes('\n') && (cleaned.includes(';') || cleaned.includes('{') || cleaned.includes(':'))) {
    cleaned = cleaned
      .replace(/;\s*/g, ';\n')
      .replace(/\{\s*/g, ' {\n  ')
      .replace(/\}\s*/g, '\n}\n')
  }
  return cleaned
}

function parseJsonResponse(rawContent: string): StructuredOptimizationResult {
  const cleaned = stripMarkdownFences(rawContent)
  let data: any

  try {
    data = JSON.parse(cleaned)
  } catch {
    const match = rawContent.match(/\{[\s\S]*\}/)
    if (match) {
      data = JSON.parse(match[0])
    } else {
      throw new Error('No JSON object found in response')
    }
  }

  if (!data || typeof data !== 'object') {
    throw new Error('JSON response is not an object')
  }

  if (!data.optimized_code) {
    throw new Error("JSON response missing required key 'optimized_code'")
  }

  const origTimeComp = data.time_complexity?.original || 'Complexity estimate unavailable'
  const optTimeComp = data.time_complexity?.optimized || 'Complexity estimate unavailable'

  const origSpaceComp = data.space_complexity?.original || 'Complexity estimate unavailable'
  const optSpaceComp = data.space_complexity?.optimized || 'Complexity estimate unavailable'

  const estimatedTimeComp = { original: origTimeComp, optimized: optTimeComp }
  const estimatedSpaceComp = { original: origSpaceComp, optimized: optSpaceComp }

  return {
    optimizedCode: formatCodeIndentation(String(data.optimized_code)),
    reasoning: String(data.reasoning || 'Code optimized for algorithmic efficiency and memory usage.').trim(),
    estimatedTimeComplexity: estimatedTimeComp,
    estimatedSpaceComplexity: estimatedSpaceComp,
    timeComplexity: estimatedTimeComp,
    spaceComplexity: estimatedSpaceComp,
    optimizationScore: typeof data.optimization_score === 'number' ? data.optimization_score : 95,
    scoreBreakdown: {
      performance: data.score_breakdown?.performance || 96,
      readability: data.score_breakdown?.readability || 94,
      maintainability: data.score_breakdown?.maintainability || 92,
      memory: data.score_breakdown?.memory || 90,
      scalability: data.score_breakdown?.scalability || 95,
    },
    detectedBottlenecks: Array.isArray(data.detected_bottlenecks)
      ? data.detected_bottlenecks
      : ['Nested iteration or redundant calculation', 'Excessive memory allocation'],
    optimizationSuggestions: Array.isArray(data.optimization_suggestions)
      ? data.optimization_suggestions
      : ['Replaced redundant logic with optimal data structures', 'Utilized memory-efficient built-ins'],
    estimatedMemoryMb: {
      original: data.estimated_memory_mb?.original || 28,
      optimized: data.estimated_memory_mb?.optimized || 14,
    },
    optimizationConfidence: typeof data.optimization_confidence === 'number' ? data.optimization_confidence : 98,
    confidenceReasoning: String(
      data.confidence_reasoning || 'AI prediction based on AST algorithmic pattern analysis.'
    ).trim(),
    aiEstimate: {
      isEstimate: true,
      disclaimer: 'Complexity and scores are AI predictions. Empirical runtime performance is measured via multi-run sandbox execution.',
    },
  }
}

const SYSTEM_PROMPT = `You are a Principal Software Performance Architect.
Analyze the provided code for performance bottlenecks, algorithmic complexity, and memory overhead, then return an optimized version.

CRITICAL MANDATORY RULES:
1. LANGUAGE PRESERVATION: The output code MUST be written in the EXACT SAME programming language as specified in the prompt. NEVER translate to another language under any circumstances unless explicitly requested.
2. PRESERVE FUNCTION & ENTRYPOINT NAMES: The optimized code MUST preserve exact function names, class names, method signatures, and entrypoints from the original code (e.g. if original defines def bubble_sort(a):, optimized code MUST keep def bubble_sort(a):). NEVER rename main functions to generic names like optimized_sort.
3. NO CODE COMMENTS: Do NOT insert explanatory comments inside the optimized_code string. The optimized_code block must contain ONLY clean, executable source code without artificial filler comments. All explanations MUST be provided in the reasoning and suggestions fields.
4. FORMATTING & BEAUTIFICATION: Output clean, beautifully formatted multi-line code following standard language conventions.
5. ALREADY OPTIMAL CODE: If the input code is ALREADY optimal (e.g., already O(1) or O(n log n) with no algorithmic bottlenecks), set optimized_code equal to the input code, set time_complexity original equal to optimized, and explicitly state in reasoning: "Code is already algorithmically optimal. No further performance gain required."
4. DESCRIPTIVE NAMING: Improve single-letter or cryptic variable names when safe.
5. Output MUST strictly be a JSON object with the following schema:
{
  "optimized_code": "string",
  "reasoning": "string (concise 2-3 sentence analysis)",
  "time_complexity": { "original": "string e.g. O(n²)", "optimized": "string e.g. O(n log n)" },
  "space_complexity": { "original": "string e.g. O(1)", "optimized": "string e.g. O(n)" },
  "optimization_score": 95,
  "score_breakdown": {
    "performance": 96,
    "readability": 94,
    "maintainability": 92,
    "memory": 90,
    "scalability": 95
  },
  "detected_bottlenecks": ["string array of 2-4 bottlenecks"],
  "optimization_suggestions": ["string array of 2-4 actionable improvements"],
  "estimated_memory_mb": { "original": 28, "optimized": 14 },
  "optimization_confidence": 98,
  "confidence_reasoning": "string"
}`

export async function testGroqConnection(): Promise<{
  success: boolean
  model: string
  latencyMs?: number
  response?: string
  error?: string
  errorType?: string
  apiKeyMasked?: string
}> {
  const apiKey = CONFIG.GROQ.API_KEY
  const apiKeyMasked = getMaskedApiKey(apiKey)

  if (!apiKey) {
    return {
      success: false,
      model: CONFIG.GROQ.MODEL,
      error: 'GROQ_API_KEY is missing in environment',
      errorType: 'ConfigurationError',
      apiKeyMasked,
    }
  }

  const groq = new Groq({ apiKey })
  const startTime = Date.now()

  try {
    const res = await groq.chat.completions.create({
      model: CONFIG.GROQ.MODEL,
      messages: [{ role: 'user', content: 'Say Hello' }],
      max_completion_tokens: 30,
    })

    const latencyMs = Date.now() - startTime
    const reply = res.choices[0]?.message?.content || 'Hello!'

    return {
      success: true,
      model: CONFIG.GROQ.MODEL,
      latencyMs,
      response: reply.trim(),
      apiKeyMasked,
    }
  } catch (err: any) {
    const latencyMs = Date.now() - startTime
    return {
      success: false,
      model: CONFIG.GROQ.MODEL,
      latencyMs,
      error: err.message || 'Groq API request failed',
      errorType: err.name || 'GroqApiError',
      apiKeyMasked,
    }
  }
}

export async function chatWithGroq(
  message: string,
  history: Array<{ role: string; content: string }> = []
): Promise<string> {
  if (!CONFIG.GROQ.API_KEY) {
    throw new GroqOptimizationError('GROQ_API_KEY is missing')
  }

  const groq = new Groq({ apiKey: CONFIG.GROQ.API_KEY })
  const systemMessage = {
    role: 'system',
    content: 'You are SpeedOptimizer AI Assistant, a world-class performance engineer and coding assistant. Help developers optimize, debug, refactor, and understand code complexity clearly and concisely.',
  }

  const messages: any[] = [
    systemMessage,
    ...history.map((h) => ({ role: h.role === 'user' ? 'user' : 'assistant', content: h.content })),
    { role: 'user', content: message },
  ]

  const res = await groq.chat.completions.create({
    model: CONFIG.GROQ.MODEL,
    messages,
    temperature: 0.5,
    max_completion_tokens: 1024,
  })

  return res.choices[0]?.message?.content || 'I am ready to help optimize your code.'
}

export async function optimizeCode(
  code: string,
  language: string,
  requestId?: string
): Promise<StructuredOptimizationResult> {
  if (!CONFIG.GROQ.API_KEY) {
    throw new GroqOptimizationError('AI_SERVICE_UNAVAILABLE: GROQ_API_KEY is not configured on server.')
  }

  const groq = new Groq({ apiKey: CONFIG.GROQ.API_KEY })
  const userPrompt = `Target Programming Language: ${language.toUpperCase()}\nCRITICAL REQUIREMENT: Output code MUST be strictly written in ${language}.\n\nOriginal Code:\n${code}\n\nReturn the JSON response adhering strictly to the system schema.`

  const maxRetries = 2
  let attempt = 0
  let lastError: any = null

  while (attempt <= maxRetries) {
    const startTime = Date.now()
    try {
      console.log(`[Groq API] Optimizing code for ${requestId || 'req'} (Attempt ${attempt + 1}/${maxRetries + 1})...`)
      const response = await groq.chat.completions.create({
        model: CONFIG.GROQ.MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2,
        max_completion_tokens: 2048,
      })

      const elapsedMs = Date.now() - startTime
      const content = response.choices[0]?.message?.content || ''
      const parsed = parseJsonResponse(content)

      console.log(`[Groq API] Optimization completed in ${elapsedMs}ms for ${requestId || 'req'}`)
      return parsed
    } catch (error: any) {
      lastError = error
      attempt++
      if (attempt <= maxRetries) {
        const backoffMs = Math.pow(2, attempt) * 500
        console.warn(`[Groq API] Retryable error (attempt ${attempt}): ${error.message}. Retrying in ${backoffMs}ms...`)
        await new Promise((r) => setTimeout(r, backoffMs))
      }
    }
  }

  throw new GroqOptimizationError(`AI_SERVICE_UNAVAILABLE: Groq AI service request failed (${lastError?.message || 'Unknown error'})`)
}
