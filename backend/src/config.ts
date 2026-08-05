import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'

// Multi-location dotenv loader
const possibleEnvPaths = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '../.env'),
  path.resolve(process.cwd(), '../../.env'),
]

for (const envPath of possibleEnvPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath })
    break
  }
}

export const CONFIG = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3001', 10),
  DEV_BYPASS_PAYMENT: process.env.DEV_BYPASS_PAYMENT === 'true',
  ALGORAND: {
    NETWORK: process.env.ALGORAND_NETWORK || 'testnet',
    API_URL: process.env.ALGORAND_API_URL || 'https://testnet-api.algonode.cloud',
    INDEXER_URL: process.env.ALGORAND_INDEXER_URL || 'https://testnet-idx.algonode.cloud',
    USDC_ASSET_ID: parseInt(process.env.USDC_ASSET_ID || '31566704', 10),
    SERVICE_ADDRESS: process.env.ALGORAND_SERVICE_ADDRESS || 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
    REQUIRED_PAYMENT_AMOUNT: parseFloat(process.env.REQUIRED_PAYMENT_AMOUNT || '0.001'),
  },
  FACILITATOR: {
    URL: process.env.FACILITATOR_URL || 'https://facilitator.goplausible.xyz',
  },
  GROQ: {
    API_KEY: process.env.GROQ_API_KEY || '',
    MODEL: 'llama-3.3-70b-versatile',
  },
  PISTON: {
    URL: process.env.PISTON_URL || 'https://emkc.org/api/v2/piston',
  },
  FIREBASE: {
    PROJECT_ID: process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
    CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL || '',
    PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : '',
  },
}

export function getServiceWalletAddress(): string {
  return CONFIG.ALGORAND.SERVICE_ADDRESS
}

export function getMaskedApiKey(key: string): string {
  if (!key) return '(not set)'
  if (key.length <= 12) return '***'
  return `${key.slice(0, 8)}...${key.slice(-4)}`
}
