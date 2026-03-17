# TASK 006 - Batch Embedding va Retry Backoff

## Phase

phase2

## Muc tieu

Tang do on dinh khi goi Gemini API.

## Cong viec can lam

1. Implement batch embedding theo EMBEDDING_BATCH_SIZE.
2. Them retry exponential backoff cho loi tam thoi.
3. Chuan hoa error: invalid key, quota, timeout.

## Dau ra mong doi

Luong embed batch on dinh va de debug.

## DoD

- [x] Co retry policy ro rang.
- [x] Error message map dung theo nhom loi.
- [x] Log batch co thong tin can thiet.

## Ket qua thuc hien

- Da implement retry exponential backoff trong GeminiEmbeddingProvider (max_retries + retry_base_seconds).
- Da chia nhom loi va map message ro rang: invalid_key, quota, timeout, unknown.
- Da bo sung logging cho embed_documents theo batch: batch start, batch success, retry warning.
- Da giu co che batch embedding theo EMBEDDING_BATCH_SIZE.
- Da bo sung test cho retry timeout, non-retry invalid key, va logging batch.
- Test pass: 14 passed (gemini + factory).
- Smoke runtime voi Gemini API that: OK, vector_dim=3072.
