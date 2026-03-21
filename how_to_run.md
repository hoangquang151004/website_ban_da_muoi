Mở **hai terminal riêng biệt**:

**Terminal 1 — Backend:**
./.venv/Scripts/activate
cd backend
uvicorn app.main:app --reload --port 8000

**Terminal 2 — Frontend:**
cd frontend
npm run dev

## Embedding Provider Config (.env)

Dat cac bien sau trong file .env (thu muc backend):

EMBEDDING_PROVIDER=baseline
EMBEDDING_MODEL=
EMBEDDING_BATCH_SIZE=32

Gia tri ho tro cho EMBEDDING_PROVIDER:

- baseline
- gemini

Vi du dung Gemini embeddings:

EMBEDDING_PROVIDER=gemini
EMBEDDING_MODEL=models/gemini-embedding-2-preview
EMBEDDING_BATCH_SIZE=32
GOOGLE_API_KEY=your_google_api_key

Neu config provider khong hop le hoac Gemini khong khoi tao duoc, he thong se fallback ve baseline.

## VNPay config (.env)

Dat them cac bien sau trong file backend/.env de bat thanh toan VNPay:

VNPAY_TMN_CODE=your_vnpay_tmn_code
VNPAY_HASH_SECRET=your_vnpay_hash_secret
VNPAY_PAYMENT_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=http://localhost:8000/api/v1/payments/vnpay/return
FRONTEND_URL=http://localhost:3000

Luu y:

- VNPAY_RETURN_URL phai trung voi URL callback da khai bao tren merchant VNPay.
- FRONTEND_URL dung de redirect nguoi dung ve trang ket qua thanh toan tren frontend.

## Benchmark va AB test (Phase 6)

Chay tu thu muc backend:

d:/web_ban_da_muoi/.venv/Scripts/python.exe scripts/benchmark_retrieval_metrics.py --provider baseline --rebuild-index
d:/web_ban_da_muoi/.venv/Scripts/python.exe scripts/benchmark_retrieval_metrics.py --provider gemini --rebuild-index
d:/web_ban_da_muoi/.venv/Scripts/python.exe scripts/benchmark_latency_cost_abtest.py --providers baseline gemini --rebuild-index

Ket qua duoc ghi tai:

- tasks/ai_data_management/022-p6-metrics-scripts/results/
- tasks/ai_data_management/023-p6-latency-cost-abtest/results/
- tasks/ai_data_management/024-p6-rollout-report-crosscutting/results/
