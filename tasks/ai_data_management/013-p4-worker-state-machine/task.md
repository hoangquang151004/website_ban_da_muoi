# TASK 013 - Tao Ingestion Worker State Machine

## Phase

phase4

## Muc tieu

Xu ly indexing nen theo trang thai queued processing indexed failed.

## Cong viec can lam

1. Tao worker executor chay nen.
2. Dinh nghia state machine va transition.
3. Upload API tra ve ngay voi job_id.

## Dau ra mong doi

Job indexing khong block request upload.

## DoD

- [x] Job state thay doi dung.
- [x] Request upload phan hoi nhanh.
- [x] Loi trong worker duoc ghi nhan.

## Ket qua thuc hien

- Da tao ingestion worker tai backend/app/services/ai_agent/ingestion.py (ham run_index_job).
- Da dinh nghia state machine job: queued -> processing -> indexed|failed.
- Upload/Reindex API da enqueue worker nen va tra response ngay voi source_id/job_id.
- Loi worker duoc ghi log va luu vao index_jobs.error.
