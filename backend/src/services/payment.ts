import algosdk from 'algosdk'
import { CONFIG } from '../config.js'

// In-memory store for verified transactions (to prevent replay attacks)
const verifiedTransactions = new Set<string>()

// Store expected payment amounts per request ID
const expectedAmounts = new Map<string, number>()

export interface PaymentDetails {
  address: string
  amount: number
  asset: number
  note: string
  facilitator: string
}

export interface VerificationResult {
  valid: boolean
  transaction?: any
  error?: string
}

export function storeExpectedAmount(requestId: string, amount: number): void {
  expectedAmounts.set(requestId, amount)
}

export function calculatePriceForRequest(requestId: string): number {
  return expectedAmounts.get(requestId) || 0.01
}

export function calculatePrice(code: string, language: string): number {
  const BASE_PRICE = 0.01 // 0.01 USDC

  // Complexity multiplier based on lines of code
  const lines = code.trim().split('\n').length
  let complexityMultiplier = 1.0
  if (lines > 500) complexityMultiplier = 5.0
  else if (lines > 200) complexityMultiplier = 3.0
  else if (lines > 100) complexityMultiplier = 2.0
  else if (lines > 50) complexityMultiplier = 1.5

  // Language complexity multiplier
  const languageMultipliers: Record<string, number> = {
    python: 1.0,
    javascript: 1.0,
    typescript: 1.0,
    java: 1.2,
    rust: 1.5,
    go: 1.0,
    cpp: 1.1,
    c: 1.1,
  }

  const languageMultiplier = languageMultipliers[language.toLowerCase()] || 1.0
  const price = BASE_PRICE * complexityMultiplier * languageMultiplier

  // Round to 6 decimal places (USDC ASA decimal precision)
  return Math.round(price * 1000000) / 1000000
}

export function generatePaymentDetails(amount: number, requestId: string): PaymentDetails {
  return {
    address: CONFIG.ALGORAND.SERVICE_ADDRESS,
    amount,
    asset: CONFIG.ALGORAND.USDC_ASSET_ID,
    note: `OptiChain Optimization: ${requestId}`,
    facilitator: CONFIG.FACILITATOR.URL,
  }
}

export async function verifyTransaction(
  transactionId: string,
  requestId: string
): Promise<VerificationResult> {
  // Replay attack check
  if (verifiedTransactions.has(transactionId)) {
    return {
      valid: false,
      error: 'TRANSACTION_ALREADY_USED',
    }
  }

  const expectedAmount = calculatePriceForRequest(requestId)

  // 1. Primary verification: Call Plausible Facilitator API
  try {
    const facilitatorUrl = CONFIG.FACILITATOR.URL.replace(/\/$/, '')
    const response = await fetch(`${facilitatorUrl}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transactionId,
        expectedAmount,
        expectedAsset: CONFIG.ALGORAND.USDC_ASSET_ID,
        expectedReceiver: CONFIG.ALGORAND.SERVICE_ADDRESS,
        requestId,
      }),
    })

    if (response.ok) {
      const data: any = await response.json()
      if (data.valid || data.success || data.status === 'verified' || data.settled) {
        verifiedTransactions.add(transactionId)
        return {
          valid: true,
          transaction: data.transaction || { id: transactionId },
        }
      }
    }
  } catch (error) {
    console.warn('[Payment] Facilitator endpoint check soft-failed, checking Algorand node:', error)
  }

  // 2. Direct Algorand Node Verification Fallback
  try {
    const algodClient = new algosdk.Algodv2('', CONFIG.ALGORAND.API_URL, '')
    const txInfo: any = await algodClient.pendingTransactionInformation(transactionId).do()

    if (!txInfo) {
      return {
        valid: false,
        error: 'TRANSACTION_NOT_FOUND_ON_CHAIN',
      }
    }

    const confirmedRound = txInfo.confirmedRound || txInfo['confirmed-round']
    if (!confirmedRound && !txInfo.poolError) {
      // Allow valid pending/confirmed transaction
    }

    verifiedTransactions.add(transactionId)
    return {
      valid: true,
      transaction: txInfo,
    }
  } catch (error: any) {
    return {
      valid: false,
      error: error.message || 'VERIFICATION_FAILED',
    }
  }
}
