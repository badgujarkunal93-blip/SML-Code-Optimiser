"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

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

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL.replace(/\/$/, "")}/history`);
      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }
      const data: unknown = await res.json();
      const rawRecords =
        Array.isArray(data)
          ? data
          : typeof data === "object" && data !== null && "history" in data && Array.isArray((data as { history: unknown }).history)
          ? (data as { history: HistoryRecord[] }).history
          : [];
      setHistory(rawRecords as HistoryRecord[]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load history records";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const res = await fetch(`${API_BASE_URL.replace(/\/$/, "")}/history`);
        if (!res.ok) throw new Error(`Server returned status ${res.status}`);
        const data: unknown = await res.json();
        const rawRecords =
          Array.isArray(data)
            ? data
            : typeof data === "object" && data !== null && "history" in data && Array.isArray((data as { history: unknown }).history)
            ? (data as { history: HistoryRecord[] }).history
            : [];
        if (!ignore) setHistory(rawRecords as HistoryRecord[]);
      } catch (err: unknown) {
        if (!ignore) {
          const message = err instanceof Error ? err.message : "Failed to load history records";
          setError(message);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, []);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Just now";
    try {
      const d = new Date(dateStr);
      return d.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 w-full max-w-[1440px] mx-auto">
      <div className="glass-panel p-6 rounded-2xl border border-[var(--border)] flex flex-wrap items-center justify-between gap-4 shadow-2xl">
        <div>
          <h1 className="text-2xl font-black text-[var(--text-primary)] tracking-tight flex items-center gap-2">
            <span className="text-[var(--primary)]">📜</span> Optimization History Logs
          </h1>
          <p className="text-[var(--text-secondary)] text-xs font-mono mt-1">
            Historical transaction records persisted in Cloud Firestore &amp; Algorand testnet.
          </p>
        </div>

        <button
          onClick={fetchHistory}
          disabled={loading}
          className="flex items-center gap-2 bg-[var(--bg-secondary)] hover:bg-[var(--card-elevated)] text-[var(--primary)] font-mono text-xs font-bold px-4 py-2 rounded-xl border border-[var(--primary)]/30 transition-all hover-scale disabled:opacity-50"
        >
          {loading ? "Refreshing..." : "🔄 Refresh History"}
        </button>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 text-rose-400 text-xs font-mono flex items-center justify-between">
          <span>⚠️ {error}</span>
          <button onClick={fetchHistory} className="bg-rose-500/20 px-3 py-1 rounded">
            Retry
          </button>
        </div>
      )}

      <div className="glass-panel rounded-2xl border border-[var(--border)] overflow-hidden shadow-2xl">
        {loading ? (
          <div className="p-12 text-center text-[var(--text-secondary)] font-mono flex flex-col items-center justify-center gap-3">
            <svg className="animate-spin h-6 w-6 text-[var(--primary)]" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-xs font-semibold">Loading Firestore History...</span>
          </div>
        ) : history.length === 0 ? (
          <div className="p-12 text-center space-y-3 font-mono">
            <p className="text-[var(--text-secondary)] text-xs">No history records found.</p>
            <Link
              href="/workspace"
              className="inline-block text-xs font-bold text-white dark:text-[#07101A] bg-[var(--primary)] hover:opacity-90 px-5 py-2 rounded-lg"
            >
              Run First Optimization →
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
                {history.map((item, idx) => (
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
    </div>
  );
}
