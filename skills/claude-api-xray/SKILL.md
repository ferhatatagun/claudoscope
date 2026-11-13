---
name: claude-api-xray
description: X-rays a Claude Messages API call. Splits a response's usage into cache read, cache write, uncached input and output, prices each segment, and tells whether prompt caching is actually hitting. Use when the user shares an API response or usage block, asks why a Claude call cost what it did, or why caching seems not to work.
---

# Claude API X-Ray

A single request is four things billed at four rates. Show them separately.

## Input
The `usage` object of a Messages API response (or several, to compare runs), and the model id. If the user has no usage block, ask for one; do not invent numbers.

## Segments
From `usage`:

| Segment | Field | Rate (per `references/models.md`) |
|---|---|---|
| uncached input | `input_tokens` | model input rate |
| cache write | `cache_creation_input_tokens` | 1.25x input (5-minute TTL) |
| cache read | `cache_read_input_tokens` | input x model's cache-read multiplier |
| output | `output_tokens` | model output rate |

`cost = sum(segment_tokens / 1e6 * rate)`. On models that think by default, `output_tokens` already includes thinking tokens. Haiku 5.5 switches to a higher rate card above 100K prompt tokens (prompt = uncached + cache write + cache read).

## Is caching working?
- First call with `cache_control`: expect a cache write, zero cache read.
- Same request again within 5 minutes: the written segment should become a cache read. If `cache_read_input_tokens` is 0 on the second run, the prefix changed or is too short.
- Common causes: a timestamp, request id or user name early in the system prompt; tool definitions or message order changing; `cache_control` placed after volatile content; prefix below the model's minimum cacheable length; more than 5 minutes between calls.
- Saving from a hit: `cache_read_tokens * (input_rate - read_rate) / 1e6`.

## Latency (if the user has timings)
Time to first token (first content block of any kind, not only text), total time, throughput = `output_tokens / (total - ttft)`.

## Report
A table of the four segments (tokens, rate, cost, % of total), total cost, cost delta against the previous run if given, a one-line caching verdict, and the single most valuable fix.

## Notes
- Most current models reject `temperature`/`top_p`/`top_k` with a 400. Do not suggest them.
- Prices are a dated snapshot. Say so and do not quote prices from memory.

Interactive version (bring your own key, no backend): https://claudoscope-labs.vercel.app, source github.com/ferhatatagun/claudoscope.
