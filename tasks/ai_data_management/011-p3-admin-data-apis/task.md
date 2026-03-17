# TASK 011 - Implement Admin Data APIs

## Phase

phase3

## Muc tieu

Tao bo REST API upload, list, reindex, delete, job status.

## Cong viec can lam

1. POST /upload tao source va index job.
2. GET /data-sources co paging va filter.
3. POST /{id}/reindex, DELETE /{id}, GET /jobs/{job_id}.

## Dau ra mong doi

Bo endpoint data management hoat dong day du.

## DoD

- [x] API tra dung contract.
- [x] Validate input upload an toan.
- [x] Error handling ro rang.

## Ket qua thuc hien

- Da tao service CRUD backend/app/services/crud/admin_data.py cho upload/list/reindex/delete/job-status.
- Da tao router backend/app/routers/admin_data.py voi cac endpoint:
  - POST /api/v1/admin/data-sources/upload
  - GET /api/v1/admin/data-sources
  - POST /api/v1/admin/data-sources/{source_id}/reindex
  - DELETE /api/v1/admin/data-sources/{source_id}
  - GET /api/v1/admin/data-sources/jobs/{job_id}
- Da include router moi vao backend/app/main.py.
- Upload da luu file that vao static/uploads/data_sources va tao index job queued.
