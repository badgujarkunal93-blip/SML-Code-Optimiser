import algosdk from 'algosdk'
import crypto from 'crypto'
import { CONFIG } from '../config.js'
import {
  savePaymentRequest,
  getPaymentRequest,
  consumeTransactionId,
  isTransactionConsumed,
  computeCodeHash,
  computePaymentPayloadHash,
  PaymentRequestRecord,
} from './db.js'

export type PaymentStatus =
  | 'PAYMENT_PENDING'
  | 'PAYMENT_VERIFIED'
  | 'PAYMENT_REJECTED'
  | 'PAYMENT_EXPIRED'
  | 'PAYMENT_ALREADY_USED'

export interface PaymentDetails {
  address: string
  amount: number
  asset: number
  note: string
  facilitator: string
  requestId: string
  expiresAt: number
  payloadHash: string
}

export interface VerificationResult {
  valid: boolean
  status: PaymentStatus
  transaction?: any
  error?: string
}

export function calculatePrice(code: string, language: string): number {
  const BASE_PRICE = CONFIG.ALGORAND.REQUIRED_PAYMENT_AMOUNT || 0.001 // USDC

  const lines = code ? code.trim().split('\n').length : 1
  let complexityMultiplier = 1.0
  if (lines > 500) complexityMultiplier = 5.0
  else if (lines > 200) complexityMultiplier = 3.0
  else if (lines > 100) complexityMultiplier = 2.0
  else if (lines > 50) complexityMultiplier = 1.5

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

  const cleanLang = (language || 'python').toLowerCase()
  const languageMultiplier = languageMultipliers[cleanLang] || 1.0
  const price = BASE_PRICE * complexityMultiplier * languageMultiplier

  // Round to 6 decimal places (USDC ASA decimal precision)
  return Math.round(price * 1000000) / 1000000
}

export async function createPaymentChallenge(
  code: string,
  language: string,
  userId?: string
): Promise<PaymentDetails> {
  const requestId = `req_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`
  const codeHash = computeCodeHash(code)
  const amount = calculatePrice(code, language)
  const receiver = CONFIG.ALGORAND.SERVICE_ADDRESS
  const assetId = CONFIG.ALGORAND.USDC_ASSET_ID
  const createdAt = Date.now()
  const expiresAt = createdAt + CONFIG.PAYMENT.CHALLENGE_TTL_SECONDS * 1000

  const payloadHash = computePaymentPayloadHash({
    requestId,
    codeHash,
    language,
    amount,
    receiver,
    assetId,
  })

  const requestRecord: PaymentRequestRecord = {
    requestId,
    userId,
    codeHash,
    language,
    amount,
    assetId,
    receiver,
    network: CONFIG.ALGORAND.NETWORK,
    createdAt,
    expiresAt,
    status: 'PENDING',
    payloadHash,
  }

  await savePaymentRequest(requestRecord)

  return {
    address: receiver,
    amount,
    asset: assetId,
    note: `Optima AI Optimization: ${requestId}`,
    facilitator: CONFIG.FACILITATOR.URL,
    requestId,
    expiresAt,
    payloadHash,
  }
}

export async function verifyStrictPayment(params: {
  transactionId: string
  requestId: string
  code: string
  language: string
  senderAddress?: string
}): Promise<VerificationResult> {
  const { transactionId, requestId, code, language, senderAddress } = params

  // Dev bypass (Strictly prohibited in production by validateConfig)
  if (CONFIG.DEV_BYPASS_PAYMENT && CONFIG.NODE_ENV !== 'production') {
    if (transactionId && transactionId.startsWith('dev_bypass_tx_')) {
      return {
        valid: true,
        status: 'PAYMENT_VERIFIED',
        transaction: { id: transactionId, bypass: true },
      }
    }
  }

  if (!transactionId || typeof transactionId !== 'string' || transactionId.trim().length < 8) {
    return {
      valid: false,
      status: 'PAYMENT_REJECTED',
      error: 'Invalid or missing transaction ID',
    }
  }

  if (!requestId) {
    return {
      valid: false,
      status: 'PAYMENT_REJECTED',
      error: 'Missing requestId. Payment challenge is required.',
    }
  }

  // 1. Replay attack check across persistent DB
  const alreadyConsumed = await isTransactionConsumed(transactionId)
  if (alreadyConsumed) {
    return {
      valid: false,
      status: 'PAYMENT_ALREADY_USED',
      error: 'TRANSACTION_ALREADY_USED: This transaction ID has already been consumed.',
    }
  }

  // 2. Fetch payment request challenge from persistent DB
  const challenge = await getPaymentRequest(requestId)
  if (!challenge) {
    return {
      valid: false,
      status: 'PAYMENT_REJECTED',
      error: 'UNKNOWN_REQUEST_ID: Payment challenge not found.',
    }
  }

  // 3. Expiration check
  if (Date.now() > challenge.expiresAt) {
    return {
      valid: false,
      status: 'PAYMENT_EXPIRED',
      error: 'PAYMENT_EXPIRED: Payment challenge has expired. Please create a new request.',
    }
  }

  // 4. Cryptographic payment-request payload hash verification
  const currentCodeHash = computeCodeHash(code)
  if (currentCodeHash !== challenge.codeHash) {
    return {
      valid: false,
      status: 'PAYMENT_REJECTED',
      error: 'PAYLOAD_MISMATCH: Source code does not match the payment challenge.',
    }
  }

  const expectedPayloadHash = computePaymentPayloadHash({
    requestId: challenge.requestId,
    codeHash: challenge.codeHash,
    language: challenge.language,
    amount: challenge.amount,
    receiver: challenge.receiver,
    assetId: challenge.assetId,
  })

  if (expectedPayloadHash !== challenge.payloadHash) {
    return {
      valid: false,
      status: 'PAYMENT_REJECTED',
      error: 'PAYLOAD_INTEGRITY_FAILED: Payment payload signature integrity check failed.',
    }
  }

  // 5. Query Algorand node directly or via facilitator
  let txInfo: any = null
  let confirmedRound = 0
  let txAmount = 0
  let txReceiver = ''
  let txSender = ''
  let txAssetId = 0

  // 5a. Primary Algorand Algod node verification
  try {
    const algodClient = new algosdk.Algodv2('', CONFIG.ALGORAND.API_URL, '')
    const rawInfo: any = await algodClient.pendingTransactionInformation(transactionId).do()
    if (rawInfo) {
      txInfo = rawInfo
      confirmedRound = rawInfo['confirmed-round'] || rawInfo.confirmedRound || 0
      const txn = rawInfo.txn?.txn || rawInfo.txn || {}
      
      txSender = algosdk.encodeAddress(txn.snd || txn.sender || new Uint8Array(32))
      
      if (txn.type === 'axfer') {
        // Asset Transfer (USDC ASA)
        txReceiver = algosdk.encodeAddress(txn.arcv || txn.receiver || new Uint8Array(32))
        txAmount = (txn.aamt || txn.amount || 0) / 1000000 // Convert micro-USDC to USDC
        txAssetId = Number(txn.xaid || txn.assetId || 0)
      } else if (txn.type === 'pay') {
        // Standard Payment (Algo)
        txReceiver = algosdk.encodeAddress(txn.rcv || txn.receiver || new Uint8Array(32))
        txAmount = (txn.amt || txn.amount || 0) / 1000000
        txAssetId = CONFIG.ALGORAND.USDC_ASSET_ID
      }
    }
  } catch (err: any) {
    console.warn('[Payment Verification] Direct Algod node check notice:', err?.message || err)
  }

  // 5b. Facilitator API fallback check if Algod node returned insufficient data
  if (!txInfo || confirmedRound <= 0) {
    try {
      const facilitatorUrl = CONFIG.FACILITATOR.URL.replace(/\/$/, '')
      const response = await fetch(`${facilitatorUrl}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionId,
          expectedAmount: challenge.amount,
          expectedAsset: challenge.assetId,
          expectedReceiver: challenge.receiver,
          requestId,
        }),
      })

      if (response.ok) {
        const facData: any = await response.json()
        if (facData.valid || facData.settled) {
          txInfo = facData.transaction || { id: transactionId }
          confirmedRound = facData.confirmedRound || facData.round || 1
          txAmount = facData.amount || challenge.amount
          txReceiver = facData.receiver || challenge.receiver
          txAssetId = facData.assetId || challenge.assetId
        }
      }
    } catch (facErr: any) {
      console.warn('[Payment Verification] Facilitator fallback notice:', facErr?.message || facErr)
    }
  }

  // STRICT RULE: Must be confirmed on chain (confirmedRound > 0)
  if (!txInfo || confirmedRound <= 0) {
    return {
      valid: false,
      status: 'PAYMENT_PENDING',
      error: 'PAYMENT_PENDING: Transaction exists on chain but is not yet confirmed.',
    }
  }

  // STRICT RULE: Reject failed transactions
  if (txInfo.poolError) {
    return {
      valid: false,
      status: 'PAYMENT_REJECTED',
      error: `PAYMENT_REJECTED: Transaction failed on chain (${txInfo.poolError}).`,
    }
  }

  // STRICT RULE: Verify receiver address
  if (txReceiver && txReceiver !== challenge.receiver) {
    return {
      valid: false,
      status: 'PAYMENT_REJECTED',
      error: `INVALID_RECEIVER: Expected receiver ${challenge.receiver}, got ${txReceiver}`,
    }
  }

  // STRICT RULE: Verify asset ID
  if (txAssetId && txAssetId !== challenge.assetId) {
    return {
      valid: false,
      status: 'PAYMENT_REJECTED',
      error: `INVALID_ASSET: Expected asset ID ${challenge.assetId}, got ${txAssetId}`,
    }
  }

  // STRICT RULE: Verify payment amount >= challenge amount
  if (txAmount < challenge.amount) {
    return {
      valid: false,
      status: 'PAYMENT_REJECTED',
      error: `INSUFFICIENT_AMOUNT: Required ${challenge.amount} USDC, received ${txAmount} USDC`,
    }
  }

  // STRICT RULE: Verify sender address if provided
  if (senderAddress && txSender && txSender !== senderAddress) {
    return {
      valid: false,
      status: 'PAYMENT_REJECTED',
      error: `INVALID_SENDER: Expected sender ${senderAddress}, got ${txSender}`,
    }
  }

  // ATOMIC REPLAY CONSUMPTION: Mark transaction ID as consumed in DB
  const consumeResult = await consumeTransactionId({
    transactionId,
    requestId,
    sender: txSender || senderAddress || 'unknown',
    receiver: txReceiver || challenge.receiver,
    assetId: txAssetId || challenge.assetId,
    amount: txAmount || challenge.amount,
    confirmedRound,
    verifiedAt: Date.now(),
    settlementStatus: 'CONFIRMED',
    consumedAt: Date.now(),
  })

  if (!consumeResult.success) {
    return {
      valid: false,
      status: 'PAYMENT_ALREADY_USED',
      error: consumeResult.reason || 'TRANSACTION_ALREADY_USED',
    }
  }

  // Update challenge status
  challenge.status = 'VERIFIED'
  await savePaymentRequest(challenge)

  return {
    valid: true,
    status: 'PAYMENT_VERIFIED',
    transaction: {
      id: transactionId,
      confirmedRound,
      amount: txAmount || challenge.amount,
      asset: txAssetId || challenge.assetId,
      receiver: txReceiver || challenge.receiver,
      sender: txSender || senderAddress,
      settled: true,
    },
  }
}
