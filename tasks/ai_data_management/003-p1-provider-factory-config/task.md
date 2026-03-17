# TASK 003 - Tao Provider Factory va Config

## Phase

phase1

## Muc tieu

Chon provider theo env va cau hinh embedding.

## Cong viec can lam

1. Them bien EMBEDDING_PROVIDER, EMBEDDING_MODEL, EMBEDDING_BATCH_SIZE.
2. Tao factory khoi tao provider theo env.
3. Xu ly fallback an toan khi config khong hop le.

## Dau ra mong doi

Co co che switch provider khong can sua business logic.

## DoD

- [x] Switch baseline/gemini bang env.
- [x] Co thong bao loi ro rang cho config sai.
- [x] Tai lieu env duoc cap nhat.

## Ket qua thuc hien

- Da them bien config EMBEDDING_PROVIDER, EMBEDDING_MODEL, EMBEDDING_BATCH_SIZE trong backend/app/core/config.py.
- Da tao factory tai backend/app/services/ai_agent/embeddings/factory.py de chon provider theo env.
- Da them GeminiEmbeddingProvider toi thieu tai backend/app/services/ai_agent/embeddings/gemini.py.
- Da refactor vector_store de dung factory thay vi hardcode baseline.
- Da cap nhat tai lieu env trong how_to_run.md.
