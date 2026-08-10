import prettier from "prettier/standalone";
import parserBabel from "prettier/plugins/babel";
import parserEstree from "prettier/plugins/estree";
import parserTypeScript from "prettier/plugins/typescript";

export async function formatSourceCode(code: string, language: string): Promise<string> {
  if (!code || !code.trim()) return code;

  const lang = language.toLowerCase();

  try {
    if (lang === "javascript" || lang === "js" || lang === "json") {
      return await prettier.format(code, {
        parser: "babel",
        plugins: [parserBabel, parserEstree],
        semi: true,
        singleQuote: false,
        tabWidth: 2,
      });
    }

    if (lang === "typescript" || lang === "ts") {
      return await prettier.format(code, {
        parser: "typescript",
        plugins: [parserTypeScript, parserEstree],
        semi: true,
        singleQuote: false,
        tabWidth: 2,
      });
    }
  } catch {
    // Fall back to clean indentation formatter if syntax parsing fails during editing
  }

  // Fallback / Python / C++ / Java / Rust / Go clean indentation & spacing formatter
  return formatCleanIndentation(code);
}

export function formatCleanIndentation(code: string): string {
  const lines = code.split("\n");
  const formattedLines: string[] = [];
  let indentLevel = 0;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();

    if (!line) {
      // Preserve single empty line between blocks
      if (formattedLines.length > 0 && formattedLines[formattedLines.length - 1] !== "") {
        formattedLines.push("");
      }
      continue;
    }

    // Unindent closing braces / brackets / colons
    if (line.startsWith("}") || line.startsWith(")") || line.startsWith("]")) {
      indentLevel = Math.max(0, indentLevel - 1);
    }

    const currentIndent = "  ".repeat(indentLevel);
    formattedLines.push(currentIndent + line);

    // Indent after lines ending with {, (, [, or Python def/class/if/for/while colons
    if (
      line.endsWith("{") ||
      line.endsWith("(") ||
      line.endsWith("[") ||
      line.endsWith(":")
    ) {
      indentLevel++;
    }
  }

  return formattedLines.join("\n").trim() + "\n";
}
