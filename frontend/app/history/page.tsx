"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getSavedHistory,
  saveCodeToHistory,
  deleteSavedHistory,
  clearAllSavedHistory,
  setActiveWorkspaceCode,
  SavedHistoryRecord,
} from "@/lib/historyStore";
import { API_BASE_URL } from "@/lib/apiConfig";

interface HistoryRecord {
  id?: string;
  created_at?: string;
  code?: string;
  original_code?: string;
  language: string;
  optimized_code?: string;
  reasoning?: string;
  original_time_ms?: number | null;
  optimized_time_ms?: number | null;
  improvement_pct?: number | null;
  correctness_verified: boolean;
}

const DEMO_HISTORY_RECORDS: HistoryRecord[] = [
  {
    id: "rec_98f41a2b",
    created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    language: "python",
    original_time_ms: 142.5,
    optimized_time_ms: 12.8,
    improvement_pct: 91.0,
    correctness_verified: true,
  },
  {
    id: "rec_87d32c1e",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    language: "rust",
    original_time_ms: 48.2,
    optimized_time_ms: 3.1,
    improvement_pct: 93.6,
    correctness_verified: true,
  },
  {
    id: "rec_76b21f0a",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    language: "typescript",
    original_time_ms: 95.0,
    optimized_time_ms: 26.6,
    improvement_pct: 72.0,
    correctness_verified: true,
  },
  {
    id: "rec_65a10e9b",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    language: "cpp",
    original_time_ms: 112.0,
    optimized_time_ms: 4.5,
    improvement_pct: 96.0,
    correctness_verified: true,
  },
  {
    id: "rec_5490fd8a",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    language: "javascript",
    original_time_ms: 78.4,
    optimized_time_ms: 28.2,
    improvement_pct: 64.0,
    correctness_verified: true,
  },
];

export default function HistoryPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"saved" | "all">("saved");
  const [savedSnippets, setSavedSnippets] = useState<SavedHistoryRecord[]>([]);
  const [systemHistory, setSystemHistory] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Load saved snippets from localStorage
  const refreshSavedSnippets = () => {
    const list = getSavedHistory();
    setSavedSnippets(list);
  };

  const fetchSystemHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      let res = await fetch("/api/history").catch(() => null);
      if (!res || !res.ok) {
        if (API_BASE_URL) {
          res = await fetch(`${API_BASE_URL}/history`).catch(() => null);
        }
      }

      if (res && res.ok) {
        const data: unknown = await res.json();
        const rawRecords =
          Array.isArray(data)
            ? data
            : typeof data === "object" && data !== null && "history" in data && Array.isArray((data as { history: unknown }).history)
            ? (data as { history: HistoryRecord[] }).history
            : [];
        setSystemHistory(rawRecords as HistoryRecord[]);
      } else {
        setSystemHistory(DEMO_HISTORY_RECORDS);
      }
    } catch {
      setSystemHistory(DEMO_HISTORY_RECORDS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshSavedSnippets();
    fetchSystemHistory();
  }, []);

  const handleDeleteSaved = (id: string) => {
    const updated = deleteSavedHistory(id);
    setSavedSnippets(updated);
  };

  const handleClearAll = () => {
    if (confirm("Are you sure you want to clear all temporarily saved code snippets?")) {
      clearAllSavedHistory();
      setSavedSnippets([]);
    }
  };

  const handleLoadInIDE = (record: SavedHistoryRecord) => {
    setActiveWorkspaceCode(record.original_code, record.language);
    router.push("/workspace");
  };

  const handleCopyCode = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateSampleSnippet = () => {
    saveCodeToHistory({
      language: "python",
      original_code: "def find_duplicates(numbers):\n    dups = []\n    for i in range(len(numbers)):\n        for j in range(i+1, len(numbers)):\n            if numbers[i] == numbers[j] and numbers[i] not in dups:\n                dups.append(numbers[i])\n    return dups",
      optimized_code: "def find_duplicates(numbers):\n    seen = set()\n    dups = set()\n    for x in numbers:\n        if x in seen:\n            dups.add(x)\n        else:\n            seen.add(x)\n    return list(dups)",
      original_time_ms: 142.5,
      optimized_time_ms: 12.8,
      improvement_pct: 91.0,
      correctness_verified: true,
      reasoning: "Replaced O(N^2) double loop with O(N) hash set lookup.",
      mode: "Auto (Balanced)",
    });
    refreshSavedSnippets();
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Just now";
    try {
      const d = new Date(dateStr);
      return d.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 w-full max-w-[1440px] mx-auto font-mono text-xs pb-16">
      
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl border border-[var(--border)] flex flex-wrap items-center justify-between gap-4 shadow-2xl">
        <div>
          <h1 className="text-2xl font-black text-[var(--text-primary)] tracking-tight flex items-center gap-2">
            <span className="text-[var(--primary)]">💾</span> Saved Code History &amp; Logs
          </h1>
          <p className="text-[var(--text-secondary)] text-xs mt-1">
            Access your explicitly saved code snippets, benchmarks, and historical optimization runs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchSystemHistory}
            disabled={loading}
            className="flex items-center gap-2 bg-[var(--bg-secondary)] hover:bg-[var(--card-elevated)] text-[var(--primary)] text-xs font-bold px-4 py-2 rounded-xl border border-[var(--primary)]/30 transition-all hover-scale disabled:opacity-50"
          >
            {loading ? "Refreshing..." : "🔄 Refresh"}
          </button>
          
          <Link
            href="/workspace"
            className="flex items-center gap-2 bg-[var(--primary)] hover:opacity-90 text-white dark:text-[#07101A] font-bold px-4 py-2 rounded-xl transition-all hover-scale shadow-md"
          >
            + New Snippet in IDE
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("saved")}
            className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${
              activeTab === "saved"
                ? "bg-[var(--primary)] text-white dark:text-[#07101A] shadow-md"
                : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border)]"
            }`}
          >
            <span>💾 Saved Code Snippets</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-black/20 dark:bg-white/20">
              {savedSnippets.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("all")}
            className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${
              activeTab === "all"
                ? "bg-[var(--primary)] text-white dark:text-[#07101A] shadow-md"
                : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border)]"
            }`}
          >
            <span>📜 System Run Logs</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-black/20 dark:bg-white/20">
              {systemHistory.length}
            </span>
          </button>
        </div>

        {activeTab === "saved" && savedSnippets.length > 0 && (
          <button
            onClick={handleClearAll}
            className="text-rose-500 hover:text-rose-400 font-bold text-xs px-3 py-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 transition-colors"
          >
            🗑️ Clear Saved Snippets
          </button>
        )}
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 text-rose-400 flex items-center justify-between">
          <span>⚠️ {error}</span>
          <button onClick={fetchSystemHistory} className="bg-rose-500/20 px-3 py-1 rounded">
            Retry
          </button>
        </div>
      )}

      {/* Content Area */}
      {activeTab === "saved" ? (
        <div className="space-y-4">
          {savedSnippets.length === 0 ? (
            <div className="glass-panel p-12 text-center rounded-2xl border border-[var(--border)] space-y-4 shadow-xl">
              <div className="text-4xl">💾</div>
              <h3 className="text-lg font-bold text-[var(--text-primary)]">No Saved Code Snippets Yet</h3>
              <p className="text-[var(--text-secondary)] text-xs max-w-md mx-auto">
                When working in the <strong>Workspace IDE</strong> or viewing the <strong>Results Page</strong>, click the <strong>&quot;💾 Save to History&quot;</strong> button to temporarily store code snippets for instant access here.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <Link
                  href="/workspace"
                  className="bg-[var(--primary)] hover:opacity-90 text-white dark:text-[#07101A] font-extrabold px-5 py-2.5 rounded-xl shadow-md transition-all hover-scale"
                >
                  Open Workspace IDE →
                </Link>
                <button
                  onClick={handleCreateSampleSnippet}
                  className="bg-[var(--bg-secondary)] hover:bg-[var(--card-elevated)] text-[var(--primary)] border border-[var(--primary)]/30 font-bold px-5 py-2.5 rounded-xl transition-all hover-scale"
                >
                  ⚡ Save Sample Snippet
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {savedSnippets.map((item) => {
                const isExpanded = expandedId === item.id;
                return (
                  <div
                    key={item.id}
                    className="glass-panel p-5 rounded-2xl border border-[var(--border)] shadow-xl space-y-3 transition-all"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-3">
                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1 rounded-lg bg-[var(--primary)]/15 text-[var(--primary)] font-bold uppercase tracking-wider text-[11px] border border-[var(--primary)]/30">
                          {item.language}
                        </span>
                        <span className="text-[var(--text-secondary)] text-xs">
                          Saved: {formatDate(item.created_at)}
                        </span>
                        {item.mode && (
                          <span className="px-2.5 py-0.5 rounded text-[10px] bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border)]">
                            Engine: {item.mode}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {item.improvement_pct !== undefined && item.improvement_pct !== null && (
                          <span className="px-2.5 py-1 rounded text-[10px] font-bold bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/30">
                            +{item.improvement_pct}% Speedup
                          </span>
                        )}
                        <button
                          onClick={() => handleLoadInIDE(item)}
                          className="bg-[var(--primary)] hover:opacity-90 text-white dark:text-[#07101A] px-3.5 py-1.5 rounded-lg font-bold transition-all hover-scale"
                          title="Load this snippet directly into Workspace IDE"
                        >
                          📂 Load in IDE
                        </button>
                        <button
                          onClick={() => handleCopyCode(item.id, item.optimized_code || item.original_code)}
                          className="bg-[var(--bg-secondary)] hover:bg-[var(--card-elevated)] text-[var(--text-primary)] px-3 py-1.5 rounded-lg border border-[var(--border)] transition-colors"
                        >
                          {copiedId === item.id ? "Copied ✓" : "📋 Copy"}
                        </button>
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : item.id)}
                          className="bg-[var(--bg-secondary)] hover:bg-[var(--card-elevated)] text-[var(--text-secondary)] px-3 py-1.5 rounded-lg border border-[var(--border)] transition-colors"
                        >
                          {isExpanded ? "Collapse ▲" : "View Code ▼"}
                        </button>
                        <button
                          onClick={() => handleDeleteSaved(item.id)}
                          className="text-rose-400 hover:text-rose-300 p-1.5 rounded-lg transition-colors"
                          title="Delete snippet from saved history"
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    {/* Preview Code Snippet */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                      <div className="bg-[var(--bg)] p-3 rounded-xl border border-[var(--border)]">
                        <div className="text-[10px] text-[var(--text-muted)] font-bold mb-1">ORIGINAL CODE</div>
                        <pre className="text-[11px] text-[var(--text-secondary)] overflow-x-auto max-h-32 font-mono">
                          {item.original_code}
                        </pre>
                      </div>
                      <div className="bg-[var(--bg)] p-3 rounded-xl border border-[var(--primary)]/30">
                        <div className="text-[10px] text-[var(--primary)] font-bold mb-1">OPTIMIZED CODE</div>
                        <pre className="text-[11px] text-[var(--primary)] overflow-x-auto max-h-32 font-mono">
                          {item.optimized_code || item.original_code}
                        </pre>
                      </div>
                    </div>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div className="bg-[var(--bg-secondary)] p-4 rounded-xl border border-[var(--border)] space-y-2 pt-3">
                        {item.reasoning && (
                          <div>
                            <span className="text-[10px] text-[var(--primary)] font-bold block">COMPILER REASONING:</span>
                            <p className="text-xs text-[var(--text-primary)] mt-1">{item.reasoning}</p>
                          </div>
                        )}
                        <div className="flex gap-4 text-[11px] text-[var(--text-secondary)] pt-1">
                          <span>Original Runtime: <strong className="text-[var(--text-primary)]">{item.original_time_ms ? `${item.original_time_ms} ms` : "N/A"}</strong></span>
                          <span>Optimized Runtime: <strong className="text-[var(--primary)]">{item.optimized_time_ms ? `${item.optimized_time_ms} ms` : "N/A"}</strong></span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* System Run Logs Tab */
        <div className="glass-panel rounded-2xl border border-[var(--border)] overflow-hidden shadow-2xl">
          {loading ? (
            <div className="p-12 text-center text-[var(--text-secondary)] flex flex-col items-center justify-center gap-3">
              <svg className="animate-spin h-6 w-6 text-[var(--primary)]" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className="text-xs font-semibold">Loading System Optimization Runs...</span>
            </div>
          ) : systemHistory.length === 0 ? (
            <div className="p-12 text-center space-y-3 font-mono">
              <p className="text-[var(--text-secondary)] text-xs">No system run logs found.</p>
              <Link
                href="/workspace"
                className="inline-block text-xs font-bold text-white dark:text-[#07101A] bg-[var(--primary)] hover:opacity-90 px-5 py-2 rounded-lg"
              >
                Run Optimization in Workspace →
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[var(--text-primary)]">
                <thead className="bg-[var(--bg-secondary)] text-[var(--text-secondary)] font-mono text-[10px] font-bold uppercase border-b border-[var(--border)]">
                  <tr>
                    <th className="px-6 py-4">Timestamp</th>
                    <th className="px-6 py-4">Language</th>
                    <th className="px-6 py-4">Original Time</th>
                    <th className="px-6 py-4">Optimized Time</th>
                    <th className="px-6 py-4">Speedup</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)] font-mono text-xs">
                  {systemHistory.map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-[var(--card-elevated)] transition-colors">
                      <td className="px-6 py-4 text-[var(--text-secondary)] whitespace-nowrap">{formatDate(item.created_at)}</td>
                      <td className="px-6 py-4 font-bold text-[var(--text-primary)] uppercase">{item.language}</td>
                      <td className="px-6 py-4 text-[var(--text-muted)]">{item.original_time_ms ? `${item.original_time_ms} ms` : "N/A"}</td>
                      <td className="px-6 py-4 text-[var(--primary)] font-bold">{item.optimized_time_ms ? `${item.optimized_time_ms} ms` : "N/A"}</td>
                      <td className="px-6 py-4">
                        {item.improvement_pct !== null && item.improvement_pct !== undefined ? (
                          <span className="px-2.5 py-1 rounded text-[10px] font-bold bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/30">
                            +{item.improvement_pct}%
                          </span>
                        ) : (
                          <span className="text-[var(--text-muted)]">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded text-[10px] font-bold bg-teal-500/10 text-[var(--primary)] border border-teal-500/30">
                          ✓ Settled
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
