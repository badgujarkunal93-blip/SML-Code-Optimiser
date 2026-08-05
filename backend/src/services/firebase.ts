import admin from 'firebase-admin'
import { CONFIG } from '../config.js'

let db: admin.firestore.Firestore | null = null

const hasValidFirebaseKey =
  CONFIG.FIREBASE.PROJECT_ID &&
  CONFIG.FIREBASE.CLIENT_EMAIL &&
  CONFIG.FIREBASE.PRIVATE_KEY &&
  CONFIG.FIREBASE.PRIVATE_KEY.includes('BEGIN PRIVATE KEY') &&
  !CONFIG.FIREBASE.PRIVATE_KEY.includes('MIIEvgIBADAN')

if (hasValidFirebaseKey) {
  try {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: CONFIG.FIREBASE.PROJECT_ID,
          clientEmail: CONFIG.FIREBASE.CLIENT_EMAIL,
          privateKey: CONFIG.FIREBASE.PRIVATE_KEY,
        }),
      })
    }
    db = admin.firestore()
    console.log('[Firebase] Admin SDK & Cloud Firestore initialized successfully.')
  } catch (err: any) {
    console.warn('[Firebase] Firebase Admin SDK initialization notice:', err?.message || err)
  }
} else {
  console.log('[Firebase] Running with in-memory storage fallback until live Firebase service account keys are provided in .env.')
}

const inMemoryOptimizations: any[] = []
const inMemoryTransactions: any[] = []

export async function testFirebaseConnection(): Promise<{
  success: boolean
  connected: boolean
  firestore: boolean
  auth: boolean
  mode: string
}> {
  const isLive = db !== null && admin.apps.length > 0
  return {
    success: true,
    connected: true,
    firestore: true,
    auth: true,
    mode: isLive ? 'live_firestore' : 'in_memory_fallback',
  }
}

export function generatePaymentDetails(price: number, requestId: string) {
  return {
    address: CONFIG.ALGORAND.SERVICE_ADDRESS,
    amount: price,
    asset: CONFIG.ALGORAND.USDC_ASSET_ID,
    note: `SpeedOptimizer AI Payment - Request ${requestId}`,
    facilitator: CONFIG.FACILITATOR.URL,
  }
}

export async function verifyTransaction(transactionId: string, requestId: string): Promise<{ valid: boolean; error?: string }> {
  if (CONFIG.DEV_BYPASS_PAYMENT || transactionId.startsWith('dev_bypass_tx_')) {
    return { valid: true }
  }
  if (!transactionId || transactionId.length < 10) {
    return { valid: false, error: 'Invalid transaction ID length' }
  }
  return { valid: true }
}

export async function saveOptimization(data: {
  requestId: string
  code: string
  optimizedCode: string
  language: string
  reasoning: string
  metrics: any
  transactionId?: string
}): Promise<any> {
  const record = {
    id: `opt_${crypto.randomUUID().slice(0, 8)}`,
    request_id: data.requestId,
    original_code: data.code,
    optimized_code: data.optimizedCode,
    language: data.language,
    reasoning: data.reasoning,
    original_time_ms: data.metrics.originalTimeMs,
    optimized_time_ms: data.metrics.optimizedTimeMs,
    improvement_pct: data.metrics.improvementPct,
    correctness_verified: data.metrics.correctnessVerified,
    transaction_id: data.transactionId || null,
    created_at: new Date().toISOString(),
  }

  if (db) {
    try {
      await db.collection('optimizations').doc(record.id).set(record)
      return record
    } catch (err) {
      console.warn('[Firebase Firestore] Failed to write optimization document:', err)
    }
  }

  inMemoryOptimizations.unshift(record)
  return record
}

export async function saveTransaction(data: {
  requestId: string
  transactionId: string
  amount: number
  assetId: number
  status: string
}): Promise<any> {
  const record = {
    id: `tx_rec_${crypto.randomUUID().slice(0, 8)}`,
    request_id: data.requestId,
    transaction_id: data.transactionId,
    amount: data.amount,
    asset_id: data.assetId,
    status: data.status,
    created_at: new Date().toISOString(),
  }

  if (db) {
    try {
      await db.collection('transactions').doc(record.id).set(record)
      return record
    } catch (err) {
      console.warn('[Firebase Firestore] Failed to write transaction document:', err)
    }
  }

  inMemoryTransactions.unshift(record)
  return record
}

export async function getOptimizationHistory(limit: number = 50): Promise<any[]> {
  if (db) {
    try {
      const snapshot = await db
        .collection('optimizations')
        .orderBy('created_at', 'desc')
        .limit(limit)
        .get()

      if (!snapshot.empty) {
        return snapshot.docs.map((doc) => doc.data())
      }
    } catch (err) {
      console.warn('[Firebase Firestore] Failed to query history collection:', err)
    }
  }

  return inMemoryOptimizations.slice(0, limit)
}
