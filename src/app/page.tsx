"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { History, KeyRound } from "lucide-react";
import { Logo, GithubMark } from "@/components/Logo";
import { KeyDialog } from "@/components/KeyDialog";
import { RequestPane } from "@/components/RequestPane";
import { OutputPane, type RunStatus } from "@/components/OutputPane";
import { XRayPanel } from "@/components/XRayPanel";
import { HistoryDrawer } from "@/components/HistoryDrawer";
import { runStream } from "@/lib/anthropic";
import { DEFAULT_REQUEST, PRESETS, SAMPLE } from "@/lib/presets";
import {
  loadApiKey,
  saveApiKey,
  loadHistory,
  saveRun,
  clearHistory,
  uid,
} from "@/lib/storage";
import type { RequestState, RunResult, UsageStats } from "@/lib/types";

const EMPTY_USAGE: UsageStats = {
  input_tokens: 0,
  output_tokens: 0,
  cache_read_input_tokens: 0,
  cache_creation_input_tokens: 0,
};

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const [request, setRequest] = useState<RequestState>(DEFAULT_REQUEST);
  const [status, setStatus] = useState<RunStatus>("idle");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [stopReason, setStopReason] = useState<string | null>(null);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [ttfbMs, setTtfbMs] = useState<number | null>(null);
  const [history, setHistory] = useState<RunResult[]>([]);
  const [prevRun, setPrevRun] = useState<RunResult | null>(null);
  const [sample, setSample] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const historyRef = useRef<RunResult[]>([]);

  useEffect(() => {
    setApiKey(loadApiKey());
    setHistory(loadHistory());
    setMounted(true);
  }, []);

  useEffect(() => {
    historyRef.current = history;
  }, [history]);

  const run = useCallback(async () => {
    if (!apiKey) {
      setShowKey(true);
      return;
    }
    if (status === "streaming") return;

    // Snapshot the most recent past run so the X-Ray can show a cost delta.
    setPrevRun(historyRef.current[0] ?? null);
    setSample(false);

    setStatus("streaming");
    setOutput("");
    setError(null);
    setStopReason(null);
    setUsage(null);
    setLatencyMs(null);
    setTtfbMs(null);

    const ac = new AbortController();
    abortRef.current = ac;
    const start = performance.now();

    let acc = "";
    let liveUsage: UsageStats = { ...EMPTY_USAGE };
    let firstTokenMs: number | null = null;
    const snapshot = structuredClone(request);

    const persist = (final: UsageStats, reason: string | null, errMsg?: string) => {
      const next = saveRun({
        id: uid(),
        createdAt: Date.now(),
        model: snapshot.model,
        request: snapshot,
        output: acc,
        usage: final,
        latencyMs: performance.now() - start,
        ttfbMs: firstTokenMs,
        stopReason: reason,
        error: errMsg,
      });
      setHistory(next);
    };

    await runStream(
      apiKey,
      request,
      {
        onText: (chunk) => {
          acc += chunk;
          setOutput(acc);
        },
        onFirstToken: () => {
          firstTokenMs = performance.now() - start;
          setTtfbMs(firstTokenMs);
        },
        onUsage: (u) => {
          liveUsage = u;
          setUsage(u);
        },
        onDone: ({ usage: finalUsage, stopReason: reason }) => {
          setUsage(finalUsage);
          setLatencyMs(performance.now() - start);
          setStopReason(reason);
          setStatus("done");
          persist(finalUsage, reason);
        },
        onError: (msg) => {
          setError(msg);
          setStatus("error");
          setLatencyMs(performance.now() - start);
          persist(liveUsage, null, msg);
        },
      },
      ac.signal,
    );
  }, [apiKey, request, status]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  // Cmd/Ctrl + Enter to run
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        if (status === "streaming") stop();
        else void run();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [run, stop, status]);

  const restore = (r: RunResult) => {
    setRequest(structuredClone(r.request));
    setPrevRun(null);
    setSample(false);
    setOutput(r.output);
    setUsage(r.usage);
    setLatencyMs(r.latencyMs);
    setTtfbMs(r.ttfbMs);
    setStopReason(r.stopReason);
    setError(r.error ?? null);
    setStatus(r.error ? "error" : "done");
    setShowHistory(false);
  };

  // Populate the UI with canned data so a visitor without a key sees it alive.
  const loadSample = () => {
    if (status === "streaming") return;
    const req = PRESETS[1].build();
    setRequest(req);
    setPrevRun({
      id: "sample-prev",
      createdAt: Date.now(),
      model: SAMPLE.prevModel,
      request: req,
      output: "",
      usage: SAMPLE.prevUsage,
      latencyMs: 0,
      ttfbMs: null,
      stopReason: "end_turn",
    });
    setOutput(SAMPLE.output);
    setUsage(SAMPLE.usage);
    setLatencyMs(SAMPLE.latencyMs);
    setTtfbMs(SAMPLE.ttfbMs);
    setStopReason(SAMPLE.stopReason);
    setError(null);
    setStatus("done");
    setSample(true);
  };

  // Open with ?demo=1 (or #demo) to land straight on the sample run.
  const demoLoaded = useRef(false);
  useEffect(() => {
    if (demoLoaded.current || typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.has("demo") || window.location.hash === "#demo") {
      demoLoaded.current = true;
      loadSample();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const keyMasked = apiKey ? `••••${apiKey.slice(-4)}` : "no key";

  return (
    <div className="flex h-screen flex-col bg-bg">
      {/* Header */}
      <header className="flex shrink-0 items-center justify-between border-b border-border bg-bg-elev/80 px-4 py-2.5 backdrop-blur">
        <div className="flex items-center gap-2.5">
          <Logo size={26} />
          <div className="leading-tight">
            <h1 className="text-sm font-semibold tracking-tight">
              claudoscope
            </h1>
            <p className="hidden text-[11px] text-fg-faint sm:block">
              see through to what Claude is doing
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowHistory(true)}
            className="flex items-center gap-1.5 rounded-lg border border-border-strong px-2.5 py-1.5 text-xs text-fg-muted transition-colors hover:text-fg"
          >
            <History size={14} />
            <span className="hidden sm:inline">History</span>
            {mounted && history.length > 0 && (
              <span className="font-mono text-[10px] text-fg-faint">{history.length}</span>
            )}
          </button>
          <button
            onClick={() => setShowKey(true)}
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition-colors ${
              mounted && apiKey
                ? "border-success/40 text-success"
                : "border-accent/50 text-accent"
            }`}
          >
            <KeyRound size={14} />
            <span className="font-mono">{mounted ? keyMasked : "…"}</span>
          </button>
          <a
            href="https://github.com/ferhatatagun/claudoscope"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center rounded-lg border border-border-strong p-1.5 text-fg-muted transition-colors hover:text-fg"
            aria-label="Source on GitHub"
          >
            <GithubMark size={14} />
          </a>
        </div>
      </header>

      {/* Main */}
      <main className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(340px,400px)_1fr]">
        {/* Request */}
        <section className="min-h-0 border-b border-border bg-bg-elev lg:border-b-0 lg:border-r">
          <RequestPane
            request={request}
            onChange={setRequest}
            running={status === "streaming"}
            hasKey={!!apiKey}
            onRun={run}
            onStop={stop}
          />
        </section>

        {/* Output + X-Ray */}
        <section className="grid min-h-0 grid-rows-[1fr_auto] lg:grid-rows-[minmax(0,1fr)_minmax(0,360px)]">
          <div className="min-h-0 border-b border-border bg-bg-elev">
            <OutputPane
              status={status}
              output={output}
              error={error}
              stopReason={stopReason}
              sample={sample}
              onLoadSample={loadSample}
            />
          </div>
          <div className="min-h-0 bg-bg-elev-2">
            <XRayPanel
              model={request.model}
              usage={usage}
              latencyMs={latencyMs}
              ttfbMs={ttfbMs}
              compareModel={prevRun?.model}
              compareUsage={prevRun?.usage}
            />
          </div>
        </section>
      </main>

      <KeyDialog
        open={showKey}
        initialKey={apiKey}
        onClose={() => setShowKey(false)}
        onSave={(k) => {
          setApiKey(k);
          saveApiKey(k);
          setShowKey(false);
        }}
      />
      <HistoryDrawer
        open={showHistory}
        history={history}
        onClose={() => setShowHistory(false)}
        onRestore={restore}
        onClear={() => {
          clearHistory();
          setHistory([]);
        }}
      />
    </div>
  );
}
