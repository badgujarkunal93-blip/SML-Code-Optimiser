export interface LanguageDetectionResult {
  language: string;
  confidence: number;
  requiresUserConfirmation: boolean;
  detectedFeatures: string[];
}

export function detectLanguage(code: string): LanguageDetectionResult {
  const cleanCode = code.trim();
  if (!cleanCode) {
    return {
      language: "python",
      confidence: 50,
      requiresUserConfirmation: true,
      detectedFeatures: ["empty"],
    };
  }

  let language = "python";
  let confidence = 75;
  const features: string[] = [];

  // Python patterns
  if (
    /def\s+\w+\s*\(/.test(cleanCode) ||
    /import\s+\w+|from\s+\w+\s+import/.test(cleanCode) ||
    /print\s*\(/.test(cleanCode) ||
    /elif\s+:|elif\s+/.test(cleanCode) ||
    /__name__\s*==\s*['"]__main__['"]/.test(cleanCode)
  ) {
    language = "python";
    confidence = 98;
    features.push("Python def/import/print syntax");
  }
  // JavaScript / TypeScript patterns
  else if (
    /console\.log\(/.test(cleanCode) ||
    /const\s+\w+\s*=|let\s+\w+\s*=|var\s+\w+\s*=/.test(cleanCode) ||
    /function\s+\w+\s*\(/.test(cleanCode) ||
    /=>\s*\{/.test(cleanCode) ||
    /interface\s+\w+|type\s+\w+\s*=/.test(cleanCode)
  ) {
    if (/: \w+|interface |type |as \w+/.test(cleanCode)) {
      language = "typescript";
      confidence = 96;
      features.push("TypeScript type annotations");
    } else {
      language = "javascript";
      confidence = 96;
      features.push("JavaScript ES6 syntax");
    }
  }
  // Rust patterns
  else if (
    /fn\s+main\s*\(/.test(cleanCode) ||
    /let\s+mut\s+/.test(cleanCode) ||
    /println!\s*\(/.test(cleanCode) ||
    /use\s+std::/.test(cleanCode) ||
    /pub\s+fn\s+/.test(cleanCode)
  ) {
    language = "rust";
    confidence = 98;
    features.push("Rust fn/println! syntax");
  }
  // Go patterns
  else if (
    /package\s+main/.test(cleanCode) ||
    /func\s+main\s*\(/.test(cleanCode) ||
    /fmt\.Println\(/.test(cleanCode) ||
    /import\s*\(\s*"fmt"/.test(cleanCode)
  ) {
    language = "go";
    confidence = 99;
    features.push("Go package main syntax");
  }
  // Java patterns
  else if (
    /public\s+class\s+\w+/.test(cleanCode) ||
    /System\.out\.println\(/.test(cleanCode) ||
    /public\s+static\s+void\s+main/.test(cleanCode)
  ) {
    language = "java";
    confidence = 98;
    features.push("Java public static void main syntax");
  }
  // C / C++ patterns
  else if (
    /#include\s*<iostream>|std::cout|std::vector/.test(cleanCode)
  ) {
    language = "cpp";
    confidence = 98;
    features.push("C++ iostream/std syntax");
  } else if (
    /#include\s*<stdio\.h>|printf\s*\(|scanf\s*\(/.test(cleanCode)
  ) {
    language = "c";
    confidence = 97;
    features.push("C stdio.h syntax");
  }
  // C# patterns
  else if (
    /using\s+System;|Console\.WriteLine\(/.test(cleanCode) ||
    /namespace\s+\w+/.test(cleanCode)
  ) {
    language = "csharp";
    confidence = 96;
    features.push("C# System/Console syntax");
  }
  // Swift patterns
  else if (
    /import\s+Foundation|import\s+UIKit|func\s+\w+\(\)->/.test(cleanCode) ||
    /print\s*\(.*\\\(\w+\)\)/.test(cleanCode)
  ) {
    language = "swift";
    confidence = 95;
    features.push("Swift Foundation/func syntax");
  }
  // Kotlin patterns
  else if (
    /fun\s+main\s*\(/.test(cleanCode) ||
    /println\s*\(/.test(cleanCode) && /val\s+\w+|var\s+\w+/.test(cleanCode)
  ) {
    language = "kotlin";
    confidence = 95;
    features.push("Kotlin fun main syntax");
  } else {
    // Low confidence fallback
    language = "python";
    confidence = 65;
    features.push("Generic heuristics fallback");
  }

  return {
    language,
    confidence,
    requiresUserConfirmation: confidence < 70,
    detectedFeatures: features,
  };
}
