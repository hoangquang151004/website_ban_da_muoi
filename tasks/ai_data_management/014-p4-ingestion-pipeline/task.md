# TASK 014 - Tach Pipeline Parse Chunk Embed Upsert

## Phase

phase4

## Muc tieu

Chuan hoa ingestion pipeline thanh cac step ro rang.

## Cong viec can lam

1. Parse file thanh text.
2. Chunk text theo quy tac.
3. Embed batch va upsert vao Chroma.

## Dau ra mong doi

Pipeline de maintain va de them retry theo step.

## DoD

- [x] Moi step co ham rieng.
- [x] Loi step nao ghi ro step do.
- [x] Co test co ban cho pipeline.

## Ket qua thuc hien

- Da tach pipeline thanh cac ham rieng trong backend/app/services/ai_agent/ingestion.py:
  - parse_source_file
  - chunk_text
  - ingest_source_chunks
  - validate_source_consistency
- Pipeline chay theo thu tu parse -> chunk -> embed/upsert Chroma.
- Da them test pipeline tai backend/tests/test_data_ingestion_pipeline.py.
