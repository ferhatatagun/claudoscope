import type { RunResult } from "./types";

const KEY_API = "claudoscope:apiKey";
const KEY_HISTORY = "claudoscope:history";
const HISTORY_LIMIT = 25;

export function loadApiKey(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(KEY_API) ?? "";
}

export function saveApiKey(key: string): void {
  if (typeof window === "undefined") return;
  if (!key) window.localStorage.removeItem(KEY_API);
  else window.localStorage.setItem(KEY_API, key);
}

export function loadHistory(): RunResult[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY_HISTORY);
    if (!raw) return [];
    return JSON.parse(raw) as RunResult[];
  } catch {
    return [];
  }
}

export function saveRun(run: RunResult): RunResult[] {
  const current = loadHistory();
  const next = [run, ...current].slice(0, HISTORY_LIMIT);
  window.localStorage.setItem(KEY_HISTORY, JSON.stringify(next));
  return next;
}

export function clearHistory(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY_HISTORY);
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}
