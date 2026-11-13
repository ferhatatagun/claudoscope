# Model windows and prices

Snapshot taken from the context-lens model catalog (October 2026). USD per 1M tokens. Check Anthropic's pricing page for changes.
Cache read = multiplier x input. Cache write (5 min) = 1.25x input.

| Model | Context window | Input | Output | Cache-read multiplier | New tokenizer (+30%) |
|---|---|---|---|---|---|
| Fable 5.1 | 1M | 10 | 50 | 0.025 | yes |
| Fable 5 | 1M | 10 | 50 | 0.1 | yes |
| Opus 5.5 | 1M | 4 | 20 | 0.05 | yes |
| Opus 5 | 1M | 5 | 25 | 0.1 | yes |
| Opus 4.8 / 4.7 | 1M | 5 | 25 | 0.1 | yes |
| Opus 4.6 | 1M | 5 | 25 | 0.1 | no |
| Opus 4.5 | 200K | 5 | 25 | 0.1 | no |
| Opus 4.1 / 4 | 200K | 15 | 75 | 0.1 | no |
| Sonnet 5.5 / 5 | 1M | 2 | 10 | 0.1 | yes |
| Sonnet 4.6 | 1M | 3 | 15 | 0.1 | no |
| Sonnet 4.5 / 4 | 200K | 3 | 15 | 0.1 | no |
| Haiku 5.5 (prompt up to 100K) | 1M | 0.10 | 0.50 | 0.1 | yes |
| Haiku 5.5 (prompt above 100K) | 1M | 0.50 | 2.50 | 0.1 | yes |
| Haiku 4.5 | 200K | 1 | 5 | 0.1 | no |

## Worked example
System 1,200 tokens + user 300 tokens = 1,500 input; 500 output; Sonnet 5.5.
- cold: 1500/1e6*2 + 500/1e6*10 = $0.003 + $0.005 = $0.008 per call, $8 per 1K calls.
- cached system (1,200 at 0.1x): 1200/1e6*0.2 + 300/1e6*2 + $0.005 = $0.00584 per call.
- window position: 1,500 / 1,000,000 = 0.15%.
