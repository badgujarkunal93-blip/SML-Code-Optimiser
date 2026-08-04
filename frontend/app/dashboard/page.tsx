"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface HistoryRecord {
  id?: string;
  created_at?: string;
  code: string;
  language: string;
  optimized_code: string;
  reasoning?: string;
  original_time_ms?: number | null;
  optimized_time_ms?: number | null;
  improvement_pct?: number | null;
  correctness_verified: boolean;
}

export default function DashboardPage() {
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/history`);
      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }
      const data: HistoryRecord[] = await res.json();
      setHistory(data);
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Optimization History
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Persisted optimization benchmarks log (showing latest 50 runs).
          </p>
        </div>

        <button
          onClick={fetchHistory}
          disabled={loading}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-4 py-2 rounded-xl border border-slate-700 transition-colors disabled:opacity-50"
        >
          {loading ? "Refreshing..." : "🔄 Refresh Table"}
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 text-rose-400 text-sm flex items-center justify-between">
          <span>⚠️ {error}</span>
          <button
            onClick={fetchHistory}
            className="text-xs bg-rose-500/20 hover:bg-rose-500/30 px-3 py-1 rounded transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Table Container */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
            <svg className="animate-spin h-6 w-6 text-emerald-400" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-sm font-medium">Loading history logs...</span>
          </div>
        ) : history.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <p className="text-slate-400 text-sm">No optimization history found in Supabase.</p>
            <Link
              href="/"
              className="inline-block text-xs font-semibold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 px-4 py-2 rounded-lg transition-colors"
            >
              Run Your First Optimization →
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4">Language</th>
                  <th className="px-6 py-4">Original Time</th>
                  <th className="px-6 py-4">Optimized Time</th>
                  <th className="px-6 py-4">Improvement</th>
                  <th className="px-6 py-4">Correctness</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                {history.map((item, idx) => (
                  <tr key={item.id || idx} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 font-sans text-slate-400 whitespace-nowrap">
                      {formatDate(item.created_at)}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-200">
                      {item.language}
                    </td>
                    <td className="px-6 py-4 text-slate-300">
                      {item.original_time_ms !== null && item.original_time_ms !== undefined
                        ? `${item.original_time_ms} ms`
                        : "N/A"}
                    </td>
                    <td className="px-6 py-4 text-emerald-400 font-semibold">
                      {item.optimized_time_ms !== null && item.optimized_time_ms !== undefined
                        ? `${item.optimized_time_ms} ms`
                        : "N/A"}
                    </td>
                    <td className="px-6 py-4">
                      {item.correctness_verified && item.improvement_pct !== null && item.improvement_pct !== undefined ? (
                        item.improvement_pct >= 0 ? (
                          <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            +{item.improvement_pct}%
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            {item.improvement_pct}%
                          </span>
                        )
                      ) : (
                        <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          Benchmark Failed
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {item.correctness_verified ? (
                        <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-teal-500/10 text-teal-300 border border-teal-500/20">
                          ✓ Verified
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          ⚠️ Unverified
                        </span>
                      )}
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
