"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, History, ArrowUpRight } from "lucide-react";
import type { RunResult } from "@/lib/types";
import { shortModel } from "@/lib/types";
import { computeCost, formatUSD } from "@/lib/pricing";

interface Props {
  open: boolean;
  history: RunResult[];
  onClose: () => void;
  onRestore: (run: RunResult) => void;
  onClear: () => void;
}

export function HistoryDrawer({ open, history, onClose, onRestore, onClear }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col border-l border-border bg-bg-elev"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <History size={16} className="text-accent" />
                <h2 className="text-sm font-semibold">History</h2>
                <span className="font-mono text-xs text-fg-faint">{history.length}</span>
              </div>
              <div className="flex items-center gap-3">
                {history.length > 0 && (
                  <button
                    onClick={onClear}
                    className="flex items-center gap-1 text-[11px] text-fg-faint transition-colors hover:text-danger"
                  >
                    <Trash2 size={12} /> clear
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="text-fg-faint transition-colors hover:text-fg"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3">
              {history.length === 0 ? (
                <p className="px-2 py-8 text-center text-xs text-fg-faint">
                  Runs you make are saved here, in this browser only.
                </p>
              ) : (
                <ul className="space-y-2">
                  {history.map((run) => (
                    <li key={run.id}>
                      <button
                        onClick={() => onRestore(run)}
                        className="group w-full rounded-lg border border-border bg-bg p-3 text-left transition-colors hover:border-accent"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[11px] text-fg-muted">
                            {shortModel(run.model)}
                          </span>
                          <span className="text-[10px] text-fg-faint">
                            {timeAgo(run.createdAt)}
                          </span>
                        </div>
                        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-fg">
                          {run.error
                            ? `⚠ ${run.error}`
                            : run.output || "(empty response)"}
                        </p>
                        <div className="mt-2 flex items-center gap-3 font-mono text-[10px] text-fg-faint">
                          <span>{formatUSD(computeCost(run.model, run.usage).total)}</span>
                          <span>{run.usage.output_tokens} out</span>
                          {run.usage.cache_read_input_tokens > 0 && (
                            <span className="text-cache-read">cache hit</span>
                          )}
                          <span className="ml-auto flex items-center gap-0.5 text-accent opacity-0 transition-opacity group-hover:opacity-100">
                            restore <ArrowUpRight size={11} />
                          </span>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}
