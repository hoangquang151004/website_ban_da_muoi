# Benchmark Dataset v1

Muc dich

- Danh gia retrieval cho chatbot tren 2 nhom use case chinh: policy CSKH va kien thuc san pham.

File

- benchmark_dataset_v1.json

Schema tom tat

- version: phien ban dataset
- documents: corpus tai lieu benchmark
- queries: tap truy van va ground truth

Document fields

- doc_id: id duy nhat
- category: policy | health | fengshui | care
- title: tieu de
- content: noi dung de index

Query fields

- query_id: id truy van
- query: cau hoi benchmark
- ground_truth_doc_ids: danh sach doc_id dung

Cach su dung

1. Dung script metric: backend/scripts/benchmark_retrieval_metrics.py
2. Truyen duong dan dataset nay voi --dataset
3. Chay cho tung provider baseline/gemini de lay Recall@5 va MRR@10

Nguyen tac review ground truth

- Moi query can co it nhat 1 ground truth doc_id.
- Neu query co nhieu y, co the gan nhieu doc_id.
- Khi chinh sua noi dung policy trong he thong, can cap nhat dataset va tang version.
