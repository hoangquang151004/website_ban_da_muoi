# TASK PLAN - Module Quan Ly Du Lieu AI voi Gemini Embedding 2
Ngay cap nhat: 2026-03-14

---

## 1. Muc tieu

Xay dung module quan ly du lieu AI cho Admin de:

- Tai len va quan ly nguon du lieu van ban.
- Nhung van ban bang Gemini Embedding 2.
- Luu vector vao ChromaDB va truy van cho RAG chatbot.
- Theo doi tien trinh index, re-index, va quan ly loi indexing.

Muc tieu cuoi: chat/knowledge va chat tong hop su dung du lieu moi da vector hoa, truy vet duoc nguon tra loi.

---

## 2. Pham vi

### Trong pham vi

- Backend embedding provider abstraction + Gemini Embedding 2 integration.
- Pipeline parse -> chunk -> embed -> upsert Chroma.
- API Admin quan ly nguon du lieu va job indexing.
- UI Admin Data ket noi API that (khong con hardcode danh sach).
- Danh gia chat luong retrieval giua baseline va Gemini.

### Ngoai pham vi

- Crawl du lieu website (tam thoi khong trien khai).
- Thay doi luong checkout/order hien tai.

---

## 3. Hien trang codebase (de tai su dung)

- Vector store da co: `backend/app/services/ai_agent/vector_store.py`.
- Script seed da co: `backend/scripts/seed_vector_store.py`.
- Chat endpoints da co: `backend/app/routers/chat.py`.
- Config da co bien Gemini API key: `backend/app/core/config.py` (`GOOGLE_API_KEY`).
- Trang Admin Data da co UI co ban: `frontend/src/app/admin/data/page.tsx`.

---

## 4. Kien truc module de xuat

### 4.1 Thanh phan chinh

1. Data Source Manager
- Quan ly metadata nguon du lieu (ten, loai, kich thuoc, hash, trang thai).

2. Ingestion Worker
- Parse file -> chunk text -> embed -> upsert Chroma.

3. Embedding Provider Layer
- Chuyen doi provider bang config (`baseline`, `gemini`).

4. Retrieval Layer
- Dung chung vector store cho RAG chain.

### 4.2 Metadata chuan cho moi chunk

- `source_id`
- `source_name`
- `category`
- `chunk_index`
- `text_hash`
- `version`
- `created_at`

### 4.3 Nguyen tac index

- Idempotent theo `source_id + chunk_index + version`.
- Re-index tang `version`.
- Ho tro soft delete nguon du lieu.

---

## 5. Ke hoach trien khai chi tiet theo giai doan

## Giai doan 1 - Chuan hoa Embedding Layer (1 ngay)

Muc tieu: tach logic embedding khoi vector store de de thay provider.

Cong viec:
- Tao abstraction embedding provider (factory/service).
- Them env config:
  - `EMBEDDING_PROVIDER=baseline|gemini`
  - `EMBEDDING_MODEL=<model_name>`
  - `EMBEDDING_BATCH_SIZE=...`
- Giu backward compatibility voi luong hien tai.

Deliverables:
- Module provider moi trong `backend/app/services/ai_agent/`.
- `vector_store.py` dung provider abstraction.

DoD:
- Chuyen provider bang env ma khong sua business logic.

## Giai doan 2 - Tich hop Gemini Embedding 2 (1 ngay)

Muc tieu: nhung du lieu bang Gemini Embedding 2 o backend.

Cong viec:
- Implement `GeminiEmbeddingProvider`.
- Batch embedding + retry exponential backoff.
- Chuan hoa loi: invalid key, quota, timeout.

Deliverables:
- Provider Gemini hoat dong trong local env.

DoD:
- Embedding thanh cong tap van ban mau va upsert vao Chroma.

## Giai doan 3 - API quan ly nguon du lieu admin (2 ngay)

Muc tieu: tao REST API cho module quan ly du lieu.

Cong viec:
- Tao bang DB:
  - `data_sources`
  - `data_chunks` (metadata)
  - `index_jobs`
- Tao admin APIs:
  - `POST /api/v1/admin/data-sources/upload`
  - `GET /api/v1/admin/data-sources`
  - `POST /api/v1/admin/data-sources/{id}/reindex`
  - `DELETE /api/v1/admin/data-sources/{id}`
  - `GET /api/v1/admin/data-sources/jobs/{job_id}`
- Bat buoc auth + role admin.

Deliverables:
- Router + service + schema cho data management.

DoD:
- Upload file va truy van danh sach nguon du lieu qua API thanh cong.

## Giai doan 4 - Ingestion worker va job progress (1-2 ngay)

Muc tieu: xu ly indexing nen, khong block request.

Cong viec:
- Tao worker/job executor cho ingestion pipeline.
- Cap nhat progress theo % cho tung job.
- Log theo tung buoc parse/chunk/embed/upsert.

Deliverables:
- Job state machine: `queued -> processing -> indexed|failed`.

DoD:
- File lon van xu ly duoc, API upload tra ve ngay voi `job_id`.

## Giai doan 5 - Ket noi frontend Admin Data voi API that (1-2 ngay)

Muc tieu: thay toan bo mock/hardcode bang du lieu tu backend.

Cong viec:
- Tao `adminDataService.ts` o frontend.
- Bang du lieu lay tu API danh sach data source.
- Nguoi dung chon file va upload that.
- Nguoi dung bam sync de re-index.
- Polling trang thai job de cap nhat progress/status.

Deliverables:
- `frontend/src/app/admin/data/page.tsx` dung du lieu that.

DoD:
- UI hien thi dung trang thai `processing/indexed/failed` theo backend.

## Giai doan 6 - Benchmark va quyet dinh rollout (2 ngay)

Muc tieu: danh gia Gemini Embedding 2 so voi baseline.

Cong viec:
- Tao bo cau hoi test retrieval (policy, cong dung, san pham).
- Do metrics:
  - Recall@5
  - MRR@10
  - Ty le cau tra loi co nguon dung
  - Latency p50/p95
  - Chi phi uoc tinh
- Chay A/B benchmark (baseline vs gemini).

Deliverables:
- Bao cao ket qua benchmark + de xuat rollout.

DoD:
- Co ket luan ro rang: chuyen sang Gemini toan phan hay hybrid.

---

## 6. API contract de xuat cho module Data Management

### 6.1 Upload source

`POST /api/v1/admin/data-sources/upload`

Request:
- multipart/form-data (`file`, `category?`, `tags?`)

Response:
```json
{
  "source_id": "src_123",
  "job_id": "job_456",
  "status": "queued"
}
```

### 6.2 List sources

`GET /api/v1/admin/data-sources?page=1&limit=20&status=indexed`

Response:
```json
{
  "items": [
    {
      "id": "src_123",
      "name": "chinh-sach-bao-hanh.pdf",
      "type": "pdf",
      "status": "indexed",
      "created_at": "2026-03-14T10:00:00Z",
      "chunks": 42
    }
  ],
  "total": 1
}
```

### 6.3 Re-index source

`POST /api/v1/admin/data-sources/{id}/reindex`

Response:
```json
{
  "job_id": "job_789",
  "status": "queued"
}
```

### 6.4 Delete source

`DELETE /api/v1/admin/data-sources/{id}`

Response:
```json
{
  "deleted": true
}
```

### 6.5 Job status

`GET /api/v1/admin/data-sources/jobs/{job_id}`

Response:
```json
{
  "job_id": "job_456",
  "status": "processing",
  "progress": 65,
  "error": null
}
```

---

## 7. Thong so khoi tao khuyen nghi

- Chunk size: 600-900 tokens.
- Chunk overlap: 80-120 tokens.
- Top-k retrieval: 5.
- Embedding batch size: 16-64 (theo quota).
- Filter retrieval theo `category` cho cac nhom query policy/san pham.

---

## 8. Rui ro va cach giam thieu

1. Rate limit/Quota Gemini
- Queue + retry backoff + gioi han concurrency.

2. Chi phi embedding tang nhanh
- Cache theo `text_hash`, khong embed lai noi dung trung.

3. Lech metadata giua DB va Chroma
- Versioning + idempotent ids + soft delete.

4. Sai retrieval tieng Viet do chunking
- Chunk theo paragraph/sentence boundary, khong cat giua cau.

---

## 9. Ke hoach kiem thu

### Unit test
- Parser cho txt/md/pdf/docx/csv.
- Chunker behavior.
- Gemini provider (mock API response + error handling).

### Integration test
- Upload -> indexing -> retrieval co source.
- Re-index -> version tang dung.
- Delete source -> khong con retrieval.

### E2E
- Admin upload file o UI.
- Theo doi progress.
- Chatbot tra loi co trich dan tu file vua index.

---

## 10. Moc thoi gian de xuat (7-10 ngay lam viec)

1. Ngay 1-2: Giai doan 1-2.
2. Ngay 3-5: Giai doan 3-4.
3. Ngay 6-7: Giai doan 5.
4. Ngay 8-10: Giai doan 6 + hardening.

---

## 11. Checklist DoD tong

- [ ] Co the upload nguon du lieu tu trang Admin Data.
- [ ] Nguon du lieu duoc index bang Gemini Embedding 2.
- [ ] ChromaDB luu chunk + metadata day du, truy vet nguon duoc.
- [ ] Chatbot tra loi su dung context moi.
- [ ] Co benchmark so sanh baseline va Gemini.
- [ ] Co quyet dinh rollout dua tren metrics va chi phi.
