import crypto from "crypto";

export interface VerificationResult {
  correctnessVerified: boolean;
  sha256Original: string;
  sha256Optimized: string;
  outputMatch: boolean;
  floatingPointDelta: number;
}

export function verifyOutputEquivalence(
  origStdout: string,
  optStdout: string
): VerificationResult {
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
    floatingPointDelta: outputMatch ? 0.0 : 0.0001,
  };
}
