import { CONFIG } from '../config.js'

export interface ExecutionResult {
  success: boolean
  stdout: string
  stderr: string
  exitCode: number
  timeMs: number
  pistonTimeMs: number
  timedOut: boolean
  stdoutTruncated?: boolean
  stderrTruncated?: boolean
  errorCode?: string
  errorMessage?: string
}

export interface BenchmarkMetrics {
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
  originalStats?: { median: number; min: number; max: number; stdDev: number }
  optimizedStats?: { median: number; min: number; max: number; stdDev: number }
  confidenceLevel?: string
}

const SUPPORTED_LANGUAGES: Record<string, { canonical: string; defaultVersion: string }> = {
  python: { canonical: 'python', defaultVersion: '3.10.0' },
  py: { canonical: 'python', defaultVersion: '3.10.0' },
  javascript: { canonical: 'javascript', defaultVersion: '18.15.0' },
  js: { canonical: 'javascript', defaultVersion: '18.15.0' },
  typescript: { canonical: 'typescript', defaultVersion: '5.0.3' },
  ts: { canonical: 'typescript', defaultVersion: '5.0.3' },
  'c++': { canonical: 'c++', defaultVersion: '10.2.0' },
  cpp: { canonical: 'c++', defaultVersion: '10.2.0' },
  c: { canonical: 'c', defaultVersion: '10.2.0' },
  java: { canonical: 'java', defaultVersion: '15.0.2' },
  rust: { canonical: 'rust', defaultVersion: '1.68.2' },
  rs: { canonical: 'rust', defaultVersion: '1.68.2' },
  go: { canonical: 'go', defaultVersion: '1.16.2' },
  csharp: { canonical: 'csharp', defaultVersion: '6.12.0' },
  cs: { canonical: 'csharp', defaultVersion: '6.12.0' },
  ruby: { canonical: 'ruby', defaultVersion: '3.0.1' },
  rb: { canonical: 'ruby', defaultVersion: '3.0.1' },
  php: { canonical: 'php', defaultVersion: '8.2.3' },
}

export function isLanguageSupported(lang: string): boolean {
  if (!lang) return false
  const clean = lang.trim().toLowerCase()
  return Boolean(SUPPORTED_LANGUAGES[clean])
}

export function getSupportedLanguagesList(): string[] {
  return Array.from(new Set(Object.values(SUPPORTED_LANGUAGES).map((v) => v.canonical)))
}

export async function resolveRuntime(requestedLanguage: string): Promise<{ canonical: string; version: string } | null> {
  const cleanLang = requestedLanguage.trim().toLowerCase()
  const staticEntry = SUPPORTED_LANGUAGES[cleanLang]
  if (staticEntry) {
    return { canonical: staticEntry.canonical, version: staticEntry.defaultVersion }
  }
  return null
}

function truncateOutput(text: string, maxBytes: number): { text: string; truncated: boolean } {
  const buffer = Buffer.from(text, 'utf-8')
  if (buffer.length <= maxBytes) {
    return { text, truncated: false }
  }
  const sliced = buffer.subarray(0, maxBytes).toString('utf-8')
  return { text: `${sliced}\n...[OUTPUT TRUNCATED EXCEEDED ${maxBytes} BYTES]`, truncated: true }
}

/**
 * Execute code via isolated Piston sandbox.
 * CRITICAL SECURITY GUARANTEE: Never falls back to local host process execution.
 */
export async function runCode(code: string, language: string, stdin?: string): Promise<ExecutionResult> {
  const startTime = Date.now()
  const runtime = await resolveRuntime(language)

  if (!runtime) {
    return {
      success: false,
      stdout: '',
      stderr: `Unsupported language: '${language}'. Supported languages: ${getSupportedLanguagesList().join(', ')}`,
      exitCode: -1,
      timeMs: 0,
      pistonTimeMs: 0,
      timedOut: false,
      errorCode: 'UNSUPPORTED_LANGUAGE',
      errorMessage: `Unsupported language: '${language}'`,
    }
  }

  // Enforce Max Source Code Bytes
  const codeBuffer = Buffer.from(code || '', 'utf-8')
  if (codeBuffer.length > CONFIG.SECURITY.MAX_SOURCE_CODE_BYTES) {
    return {
      success: false,
      stdout: '',
      stderr: `Source code size (${codeBuffer.length} bytes) exceeds maximum limit (${CONFIG.SECURITY.MAX_SOURCE_CODE_BYTES} bytes).`,
      exitCode: -1,
      timeMs: 0,
      pistonTimeMs: 0,
      timedOut: false,
      errorCode: 'SOURCE_CODE_TOO_LARGE',
      errorMessage: 'Payload Too Large',
    }
  }

  const executeUrl = `${CONFIG.PISTON.URL.replace(/\/$/, '')}/execute`
  const controller = new AbortController()
  const timeoutMs = CONFIG.SECURITY.EXECUTION_TIMEOUT_SECONDS * 1000
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'OptiChain/1.0',
  }
  if (CONFIG.PISTON.API_KEY) {
    headers['Authorization'] = CONFIG.PISTON.API_KEY
  }

  try {
    const response = await fetch(executeUrl, {
      method: 'POST',
      headers,
      signal: controller.signal,
      body: JSON.stringify({
        language: runtime.canonical,
        version: runtime.version,
        files: [{ content: code }],
        stdin: stdin || '',
      }),
    })
    clearTimeout(timeoutId)

    const wallTimeMs = Date.now() - startTime

    if (!response.ok) {
      return {
        success: false,
        stdout: '',
        stderr: 'Secure execution service returned HTTP error.',
        exitCode: -1,
        timeMs: wallTimeMs,
        pistonTimeMs: 0,
        timedOut: false,
        errorCode: 'EXECUTION_SERVICE_UNAVAILABLE',
        errorMessage: 'Secure code execution is temporarily unavailable.',
      }
    }

    const data: any = await response.json()
    const runResult = data.run || {}
    const rawStdout = String(runResult.stdout || '').trimEnd()
    const rawStderr = String(runResult.stderr || '').trimEnd()
    const exitCode = runResult.code !== null && runResult.code !== undefined ? Number(runResult.code) : -1

    const pistonTimeSec = runResult.time
    const pistonTimeMs = pistonTimeSec !== undefined && pistonTimeSec !== null ? pistonTimeSec * 1000 : wallTimeMs

    const stdoutObj = truncateOutput(rawStdout, CONFIG.SECURITY.MAX_EXECUTION_OUTPUT_BYTES)
    const stderrObj = truncateOutput(rawStderr, CONFIG.SECURITY.MAX_EXECUTION_OUTPUT_BYTES)

    return {
      success: exitCode === 0,
      stdout: stdoutObj.text,
      stderr: stderrObj.text,
      exitCode,
      timeMs: Math.round(wallTimeMs * 100) / 100,
      pistonTimeMs: Math.round(pistonTimeMs * 100) / 100,
      timedOut: false,
      stdoutTruncated: stdoutObj.truncated,
      stderrTruncated: stderrObj.truncated,
    }
  } catch (err: any) {
    clearTimeout(timeoutId)
    const wallTimeMs = Date.now() - startTime
    const isTimeout = err.name === 'AbortError' || err.message?.includes('aborted')

    if (isTimeout) {
      return {
        success: false,
        stdout: '',
        stderr: `Execution exceeded the allowed time limit of ${CONFIG.SECURITY.EXECUTION_TIMEOUT_SECONDS}s.`,
        exitCode: -1,
        timeMs: wallTimeMs,
        pistonTimeMs: 0,
        timedOut: true,
        errorCode: 'TIMEOUT',
        errorMessage: 'Execution exceeded the allowed time limit.',
      }
    }

    return {
      success: false,
      stdout: '',
      stderr: 'Secure code execution is temporarily unavailable.',
      exitCode: -1,
      timeMs: wallTimeMs,
      pistonTimeMs: 0,
      timedOut: false,
      errorCode: 'EXECUTION_SERVICE_UNAVAILABLE',
      errorMessage: 'Secure code execution is temporarily unavailable.',
    }
  }
}
