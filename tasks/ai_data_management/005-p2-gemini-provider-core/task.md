# TASK 005 - Implement GeminiEmbeddingProvider

## Phase

phase2

## Muc tieu

Tich hop Gemini Embedding 2 vao lop provider.

## Cong viec can lam

1. Tao GeminiEmbeddingProvider theo interface chung.
2. Ho tro embed_query va embed_documents.
3. Cau hinh model thong qua EMBEDDING_MODEL.

## Dau ra mong doi

Gemini provider co the embed du lieu co ban.

## DoD

- [x] Goi API thanh cong trong local env.
- [x] Co xu ly loi co ban.
- [x] Tuan thu interface chung.

## Ket qua thuc hien

- Da hoan thien GeminiEmbeddingProvider theo interface chung tai backend/app/services/ai_agent/embeddings/gemini.py.
- Da ho tro day du embed_query va embed_documents, co batch handling cho embed_documents.
- Da dung cau hinh model thong qua EMBEDDING_MODEL, default la models/gemini-embedding-2-preview.
- Da bo sung xu ly loi co ban: thieu API key, thieu dependency, loi call embedding.
- Da bo sung fallback 1 lan sang models/gemini-embedding-001 khi gap loi model not found.
- Da viet unit test tai backend/tests/test_gemini_embedding_provider.py va chay pass.
- Da smoke test goi API that trong local env: OK (VECTOR_DIM=3072).
