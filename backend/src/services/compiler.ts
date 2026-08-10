export interface StaticAnalysisResult {
  validSyntax: boolean;
  syntaxError?: string;
  warnings: string[];
  cyclomaticComplexity: number;
  linesOfCode: number;
  detectedLoopCount: number;
}

export function validateSyntax(code: string, language: string): { valid: boolean; reason?: string } {
  if (!code || !code.trim()) {
    return { valid: false, reason: "Code snippet cannot be empty." };
  }

  const cleanLang = language.toLowerCase().trim();

  // Balanced brackets & parentheses check across all languages
  const stack: string[] = [];
  const opening = "({[";
  const closing = ")}]";
  const pairs: Record<string, string> = { ")": "(", "}": "{", "]": "[" };

  let inSingleLineComment = false;
  let inMultiLineComment = false;
  let inString: string | null = null;

  for (let i = 0; i < code.length; i++) {
    const char = code[i];
    const nextChar = code[i + 1] || "";

    // Handle string literals
    if (inString) {
      if (char === inString && code[i - 1] !== "\\") {
        inString = null;
      }
      continue;
    }

    if (char === '"' || char === "'" || char === "`") {
      inString = char;
      continue;
    }

    // Handle comments
    if (cleanLang === "python" || cleanLang === "py") {
      if (char === "#") {
        inSingleLineComment = true;
      }
      if (inSingleLineComment && char === "\n") {
        inSingleLineComment = false;
      }
      if (inSingleLineComment) continue;
    } else {
      if (char === "/" && nextChar === "/") {
        inSingleLineComment = true;
      }
      if (inSingleLineComment && char === "\n") {
        inSingleLineComment = false;
      }
      if (inSingleLineComment) continue;

      if (char === "/" && nextChar === "*") {
        inMultiLineComment = true;
      }
      if (inMultiLineComment && char === "*" && nextChar === "/") {
        inMultiLineComment = false;
        i++;
        continue;
      }
      if (inMultiLineComment) continue;
    }

    // Check bracket balance
    if (opening.includes(char)) {
      stack.push(char);
    } else if (closing.includes(char)) {
      const top = stack.pop();
      if (top !== pairs[char]) {
        return { valid: false, reason: `Syntax Error: Unmatched closing bracket '${char}'.` };
      }
    }
  }

  if (stack.length > 0) {
    return { valid: false, reason: `Syntax Error: Unclosed bracket '${stack[stack.length - 1]}'.` };
  }

  // Language specific structural rules
  if (cleanLang === "python" || cleanLang === "py") {
    const lines = code.split("\n");
    for (let idx = 0; idx < lines.length; idx++) {
      const line = lines[idx].trim();
      if (line.startsWith("#") || line.length === 0) continue;
      // Check def/if/for/while/class ending with colon
      if (/^\s*(def|class|if|elif|else|for|while|try|except|finally|with)\b/.test(line)) {
        if (!line.endsWith(":") && !line.includes("#")) {
          return { valid: false, reason: `Python Syntax Error on line ${idx + 1}: Missing colon ':' at end of control statement.` };
        }
      }
    }
  }

  return { valid: true };
}

export function analyzeCode(code: string, language: string): StaticAnalysisResult {
  const syntaxCheck = validateSyntax(code, language);
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
    validSyntax: syntaxCheck.valid,
    syntaxError: syntaxCheck.reason,
    warnings,
    cyclomaticComplexity,
    linesOfCode,
    detectedLoopCount: loopCount,
  };
}
