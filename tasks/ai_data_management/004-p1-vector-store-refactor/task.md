# TASK 004 - Refactor Vector Store dung Provider Abstraction

## Phase

phase1

## Muc tieu

Tach vector store khoi provider cu the va giu backward compatibility.

## Cong viec can lam

1. Refactor vector_store de nhan provider tu factory.
2. Dam bao default provider la baseline.
3. Kiem tra luong chat retrieval hien tai.

## Dau ra mong doi

Vector store su dung provider abstraction, luong cu van chay.

## DoD

- [x] Khong can sua logic nghiep vu khac de switch provider.
- [x] Regression test retrieval pass.
- [x] Khong sinh loi runtime moi.

## Ket qua thuc hien

- Vector store da dung provider abstraction thong qua factory (khong con phu thuoc provider cu the).
- Da bo sung test unit cho vector store abstraction tai backend/tests/test_vector_store_provider_abstraction.py.
- Da chay regression test embedding + vector store abstraction: 11 passed.
- Da chay regression test backend AI agent non-integration: 51 passed, 20 deselected.
