# TASK 001 - Tao EmbeddingProvider interface

## Phase

phase1

## Muc tieu

Tao interface chuan cho provider embedding.

## Cong viec can lam

1. Tao interface EmbeddingProvider voi 2 ham embed_documents va embed_query.
2. Chuan hoa kieu du lieu dau vao dau ra.
3. Them ghi chu ky thuat cho contract su dung.

## Dau ra mong doi

Co contract embedding dung chung cho moi provider.

## DoD

- [x] Interface compile pass.
- [x] Khong pha vo code cu.
- [x] Co test don gian cho contract neu can.

## Ket qua thuc hien

- Da them EmbeddingProvider contract tai backend/app/services/ai_agent/embeddings/provider.py.
- Da them package export tai backend/app/services/ai_agent/embeddings/**init**.py va backend/app/services/ai_agent/**init**.py.
- Da them unit test backend/tests/test_embedding_provider_contract.py.
- Da chay test: 2 passed.
