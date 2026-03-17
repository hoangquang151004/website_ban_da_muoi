# TASK 009 - Tao DB Migrations cho Data Module

## Phase

phase3

## Muc tieu

Tao cac bang data_sources, data_chunks, index_jobs.

## Cong viec can lam

1. Tao migration cho data_sources.
2. Tao migration cho data_chunks.
3. Tao migration cho index_jobs va index can thiet.

## Dau ra mong doi

Schema DB san sang cho API quan ly data.

## DoD

- [ ] Migration run len xuong duoc.
- [x] Khoa ngoai va index hop ly.
- [x] Khong anh huong bang hien tai.

## Ket qua thuc hien

- Da tao migration backend/alembic/versions/c7f8a3d91e10_add_ai_data_management_tables.py.
- Migration tao 3 bang: data_sources, data_chunks, index_jobs.
- Da co khoa ngoai den users va data_sources, co unique constraint cho data_chunks.
- Da co index cho data_chunks.source_id va index_jobs.source_id.
- Da verify chuoi migration: alembic heads -> c7f8a3d91e10 (head).
- Chua verify duoc upgrade/downgrade tren DB that vi MySQL localhost trong env hien tai dang khong ket noi duoc.
