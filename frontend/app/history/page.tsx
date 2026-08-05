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
      const data: any = await res.json();
      const records: HistoryRecord[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.history)
        ? data.history
        : [];
      setHistory(records);
    } catch (err: any) {
      setError(err.message || "Failed to load history records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
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
      <div className="glass-panel p-6 rounded-2xl border border-[#3c4a46]/30 flex flex-wrap items-center justify-between gap-4 shadow-2xl">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span className="text-[#57f1db]">📜</span> Optimization History Logs
          </h1>
          <p className="text-[#bacac5] text-xs font-mono mt-1">
            Historical transaction records persisted in Cloud Firestore &amp; Algorand testnet.
          </p>
        </div>

        <button
          onClick={fetchHistory}
          disabled={loading}
          className="flex items-center gap-2 bg-[#0F172A] hover:bg-slate-800 text-[#57f1db] font-mono text-xs font-bold px-4 py-2 rounded-xl border border-[#2DD4BF]/30 transition-all hover-scale disabled:opacity-50"
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

      <div className="glass-panel rounded-2xl border border-[#3c4a46]/30 overflow-hidden shadow-2xl">
        {loading ? (
          <div className="p-12 text-center text-[#bacac5] font-mono flex flex-col items-center justify-center gap-3">
            <svg className="animate-spin h-6 w-6 text-[#2DD4BF]" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-xs font-semibold">Loading Firestore History...</span>
          </div>
        ) : history.length === 0 ? (
          <div className="p-12 text-center space-y-3 font-mono">
            <p className="text-[#bacac5] text-xs">No history records found.</p>
            <Link
              href="/workspace"
              className="inline-block text-xs font-bold text-[#020617] bg-[#2DD4BF] hover:bg-[#57f1db] px-5 py-2 rounded-lg"
            >
              Run First Optimization →
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#dde4e1]">
              <thead className="bg-[#0F172A] text-[#bacac5] font-mono text-[10px] font-bold uppercase border-b border-[#3c4a46]/30">
                <tr>
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4">Language</th>
                  <th className="px-6 py-4">Original Time</th>
                  <th className="px-6 py-4">Optimized Time</th>
                  <th className="px-6 py-4">Speedup</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#3c4a46]/20 font-mono text-xs">
                {history.map((item, idx) => (
                  <tr key={item.id || idx} className="hover:bg-[#0F172A]/50 transition-colors">
                    <td className="px-6 py-4 text-[#bacac5] whitespace-nowrap">{formatDate(item.created_at)}</td>
                    <td className="px-6 py-4 font-bold text-white uppercase">{item.language}</td>
                    <td className="px-6 py-4 text-slate-400">{item.original_time_ms ? `${item.original_time_ms} ms` : "N/A"}</td>
                    <td className="px-6 py-4 text-[#2DD4BF] font-bold">{item.optimized_time_ms ? `${item.optimized_time_ms} ms` : "N/A"}</td>
                    <td className="px-6 py-4">
                      {item.improvement_pct !== null && item.improvement_pct !== undefined ? (
                        <span className="px-2.5 py-1 rounded text-[10px] font-bold bg-[#2DD4BF]/10 text-[#2DD4BF] border border-[#2DD4BF]/30">
                          +{item.improvement_pct}%
                        </span>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded text-[10px] font-bold bg-teal-500/10 text-[#57f1db] border border-teal-500/30">
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
