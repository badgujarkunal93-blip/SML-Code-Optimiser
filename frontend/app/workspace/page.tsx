"use client";

import { useState, useEffect, useRef } from "react";
import { x402Client, OptimizationResponse, TestCaseItem } from "@/lib/x402/fetch";
import { PaymentDetails } from "@/lib/x402/avm";
import { detectLanguage } from "@/lib/languageDetector";

const LANGUAGES = [
  { id: "python", name: "Python 3", ext: "py" },
  { id: "javascript", name: "JavaScript (Node.js)", ext: "js" },
  { id: "typescript", name: "TypeScript", ext: "ts" },
  { id: "cpp", name: "C++ (GCC)", ext: "cpp" },
  { id: "java", name: "Java", ext: "java" },
  { id: "rust", name: "Rust", ext: "rs" },
  { id: "go", name: "Go", ext: "go" },
];

const OPTIMIZATION_MODES = [
  { id: "auto", name: "⚡ Auto (Balanced)" },
  { id: "performance", name: "🚀 Max Performance" },
  { id: "memory", name: "💾 Min Memory" },
  { id: "readability", name: "📖 Readability" },
  { id: "cp", name: "🏆 Competitive Prog" },
  { id: "production", name: "🛡️ Production Ready" },
];

const DEFAULT_EXAMPLE = `import random

random.seed(42)
arr = [random.randint(1, 1000) for _ in range(1200)]

def bubble_sort(a):
    n = len(a)
    for i in range(n):
        for j in range(0, n - i - 1):
            if a[j] > a[j + 1]:
                a[j], a[j + 1] = a[j + 1], a[j]
    return a

sorted_arr = bubble_sort(arr)
print("Count:", len(sorted_arr), "Min:", sorted_arr[0], "Max:", sorted_arr[-1])
`;

function generateDiffLines(oldCode: string, newCode: string) {
  const oldLines = oldCode.split("\n");
  const newLines = newCode.split("\n");
  const diff: Array<{ type: "added" | "removed" | "unchanged"; line: string }> = [];

  const maxLines = Math.max(oldLines.length, newLines.length);
  for (let i = 0; i < maxLines; i++) {
    const oldL = oldLines[i];
    const newL = newLines[i];

    if (oldL === newL) {
      if (oldL !== undefined) diff.push({ type: "unchanged", line: oldL });
    } else {
      if (oldL !== undefined) diff.push({ type: "removed", line: oldL });
      if (newL !== undefined) diff.push({ type: "added", line: newL });
    }
  }
  return diff;
}

export default function WorkspacePage() {
  const [code, setCode] = useState<string>(DEFAULT_EXAMPLE);
  const [stdinInput, setStdinInput] = useState<string>("");
  const [manualLangOverride, setManualLangOverride] = useState<string>("");
  const [targetConvertLang, setTargetConvertLang] = useState<string>("");
  const [optMode, setOptMode] = useState<string>("auto");
  const [loading, setLoading] = useState<boolean>(false);
  const [executing, setExecuting] = useState<boolean>(false);
  const [pipelineStage, setPipelineStage] = useState<number>(0);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OptimizationResponse | null>(null);
  const [viewMode, setViewMode] = useState<"split" | "unified">("split");
  const [rightTab, setRightTab] = useState<"ai" | "execution" | "testcases">("ai");

  // Custom Execution Console State
  const [origExecResult, setOrigExecResult] = useState<{ stdout: string; stderr: string; exitCode: number; timeMs: number } | null>(null);
  const [optExecResult, setOptExecResult] = useState<{ stdout: string; stderr: string; exitCode: number; timeMs: number } | null>(null);

  // Test Cases State
  const [testCases, setTestCases] = useState<TestCaseItem[]>([
    { id: "tc_1", category: "Normal Input", input: "5\n10", expectedOutput: "15", status: "PENDING", importance: "Basic Addition Check" },
  ]);
  const [generatingTestCases, setGeneratingTestCases] = useState<boolean>(false);

  // AI Assistant Chat State
  const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([
    {
      role: "assistant",
      content: "Welcome to Optima Workspace. Paste code in the editor and click 'Optimize Code' or 'Run & Verify' to execute.",
    },
  ]);
  const [chatInput, setChatInput] = useState<string>("");
  const [chatLoading, setChatLoading] = useState<boolean>(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Automatic Language Detection
  const detected = detectLanguage(code);
  const activeInputLang = manualLangOverride || detected.language;

  // Dev mode flag
  const isDevBypass = process.env.NEXT_PUBLIC_DEV_BYPASS_PAYMENT === "true";

  // Wallet Connection state
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [pendingPayment, setPendingPayment] = useState<PaymentDetails | null>(null);
  const [paymentResolver, setPaymentResolver] = useState<((approved: boolean) => void) | null>(null);

  useEffect(() => {
    if (!isDevBypass) {
      x402Client.reconnectWallet().then((addr) => {
        if (addr) setWalletAddress(addr);
      });
    }
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleConnectWallet = async () => {
    if (isDevBypass) return;
    try {
      setError(null);
      const addr = await x402Client.connectWallet();
      setWalletAddress(addr);
    } catch (err: any) {
      if (err.message !== "Wallet connection was closed.") {
        setError(err.message || "Failed to connect Pera Wallet");
      }
    }
  };

  const handleRunAndVerifyAll = async () => {
    if (!code.trim()) return;

    setExecuting(true);
    setError(null);

    try {
      const origRes = await x402Client.executeCode(code, activeInputLang, stdinInput);
      setOrigExecResult(origRes);

      let optCodeToRun = result ? result.optimizedCode : code;
      const optRes = await x402Client.executeCode(optCodeToRun, targetConvertLang || activeInputLang, stdinInput);
      setOptExecResult(optRes);

      const updatedTCs = await Promise.all(
        testCases.map(async (tc) => {
          const res = await x402Client.executeCode(optCodeToRun, targetConvertLang || activeInputLang, tc.input);
          const pass = res.stdout.trim() === tc.expectedOutput.trim();
          return {
            ...tc,
            actualOutput: res.stdout,
            timeMs: res.timeMs,
            status: (pass ? "PASS" : "FAIL") as "PASS" | "FAIL",
          };
        })
      );
      setTestCases(updatedTCs);
      setRightTab("execution");
    } catch (err: any) {
      setError(err.message || "Execution verification failed");
    } finally {
      setExecuting(false);
    }
  };

  const handleGenerateAITestCases = async () => {
    if (!code.trim()) return;

    setGeneratingTestCases(true);
    try {
      const generated = await x402Client.generateTestCases(code, activeInputLang);
      setTestCases((prev) => [...prev, ...generated]);
      setRightTab("testcases");
    } catch (err: any) {
      setError(err.message || "Failed to generate test cases");
    } finally {
      setGeneratingTestCases(false);
    }
  };

  const handleOptimize = async () => {
    if (!code.trim()) return;

    setLoading(true);
    setPipelineStage(1);
    setPaymentStatus(null);
    setError(null);
    setResult(null);

    const stagesTimer = setInterval(() => {
      setPipelineStage((prev) => (prev < 6 ? prev + 1 : prev));
    }, 600);

    const reqLang = targetConvertLang || activeInputLang;

    try {
      const response = await x402Client.optimize(
        { code, language: reqLang, stdin: stdinInput },
        async (paymentDetails: PaymentDetails) => {
          if (isDevBypass) return true;
          setPendingPayment(paymentDetails);
          setShowPaymentModal(true);
          setPaymentStatus("Awaiting Pera Wallet Authorization...");

          return new Promise<boolean>((resolve) => {
            setPaymentResolver(() => (approved: boolean) => {
              setShowPaymentModal(false);
              resolve(approved);
            });
          });
        }
      );

      clearInterval(stagesTimer);
      setPipelineStage(7);

      if (isDevBypass) {
        setPaymentStatus("Development Mode: Payment Bypassed ✓");
      } else {
        setPaymentStatus("Transaction Verified & Settled via Plausible Facilitator!");
      }
      setResult(response);

      const aiSummary = `⚡ **Optimization Complete!**\n\n- **Complexity:** ${response.timeComplexity?.original || "O(n²)"} → ${response.timeComplexity?.optimized || "O(n)"}\n- **Wall-Clock Speedup:** ${response.metrics.originalTimeMs}ms → ${response.metrics.optimizedTimeMs}ms (+${response.metrics.improvementPct}% faster)\n- **Confidence:** ${response.optimizationConfidence || 98}%\n\n${response.reasoning}`;
      setChatMessages((prev) => [...prev, { role: "assistant", content: aiSummary }]);
      setRightTab("ai");
    } catch (err: any) {
      clearInterval(stagesTimer);
      if (err.message !== "Payment was cancelled by user") {
        setError(err.message || "Failed to optimize code");
      }
    } finally {
      setLoading(false);
      setShowPaymentModal(false);
    }
  };

  const handleSendChat = async (msgOverride?: string) => {
    const text = msgOverride || chatInput.trim();
    if (!text || chatLoading) return;

    const newHistory = [...chatMessages, { role: "user" as const, content: text }];
    setChatMessages(newHistory);
    if (!msgOverride) setChatInput("");
    setChatLoading(true);

    try {
      const reply = await x402Client.sendChatMessage(text, newHistory);
      setChatMessages([...newHistory, { role: "assistant", content: reply }]);
    } catch (err: any) {
      setChatMessages([...newHistory, { role: "assistant", content: `Error: ${err.message}` }]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="space-y-6 w-full relative">
      {/* 🛠️ TOP TOOLBAR (Cursor IDE Style) */}
      <div className="glass-panel p-4 rounded-2xl border border-[#3c4a46]/30 flex flex-wrap items-center justify-between gap-4 shadow-xl font-mono text-xs">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
            <span className="font-bold text-white">{activeInputLang.toUpperCase()}</span>
            <span className="text-[#bacac5] text-[10px]">({detected.confidence}% Confidence)</span>
          </div>

          <div className="flex items-center gap-2 border-l border-[#3c4a46]/40 pl-4">
            <span className="text-[#bacac5]">Mode:</span>
            <select
              value={optMode}
              onChange={(e) => setOptMode(e.target.value)}
              className="bg-[#0e1513] text-[#2DD4BF] font-bold border border-[#3c4a46]/50 rounded-lg px-3 py-1 outline-none"
            >
              {OPTIMIZATION_MODES.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 border-l border-[#3c4a46]/40 pl-4">
            <span className="text-[#bacac5]">Convert:</span>
            <select
              value={targetConvertLang}
              onChange={(e) => setTargetConvertLang(e.target.value)}
              className="bg-[#0e1513] text-teal-300 border border-[#3c4a46]/50 rounded-lg px-3 py-1 outline-none"
            >
              <option value="">(Same: {activeInputLang})</option>
              {LANGUAGES.filter((l) => l.id !== activeInputLang).map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isDevBypass ? (
            <span className="text-[10px] text-[#8b9cf5] bg-[#8b9cf5]/10 px-3 py-1 rounded-full border border-[#8b9cf5]/30">
              Dev Mode Bypass ✓
            </span>
          ) : walletAddress ? (
            <span className="text-[10px] text-[#2DD4BF] bg-[#2DD4BF]/10 px-3 py-1 rounded-full border border-[#2DD4BF]/30 font-semibold">
              Pera: {walletAddress.slice(0, 6)}...
            </span>
          ) : (
            <button
              onClick={handleConnectWallet}
              className="bg-[#8b9cf5] text-white px-4 py-1.5 rounded-full font-bold text-xs"
            >
              Connect Wallet
            </button>
          )}

          <button
            onClick={handleRunAndVerifyAll}
            disabled={executing}
            className="bg-[#0F172A] hover:bg-slate-800 text-[#57f1db] border border-[#2DD4BF]/30 font-bold px-4 py-1.5 rounded-lg"
          >
            {executing ? "Executing..." : "⚡ Run & Verify"}
          </button>

          <button
            onClick={handleOptimize}
            disabled={loading || !code.trim()}
            className="bg-[#2DD4BF] hover:bg-[#57f1db] text-[#020617] font-bold px-5 py-1.5 rounded-lg shadow-md"
          >
            {loading ? "Optimizing..." : "⚡ Optimize Code"}
          </button>
        </div>
      </div>

      {/* Standard Input stdin bar */}
      <div className="bg-[#0e1513] p-3 rounded-xl border border-[#3c4a46]/30 font-mono text-xs">
        <span className="text-[10px] text-[#bacac5] font-bold block mb-1">Standard Input (stdin):</span>
        <input
          type="text"
          value={stdinInput}
          onChange={(e) => setStdinInput(e.target.value)}
          placeholder="Enter stdin line data (e.g. 5 10)"
          className="w-full bg-[#020617] text-slate-200 p-2 rounded-lg border border-[#3c4a46]/40 outline-none"
        />
      </div>

      {paymentStatus && (
        <div className="bg-[#2DD4BF]/10 border border-[#2DD4BF]/30 p-3 rounded-xl text-xs text-[#2DD4BF] font-mono">
          💳 {paymentStatus}
        </div>
      )}

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 p-3 rounded-xl text-xs text-rose-400 font-mono">
          ⚠️ {error}
        </div>
      )}

      {/* 💻 MAIN CENTER EDITOR & RIGHT SIDEBAR */}
      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
        
        {/* CENTER MONACO SOURCE EDITOR */}
        <div className="flex-1 flex flex-col w-full glass-panel rounded-2xl overflow-hidden border border-[#3c4a46]/30 shadow-2xl">
          <div className="bg-[#0F172A] p-3 border-b border-[#3c4a46]/30 flex justify-between items-center font-mono text-xs text-[#bacac5]">
            <span className="font-bold text-white">Source Code Workspace</span>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode("split")}
                className={`px-2.5 py-1 rounded text-[10px] ${viewMode === "split" ? "bg-[#2DD4BF]/20 text-[#57f1db] font-bold" : "text-slate-400"}`}
              >
                Split View
              </button>
              <button
                onClick={() => setViewMode("unified")}
                className={`px-2.5 py-1 rounded text-[10px] ${viewMode === "unified" ? "bg-[#2DD4BF]/20 text-[#57f1db] font-bold" : "text-slate-400"}`}
              >
                Unified Diff
              </button>
            </div>
          </div>

          <div className="editor-bg p-6 font-mono text-xs min-h-[440px]">
            {result ? (
              viewMode === "split" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="text-slate-400 font-bold uppercase text-[10px]">Original</div>
                    <pre className="p-3 bg-[#020617] text-slate-300 rounded-lg border border-[#3c4a46]/30 overflow-x-auto leading-relaxed">
                      <code>{code}</code>
                    </pre>
                  </div>
                  <div className="space-y-2">
                    <div className="text-[#2DD4BF] font-bold uppercase text-[10px]">Optimized</div>
                    <pre className="p-3 bg-[#020617] text-[#2DD4BF] rounded-lg border border-[#2DD4BF]/30 overflow-x-auto leading-relaxed">
                      <code>{result.optimizedCode}</code>
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-[#020617] text-slate-300 rounded-lg border border-[#3c4a46]/30">
                  {generateDiffLines(code, result.optimizedCode).map((line, idx) => (
                    <div
                      key={idx}
                      className={
                        line.type === "added"
                          ? "bg-emerald-500/10 text-emerald-300 px-2 py-0.5"
                          : line.type === "removed"
                          ? "bg-rose-500/10 text-rose-400 px-2 py-0.5 line-through opacity-80"
                          : "text-slate-400 px-2 py-0.5"
                      }
                    >
                      {line.line}
                    </div>
                  ))}
                </div>
              )
            ) : (
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                rows={16}
                className="w-full bg-transparent text-slate-100 font-mono text-xs leading-relaxed outline-none border-none resize-y"
              />
            )}
          </div>

          {/* Bottom Metrics */}
          <div className="bg-[#0F172A] p-4 border-t border-[#3c4a46]/30 grid grid-cols-4 gap-4 font-mono text-xs text-center">
            <div>
              <div className="text-[10px] text-[#bacac5]">Runtime Saved</div>
              <div className="text-[#2DD4BF] font-bold text-lg">{result ? `${result.metrics.improvementPct}%` : "+42%"}</div>
            </div>
            <div>
              <div className="text-[10px] text-[#bacac5]">Memory Saved</div>
              <div className="text-white font-bold text-lg">{result ? `${result.estimatedMemoryMb?.optimized || 14}MB` : "124MB"}</div>
            </div>
            <div>
              <div className="text-[10px] text-[#bacac5]">Complexity</div>
              <div className="text-emerald-400 font-bold text-lg">{result ? (result.timeComplexity?.optimized || "O(n)") : "O(n)"}</div>
            </div>
            <div>
              <div className="text-[10px] text-[#bacac5]">Confidence</div>
              <div className="text-white font-bold text-lg">{result?.optimizationConfidence || 98}%</div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR (AI Chat / Execution Console / Test Cases) */}
        <div className="w-full lg:w-[360px] flex flex-col gap-4">
          <div className="glass-panel p-1 rounded-xl flex gap-1 font-mono text-xs">
            <button
              onClick={() => setRightTab("ai")}
              className={`flex-1 py-2 rounded-lg ${rightTab === "ai" ? "bg-[#2DD4BF]/20 text-[#57f1db] font-bold" : "text-[#bacac5]"}`}
            >
              AI Assistant
            </button>
            <button
              onClick={() => setRightTab("execution")}
              className={`flex-1 py-2 rounded-lg ${rightTab === "execution" ? "bg-[#2DD4BF]/20 text-[#57f1db] font-bold" : "text-[#bacac5]"}`}
            >
              Execution
            </button>
            <button
              onClick={() => setRightTab("testcases")}
              className={`flex-1 py-2 rounded-lg ${rightTab === "testcases" ? "bg-[#2DD4BF]/20 text-[#57f1db] font-bold" : "text-[#bacac5]"}`}
            >
              Test Cases
            </button>
          </div>

          {rightTab === "ai" && (
            <div className="glass-panel rounded-xl flex-1 flex flex-col min-h-[460px] font-mono text-xs">
              <div className="p-3 bg-[#0F172A] border-b border-[#3c4a46]/30 font-bold text-white">
                Optima AI Chat &amp; Reasoning
              </div>

              <div className="flex-1 p-4 overflow-y-auto space-y-3">
                {chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl ${msg.role === "user" ? "bg-[#2DD4BF]/20 text-[#57f1db] ml-auto max-w-[90%]" : "bg-[#020617] text-slate-200"}`}
                  >
                    <div className="text-[10px] text-[#2DD4BF] font-bold mb-1">{msg.role === "user" ? "You" : "Optima AI"}</div>
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>
                ))}
                {chatLoading && <div className="text-slate-400 animate-pulse">Processing...</div>}
                <div ref={chatEndRef} />
              </div>

              <div className="p-3 border-t border-[#3c4a46]/30 bg-[#0F172A]">
                <div className="relative">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
                    placeholder="Ask AI assistant..."
                    className="w-full bg-[#020617] text-white p-2 pr-8 rounded-lg border border-[#3c4a46]/50 outline-none"
                  />
                  <button onClick={() => handleSendChat()} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#2DD4BF]">
                    ➔
                  </button>
                </div>
              </div>
            </div>
          )}

          {rightTab === "execution" && (
            <div className="glass-panel p-4 rounded-xl space-y-4 font-mono text-xs min-h-[460px]">
              <div className="font-bold text-white border-b border-[#3c4a46]/30 pb-2">
                Piston Execution Sandbox Output
              </div>

              <div className="space-y-3">
                <div className="bg-[#020617] p-3 rounded-lg border border-[#3c4a46]/30">
                  <span className="text-[#bacac5] text-[10px] block font-bold">Original Code Output:</span>
                  <pre className="text-slate-300 text-[11px] whitespace-pre-wrap max-h-28 overflow-y-auto">
                    {origExecResult ? (origExecResult.stdout || origExecResult.stderr) : "(Run execution to view)"}
                  </pre>
                </div>

                <div className="bg-[#020617] p-3 rounded-lg border border-[#2DD4BF]/30">
                  <span className="text-[#2DD4BF] text-[10px] block font-bold">Optimized Code Output:</span>
                  <pre className="text-[#2DD4BF] text-[11px] whitespace-pre-wrap max-h-28 overflow-y-auto">
                    {optExecResult ? (optExecResult.stdout || optExecResult.stderr) : "(Run execution to view)"}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {rightTab === "testcases" && (
            <div className="glass-panel p-4 rounded-xl space-y-4 font-mono text-xs min-h-[460px]">
              <div className="font-bold text-white border-b border-[#3c4a46]/30 pb-2 flex justify-between items-center">
                <span>Test Cases ({testCases.length})</span>
                <button onClick={handleGenerateAITestCases} disabled={generatingTestCases} className="text-[#2DD4BF] underline">
                  {generatingTestCases ? "Generating..." : "+ AI Test Cases"}
                </button>
              </div>

              <div className="space-y-2 max-h-[360px] overflow-y-auto">
                {testCases.map((tc, idx) => (
                  <div key={tc.id} className="bg-[#020617] p-3 rounded-lg border border-[#3c4a46]/30 space-y-1">
                    <div className="flex justify-between font-bold">
                      <span className="text-slate-200">#{idx + 1}: {tc.category}</span>
                      <span className={tc.status === "PASS" ? "text-emerald-400" : tc.status === "FAIL" ? "text-rose-400" : "text-slate-500"}>
                        {tc.status}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400">Input: {tc.input.replace(/\n/g, " | ")}</div>
                    <div className="text-[10px] text-[#2DD4BF]">Expected: {tc.expectedOutput}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
