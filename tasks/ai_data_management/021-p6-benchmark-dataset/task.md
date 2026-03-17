# TASK 021 - Tao Benchmark Dataset

## Phase

phase6

## Muc tieu

Chuan bi bo cau hoi va ground truth de danh gia retrieval.

## Cong viec can lam

1. Tao query set cho policy cong dung san pham.
2. Gan ground truth document chunk.
3. Luu dataset benchmark co version.

## Dau ra mong doi

Co bo du lieu benchmark de chay AB test.

## DoD

- [x] Dataset co dai dien cho use case that.
- [x] Ground truth duoc review.
- [x] Co tai lieu cach su dung dataset.

## Ket qua thuc hien

- Da tao dataset versioned tai tasks/ai_data_management/021-p6-benchmark-dataset/dataset/benchmark_dataset_v1.json.
- Dataset gom 11 documents va 18 queries, cover policy + cong dung + bao quan den da muoi.
- Da gan ground_truth_doc_ids cho tung query de phuc vu Recall/MRR.
- Da bo sung tai lieu su dung va versioning:
  - tasks/ai_data_management/021-p6-benchmark-dataset/dataset/README.md
  - tasks/ai_data_management/021-p6-benchmark-dataset/dataset/CHANGELOG.md
