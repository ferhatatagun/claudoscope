import type { UsageStats } from "./types";

// USD per 1M tokens, by model tier. Reflects Anthropic's published pricing.
// Cost is detected from the model name, so dated snapshots and future minor
// versions still get a sensible estimate. Edit here when pricing changes.
interface Price {
  input: number;
  cacheRead: number;
  cacheWrite5m: number;
  output: number;
}

const TIERS: Record<"opus" | "sonnet" | "haiku", Price> = {
  opus: { input: 15, cacheRead: 1.5, cacheWrite5m: 18.75, output: 75 },
  sonnet: { input: 3, cacheRead: 0.3, cacheWrite5m: 3.75, output: 15 },
  haiku: { input: 1, cacheRead: 0.1, cacheWrite5m: 1.25, output: 5 },
};

export function tierOf(model: string): "opus" | "sonnet" | "haiku" {
  const m = model.toLowerCase();
  if (m.includes("opus")) return "opus";
  if (m.includes("haiku")) return "haiku";
  return "sonnet";
}

export interface CostBreakdown {
  uncachedInput: number;
  cachedRead: number;
  cacheWrite: number;
  output: number;
  total: number;
  tier: "opus" | "sonnet" | "haiku";
}

export function computeCost(model: string, usage: UsageStats): CostBreakdown {
  const tier = tierOf(model);
  const p = TIERS[tier];
  const uncachedInput = (usage.input_tokens / 1_000_000) * p.input;
  const cachedRead = (usage.cache_read_input_tokens / 1_000_000) * p.cacheRead;
  const cacheWrite = (usage.cache_creation_input_tokens / 1_000_000) * p.cacheWrite5m;
  const output = (usage.output_tokens / 1_000_000) * p.output;
  return {
    uncachedInput,
    cachedRead,
    cacheWrite,
    output,
    total: uncachedInput + cachedRead + cacheWrite + output,
    tier,
  };
}

export function priceOf(model: string): Price {
  return TIERS[tierOf(model)];
}

export function formatUSD(n: number): string {
  if (n === 0) return "$0";
  if (n < 0.0001) return "<$0.0001";
  if (n < 1) return `$${n.toFixed(4)}`;
  return `$${n.toFixed(3)}`;
}

export function formatNum(n: number): string {
  return n.toLocaleString("en-US");
}
