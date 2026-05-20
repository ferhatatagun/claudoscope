"use client";

import { motion } from "framer-motion";
import { Database, Zap, Clock, Gauge, CircleDollarSign } from "lucide-react";
import type { UsageStats } from "@/lib/types";
import { computeCost, formatNum, formatUSD, priceOf } from "@/lib/pricing";

interface Props {
  model: string;
  usage: UsageStats | null;
  latencyMs: number | null;
  ttfbMs: number | null;
}

const SEGMENTS = [
  { key: "cache_read_input_tokens", label: "cache read", color: "var(--cache-read)" },
  { key: "cache_creation_input_tokens", label: "cache write", color: "var(--cache-write)" },
  { key: "input_tokens", label: "uncached input", color: "var(--uncached)" },
  { key: "output_tokens", label: "output", color: "var(--output)" },
] as const;

export function XRayPanel({ model, usage, latencyMs, ttfbMs }: Props) {
  const u = usage ?? {
    input_tokens: 0,
    output_tokens: 0,
    cache_read_input_tokens: 0,
    cache_creation_input_tokens: 0,
  };
  const total =
    u.input_tokens + u.output_tokens + u.cache_read_input_tokens + u.cache_creation_input_tokens;
  const cost = computeCost(model, u);

  // Cache economics
  const p = priceOf(model);
  const savedOnReads = (u.cache_read_input_tokens / 1_000_000) * (p.input - p.cacheRead);
  const writePremium =
    (u.cache_creation_input_tokens / 1_000_000) * (p.cacheWrite5m - p.input);
  const genMs = latencyMs && ttfbMs ? Math.max(latencyMs - ttfbMs, 1) : null;
  const speed = genMs ? (u.output_tokens / genMs) * 1000 : null;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
        <span className="text-[11px] font-medium uppercase tracking-wider text-fg-faint">
          X-Ray
        </span>
        <span className="text-[11px] text-fg-faint">token economics of the last run</span>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {/* Token composition bar */}
        <div>
          <div className="mb-1.5 flex items-baseline justify-between">
            <span className="text-[11px] uppercase tracking-wider text-fg-faint">
              Token composition
            </span>
            <span className="font-mono text-xs text-fg-muted">
              {formatNum(total)} tokens
            </span>
          </div>
          <div className="flex h-9 w-full overflow-hidden rounded-lg border border-border bg-bg">
            {total === 0 ? (
              <div className="flex w-full items-center justify-center text-[11px] text-fg-faint">
                run a request to populate
              </div>
            ) : (
              SEGMENTS.map((s) => {
                const v = u[s.key];
                if (v === 0) return null;
                return (
                  <motion.div
                    key={s.key}
                    title={`${s.label}: ${formatNum(v)}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${(v / total) * 100}%` }}
                    transition={{ type: "spring", stiffness: 120, damping: 20 }}
                    className="group relative flex items-center justify-center"
                    style={{ background: s.color, minWidth: 3 }}
                  >
                    <span className="px-1 font-mono text-[10px] font-semibold text-black/75 opacity-0 transition-opacity group-hover:opacity-100">
                      {formatNum(v)}
                    </span>
                  </motion.div>
                );
              })
            )}
          </div>
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            {SEGMENTS.map((s) => (
              <div key={s.key} className="flex items-center gap-1.5">
                <span
                  className="h-2 w-2 shrink-0 rounded-[2px]"
                  style={{ background: s.color }}
                />
                <span className="text-[11px] text-fg-muted">{s.label}</span>
                <span className="ml-auto font-mono text-[11px] text-fg">
                  {formatNum(u[s.key])}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-2">
          <Stat
            icon={<CircleDollarSign size={13} />}
            label="Cost"
            value={formatUSD(cost.total)}
            sub={`est · ${cost.tier} pricing`}
          />
          <Stat
            icon={<Zap size={13} />}
            label="TTFB"
            value={ttfbMs != null ? `${Math.round(ttfbMs)} ms` : "—"}
            sub="time to first token"
          />
          <Stat
            icon={<Clock size={13} />}
            label="Total time"
            value={latencyMs != null ? fmtMs(latencyMs) : "—"}
            sub="request to finish"
          />
          <Stat
            icon={<Gauge size={13} />}
            label="Speed"
            value={speed != null ? `${speed.toFixed(0)} t/s` : "—"}
            sub="output throughput"
          />
        </div>

        {/* Cache callout */}
        <div className="rounded-lg border border-border bg-bg p-3">
          <div className="mb-2 flex items-center gap-1.5">
            <Database size={13} className="text-cache-write" />
            <span className="text-[11px] font-medium uppercase tracking-wider text-fg-faint">
              Cache impact
            </span>
          </div>
          {u.cache_read_input_tokens === 0 && u.cache_creation_input_tokens === 0 ? (
            <p className="text-xs leading-relaxed text-fg-muted">
              No cache activity. Turn on the system-prompt cache and give it ~1k+ tokens,
              then run twice — the second run reads from cache at a{" "}
              <span className="text-cache-read">~90% discount</span>.
            </p>
          ) : (
            <div className="space-y-1.5 text-xs">
              {u.cache_creation_input_tokens > 0 && (
                <Row
                  label={`Wrote ${formatNum(u.cache_creation_input_tokens)} tokens to cache`}
                  value={`+${formatUSD(writePremium)}`}
                  tone="warn"
                  note="one-time premium"
                />
              )}
              {u.cache_read_input_tokens > 0 && (
                <Row
                  label={`Read ${formatNum(u.cache_read_input_tokens)} tokens from cache`}
                  value={`−${formatUSD(savedOnReads)}`}
                  tone="good"
                  note="saved vs full price"
                />
              )}
              {u.cache_read_input_tokens === 0 && u.cache_creation_input_tokens > 0 && (
                <p className="pt-1 text-fg-muted">
                  Cache primed. Run the same request again within 5 minutes to cash in.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-bg p-2.5">
      <div className="flex items-center gap-1 text-fg-faint">
        {icon}
        <span className="text-[10px] font-medium uppercase tracking-wider">{label}</span>
      </div>
      <div className="mt-1 font-mono text-lg leading-none text-fg">{value}</div>
      <div className="mt-1 text-[10px] text-fg-faint">{sub}</div>
    </div>
  );
}

function Row({
  label,
  value,
  tone,
  note,
}: {
  label: string;
  value: string;
  tone: "good" | "warn";
  note: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-fg-muted">{label}</span>
      <span className="flex items-baseline gap-1.5">
        <span className="text-[10px] text-fg-faint">{note}</span>
        <span
          className="font-mono font-semibold"
          style={{ color: tone === "good" ? "var(--success)" : "var(--warn)" }}
        >
          {value}
        </span>
      </span>
    </div>
  );
}

function fmtMs(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}
