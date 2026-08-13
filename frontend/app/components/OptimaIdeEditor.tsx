"use client";

import { useState, useCallback } from "react";
import Editor, { DiffEditor, Monaco, loader } from "@monaco-editor/react";

if (typeof window !== "undefined") {
  loader.config({
    paths: {
      vs: "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs",
    },
  });
}

interface OptimaIdeEditorProps {
  code: string;
  onChange?: (value: string) => void;
  language: string;
  optimizedCode?: string;
  viewMode?: "split" | "unified";
  onViewModeChange?: (mode: "split" | "unified") => void;
  onFormat?: () => void;
  height?: string;
  readOnly?: boolean;
}

export function getMonacoLanguage(lang: string): string {
  switch ((lang || "").toLowerCase()) {
    case "python":
    case "pyteal":
      return "python";
    case "javascript":
    case "js":
      return "javascript";
    case "typescript":
    case "ts":
      return "typescript";
    case "cpp":
    case "c++":
    case "c":
      return "cpp";
    case "java":
      return "java";
    case "rust":
    case "rs":
      return "rust";
    case "go":
      return "go";
    case "html":
      return "html";
    case "css":
      return "css";
    case "json":
      return "json";
    default:
      return "plaintext";
  }
}

export default function OptimaIdeEditor({
  code,
  onChange,
  language,
  optimizedCode,
  viewMode = "split",
  onViewModeChange,
  onFormat,
  height = "480px",
  readOnly = false,
}: OptimaIdeEditorProps) {
  const [copied, setCopied] = useState<boolean>(false);
  const monacoLang = getMonacoLanguage(language);
  const linesCount = code.split("\n").length;
  const charCount = code.length;

  const handleEditorWillMount = useCallback((monaco: Monaco) => {
    // Register custom Optima Dark VS Code Theme
    monaco.editor.defineTheme("optima-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "64748b", fontStyle: "italic" },
        { token: "keyword", foreground: "38bdf8", fontStyle: "bold" },
        { token: "string", foreground: "34d399" },
        { token: "number", foreground: "f472b6" },
        { token: "function", foreground: "a78bfa" },
        { token: "type", foreground: "f59e0b" },
        { token: "delimiter", foreground: "94a3b8" },
      ],
      colors: {
        "editor.background": "#0b121e",
        "editor.foreground": "#e2e8f0",
        "editor.lineHighlightBackground": "#131f33",
        "editorCursor.foreground": "#38bdf8",
        "editorLineNumber.foreground": "#475569",
        "editorLineNumber.activeForeground": "#38bdf8",
        "editor.selectionBackground": "rgba(56, 189, 248, 0.25)",
        "editorIndentGuide.background": "rgba(255, 255, 255, 0.08)",
        "editorIndentGuide.activeBackground": "rgba(56, 189, 248, 0.4)",
        // Custom Soft Diff Colors (No harsh solid red fills)
        "diffEditor.insertedTextBackground": "rgba(52, 211, 153, 0.22)",
        "diffEditor.removedTextBackground": "rgba(244, 63, 94, 0.22)",
        "diffEditor.insertedLineBackground": "rgba(52, 211, 153, 0.10)",
        "diffEditor.removedLineBackground": "rgba(244, 63, 94, 0.10)",
        "diffEditor.insertedTextBorder": "rgba(52, 211, 153, 0.3)",
        "diffEditor.removedTextBorder": "rgba(244, 63, 94, 0.3)",
        "diffEditor.gutterInsertedLineBackground": "rgba(52, 211, 153, 0.12)",
        "diffEditor.gutterRemovedLineBackground": "rgba(244, 63, 94, 0.12)",
        "diffEditorGutter.insertedLineBackground": "rgba(52, 211, 153, 0.12)",
        "diffEditorGutter.removedLineBackground": "rgba(244, 63, 94, 0.12)",
        "diffOverviewRuler.insertedForeground": "rgba(52, 211, 153, 0.4)",
        "diffOverviewRuler.removedForeground": "rgba(244, 63, 94, 0.4)",
        "diffEditor.diagonalFill": "#0b121e",
        "diffEditor.border": "rgba(255, 255, 255, 0.08)",
        "scrollbarSlider.background": "rgba(255, 255, 255, 0.08)",
        "scrollbarSlider.hoverBackground": "rgba(56, 189, 248, 0.3)",
        "scrollbarSlider.activeBackground": "rgba(56, 189, 248, 0.5)",
      },
    });
  }, []);

  const handleCopyCode = () => {
    const textToCopy = optimizedCode || code;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-[#0b121e] flex flex-col font-mono">
      {/* 🖥️ CURSOR IDE TOP WINDOW BAR */}
      <div className="bg-[#0f172a]/90 backdrop-blur-md px-4 py-3 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left: Window Controls & Active Tab */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500/80 border border-rose-600/40 inline-block shadow-sm" />
            <span className="w-3 h-3 rounded-full bg-amber-500/80 border border-amber-600/40 inline-block shadow-sm" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 border border-emerald-600/40 inline-block shadow-sm" />
          </div>

          <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1 rounded-lg text-zinc-200 font-semibold shadow-inner">
            <span className="text-cyan-400 text-sm">📄</span>
            <span>main.{monacoLang}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-bold uppercase tracking-wider">
              {language}
            </span>
          </div>

          {optimizedCode && (
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
              ⚡ Diff Inspection Mode
            </span>
          )}
        </div>

        {/* Right: Actions & View Toggles */}
        <div className="flex items-center gap-2">
          {onFormat && !optimizedCode && (
            <button
              onClick={onFormat}
              className="px-3 py-1.5 rounded-lg text-[11px] bg-cyan-500/10 text-cyan-300 font-bold border border-cyan-500/30 hover:bg-cyan-500/20 transition-all flex items-center gap-1.5"
              title="Format code using Prettier"
            >
              <span>⚡ Prettier</span>
            </button>
          )}

          {optimizedCode && onViewModeChange && (
            <div className="flex items-center bg-black/40 p-0.5 rounded-lg border border-white/10">
              <button
                onClick={() => onViewModeChange("split")}
                className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all ${
                  viewMode === "split" ? "bg-cyan-500 text-black shadow-md" : "text-zinc-400 hover:text-white"
                }`}
              >
                Split View
              </button>
              <button
                onClick={() => onViewModeChange("unified")}
                className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all ${
                  viewMode === "unified" ? "bg-cyan-500 text-black shadow-md" : "text-zinc-400 hover:text-white"
                }`}
              >
                Unified Diff
              </button>
            </div>
          )}

          <button
            onClick={handleCopyCode}
            className="px-3 py-1.5 rounded-lg text-[11px] bg-white/5 hover:bg-white/10 text-zinc-300 font-semibold border border-white/10 transition-all flex items-center gap-1.5"
            title="Copy code to clipboard"
          >
            <span>{copied ? "✓ Copied!" : "📋 Copy"}</span>
          </button>
        </div>
      </div>

      {/* 💻 MONACO EDITOR CONTAINER */}
      <div className="w-full relative bg-[#0b121e]">
        {optimizedCode ? (
          <DiffEditor
            height={height}
            language={monacoLang}
            original={code}
            modified={optimizedCode}
            beforeMount={handleEditorWillMount}
            theme="optima-dark"
            options={{
              renderSideBySide: viewMode === "split",
              readOnly: true,
              minimap: { enabled: false },
              fontSize: 13,
              fontFamily: "'Fira Code', 'Cascadia Code', Consolas, Monaco, monospace",
              scrollBeyondLastLine: false,
              automaticLayout: true,
              padding: { top: 16, bottom: 16 },
              lineNumbersMinChars: 3,
              smoothScrolling: true,
              overviewRulerLanes: 0,
              overviewRulerBorder: false,
            }}
          />
        ) : (
          <Editor
            height={height}
            language={monacoLang}
            value={code}
            onChange={(val) => onChange && onChange(val || "")}
            beforeMount={handleEditorWillMount}
            theme="optima-dark"
            options={{
              readOnly,
              fontSize: 13,
              fontFamily: "'Fira Code', 'Cascadia Code', Consolas, Monaco, monospace",
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              padding: { top: 16, bottom: 16 },
              lineNumbersMinChars: 3,
              smoothScrolling: true,
              cursorBlinking: "smooth",
              cursorSmoothCaretAnimation: "on",
              folding: true,
              bracketPairColorization: { enabled: true },
              overviewRulerLanes: 0,
              overviewRulerBorder: false,
            }}
          />
        )}
      </div>

      {/* 📊 EDITOR FOOTER BAR */}
      <div className="bg-[#0f172a]/90 backdrop-blur-md px-4 py-2 border-t border-white/10 flex items-center justify-between text-[11px] text-zinc-400 font-mono">
        <div className="flex items-center gap-4">
          <span>{linesCount} Lines</span>
          <span>{charCount} Characters</span>
          <span className="text-emerald-400 font-bold">UTF-8</span>
        </div>
        <div className="flex items-center gap-2 text-cyan-400">
          <span>⚡ Optima AI Engine Active</span>
        </div>
      </div>
    </div>
  );
}
