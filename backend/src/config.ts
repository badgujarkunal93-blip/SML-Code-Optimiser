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
  FRONTEND_URL: process.env.FRONTEND_URL || '',
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
  PAYMENT: {
    CHALLENGE_TTL_SECONDS: parseInt(process.env.PAYMENT_CHALLENGE_TTL_SECONDS || '600', 10),
  },
  GROQ: {
    API_KEY: process.env.GROQ_API_KEY || '',
    MODEL: 'llama-3.3-70b-versatile',
  },
  PISTON: {
    URL: process.env.PISTON_URL || 'https://emkc.org/api/v2/piston',
    API_KEY: process.env.PISTON_API_KEY || '',
    CACHE_TTL_SECONDS: parseInt(process.env.PISTON_RUNTIME_CACHE_TTL_SECONDS || '1800', 10),
    TIMEOUT_MS: parseInt(process.env.PISTON_TIMEOUT_MS || '5000', 10),
    MAX_RETRIES: parseInt(process.env.PISTON_MAX_RETRIES || '2', 10),
  },
  SECURITY: {
    MAX_SOURCE_CODE_BYTES: parseInt(process.env.MAX_SOURCE_CODE_BYTES || '100000', 10), // ~100KB
    EXECUTION_TIMEOUT_SECONDS: parseInt(process.env.EXECUTION_TIMEOUT_SECONDS || '5', 10),
    MAX_EXECUTION_OUTPUT_BYTES: parseInt(process.env.MAX_EXECUTION_OUTPUT_BYTES || '1048576', 10), // 1MB
    RATE_LIMIT_PER_MINUTE: parseInt(process.env.RATE_LIMIT_PER_MINUTE || '15', 10),
    MAX_CONCURRENT_EXECUTIONS: parseInt(process.env.MAX_CONCURRENT_EXECUTIONS || '5', 10),
  },
  BENCHMARK: {
    WARMUP_RUNS: parseInt(process.env.BENCHMARK_WARMUP_RUNS || '3', 10),
    MEASUREMENT_RUNS: parseInt(process.env.BENCHMARK_MEASUREMENT_RUNS || '10', 10),
  },
  FIREBASE: {
    PROJECT_ID: process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
    CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL || '',
    PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : '',
  },
}

export function validateConfig(): void {
  if (CONFIG.NODE_ENV === 'production' && CONFIG.DEV_BYPASS_PAYMENT) {
    throw new Error('DEV_BYPASS_PAYMENT cannot be enabled in production environment.')
  }
}

export function getServiceWalletAddress(): string {
  return CONFIG.ALGORAND.SERVICE_ADDRESS
}

export function getMaskedApiKey(key: string): string {
  if (!key) return '(not set)'
  if (key.length <= 12) return '***'
  return `${key.slice(0, 8)}...${key.slice(-4)}`
}

