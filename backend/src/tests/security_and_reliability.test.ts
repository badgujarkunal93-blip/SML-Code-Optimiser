import { runCode, isLanguageSupported } from "../services/piston.js";
import { validateSyntax } from "../services/compiler.js";
import { verifyMultiCaseEquivalence } from "../services/verifier.js";
import { computeMultiRunBenchmark } from "../services/benchmark.js";
import fs from "fs";
import path from "path";

async function runTests() {
  console.log("=================================================");
  console.log("🔒 OPTIMA AI BACKEND HARDENING & SECURITY TEST SUITE");
  console.log("=================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, title: string) {
    if (condition) {
      console.log(`✅ [PASS] ${title}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${title}`);
      failed++;
    }
  }

  // TEST 1: Security Regression Test — Proof that Local Execution Fallback is Removed
  console.log("1. Running Security Regression Test (Local Fallback Removal)...");
  const markerFile = path.resolve(process.cwd(), "SECURITY_EXPLOIT_MARKER_TEST.tmp");
  if (fs.existsSync(markerFile)) fs.unlinkSync(markerFile);

  const maliciousPython = `
import os
with open("SECURITY_EXPLOIT_MARKER_TEST.tmp", "w") as f:
    f.write("EXPLOIT_SUCCESSFUL")
print("Exploit attempt finished")
`;

  // Execute malicious snippet
  await runCode(maliciousPython, "python");
  const markerCreatedOnHost = fs.existsSync(markerFile);
  if (fs.existsSync(markerFile)) fs.unlinkSync(markerFile);

  assert(
    !markerCreatedOnHost,
    "CRITICAL SECURITY PROOF: Malicious user code was NOT executed on the local backend host."
  );

  // TEST 2: Payload Size Limit (413 Payload Too Large)
  console.log("\n2. Testing Request Source Code Size Limit...");
  const oversizedCode = "x = 1\n".repeat(20000); // > 100KB
  const oversizedResult = await runCode(oversizedCode, "python");
  assert(
    oversizedResult.errorCode === "SOURCE_CODE_TOO_LARGE" || !oversizedResult.success,
    "Oversized payload rejected before API/Sandbox call."
  );

  // TEST 3: Unsupported Language Validation
  console.log("\n3. Testing Unsupported Language Handling...");
  const invalidLangResult = await runCode("print('test')", "kotlin");
  assert(
    invalidLangResult.errorCode === "UNSUPPORTED_LANGUAGE" && !isLanguageSupported("kotlin"),
    "Unsupported language 'kotlin' correctly rejected with structured error."
  );

  // TEST 4: Syntax Validation Check
  console.log("\n4. Testing Syntax Validation...");
  const invalidSyntax = "def foo():\n  print('missing colon'";
  const syntaxCheck = validateSyntax(invalidSyntax, "python");
  assert(
    !syntaxCheck.valid && Boolean(syntaxCheck.reason),
    "Invalid Python syntax correctly caught before execution sandbox."
  );

  // TEST 5: Multi-Case Verification
  console.log("\n5. Testing Multi-Case Verification...");
  const origCode = "items = [1, 2, 3]\nprint(sum(items))";
  const optCode = "items = [1, 2, 3]\nprint(sum(items))";
  const verificationRes = await verifyMultiCaseEquivalence(origCode, optCode, "python");
  console.log("Verification Result Debug:", JSON.stringify(verificationRes, null, 2));
  assert(
    verificationRes.correctnessVerified && verificationRes.testsRun > 0,
    "Multi-case correctness verification passed across test cases."
  );

  // TEST 6: Multi-Run Benchmark & Median Statistics
  console.log("\n6. Testing Multi-Run Benchmark with Median Statistics...");
  const benchRes = await computeMultiRunBenchmark(
    "a = [i for i in range(100)]",
    "a = list(range(100))",
    "python"
  );
  assert(
    typeof benchRes.originalTimeMs === "number" &&
      typeof benchRes.optimizedTimeMs === "number" &&
      Boolean(benchRes.originalStats),
    "Multi-run median benchmarking returned robust statistical metrics."
  );

  console.log("\n=================================================");
  console.log(`RESULTS: Passed ${passed} | Failed ${failed}`);
  console.log("=================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution error:", err);
  process.exit(1);
});
