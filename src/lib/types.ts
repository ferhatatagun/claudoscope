export type Role = "user" | "assistant";

export interface Message {
  id: string;
  role: Role;
  content: string;
}

export interface RequestState {
  /** Any model id your API key supports — e.g. claude-sonnet-4-5-20250929. */
  model: string;
  system: string;
  cacheSystem: boolean;
  messages: Message[];
  maxTokens: number;
  temperature: number;
}

export interface UsageStats {
  input_tokens: number;
  output_tokens: number;
  cache_read_input_tokens: number;
  cache_creation_input_tokens: number;
}

export interface RunResult {
  id: string;
  createdAt: number;
  model: string;
  request: RequestState;
  output: string;
  usage: UsageStats;
  latencyMs: number;
  ttfbMs: number | null;
  stopReason: string | null;
  error?: string;
}

/** Suggestions for the model autocomplete. Not exhaustive — type anything. */
export const MODEL_SUGGESTIONS: { id: string; label: string }[] = [
  { id: "claude-sonnet-4-5-20250929", label: "Sonnet 4.5" },
  { id: "claude-haiku-4-5-20251001", label: "Haiku 4.5" },
  { id: "claude-opus-4-1-20250805", label: "Opus 4.1" },
];

export function shortModel(id: string): string {
  const known = MODEL_SUGGESTIONS.find((m) => m.id === id);
  if (known) return known.label;
  // strip the trailing date snapshot for a tidy label
  return id.replace(/^claude-/, "").replace(/-\d{8}$/, "");
}
