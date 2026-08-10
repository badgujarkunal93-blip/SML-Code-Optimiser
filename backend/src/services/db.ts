import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { CONFIG } from '../config.js'
import admin from 'firebase-admin'

export interface PaymentRequestRecord {
  requestId: string
  userId?: string
  codeHash: string
  language: string
  amount: number
  assetId: number
  receiver: string
  network: string
  createdAt: number
  expiresAt: number
  status: 'PENDING' | 'VERIFIED' | 'EXPIRED' | 'REJECTED'
  payloadHash: string
}

export interface PaymentTransactionRecord {
  transactionId: string
  requestId: string
  sender: string
  receiver: string
  assetId: number
  amount: number
  confirmedRound: number
  verifiedAt: number
  settlementStatus: string
  consumedAt: number
}

// Persistent Storage Fallback Directory (for local persistent storage across restarts)
const STORAGE_DIR = path.resolve(process.cwd(), '.storage')
const REQUESTS_FILE = path.join(STORAGE_DIR, 'payment_requests.json')
const TRANSACTIONS_FILE = path.join(STORAGE_DIR, 'consumed_transactions.json')
const HISTORY_FILE = path.join(STORAGE_DIR, 'optimization_history.json')

function ensureStorageDir(): void {
  if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true })
  }
}

function loadJsonFile<T>(filePath: string): T[] {
  ensureStorageDir()
  if (!fs.existsSync(filePath)) {
    return []
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return []
  }
}

function saveJsonFile<T>(filePath: string, data: T[]): void {
  ensureStorageDir()
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
}

// Initialize Firestore DB handle if initialized in firebase.ts
export function getFirestore(): admin.firestore.Firestore | null {
  if (admin.apps.length > 0) {
    try {
      return admin.firestore()
    } catch {
      return null
    }
  }
  return null
}

export function computeCodeHash(code: string): string {
  return crypto.createHash('sha256').update(code.trim()).digest('hex')
}

export function computePaymentPayloadHash(data: {
  requestId: string
  codeHash: string
  language: string
  amount: number
  receiver: string
  assetId: number
}): string {
  const raw = `${data.requestId}:${data.codeHash}:${data.language.toLowerCase()}:${data.amount}:${data.receiver}:${data.assetId}`
  return crypto.createHash('sha256').update(raw).digest('hex')
}

export async function savePaymentRequest(request: PaymentRequestRecord): Promise<void> {
  const firestore = getFirestore()
  if (firestore) {
    try {
      await firestore.collection('payment_requests').doc(request.requestId).set(request)
      return
    } catch (err) {
      console.warn('[DB] Firestore write failed for payment_requests, using file fallback:', err)
    }
  }

  const requests = loadJsonFile<PaymentRequestRecord>(REQUESTS_FILE)
  const existingIdx = requests.findIndex((r) => r.requestId === request.requestId)
  if (existingIdx >= 0) {
    requests[existingIdx] = request
  } else {
    requests.push(request)
  }
  saveJsonFile(REQUESTS_FILE, requests)
}

export async function getPaymentRequest(requestId: string): Promise<PaymentRequestRecord | null> {
  if (!requestId) return null
  const firestore = getFirestore()
  if (firestore) {
    try {
      const doc = await firestore.collection('payment_requests').doc(requestId).get()
      if (doc.exists) {
        return doc.data() as PaymentRequestRecord
      }
    } catch (err) {
      console.warn('[DB] Firestore read failed for payment_requests:', err)
    }
  }

  const requests = loadJsonFile<PaymentRequestRecord>(REQUESTS_FILE)
  const found = requests.find((r) => r.requestId === requestId)
  return found || null
}

/**
  Atomic transaction replay check & consume.
  Returns true if consumption succeeded (first time seen).
  Returns false if transactionId has already been consumed (replay attack).
*/
export async function consumeTransactionId(txRecord: PaymentTransactionRecord): Promise<{ success: boolean; reason?: string }> {
  if (!txRecord.transactionId) {
    return { success: false, reason: 'INVALID_TRANSACTION_ID' }
  }

  const firestore = getFirestore()
  if (firestore) {
    try {
      const docRef = firestore.collection('consumed_transactions').doc(txRecord.transactionId)
      const doc = await docRef.get()
      if (doc.exists) {
        return { success: false, reason: 'TRANSACTION_ALREADY_USED' }
      }
      await docRef.set(txRecord)
      return { success: true }
    } catch (err) {
      console.warn('[DB] Firestore error during transaction replay check:', err)
    }
  }

  // File-backed atomic check
  const txs = loadJsonFile<PaymentTransactionRecord>(TRANSACTIONS_FILE)
  const existing = txs.find((t) => t.transactionId === txRecord.transactionId)
  if (existing) {
    return { success: false, reason: 'TRANSACTION_ALREADY_USED' }
  }

  txs.push(txRecord)
  saveJsonFile(TRANSACTIONS_FILE, txs)
  return { success: true }
}

export async function isTransactionConsumed(transactionId: string): Promise<boolean> {
  if (!transactionId) return false
  const firestore = getFirestore()
  if (firestore) {
    try {
      const doc = await firestore.collection('consumed_transactions').doc(transactionId).get()
      return doc.exists
    } catch {
      // Fallback to local check
    }
  }

  const txs = loadJsonFile<PaymentTransactionRecord>(TRANSACTIONS_FILE)
  return txs.some((t) => t.transactionId === transactionId)
}
