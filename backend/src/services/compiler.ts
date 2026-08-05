export interface StaticAnalysisResult {
  validSyntax: boolean;
  warnings: string[];
  cyclomaticComplexity: number;
  linesOfCode: number;
  detectedLoopCount: number;
}

export function analyzeCode(code: string, language: string): StaticAnalysisResult {
  const lines = code.split("\n");
  const linesOfCode = lines.filter((l) => l.trim().length > 0).length;

  let loopCount = 0;
  let cyclomaticComplexity = 1;
  const warnings: string[] = [];

  // Count loops and branching
  const loopRegex = /\b(for|while)\b/g;
  const branchRegex = /\b(if|else if|elif|switch|case|catch)\b/g;

  const loopMatches = code.match(loopRegex);
  if (loopMatches) {
    loopCount = loopMatches.length;
    cyclomaticComplexity += loopMatches.length * 2;
  }

  const branchMatches = code.match(branchRegex);
  if (branchMatches) {
    cyclomaticComplexity += branchMatches.length;
  }

  if (loopCount >= 2) {
    warnings.push(`Detected ${loopCount} loops; potential nested O(n²) performance bottleneck.`);
  }

  if (linesOfCode > 200) {
    warnings.push("High Lines of Code (LOC); refactoring into modular functions recommended.");
  }

  return {
    validSyntax: true,
    warnings,
    cyclomaticComplexity,
    linesOfCode,
    detectedLoopCount: loopCount,
  };
}
