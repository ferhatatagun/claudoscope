import type { UsageStats } from "./types";
import { priceFor, resolveModel, type Price } from "./models";

// Pricing comes from the model catalog (src/lib/models.ts), per model: the
// 5.x generation no longer shares one price per tier. Unknown ids price as the
// newest model of their family, so future releases still get a sensible
// estimate. Edit the catalog when pricing changes.

export interface CostBreakdown {
  uncachedInput: number;
  cachedRead: number;
  cacheWrite: number;
  output: number;
  total: number;
  /** Label of the model whose rates were applied. */
  pricing: string;
  /** false when the id isn't in the catalog and a family default was assumed. */
  exact: boolean;
}

function promptTokens(usage: UsageStats): number {
  return usage.input_tokens + usage.cache_read_input_tokens + usage.cache_creation_input_tokens;
}

export function computeCost(model: string, usage: UsageStats): CostBreakdown {
  const { model: info, exact } = resolveModel(model);
  const p = priceFor(info, promptTokens(usage));
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
    pricing: exact ? info.label : `${info.label} (assumed)`,
    exact,
  };
}

export function priceOf(model: string, promptTokens = 0): Price {
  return priceFor(resolveModel(model).model, promptTokens);
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
