# Website Bán Đá Muối Himalaya

Nền tảng thương mại điện tử B2C hoàn chỉnh cho cửa hàng đèn đá muối Himalaya. Hệ thống phục vụ ba nhóm người dùng: khách vãng lai, khách hàng đã đăng ký và quản trị viên — với đầy đủ luồng mua sắm, quản lý kho, thống kê doanh thu và chatbot AI hỗ trợ khách hàng.

## Tính năng chính

### Khu vực công khai (Shop)

- Trang chủ, giới thiệu, liên hệ
- Danh sách và chi tiết sản phẩm (xem 3D model)
- Giỏ hàng, checkout và thanh toán (VNPay, MoMo)
- Chatbot AI tích hợp trên giao diện (streaming SSE)
- Đăng nhập / đăng ký

### Khu vực tài khoản (User Dashboard)

- Tổng quan tài khoản
- Quản lý hồ sơ cá nhân
- Theo dõi lịch sử và chi tiết đơn hàng
- Tải hóa đơn PDF

### Khu vực quản trị (Admin Dashboard)

- Tổng quan doanh thu và đơn hàng
- Quản lý sản phẩm, danh mục, kho hàng
- Xử lý đơn hàng và khách hàng
- Kiểm duyệt đánh giá
- Thống kê & xuất báo cáo
- Quản lý nguồn dữ liệu AI (embedding / vector index)

## Công nghệ sử dụng

| Thành phần | Công nghệ |
|------------|-----------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4, Zustand, Three.js |
| Backend | FastAPI, Python 3.11, SQLAlchemy, Alembic |
| Database | MySQL |
| AI / Chatbot | LangChain, LangGraph, ChromaDB, OpenCode Zen / Gemini |
| Thanh toán | VNPay, MoMo |
| Deploy | Docker (full-stack), Railway |

## Cấu trúc dự án

```text
web_ban_da_muoi/
├── backend/                 # API FastAPI
│   ├── app/
│   │   ├── routers/         # Auth, products, orders, payments, admin, chat
│   │   ├── services/        # CRUD, AI agent, payment gateways
│   │   ├── models/          # SQLAlchemy ORM
│   │   └── schemas/         # Pydantic request/response
│   ├── alembic/             # Database migrations
│   ├── tests/
│   └── requirements.txt
├── frontend/                # Next.js App Router
│   └── src/
│       ├── app/             # Routes: (shop), (auth), admin
│       ├── components/
│       ├── services/        # API client layer
│       └── store/           # Zustand (cart, auth)
├── UI/                      # Giao diện HTML tham chiếu ban đầu
├── Dockerfile               # Build full-stack (Next.js + FastAPI)
├── how_to_run.md            # Hướng dẫn chi tiết cấu hình .env
└── DEPLOY.md                # Hướng dẫn deploy Railway
```

## Yêu cầu hệ thống

- **Node.js** 20+
- **Python** 3.11+
- **MySQL** 8+
- **npm** hoặc tương đương

## Cài đặt

### 1. Clone repository

```bash
git clone <repository-url>
cd web_ban_da_muoi
```

### 2. Backend

```bash
# Tạo và kích hoạt virtual environment (Windows)
python -m venv .venv
.\.venv\Scripts\activate

# Cài dependencies
cd backend
pip install -r requirements.txt

# Sao chép và chỉnh sửa biến môi trường
copy .env.example .env
```

Tạo database MySQL và cập nhật `DATABASE_URL` trong `backend/.env`:

```env
DATABASE_URL=mysql+aiomysql://root:password@localhost:3306/da_muoi_db
```

Chạy migration:

```bash
alembic upgrade head
```

### 3. Frontend

```bash
cd frontend
npm install
```

## Chạy ứng dụng (Development)

Mở **hai terminal riêng biệt**:

**Terminal 1 — Backend** (cổng 8000):

```bash
.\.venv\Scripts\activate
cd backend
uvicorn app.main:app --reload --port 8000
```

**Terminal 2 — Frontend** (cổng 3000):

```bash
cd frontend
npm run dev
```

Truy cập:

| URL | Mô tả |
|-----|-------|
| http://localhost:3000 | Giao diện cửa hàng |
| http://localhost:8000/docs | Swagger API docs |
| http://localhost:8000/health | Health check |

## Cấu hình môi trường

Sao chép `backend/.env.example` thành `backend/.env` và điền các giá trị cần thiết. Các nhóm cấu hình quan trọng:

| Nhóm | Biến chính | Ghi chú |
|------|------------|---------|
| Database | `DATABASE_URL` | Bắt buộc |
| JWT | `SECRET_KEY` | Đổi trong production |
| LLM / Chatbot | `LLM_PROVIDER`, `LLM_API_KEY`, `LLM_MODEL` | Mặc định OpenCode Zen |
| Embedding | `EMBEDDING_PROVIDER`, `GOOGLE_API_KEY` | `baseline` hoặc `gemini` |
| VNPay | `VNPAY_TMN_CODE`, `VNPAY_HASH_SECRET` | Sandbox / production |
| MoMo | `MOMO_PARTNER_CODE`, `MOMO_ACCESS_KEY`, `MOMO_SECRET_KEY` | Cần URL public cho IPN khi test |
| Frontend | `FRONTEND_URL`, `CORS_ORIGINS` | Khớp origin frontend |

Chi tiết đầy đủ (logging, SSE streaming, thẻ test MoMo, benchmark AI): xem [`how_to_run.md`](how_to_run.md).

## API chính

Tất cả endpoint REST nằm dưới prefix `/api/v1`:

| Module | Prefix | Mô tả |
|--------|--------|-------|
| Auth | `/api/v1/auth` | Đăng nhập, đăng ký, JWT |
| Products | `/api/v1` | Sản phẩm, danh mục, đánh giá |
| Orders | `/api/v1/orders` | Đặt hàng, lịch sử |
| Payments | `/api/v1/payments` | VNPay, MoMo callback |
| Chat | `/api/v1/chat`, `/api/v1/chat/stream` | Chatbot AI (SSE) |
| Admin | `/api/v1/admin/*` | Quản trị (yêu cầu role admin) |

Response format thống nhất:

```json
{
  "status": "success",
  "data": { },
  "message": "..."
}
```

## Kiểm thử

Chạy test backend từ thư mục `backend`:

```bash
pytest
```

## Deploy

Dự án hỗ trợ deploy full-stack bằng Docker (Next.js + FastAPI trong một container). Hướng dẫn chi tiết deploy lên Railway: [`DEPLOY.md`](DEPLOY.md).

Test Docker local (Windows):

```powershell
docker build -t da-muoi .
docker run --env-file backend/.env -p 3000:3000 -e PORT=3000 da-muoi
```

## Tài khoản demo

| Vai trò | Email | Mật khẩu |
|---------|-------|----------|
| Admin | admin@gmail.com | quang123 |

> Chỉ dùng cho môi trường phát triển. Đổi mật khẩu trước khi deploy production.

## Tài liệu liên quan

- [`how_to_run.md`](how_to_run.md) — Cấu hình LLM, thanh toán, embedding, benchmark
- [`DEPLOY.md`](DEPLOY.md) — Deploy Docker / Railway
- [`AGENTS.md`](AGENTS.md) — Hướng dẫn cho AI agents phát triển dự án
- [`phan_tich_du_an.md`](phan_tich_du_an.md) — Phân tích chức năng theo module

## Giấy phép

Dự án nội bộ — vui lòng liên hệ chủ sở hữu repository để biết thêm chi tiết.


TÔI TỐT NGHIỆP RỒI CÓ THỂ LÀ SẼ KHÔNG CÒN UPDATE NÀO NỮA.
HÔM NÀY LÀ NGÀY 29/06/2026