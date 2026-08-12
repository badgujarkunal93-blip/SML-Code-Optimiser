export interface DetectionResult {
  language: string;
  confidence: number; // 0 to 100
  formatter: string;
  compiler: string;
  runtime: string;
}

export function detectLanguage(code: string): DetectionResult {
  const text = code.trim();
  if (!text) {
    return {
      language: "python",
      confidence: 100,
      formatter: "Black (PEP8)",
      compiler: "Python 3.11",
      runtime: "CPython",
    };
  }

  const scores: Record<string, number> = {
    teal: 0,
    pyteal: 0,
    python: 0,
    javascript: 0,
    typescript: 0,
    cpp: 0,
    c: 0,
    java: 0,
    go: 0,
    rust: 0,
    csharp: 0,
    php: 0,
    ruby: 0,
    swift: 0,
    kotlin: 0,
    sql: 0,
    bash: 0,
  };

  // TEAL patterns
  if (/#pragma\s+version\s+\d+/.test(text)) scores.teal += 70;
  if (/\b(txn|global|gtxn|itxn|app_global_get|app_local_get|btoi|itob|pop|dup|assert)\b/.test(text)) scores.teal += 45;

  // PyTeal patterns
  if (/\bfrom\s+pyteal\s+import\b|\bimport\s+pyteal\b/.test(text)) scores.pyteal += 75;
  if (/\b(Txn\.|Global\.|App\.|Seq\(|Int\(|Bytes\(|Cond\()/ .test(text)) scores.pyteal += 50;

  // Python patterns
  if (/\bdef\s+[a-zA-Z_]\w*\s*\(/.test(text)) scores.python += 35;
  if (/\bimport\s+[a-zA-Z_]\w*/.test(text) && !/\bfrom\s+["']/.test(text)) scores.python += 20;
  if (/\bprint\s*\(/.test(text)) scores.python += 20;
  if (/\belif\b/.test(text)) scores.python += 30;
  if (/:\s*\n\s+/.test(text) && !/[{}]/.test(text)) scores.python += 25;
  if (/\bself\b/.test(text)) scores.python += 20;
  if (/list\(|dict\(|range\(/.test(text)) scores.python += 15;

  // JavaScript / TypeScript patterns
  if (/\bconsole\.log\s*\(/.test(text)) {
    scores.javascript += 40;
    scores.typescript += 35;
  }
  if (/\bconst\b|\blet\b|\bvar\b/.test(text)) {
    scores.javascript += 25;
    scores.typescript += 25;
  }
  if (/\bfunction\s+[a-zA-Z_]\w*/.test(text)) {
    scores.javascript += 25;
    scores.typescript += 25;
  }
  if (/\b=>\s*[{(]/.test(text)) {
    scores.javascript += 20;
    scores.typescript += 20;
  }
  if (/:\s*(string|number|boolean|any|void|never|object|Array<|\w+\[\])/.test(text)) {
    scores.typescript += 45;
  }
  if (/\binterface\s+[A-Z]\w*/.test(text) || /\btype\s+[A-Z]\w*\s*=/.test(text)) {
    scores.typescript += 50;
  }

  // C / C++ patterns
  if (/#include\s*<[a-zA-Z0-9_.]+>/.test(text)) {
    scores.cpp += 50;
    scores.c += 40;
  }
  if (/std::\w+|cout\s*<<|cin\s*>>|using\s+namespace\s+std/.test(text)) {
    scores.cpp += 60;
  }
  if (/printf\s*\(|scanf\s*\(/.test(text)) {
    scores.c += 35;
    scores.cpp += 15;
  }

  // Java patterns
  if (/\bpublic\s+class\s+[A-Z]\w*/.test(text)) scores.java += 55;
  if (/System\.out\.println\s*\(/.test(text)) scores.java += 55;
  if (/\bpublic\s+static\s+void\s+main\s*\(/.test(text)) scores.java += 60;
  if (/\bString\[\]\s+args/.test(text)) scores.java += 40;

  // Go patterns
  if (/\bpackage\s+main\b/.test(text)) scores.go += 60;
  if (/\bfunc\s+main\s*\(\)/.test(text)) scores.go += 50;
  if (/fmt\.Println|fmt\.Printf/.test(text)) scores.go += 50;
  if (/:=\s*/.test(text)) scores.go += 30;

  // Rust patterns
  if (/\bfn\s+main\s*\(\)/.test(text)) scores.rust += 60;
  if (/\blet\s+mut\b/.test(text)) scores.rust += 50;
  if (/println!\s*\(/.test(text)) scores.rust += 55;
  if (/match\s+\w+\s*\{/.test(text)) scores.rust += 30;

  // C# patterns
  if (/\busing\s+System;/.test(text)) scores.csharp += 60;
  if (/Console\.WriteLine\s*\(/.test(text)) scores.csharp += 55;
  if (/\bnamespace\s+[A-Z]\w*/.test(text)) scores.csharp += 40;

  // PHP patterns
  if (/<\?php/.test(text) || /\$[a-zA-Z_]\w*/.test(text)) scores.php += 60;
  if (/echo\s+["']/.test(text)) scores.php += 40;

  // Ruby patterns
  if (/\bdef\s+[a-zA-Z_]\w*/.test(text) && /\bend\b/.test(text)) scores.ruby += 40;
  if (/puts\s+["']/.test(text)) scores.ruby += 40;

  // SQL patterns
  if (/\bSELECT\b.*\bFROM\b/i.test(text)) scores.sql += 60;
  if (/\bINSERT\s+INTO\b|\bUPDATE\b.*\bSET\b|\bDELETE\b.*\bFROM\b/i.test(text)) scores.sql += 50;

  // Determine highest scoring language
  let bestLang = "python";
  let maxScore = 0;

  for (const [lang, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      bestLang = lang;
    }
  }

  // Calculate confidence percentage
  const confidence = Math.min(99, Math.max(75, maxScore > 0 ? Math.round(Math.min(100, maxScore * 1.4)) : 80));

  const metadataMap: Record<string, { formatter: string; compiler: string; runtime: string }> = {
    teal: { formatter: "teal-fmt", compiler: "Algorand AVM 10 (TEAL)", runtime: "AVM Sandbox / Algorand Node" },
    pyteal: { formatter: "Black (PEP8)", compiler: "PyTeal -> TEAL Compiler", runtime: "AVM Sandbox / CPython" },
    python: { formatter: "Black (PEP8)", compiler: "Python 3.11", runtime: "CPython" },
    javascript: { formatter: "Prettier", compiler: "V8 Engine", runtime: "Node.js 20" },
    typescript: { formatter: "Prettier (TS)", compiler: "tsc (TypeScript 5)", runtime: "Node.js 20" },
    cpp: { formatter: "clang-format", compiler: "GCC 13 / g++", runtime: "Native Executable" },
    c: { formatter: "clang-format", compiler: "GCC 13", runtime: "Native Executable" },
    java: { formatter: "google-java-format", compiler: "OpenJDK 21", runtime: "JVM" },
    go: { formatter: "gofmt", compiler: "Go Compiler 1.22", runtime: "Go Runtime" },
    rust: { formatter: "rustfmt", compiler: "rustc 1.76", runtime: "Native Executable" },
    csharp: { formatter: "dotnet-format", compiler: "Roslyn (.NET 8)", runtime: "CLR" },
    php: { formatter: "php-cs-fixer", compiler: "Zend Engine", runtime: "PHP 8.3" },
    ruby: { formatter: "RuboCop", compiler: "YARV", runtime: "Ruby 3.3" },
    sql: { formatter: "sql-formatter", compiler: "PostgreSQL / SQLite Engine", runtime: "RDBMS" },
    bash: { formatter: "shfmt", compiler: "Bash Shell 5.2", runtime: "Unix Shell" },
  };

  const meta = metadataMap[bestLang] || metadataMap.python;

  return {
    language: bestLang,
    confidence,
    formatter: meta.formatter,
    compiler: meta.compiler,
    runtime: meta.runtime,
  };
}
