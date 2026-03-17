# TASK 023 - Latency Cost va AB Test

## Phase

phase6

## Muc tieu

So sanh baseline va gemini theo hieu nang va chi phi.

## Cong viec can lam

1. Do latency p50 p95.
2. Uoc tinh chi phi embedding theo khoi luong.
3. Chay AB test baseline vs gemini.

## Dau ra mong doi

Co bang so sanh tong hop metric hieu nang chi phi.

## DoD

- [x] So lieu do duoc luu va truy vet duoc.
- [x] Cach do duoc mo ta ro rang.
- [x] Co ket luan tam thoi dua tren data.

## Ket qua thuc hien

- Da tao script backend/scripts/benchmark_latency_cost_abtest.py.
- Script tong hop p50/p95 latency + quality metrics + uoc tinh cost theo provider.
- Da chay AB test baseline vs gemini, ket qua luu tai:
  - tasks/ai_data_management/023-p6-latency-cost-abtest/results/abtest_summary.json
  - tasks/ai_data_management/023-p6-latency-cost-abtest/results/abtest_summary.md
- Ket luan tam thoi tu data:
  - baseline nhanh hon ro rang (p95 ~ 22ms)
  - gemini retrieval quality cao hon (Recall@5, MRR@10)
  - khuyen nghi hybrid baseline default + gemini cho query can do chinh xac cao
