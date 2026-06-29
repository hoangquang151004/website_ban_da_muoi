Mở **hai terminal riêng biệt**:

**Terminal 1 — Backend:**
./.venv/Scripts/activate
cd backend
uvicorn app.main:app --reload --port 8000

**Terminal 2 — Frontend:**
cd frontend
npm run dev

## LLM config (.env) — OpenCode Zen

Chatbot và intent dùng LLM qua endpoint OpenAI-compatible (OpenCode Zen):

LLM_PROVIDER=opencode
LLM_BASE_URL=https://opencode.ai/zen/v1
LLM_API_KEY=your_api_key
LLM_MODEL=deepseek-v4-flash-free

Rollback HuggingFace Router: `LLM_PROVIDER=huggingface`, `HF_TOKEN=...`, `LLM_MODEL=openai/gpt-oss-120b:groq`.

Sau khi doi .env, restart uvicorn. Thu nhanh: `python huggiface_api.py` (doc tu `backend/.env`).

## Logging config (.env)

Dat cac bien sau trong file `backend/.env` de theo doi log backend FastAPI:

LOG_LEVEL=INFO
LOG_SLOW_REQUEST_MS=1000

Giai thich:

- `LOG_LEVEL`: muc log tong (`DEBUG`, `INFO`, `WARNING`, `ERROR`).
- `LOG_SLOW_REQUEST_MS`: neu request chay cham hon nguong nay (ms), backend se ghi `slow_request` o muc `WARNING`.

Moi request se co `request_id` va backend tra ve header `X-Request-ID` de trace loi giua client va server.

## Chat streaming (SSE)

Backend (trong `backend/.env`):

CHAT_STREAM_ENABLED=true

Frontend (tùy chọn, mặc định bật):

NEXT_PUBLIC_CHAT_STREAM=true

- API stream: `POST /api/v1/chat/stream` — body JSON giống `POST /api/v1/chat`, response `text/event-stream` với các event `status`, `token`, `done`.
- API cũ `POST /api/v1/chat` vẫn dùng được (fallback khi stream lỗi).
- Chatbot hiển thị chữ dần khi nhận `token`; product cards / stats / đơn hàng gắn sau event `done`.

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

## MoMo config (.env)

Dat them cac bien sau trong file backend/.env de bat thanh toan MoMo:

MOMO_PARTNER_CODE=your_partner_code
MOMO_ACCESS_KEY=your_access_key
MOMO_SECRET_KEY=your_secret_key
MOMO_ENDPOINT=https://test-payment.momo.vn/v2/gateway/api/create
MOMO_RETURN_URL=http://localhost:8000/api/v1/payments/momo/return
MOMO_IPN_URL=http://localhost:8000/api/v1/payments/momo/ipn
FRONTEND_URL=http://localhost:3000

Luu y:

- MOMO_RETURN_URL la endpoint **backend** (khong dat URL frontend). Sau khi MoMo goi ve, backend redirect nguoi dung den `FRONTEND_URL/checkout/payment-result`.
- MOMO_IPN_URL (hoac MOMO_NOTIFY_URL) phai trung route `POST /api/v1/payments/momo/ipn`.
- Khi test local, can URL public (ngrok) cho ca RETURN va IPN vi MoMo goi tu internet.
- Dang ky IPN URL tren MoMo Developer Portal trung voi MOMO_IPN_URL.
- `MOMO_REQUEST_TYPE=payWithATM`: khach nhap so the/tai khoan ngan hang tren trang MoMo (khong quet QR).
- `MOMO_REQUEST_TYPE=captureWallet`: thanh toan quet ma QR vi MoMo (neu can doi lai).
- Kenh ATM can duoc MoMo kich hoat cho tai khoan merchant (Partner Portal).
- Chay migration: `alembic upgrade head` (them gia tri payment_method `vnpay`, `momo`).

## Benchmark va AB test (Phase 6)

Chay tu thu muc backend:

d:/web_ban_da_muoi/.venv/Scripts/python.exe scripts/benchmark_retrieval_metrics.py --provider baseline --rebuild-index
d:/web_ban_da_muoi/.venv/Scripts/python.exe scripts/benchmark_retrieval_metrics.py --provider gemini --rebuild-index
d:/web_ban_da_muoi/.venv/Scripts/python.exe scripts/benchmark_latency_cost_abtest.py --providers baseline gemini --rebuild-index

Ket qua duoc ghi tai:

- tasks/ai_data_management/022-p6-metrics-scripts/results/
- tasks/ai_data_management/023-p6-latency-cost-abtest/results/
- tasks/ai_data_management/024-p6-rollout-report-crosscutting/results/

# tài khoản admin

admin@gmail.com
quang123


# Thanh toán bằng momo

Thông tin thẻ test (ATM) để kiểm tra luồng thanh toán MoMo:

| No  | Tên          | Số thẻ              | Hạn ghi trên thẻ | OTP | Trường hợp test     |
| --- | ------------ | ------------------- | ---------------- | --- | ------------------- |
| 1   | NGUYEN VAN A | 9704 0000 0000 0018 | 03/07            | OTP | Thành công          |
| 2   | NGUYEN VAN A | 9704 0000 0000 0026 | 03/07            | OTP | Thẻ bị khóa         |
| 3   | NGUYEN VAN A | 9704 0000 0000 0034 | 03/07            | OTP | Nguồn tiền không đủ |
| 4   | NGUYEN VAN A | 9704 0000 0000 0042 | 03/07            | OTP | Hạn mức thẻ         |