import { avmWalletManager, PaymentDetails } from './avm'
import { API_BASE_URL } from '../apiConfig'

// Default request timeout (30 seconds)
const REQUEST_TIMEOUT_MS = 30_000

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
      throw new Error(
        'Backend request timed out. The server may be unavailable or overloaded. Please try again.'
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
  private baseUrl: string

  constructor() {
    this.baseUrl = API_BASE_URL
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
    onPaymentRequired: (payment: PaymentDetails) => Promise<boolean>
  ): Promise<OptimizationResponse> {
    const isDevBypass = process.env.NEXT_PUBLIC_DEV_BYPASS_PAYMENT === 'true'

    const initialResponse = await fetchWithTimeout(`${this.baseUrl}/optimize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })

    if (initialResponse.status === 402 && !isDevBypass) {
      const errorData: X402PaymentError = await initialResponse.json()
      const paymentDetails = errorData.payment || (await this.createChallenge(request.code, request.language))

      const approved = await onPaymentRequired(paymentDetails)
      if (!approved) {
        throw new Error('Payment was cancelled by user')
      }

      const txId = await avmWalletManager.payUSDC(paymentDetails)

      const paidResponse = await fetchWithTimeout(`${this.baseUrl}/optimize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Payment-TxID': txId,
          'X-Request-ID': paymentDetails.requestId || '',
        },
        body: JSON.stringify({
          ...request,
          transactionId: txId,
          requestId: paymentDetails.requestId || '',
        }),
      })

      if (!paidResponse.ok) {
        const msg = await parseHttpError(paidResponse, 'Optimization failed after payment')
        throw new Error(msg)
      }

      return await paidResponse.json()
    }

    if (!initialResponse.ok) {
      const msg = await parseHttpError(initialResponse, 'Optimization request failed')
      throw new Error(msg)
    }

    return await initialResponse.json()
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
