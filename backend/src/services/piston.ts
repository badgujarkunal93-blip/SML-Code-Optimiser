import { CONFIG } from '../config.js'

export interface ExecutionResult {
  stdout: string
  stderr: string
  exitCode: number
  timeMs: number
}

export interface BenchmarkMetrics {
  originalTimeMs: number
  optimizedTimeMs: number
  improvementPct: number
  correctnessVerified: boolean
  originalStdout?: string
  optimizedStdout?: string
}

const LANGUAGE_ALIASES: Record<string, string> = {
  py: 'python',
  js: 'javascript',
  ts: 'typescript',
  cpp: 'c++',
  'c++': 'c++',
  cs: 'csharp',
  rb: 'ruby',
  rs: 'rust',
  go: 'go',
}

import { execFile } from 'child_process'

function runCodeLocally(code: string, language: string, stdin?: string): Promise<ExecutionResult | null> {
  return new Promise((resolve) => {
    const startTime = Date.now()
    let cmd = ''
    let args: string[] = []

    if (language === 'python' || language === 'py') {
      cmd = 'python3'
      args = ['-c', code]
    } else if (language === 'javascript' || language === 'js' || language === 'typescript' || language === 'ts') {
      cmd = 'node'
      args = ['-e', code]
    } else {
      return resolve(null)
    }

    const child = execFile(cmd, args, { timeout: 3000, maxBuffer: 1024 * 1024 }, (err, stdout, stderr) => {
      const wallTimeMs = Math.max(0.1, Date.now() - startTime)
      const exitCode = err ? (err.code !== undefined && typeof err.code === 'number' ? err.code : 1) : 0
      resolve({
        stdout: (stdout || '').trimEnd(),
        stderr: (stderr || (err ? err.message : '')).trimEnd(),
        exitCode,
        timeMs: Math.round(wallTimeMs * 100) / 100,
      })
    })

    if (stdin && child.stdin) {
      child.stdin.write(stdin)
      child.stdin.end()
    }
  })
}

export async function runCode(code: string, language: string, stdin?: string): Promise<ExecutionResult> {
  const cleanLang = (LANGUAGE_ALIASES[language.toLowerCase()] || language.toLowerCase()).trim()
  const startTime = Date.now()

  try {
    const response = await fetch(`${CONFIG.PISTON.URL.replace(/\/$/, '')}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'OptiChain/1.0' },
      body: JSON.stringify({
        language: cleanLang,
        version: '*',
        files: [{ content: code }],
        stdin: stdin || '',
      }),
    })

    const wallTimeMs = Date.now() - startTime

    if (response.ok) {
      const data: any = await response.json()
      const runResult = data.run || {}
      const pistonTimeSec = runResult.time
      const pistonTimeMs = pistonTimeSec !== undefined && pistonTimeSec !== null ? pistonTimeSec * 1000 : wallTimeMs

      return {
        stdout: (runResult.stdout || '').trimEnd(),
        stderr: (runResult.stderr || '').trimEnd(),
        exitCode: runResult.code !== null && runResult.code !== undefined ? runResult.code : -1,
        timeMs: Math.round(pistonTimeMs * 100) / 100,
      }
    }
  } catch {
    // Fallthrough to local fallback
  }

  // Fallback to local process execution if Piston is unavailable or whitelisted
  const localRes = await runCodeLocally(code, cleanLang, stdin)
  if (localRes) {
    return localRes
  }

  const wallTimeMs = Date.now() - startTime
  return {
    stdout: '',
    stderr: 'Piston API service restricted and local compiler unavailable.',
    exitCode: -1,
    timeMs: wallTimeMs,
  }
}

export async function benchmarkCode(
  originalCode: string,
  optimizedCode: string,
  language: string,
  stdin?: string
): Promise<BenchmarkMetrics> {
  const [origRes, optRes] = await Promise.all([
    runCode(originalCode, language, stdin),
    runCode(optimizedCode, language, stdin),
  ])

  let isCorrect = true

  if (origRes.exitCode !== 0 || optRes.exitCode !== 0) {
    isCorrect = false
  } else if (origRes.stdout !== optRes.stdout) {
    isCorrect = false
  }

  const origTimeMs = origRes.timeMs
  const optTimeMs = optRes.timeMs

  let improvementPct = 0
  if (origTimeMs > 0) {
    improvementPct = ((origTimeMs - optTimeMs) / origTimeMs) * 100
  }

  return {
    originalTimeMs: Math.round(origTimeMs * 100) / 100,
    optimizedTimeMs: Math.round(optTimeMs * 100) / 100,
    improvementPct: Math.round(improvementPct * 100) / 100,
    correctnessVerified: isCorrect,
    originalStdout: origRes.stdout,
    optimizedStdout: optRes.stdout,
  }
}
