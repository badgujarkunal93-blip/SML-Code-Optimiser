export interface SavedHistoryRecord {
  id: string;
  created_at: string;
  language: string;
  original_code: string;
  optimized_code?: string;
  original_time_ms?: number | null;
  optimized_time_ms?: number | null;
  improvement_pct?: number | null;
  correctness_verified?: boolean;
  reasoning?: string;
  mode?: string;
  title?: string;
}

const STORAGE_KEY = "optima_saved_history";
const ACTIVE_CODE_KEY = "optima_active_workspace_code";

export function getSavedHistory(): SavedHistoryRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCodeToHistory(record: Omit<SavedHistoryRecord, "id" | "created_at">): SavedHistoryRecord {
  const existing = getSavedHistory();
  const newRecord: SavedHistoryRecord = {
    ...record,
    id: `saved_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    created_at: new Date().toISOString(),
  };
  const updated = [newRecord, ...existing];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to save code to history:", e);
  }
  return newRecord;
}

export function deleteSavedHistory(id: string): SavedHistoryRecord[] {
  const existing = getSavedHistory();
  const updated = existing.filter((item) => item.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to update saved history:", e);
  }
  return updated;
}

export function clearAllSavedHistory(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

export function setActiveWorkspaceCode(code: string, language?: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACTIVE_CODE_KEY, JSON.stringify({ code, language }));
}

export function getActiveWorkspaceCode(): { code: string; language?: string } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(ACTIVE_CODE_KEY);
    if (!raw) return null;
    localStorage.removeItem(ACTIVE_CODE_KEY);
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
