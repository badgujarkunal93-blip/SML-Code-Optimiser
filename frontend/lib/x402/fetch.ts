import { avmWalletManager, PaymentDetails } from './avm'

export interface OptimizationRequest {
  code: string
  language: string
  transactionId?: string
  stdin?: string
}

export interface OptimizationResponse {
  requestId: string
  optimizationId: string
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
  payment: PaymentDetails
  requestId: string
}

class X402Client {
  private baseUrl: string

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
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
    const res = await fetch(`${this.baseUrl}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, language, stdin }),
    })
    if (!res.ok) {
      throw new Error('Code execution failed')
    }
    return await res.json()
  }

  async generateTestCases(code: string, language: string): Promise<TestCaseItem[]> {
    const res = await fetch(`${this.baseUrl}/generate-test-cases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, language }),
    })
    if (!res.ok) {
      throw new Error('Failed to generate test cases')
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
    const res = await fetch(`${this.baseUrl}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || 'Failed to send message to AI Assistant')
    }
    const data = await res.json()
    return data.reply
  }

  async optimize(
    request: OptimizationRequest,
    onPaymentRequired: (payment: PaymentDetails) => Promise<boolean>
  ): Promise<OptimizationResponse> {
    const isDevBypass = process.env.NEXT_PUBLIC_DEV_BYPASS_PAYMENT === 'true'

    const initialResponse = await fetch(`${this.baseUrl}/optimize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })

    if (initialResponse.status === 402 && !isDevBypass) {
      const errorData: X402PaymentError = await initialResponse.json()
      const paymentDetails = errorData.payment

      const approved = await onPaymentRequired(paymentDetails)
      if (!approved) {
        throw new Error('Payment was cancelled by user')
      }

      const txId = await avmWalletManager.payUSDC(paymentDetails)

      const paidResponse = await fetch(`${this.baseUrl}/optimize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Payment-TxID': txId,
        },
        body: JSON.stringify({ ...request, transactionId: txId }),
      })

      if (!paidResponse.ok) {
        const errorMsg = await paidResponse.text()
        throw new Error(`Optimization failed after payment: ${errorMsg}`)
      }

      return await paidResponse.json()
    }

    if (!initialResponse.ok) {
      const errorMsg = await initialResponse.text()
      throw new Error(`Optimization request failed: ${errorMsg}`)
    }

    return await initialResponse.json()
  }
}

export const x402Client = new X402Client()
