"use client";

import { MODEL_SUGGESTIONS, type Message, type RequestState, type Role } from "@/lib/types";
import { PRESETS } from "@/lib/presets";
import { uid } from "@/lib/storage";
import { Plus, Trash2, Play, Square, Database, Sparkles } from "lucide-react";

interface Props {
  request: RequestState;
  onChange: (next: RequestState) => void;
  running: boolean;
  hasKey: boolean;
  onRun: () => void;
  onStop: () => void;
}

export function RequestPane({ request, onChange, running, hasKey, onRun, onStop }: Props) {
  const patch = (p: Partial<RequestState>) => onChange({ ...request, ...p });

  const updateMessage = (id: string, p: Partial<Message>) =>
    patch({ messages: request.messages.map((m) => (m.id === id ? { ...m, ...p } : m)) });

  const addMessage = () => {
    const lastRole = request.messages.at(-1)?.role;
    const role: Role = lastRole === "user" ? "assistant" : "user";
    patch({ messages: [...request.messages, { id: uid(), role, content: "" }] });
  };

  const removeMessage = (id: string) =>
    patch({ messages: request.messages.filter((m) => m.id !== id) });

  return (
    <div className="flex h-full flex-col">
      {/* Presets */}
      <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
        <span className="text-[11px] font-medium uppercase tracking-wider text-fg-faint">
          Preset
        </span>
        {PRESETS.map((p) => (
          <button
            key={p.id}
            title={p.hint}
            onClick={() => onChange(p.build())}
            className="rounded-md border border-border-strong px-2 py-1 text-xs text-fg-muted transition-colors hover:border-accent hover:text-fg"
          >
            {p.name}
          </button>
        ))}
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto p-4">
        {/* Model */}
        <Field label="Model">
          <input
            list="model-suggestions"
            value={request.model}
            onChange={(e) => patch({ model: e.target.value.trim() })}
            spellCheck={false}
            autoComplete="off"
            placeholder="claude-sonnet-4-5-20250929"
            className="w-full rounded-lg border border-border-strong bg-bg px-3 py-2 font-mono text-xs text-fg outline-none transition-colors placeholder:text-fg-faint focus:border-accent"
          />
          <datalist id="model-suggestions">
            {MODEL_SUGGESTIONS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </datalist>
          <div className="mt-1.5 flex gap-1.5">
            {MODEL_SUGGESTIONS.map((m) => (
              <button
                key={m.id}
                onClick={() => patch({ model: m.id })}
                className={`flex-1 rounded-md border px-2 py-1 text-xs font-medium transition-colors ${
                  request.model === m.id
                    ? "border-accent bg-accent/10 text-fg"
                    : "border-border-strong text-fg-muted hover:text-fg"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
          <p className="mt-1 text-[11px] text-fg-faint">
            Any model id your key supports — type your own.
          </p>
        </Field>

        {/* System */}
        <Field
          label="System prompt"
          aside={
            <button
              onClick={() => patch({ cacheSystem: !request.cacheSystem })}
              className={`flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] transition-colors ${
                request.cacheSystem
                  ? "border-cache-write/50 bg-cache-write/10 text-cache-write"
                  : "border-border-strong text-fg-faint hover:text-fg-muted"
              }`}
              title="Mark the system prompt as a cache breakpoint"
            >
              <Database size={11} />
              {request.cacheSystem ? "cached" : "cache off"}
            </button>
          }
        >
          <textarea
            value={request.system}
            onChange={(e) => patch({ system: e.target.value })}
            rows={4}
            spellCheck={false}
            placeholder="You are a helpful assistant…"
            className="w-full resize-y rounded-lg border border-border-strong bg-bg px-3 py-2 text-sm leading-relaxed text-fg outline-none transition-colors placeholder:text-fg-faint focus:border-accent"
          />
          <p className="mt-1 text-[11px] text-fg-faint">
            {charCount(request.system)} chars · caching needs ~1k+ tokens to engage
          </p>
        </Field>

        {/* Messages */}
        <Field
          label="Messages"
          aside={
            <button
              onClick={addMessage}
              className="flex items-center gap-1 text-[11px] text-accent hover:underline"
            >
              <Plus size={11} /> add
            </button>
          }
        >
          <div className="space-y-2">
            {request.messages.map((m) => (
              <div key={m.id} className="rounded-lg border border-border-strong bg-bg">
                <div className="flex items-center justify-between border-b border-border px-2 py-1">
                  <div className="flex gap-1">
                    {(["user", "assistant"] as Role[]).map((r) => (
                      <button
                        key={r}
                        onClick={() => updateMessage(m.id, { role: r })}
                        className={`rounded px-1.5 py-0.5 text-[11px] font-medium transition-colors ${
                          m.role === r
                            ? "bg-bg-elev-2 text-fg"
                            : "text-fg-faint hover:text-fg-muted"
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                  {request.messages.length > 1 && (
                    <button
                      onClick={() => removeMessage(m.id)}
                      className="text-fg-faint transition-colors hover:text-danger"
                      aria-label="Remove message"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
                <textarea
                  value={m.content}
                  onChange={(e) => updateMessage(m.id, { content: e.target.value })}
                  rows={3}
                  spellCheck={false}
                  placeholder={m.role === "user" ? "Ask something…" : "Assistant turn…"}
                  className="w-full resize-y bg-transparent px-3 py-2 text-sm leading-relaxed text-fg outline-none placeholder:text-fg-faint"
                />
              </div>
            ))}
          </div>
        </Field>

        {/* Params */}
        <div className="grid grid-cols-2 gap-3">
          <Field label={`Max tokens · ${request.maxTokens}`}>
            <input
              type="range"
              min={64}
              max={4096}
              step={64}
              value={request.maxTokens}
              onChange={(e) => patch({ maxTokens: Number(e.target.value) })}
              className="w-full accent-[var(--accent)]"
            />
          </Field>
          <Field label={`Temperature · ${request.temperature.toFixed(1)}`}>
            <input
              type="range"
              min={0}
              max={1}
              step={0.1}
              value={request.temperature}
              onChange={(e) => patch({ temperature: Number(e.target.value) })}
              className="w-full accent-[var(--accent)]"
            />
          </Field>
        </div>
      </div>

      {/* Run bar */}
      <div className="border-t border-border p-3">
        {running ? (
          <button
            onClick={onStop}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-border-strong py-2.5 text-sm font-semibold text-fg transition-colors hover:border-danger hover:text-danger"
          >
            <Square size={14} fill="currentColor" /> Stop
          </button>
        ) : (
          <button
            onClick={onRun}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent py-2.5 text-sm font-semibold text-black transition-opacity hover:opacity-90"
          >
            {hasKey ? <Play size={14} fill="currentColor" /> : <Sparkles size={14} />}
            {hasKey ? "Run request" : "Add key & run"}
          </button>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  aside,
  children,
}: {
  label: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-wider text-fg-faint">
          {label}
        </span>
        {aside}
      </div>
      {children}
    </div>
  );
}

function charCount(s: string): string {
  return s.length.toLocaleString("en-US");
}
