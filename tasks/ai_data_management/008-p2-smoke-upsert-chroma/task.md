# TASK 008 - Smoke Test Embed va Upsert Chroma

## Phase

phase2

## Muc tieu

Xac nhan du lieu mau duoc embed va luu vao Chroma thanh cong.

## Cong viec can lam

1. Chuan bi tap van ban mau.
2. Chay embedding bang Gemini provider.
3. Upsert vao Chroma va truy van kiem tra.

## Dau ra mong doi

Co bang chung retrieval doc duoc du lieu moi.

## DoD

- [x] Upsert thanh cong khong loi.
- [x] Query tra ve ket qua co lien quan.
- [x] Co ghi lai log ket qua smoke test.

## Ket qua thuc hien

- Da tao script smoke: backend/scripts/smoke_gemini_upsert_chroma.py.
- Script da upsert 2 document mau bang Gemini embedding vao collection rieng: salt_lamp_knowledge_smoke_gemini.
- Da query kiem tra voi cau hoi van chuyen, ket qua top la tai lieu van chuyen (retrieval_ok=True).
- Da ghi log ket qua tai: tasks/ai_data_management/008-p2-smoke-upsert-chroma/smoke_result.md.

## Ghi chu ky thuat

- Collection mac dinh hien co dang dung vector dimension 384 (baseline). Gemini dimension 3072.
- Vi vay smoke test dung collection rieng de tranh loi dimension mismatch.
