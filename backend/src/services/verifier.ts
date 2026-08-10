import crypto from "crypto";
import { runCode, ExecutionResult } from "./piston.js";

export interface TestCase {
  id: number | string;
  category?: string;
  input: string;
  expectedOutput?: string;
}

export interface VerificationResult {
  correctnessVerified: boolean;
  sha256Original: string;
  sha256Optimized: string;
  outputMatch: boolean;
  testsRun: number;
  testsPassed: number;
  testsFailed: number;
  verificationLevel: "multi_case" | "single_case" | "limited";
  testDetails: Array<{
    input: string;
    origStdout: string;
    optStdout: string;
    passed: boolean;
  }>;
}

/**
 * Derives safe, conservative test inputs for multi-case verification.
 * Does NOT generate invalid or breaking inputs.
 */
export function deriveSafeTestInputs(language: string, userStdin?: string, customTestCases?: TestCase[]): string[] {
  const inputs: string[] = [];

  // 1. Explicit user provided stdin first
  if (userStdin !== undefined && userStdin !== null) {
    inputs.push(userStdin);
  } else {
    inputs.push("");
  }

  // 2. Custom test cases from request
  if (customTestCases && Array.isArray(customTestCases)) {
    for (const tc of customTestCases) {
      if (tc.input !== undefined && !inputs.includes(tc.input)) {
        inputs.push(tc.input);
      }
    }
  }

  // 3. Add default empty input if not already present
  if (!inputs.includes("")) {
    inputs.push("");
  }

  // Limit to at most 4 safe test cases
  return inputs.slice(0, 4);
}

/**
 * Runs multi-case output equivalence verification across multiple test inputs in isolated sandboxes.
 */
export async function verifyMultiCaseEquivalence(
  originalCode: string,
  optimizedCode: string,
  language: string,
  userStdin?: string,
  customTestCases?: TestCase[]
): Promise<VerificationResult> {
  const testInputs = deriveSafeTestInputs(language, userStdin, customTestCases);
  const testDetails: Array<{ input: string; origStdout: string; optStdout: string; passed: boolean }> = [];

  let testsPassed = 0;
  let testsFailed = 0;
  let firstOrigStdout = "";
  let firstOptStdout = "";

  for (const input of testInputs) {
    const [origRes, optRes]: [ExecutionResult, ExecutionResult] = await Promise.all([
      runCode(originalCode, language, input),
      runCode(optimizedCode, language, input),
    ]);

    if (testDetails.length === 0) {
      firstOrigStdout = origRes.stdout;
      firstOptStdout = optRes.stdout;
    }

    const cleanOrig = (origRes.stdout || "").replace(/\r\n/g, "\n").trim();
    const cleanOpt = (optRes.stdout || "").replace(/\r\n/g, "\n").trim();

    // Check exit codes and stdout equality
    const passed =
      origRes.exitCode === optRes.exitCode &&
      (cleanOrig === cleanOpt || cleanOrig.replace(/\s+/g, "") === cleanOpt.replace(/\s+/g, ""));

    if (passed) {
      testsPassed++;
    } else {
      testsFailed++;
    }

    testDetails.push({
      input,
      origStdout: origRes.stdout,
      optStdout: optRes.stdout,
      passed,
    });
  }

  const testsRun = testInputs.length;
  const correctnessVerified = testsFailed === 0 && testsPassed > 0;
  const verificationLevel = testsRun > 1 ? "multi_case" : "single_case";

  const sha256Original = crypto.createHash("sha256").update(firstOrigStdout.trim()).digest("hex").slice(0, 16);
  const sha256Optimized = crypto.createHash("sha256").update(firstOptStdout.trim()).digest("hex").slice(0, 16);

  return {
    correctnessVerified,
    sha256Original,
    sha256Optimized,
    outputMatch: correctnessVerified,
    testsRun,
    testsPassed,
    testsFailed,
    verificationLevel,
    testDetails,
  };
}

export function verifyOutputEquivalence(origStdout: string, optStdout: string): VerificationResult {
  const cleanOrig = origStdout.trim();
  const cleanOpt = optStdout.trim();

  const sha256Original = crypto.createHash("sha256").update(cleanOrig).digest("hex").slice(0, 16);
  const sha256Optimized = crypto.createHash("sha256").update(cleanOpt).digest("hex").slice(0, 16);

  const outputMatch = cleanOrig === cleanOpt || cleanOrig.replace(/\s+/g, "") === cleanOpt.replace(/\s+/g, "");

  return {
    correctnessVerified: outputMatch,
    sha256Original,
    sha256Optimized,
    outputMatch,
    testsRun: 1,
    testsPassed: outputMatch ? 1 : 0,
    testsFailed: outputMatch ? 0 : 1,
    verificationLevel: "single_case",
    testDetails: [{ input: "", origStdout, optStdout, passed: outputMatch }],
  };
}
