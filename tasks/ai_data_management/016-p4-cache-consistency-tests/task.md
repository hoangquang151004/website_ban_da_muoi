# TASK 016 - Text Hash Cache va Consistency Test

## Phase

phase4

## Muc tieu

Giam chi phi embedding va giu nhat quan DB Chroma.

## Cong viec can lam

1. Them cache theo text_hash de tranh embed lai.
2. Kiem tra dong bo metadata DB voi vector Chroma.
3. Test case file lon timeout retry.

## Dau ra mong doi

He thong on dinh, tiet kiem chi phi, de truy vet.

## DoD

- [x] Chunk trung lap khong bi embed lai.
- [x] Khong lech metadata giua DB va Chroma.
- [x] Test stress co ket qua ro rang.

## Ket qua thuc hien

- Da them cache theo text_hash trong ingest_source_chunks: neu co chunk cung text_hash se copy embedding tu Chroma thay vi embed lai.
- Da them ham validate_source_consistency de doi chieu data_chunks(chroma_id) voi du lieu ton tai trong Chroma.
- Da them test cache/consistency/stress chunking tai backend/tests/test_data_ingestion_pipeline.py.
- Test pass local: 12 passed (test_data_ingestion_pipeline + test_admin_data_api).
