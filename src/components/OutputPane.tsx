"use client";

import { useEffect, useRef, useState } from "react";
import { Copy, Check, Radio, CircleDot, TriangleAlert } from "lucide-react";

export type RunStatus = "idle" | "streaming" | "done" | "error";

interface Props {
  status: RunStatus;
  output: string;
  error: string | null;
  stopReason: string | null;
  sample?: boolean;
  onLoadSample?: () => void;
}

export function OutputPane({
  status,
  output,
  error,
  stopReason,
  sample,
  onLoadSample,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (status === "streaming" && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [output, status]);

  const copy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <div className="flex items-center gap-2">
          <StatusBadge status={status} />
          {stopReason && status === "done" && (
            <span className="font-mono text-[11px] text-fg-faint">
              stop: {stopReason}
            </span>
          )}
          {sample && (
            <span className="rounded border border-accent/40 bg-accent/10 px-1.5 py-0.5 font-mono text-[10px] text-accent">
              sample data
            </span>
          )}
        </div>
        {output && (
          <button
            onClick={copy}
            className="flex items-center gap-1 text-[11px] text-fg-muted transition-colors hover:text-fg"
          >
            {copied ? <Check size={12} className="text-success" /> : <Copy size={12} />}
            {copied ? "copied" : "copy"}
          </button>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
        {status === "error" ? (
          <div className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/5 p-3 text-sm text-danger">
            <TriangleAlert size={15} className="mt-0.5 shrink-0" />
            <span className="font-mono text-[13px] leading-relaxed">{error}</span>
          </div>
        ) : output ? (
          <div className="whitespace-pre-wrap text-[14px] leading-relaxed text-fg">
            {output}
            {status === "streaming" && (
              <span className="caret-blink ml-0.5 inline-block h-[1.05em] w-[2px] -translate-y-[1px] bg-accent align-middle" />
            )}
          </div>
        ) : (
          <EmptyState status={status} onLoadSample={onLoadSample} />
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: RunStatus }) {
  const map = {
    idle: { label: "idle", color: "text-fg-faint", icon: <CircleDot size={12} /> },
    streaming: { label: "streaming", color: "text-accent", icon: <Radio size={12} /> },
    done: { label: "complete", color: "text-success", icon: <Check size={12} /> },
    error: { label: "error", color: "text-danger", icon: <TriangleAlert size={12} /> },
  }[status];

  return (
    <span className={`flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider ${map.color}`}>
      <span className={status === "streaming" ? "animate-pulse" : ""}>{map.icon}</span>
      {map.label}
    </span>
  );
}

function EmptyState({
  status,
  onLoadSample,
}: {
  status: RunStatus;
  onLoadSample?: () => void;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <div className="mb-2 font-mono text-xs text-fg-faint">
        {status === "streaming" ? "waiting for first token…" : "no response yet"}
      </div>
      <p className="mb-4 max-w-[17rem] text-xs text-fg-faint">
        Run a request to stream a live response and x-ray its token economics.
      </p>
      {status === "idle" && onLoadSample && (
        <button
          onClick={onLoadSample}
          className="rounded-lg border border-border-strong px-3 py-1.5 text-xs text-fg-muted transition-colors hover:border-accent hover:text-fg"
        >
          Preview with sample data
        </button>
      )}
    </div>
  );
}
