# Embedding AB Test Summary

- dataset: D:\web_ban_da_muoi\tasks\ai_data_management\021-p6-benchmark-dataset\dataset\benchmark_dataset_v1.json
- recall@5, mrr@10
- recommendation: hybrid_baseline_default

## Provider Comparison

| provider | status | recall | mrr | p50_ms | p95_ms | est_cost_usd | error |
|---|---|---:|---:|---:|---:|---:|---|
| baseline | success | 0.833333 | 0.517284 | 15.847 | 22.04 | 0.0 |  |
| gemini | success | 0.944444 | 0.869907 | 550.304 | 596.757 | 0.000226 |  |

## Recommendation Notes

- Khong dat dong thoi quality-latency-cost de rollout full Gemini.
- Khuyen nghi hybrid: baseline mac dinh, Gemini cho policy/query can do chinh xac cao.

## Cost Assumptions

- baseline rate: env BASELINE_EMBEDDING_USD_PER_1K_CHARS (default 0)
- gemini rate: env GEMINI_EMBEDDING_USD_PER_1K_CHARS (default 0.00012)
