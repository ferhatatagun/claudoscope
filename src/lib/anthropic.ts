import type { RequestState, UsageStats } from "./types";

/**
 * Direct browser → Anthropic streaming client.
 *
 * We deliberately skip the official SDK: its newer agent-toolset entry pulls in
 * Node-only modules (`node:fs/promises`) that break browser bundling. Talking to
 * the Messages API over `fetch` keeps the bundle lean and gives us full control
 * over SSE parsing — which is the whole point of an x-ray tool.
 */

const ENDPOINT = "https://api.anthropic.com/v1/messages";
const API_VERSION = "2023-06-01";

export interface StreamCallbacks {
  onText: (chunk: string) => void;
  onFirstToken: () => void;
  onUsage: (usage: UsageStats) => void;
  onDone: (final: { usage: UsageStats; stopReason: string | null }) => void;
  onError: (message: string) => void;
}

const EMPTY_USAGE: UsageStats = {
  input_tokens: 0,
  output_tokens: 0,
  cache_read_input_tokens: 0,
  cache_creation_input_tokens: 0,
};

/** Build the `system` param — a cacheable block array when caching is on. */
function buildSystem(req: RequestState) {
  const text = req.system.trim();
  if (!text) return undefined;
  if (!req.cacheSystem) return text;
  return [{ type: "text", text, cache_control: { type: "ephemeral" } }];
}

function mergeUsage(target: UsageStats, raw: Record<string, unknown> | undefined) {
  if (!raw) return;
  if (typeof raw.input_tokens === "number") target.input_tokens = raw.input_tokens;
  if (typeof raw.output_tokens === "number") target.output_tokens = raw.output_tokens;
  if (typeof raw.cache_read_input_tokens === "number")
    target.cache_read_input_tokens = raw.cache_read_input_tokens;
  if (typeof raw.cache_creation_input_tokens === "number")
    target.cache_creation_input_tokens = raw.cache_creation_input_tokens;
}

export async function runStream(
  apiKey: string,
  req: RequestState,
  cb: StreamCallbacks,
  signal?: AbortSignal,
): Promise<void> {
  const messages = req.messages
    .filter((m) => m.content.trim().length > 0)
    .map((m) => ({ role: m.role, content: m.content }));

  if (messages.length === 0) {
    cb.onError("Add at least one message with content before running.");
    return;
  }

  const usage: UsageStats = { ...EMPTY_USAGE };
  let firstTokenSeen = false;
  let stopReason: string | null = null;

  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      signal,
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": API_VERSION,
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: req.model,
        max_tokens: req.maxTokens,
        temperature: req.temperature,
        system: buildSystem(req),
        messages,
        stream: true,
      }),
    });

    if (!res.ok || !res.body) {
      cb.onError(await readError(res));
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // SSE events are separated by a blank line.
      let sep: number;
      while ((sep = buffer.indexOf("\n\n")) !== -1) {
        const rawEvent = buffer.slice(0, sep);
        buffer = buffer.slice(sep + 2);

        const dataLine = rawEvent
          .split("\n")
          .find((l) => l.startsWith("data:"));
        if (!dataLine) continue;

        let evt: Record<string, unknown>;
        try {
          evt = JSON.parse(dataLine.slice(5).trim());
        } catch {
          continue;
        }

        switch (evt.type) {
          case "message_start": {
            const msg = evt.message as Record<string, unknown> | undefined;
            mergeUsage(usage, msg?.usage as Record<string, unknown>);
            cb.onUsage({ ...usage });
            break;
          }
          case "content_block_delta": {
            const delta = evt.delta as Record<string, unknown> | undefined;
            if (delta?.type === "text_delta" && typeof delta.text === "string") {
              if (!firstTokenSeen) {
                firstTokenSeen = true;
                cb.onFirstToken();
              }
              cb.onText(delta.text);
            }
            break;
          }
          case "message_delta": {
            mergeUsage(usage, evt.usage as Record<string, unknown>);
            const delta = evt.delta as Record<string, unknown> | undefined;
            if (typeof delta?.stop_reason === "string") stopReason = delta.stop_reason;
            cb.onUsage({ ...usage });
            break;
          }
          case "error": {
            const err = evt.error as Record<string, unknown> | undefined;
            cb.onError(String(err?.message ?? "Stream error from Anthropic."));
            return;
          }
        }
      }
    }

    cb.onDone({ usage: { ...usage }, stopReason });
  } catch (err: unknown) {
    if (signal?.aborted) {
      cb.onDone({ usage: { ...usage }, stopReason: "aborted" });
      return;
    }
    cb.onError(errorMessage(err));
  }
}

async function readError(res: Response): Promise<string> {
  try {
    const body = await res.json();
    const msg = body?.error?.message ?? body?.message;
    if (msg) return `${res.status} · ${msg}`;
  } catch {
    /* fall through */
  }
  if (res.status === 401) return "401 · Invalid API key. Check it in the key dialog.";
  if (res.status === 429) return "429 · Rate limited. Wait a moment and retry.";
  return `${res.status} · Request failed.`;
}

function errorMessage(err: unknown): string {
  if (err instanceof TypeError) {
    return "Network error — the request was blocked or could not reach Anthropic.";
  }
  if (err instanceof Error) return err.message;
  return "Unknown error while calling the Anthropic API.";
}
