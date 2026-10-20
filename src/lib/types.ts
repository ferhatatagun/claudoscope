import { MODEL_OPTIONS, QUICK_PICKS, modelLabel } from "./models";

export type Role = "user" | "assistant";

export interface Message {
  id: string;
  role: Role;
  content: string;
}

export interface RequestState {
  /** Any model id your API key supports — e.g. claude-sonnet-5-5. */
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

/** Quick-pick buttons for the model field. Not exhaustive — type anything. */
export const MODEL_SUGGESTIONS = QUICK_PICKS;

export { MODEL_OPTIONS };

export const shortModel = modelLabel;
