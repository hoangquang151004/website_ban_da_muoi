# TASK 022 - Script Metric Recall va MRR

## Phase

phase6

## Muc tieu

Do chat luong retrieval bang metric chuan.

## Cong viec can lam

1. Viet script tinh Recall at 5.
2. Viet script tinh MRR at 10.
3. Luu ket qua metric theo provider.

## Dau ra mong doi

Co script danh gia retrieval lap lai duoc.

## DoD

- [x] Script chay duoc local.
- [x] Ket qua tai lap khi cung dataset.
- [x] Dinh dang output de tong hop bao cao.

## Ket qua thuc hien

- Da tao script backend/scripts/benchmark_retrieval_metrics.py tinh Recall@5 va MRR@10.
- Script ho tro chay theo provider (baseline/gemini), rebuild index benchmark, va luu output JSON + Markdown.
- Da chay local cho baseline va gemini, ket qua luu tai:
  - tasks/ai_data_management/022-p6-metrics-scripts/results/metrics_baseline.json
  - tasks/ai_data_management/022-p6-metrics-scripts/results/metrics_gemini.json
  - tasks/ai_data_management/022-p6-metrics-scripts/results/metrics_baseline.md
  - tasks/ai_data_management/022-p6-metrics-scripts/results/metrics_gemini.md
