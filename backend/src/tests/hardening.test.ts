import { CONFIG, validateConfig } from '../config.js'
import { createPaymentChallenge, verifyStrictPayment } from '../services/payment.js'
import { verifyMultiCaseEquivalence, deriveLanguageAwareTestInputs } from '../services/verifier.js'
import { computeMultiRunBenchmark } from '../services/benchmark.js'
import { runCode } from '../services/piston.js'

async function runHardeningTests() {
  console.log('🧪 Starting Optima AI Backend Hardening Verification Test Suite...\n')
  let passedCount = 0
  let failedCount = 0

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`)
      passedCount++
    } else {
      console.error(`  ❌ [FAIL] ${testName} ${detail ? `(${detail})` : ''}`)
      failedCount++
    }
  }

  // --- 1. Security & Fail-Fast Production Guards ---
  console.log('--- 1. Security & Production Guard Tests ---')

  try {
    const origEnv = CONFIG.NODE_ENV
    const origBypass = CONFIG.DEV_BYPASS_PAYMENT

    // Temporarily set prod + bypass to test fail-fast
    CONFIG.NODE_ENV = 'production'
    CONFIG.DEV_BYPASS_PAYMENT = true

    let thrown = false
    try {
      validateConfig()
    } catch {
      thrown = true
    }
    assert(thrown, 'Production Dev Bypass Guard (Fails fast if DEV_BYPASS_PAYMENT enabled in production)')

    // Restore
    CONFIG.NODE_ENV = origEnv
    CONFIG.DEV_BYPASS_PAYMENT = origBypass
  } catch (err: any) {
    assert(false, 'Production Guard Test', err.message)
  }

  // Source code payload size limit
  const hugeCode = 'x = 1\n' + 'a'.repeat(CONFIG.SECURITY.MAX_SOURCE_CODE_BYTES + 500)
  const pistonSizeRes = await runCode(hugeCode, 'python')
  assert(pistonSizeRes.errorCode === 'SOURCE_CODE_TOO_LARGE', 'Payload Size Limit Guard (Rejects >100KB source code)')

  // --- 2. Cryptographic Payment Verification & Replay Protection ---
  console.log('\n--- 2. Payment Verification & Replay Protection Tests ---')

  const testCode = `def add(a, b):\n    return a + b\nprint(add(5, 10))`
  const challenge = await createPaymentChallenge(testCode, 'python')

  assert(Boolean(challenge.requestId), 'Payment Challenge Generation (requestId issued)')
  assert(Boolean(challenge.payloadHash), 'Cryptographic Request Binding (SHA256 payloadHash created)')
  assert(challenge.amount > 0, 'Payment Amount Check (Amount bound to challenge)')

  // Verification without transaction ID -> Should fail
  const emptyTxCheck = await verifyStrictPayment({
    transactionId: '',
    requestId: challenge.requestId,
    code: testCode,
    language: 'python',
  })
  assert(emptyTxCheck.status === 'PAYMENT_REJECTED' && !emptyTxCheck.valid, 'Reject Empty Transaction ID')

  // Verification with altered source code -> Should fail cryptographic binding check
  const alteredCode = `def add(a, b):\n    return a * b\nprint(add(5, 10))`
  const payloadMismatchCheck = await verifyStrictPayment({
    transactionId: 'fake_tx_1234567890',
    requestId: challenge.requestId,
    code: alteredCode,
    language: 'python',
  })
  assert(Boolean(payloadMismatchCheck.error?.includes('PAYLOAD_MISMATCH')), 'Payload Code Mismatch Rejection (Cryptographic hash tampering check)')

  // Replay Attack Test: Dev bypass simulated tx
  if (CONFIG.DEV_BYPASS_PAYMENT && CONFIG.NODE_ENV !== 'production') {
    const devTxId = `dev_bypass_tx_test_${Date.now()}`
    const devCheck1 = await verifyStrictPayment({
      transactionId: devTxId,
      requestId: challenge.requestId,
      code: testCode,
      language: 'python',
    })
    assert(devCheck1.valid && devCheck1.status === 'PAYMENT_VERIFIED', 'Dev Bypass Valid Payment Accepted')
  }

  // --- 3. Language-Aware Behavioral Equivalence Verification ---
  console.log('\n--- 3. Behavioral Equivalence Testing Tests ---')

  const pyInputs = deriveLanguageAwareTestInputs('python', 'code containing input() and sort()')
  assert(pyInputs.length >= 3, 'Language-Aware Test Case Generator (Derived boundary & edge cases)')

  const origCodePy = `import sys\ntry:\n    nums = list(map(int, sys.stdin.read().split()))\n    print("Result:", sum(nums))\nexcept Exception:\n    print("Result: 0")`
  const optCodePy = `import sys\ntry:\n    nums = list(map(int, sys.stdin.read().split()))\n    print(f"Result: {sum(nums)}")\nexcept Exception:\n    print("Result: 0")`
  const diffCodePy = `print("Result: 9999")`

  const equivCheck = await verifyMultiCaseEquivalence(origCodePy, optCodePy, 'python', '10 20 30')
  // If public Piston rate-limits, verify graceful degradation
  if (equivCheck.testDetails[0]?.reason?.includes('Sandbox execution error')) {
    assert(!equivCheck.correctnessVerified, 'Behavioral Equivalence Graceful Rate Limit Handling')
  } else {
    assert(equivCheck.correctnessVerified && equivCheck.testsPassed > 0, 'Behavioral Equivalence Pass for Equivalent Programs')
  }

  const nonEquivCheck = await verifyMultiCaseEquivalence(origCodePy, diffCodePy, 'python', '10 20 30')
  assert(!nonEquivCheck.correctnessVerified, 'Behavioral Equivalence Fail for Inequivalent Programs')

  // --- 4. Multi-Run Benchmarking & Median Statistics ---
  console.log('\n--- 4. Benchmarking Engine Tests ---')

  const benchRes = await computeMultiRunBenchmark(origCodePy, optCodePy, 'python', '5 15 25')
  assert(typeof benchRes.originalTimeMs === 'number', 'Benchmark Original Median Time Collected')
  assert(typeof benchRes.optimizedTimeMs === 'number', 'Benchmark Optimized Median Time Collected')
  assert(typeof benchRes.originalStats.p95 === 'number', 'Benchmark P95 Percentile Calculated')
  assert(benchRes.runsConfigured.measurement >= 1, 'Benchmark Measurement Runs Configured')

  console.log(`\n==================================================`)
  console.log(`SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`)
  console.log(`==================================================\n`)

  if (failedCount > 0) {
    process.exit(1)
  }
}

runHardeningTests().catch((err) => {
  console.error('Unhandled test execution error:', err)
  process.exit(1)
})
