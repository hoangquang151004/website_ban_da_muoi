# TASK 010 - Tao Models va Schemas

## Phase

phase3

## Muc tieu

Chuan hoa model ORM va schema API cho data management.

## Cong viec can lam

1. Tao models va relationships.
2. Tao request/response schemas.
3. Chuan hoa enum status cho source va job.

## Dau ra mong doi

Layer model/schema ro rang de phuc vu router service.

## DoD

- [x] Model map dung migration.
- [x] Schema validate dung.
- [x] Khong co warning type nghiem trong.

## Ket qua thuc hien

- Da tao models backend/app/models/data_source.py gom DataSource, DataChunk, IndexJob va enum status/operation.
- Da dang ky models moi trong backend/app/models/**init**.py de Alembic va app nhan dien.
- Da tao schemas backend/app/schemas/data_source.py cho upload/list/reindex/delete/job-status.
- Da kiem tra loi phan tich tinh (no errors) cho models/schemas moi.
