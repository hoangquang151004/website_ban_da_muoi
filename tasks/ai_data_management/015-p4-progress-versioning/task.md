# TASK 015 - Progress Tracking va Versioning

## Phase

phase4

## Muc tieu

Cap nhat progress theo phan tram va re-index tang version.

## Cong viec can lam

1. Tinh progress theo tung buoc.
2. Version tang khi re-index.
3. Dam bao idempotent key source_id + chunk_index + version.

## Dau ra mong doi

Co the theo doi tien trinh va lich su index.

## DoD

- [x] API job status tra progress chinh xac.
- [x] Re-index tao version moi dung.
- [x] Khong bi duplicate chunk do chay lai.

## Ket qua thuc hien

- Worker cap nhat progress theo tung moc: 5 -> 20 -> 45 -> 90 -> 100.
- API GET /api/v1/admin/data-sources/jobs/{job_id} tra status/progress/error theo DB.
- Reindex tang source.current_version va tao job operation=reindex.
- Id chunk dung key source_id:chunk_index:version de dam bao idempotent.
