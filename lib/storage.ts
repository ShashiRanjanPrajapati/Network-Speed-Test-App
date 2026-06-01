import { SpeedTestResult } from "@/types/speed-test";
import { HISTORY_STORAGE_KEY, MAX_HISTORY_ENTRIES } from "./constants";

export function loadHistory(): SpeedTestResult[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SpeedTestResult[];
  } catch {
    return [];
  }
}

export function saveResult(result: SpeedTestResult): SpeedTestResult[] {
  const history = loadHistory();
  const updated = [result, ...history].slice(0, MAX_HISTORY_ENTRIES);
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Storage quota exceeded - ignore
  }
  return updated;
}

export function deleteResult(id: string): SpeedTestResult[] {
  const history = loadHistory();
  const updated = history.filter((r) => r.id !== id);
  localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export function clearHistory(): void {
  localStorage.removeItem(HISTORY_STORAGE_KEY);
}
