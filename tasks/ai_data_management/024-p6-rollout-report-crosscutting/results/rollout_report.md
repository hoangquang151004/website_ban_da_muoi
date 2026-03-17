# Rollout Report - AI Data Management Phase 6

## 1) Benchmark Summary

Dataset

- version: v1.0.0
- documents: 11
- queries: 18
- scope: policy + health + fengshui + care

Metrics

- baseline: Recall@5=0.833333, MRR@10=0.517284, p95 latency=22.04ms
- gemini: Recall@5=0.944444, MRR@10=0.869907, p95 latency=596.757ms

AB Recommendation

- recommendation: hybrid_baseline_default
- reason: Gemini quality cao hon ro, nhung p95 latency cao hon baseline rat nhieu.

## 2) Rollout Decision

Quyet dinh

- Khuyen nghi rollout hybrid.

Chinh sach runtime de xuat

- Mac dinh dung baseline cho traffic thong thuong de giu response nhanh.
- Dung gemini cho:
  - policy va query quan trong can do chinh xac retrieval cao
  - batch ingestion/reindex theo lich nen

Canary plan

- Step 1: 10% query policy sang gemini trong 3-5 ngay.
- Step 2: neu quality cai thien ro va SLA chap nhan duoc, nang len 30%.
- Step 3: xem xet full gemini cho ingestion, giu baseline cho online query neu latency van cao.

## 3) Risks and Mitigations

Rui ro 1: latency gemini cao

- Tac dong: cham UX chat khi query realtime.
- Giam thieu: chi dung gemini cho luong can do chinh xac cao, cache ket qua retrieval, async precompute.

Rui ro 2: cost tang theo luu luong

- Tac dong: vuot ngan sach khi index/query tang.
- Giam thieu: text-hash cache da co, limit reindex khong can thiet, dat budget alert theo ngay.

Rui ro 3: mismatch embedding dimensions

- Tac dong: loi query/upsert neu dung chung collection.
- Giam thieu: tach collection theo provider (da ap dung trong benchmark script).

Rui ro 4: upload security

- Tac dong: upload file doc hai/qua lon.
- Giam thieu de xuat:
  - whitelist extension + MIME check
  - gioi han kich thuoc file
  - doi ten file va luu an toan
  - scan antivirus neu co ha tang

Rui ro 5: observability chua day du

- Tac dong: kho truy vet loi ingestion/retrieval.
- Giam thieu de xuat:
  - log co cau truc: source_id, job_id, provider, status, progress, error_type
  - metric: ingestion_success_rate, query_latency_p95, failed_jobs
  - dashboard + alert cho failed spike

## 4) Regression and API Contract Review

Chatbot citation/retrieval regression

- Da co script metrics lap lai duoc voi dataset versioned.
- Khuyen nghi chay dinh ky sau moi thay doi embedding/model/chunking.

API contract

- Admin Data APIs da on dinh cho upload/list/reindex/delete/job status.
- Khuyen nghi bo sung API doc noi bo cho:
  - trang thai job va y nghia progress
  - expected error codes cho upload/reindex/delete

## 5) Handover Checklist

Pre-release

- [ ] Chay benchmark metrics cho baseline va gemini.
- [ ] Chay AB summary va cap nhat rollout report.
- [ ] Verify migration va data_sources/index_jobs tren env target.
- [ ] Verify upload/reindex/delete/polling flow tren UI admin.

Production readiness

- [ ] Bat log co cau truc cho ingestion worker.
- [ ] Dat nguong canh bao failed jobs + p95 latency.
- [ ] Review upload security controls.
- [ ] Dat budget/cost guardrail cho provider.

Post-release

- [ ] Theo doi 7 ngay: quality retrieval + latency + cost.
- [ ] Quy dinh dieu kien nang traffic gemini trong hybrid plan.
