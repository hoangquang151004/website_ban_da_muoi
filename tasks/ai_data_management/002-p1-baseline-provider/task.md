# TASK 002 - Tach BaselineEmbeddingProvider

## Phase

phase1

## Muc tieu

Boc tach logic embedding hien tai thanh provider rieng.

## Cong viec can lam

1. Tao BaselineEmbeddingProvider theo interface moi.
2. Di chuyen logic embedding cu vao provider.
3. Dam bao ket qua embedding khong doi.

## Dau ra mong doi

Provider baseline hoat dong tuong duong luong cu.

## DoD

- [x] Chay duoc local.
- [x] Ket qua embedding baseline khong regression.
- [x] Code co the tai su dung.

## Ket qua thuc hien

- Da them BaselineEmbeddingProvider tai backend/app/services/ai_agent/embeddings/baseline.py.
- Da export provider trong backend/app/services/ai_agent/embeddings/**init**.py.
- Da refactor vector_store de su dung BaselineEmbeddingProvider va giu hanh vi cu.
- Da them unit test backend/tests/test_baseline_embedding_provider.py.
- Da chay test: 4 passed (gom test contract va baseline provider).
