# Hướng dẫn Chạy Dự án — Đèn Đá Muối Himalaya

Dự án gồm hai phần độc lập:

- **Backend**: FastAPI + MySQL + Alembic (thư mục `backend/`)
- **Frontend**: Next.js 16 (thư mục `frontend/`)

---

## Yêu cầu Hệ thống

| Công cụ | Phiên bản khuyến nghị |
| ------- | --------------------- |
| Python  | 3.11+                 |
| Node.js | 18+                   |
| MySQL   | 8.0+                  |
| npm     | 9+                    |

---

## 1. Chuẩn bị Cơ sở Dữ liệu (MySQL)

1. Khởi động MySQL Server.
2. Tạo database:

```sql
CREATE DATABASE da_muoi_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

---

## 2. Chạy Backend (FastAPI)

### 2.1. Tạo và kích hoạt virtual environment

```powershell
cd backend
python -m venv venv
.\venv\Scripts\activate
```

### 2.2. Cài đặt dependencies

```powershell
pip install -r requirements.txt
```

### 2.3. Tạo file cấu hình `.env`

Tạo file `backend/.env` với nội dung sau (chỉnh sửa cho phù hợp với môi trường của bạn):

```env
# Database
DATABASE_URL=mysql+aiomysql://root:password@localhost:3306/da_muoi_db

# JWT
SECRET_KEY=your-super-secret-key-change-this

# AI / LLM (tuỳ chọn, cần nếu dùng tính năng chatbot)
OPENAI_API_KEY=sk-...

# Vector DB
CHROMA_DB_PATH=./chroma_db
```

> **Lưu ý:** `SECRET_KEY` nên là một chuỗi ngẫu nhiên dài, an toàn trong môi trường production.

### 2.4. Chạy Migration (tạo bảng trong database)

```powershell
# Đảm bảo đang ở thư mục backend/ và venv đã được kích hoạt
alembic upgrade head
```

### 2.5. Khởi động server

```powershell
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend sẽ chạy tại: **http://localhost:8000**

- Swagger UI (API docs): http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

---

## 3. Chạy Frontend (Next.js)

### 3.1. Cài đặt dependencies

```powershell
cd frontend
npm install
```

### 3.2. Tạo file cấu hình `.env.local`

Tạo file `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

### 3.3. Khởi động server phát triển

```powershell
npm run dev
```

Frontend sẽ chạy tại: **http://localhost:3000**

---

## 4. Tóm tắt — Khởi động nhanh

Mở **hai terminal riêng biệt**:

**Terminal 1 — Backend:**

```powershell
cd backend
.\venv\Scripts\activate
uvicorn app.main:app --reload --port 8000
```

**Terminal 2 — Frontend:**

```powershell
cd frontend
npm run dev
```

---

## 5. Cấu trúc URL

| Service             | URL                         |
| ------------------- | --------------------------- |
| Frontend (cửa hàng) | http://localhost:3000       |
| Frontend (admin)    | http://localhost:3000/admin |
| Backend API         | http://localhost:8000       |
| API Documentation   | http://localhost:8000/docs  |

---

## 6. Ghi chú Thêm

- **Lần đầu chạy:** Bắt buộc phải chạy `alembic upgrade head` để tạo đầy đủ các bảng trong database trước khi khởi động backend.
- **Tính năng AI Chatbot:** Yêu cầu cung cấp `OPENAI_API_KEY` hợp lệ trong file `.env`.
- **CORS:** Backend đã được cấu hình cho phép request từ `http://localhost:3000`. Nếu đổi port frontend, cần cập nhật `CORS_ORIGINS` trong `backend/app/core/config.py`.
- **Alembic (tạo migration mới khi thay đổi models):**
  ```powershell
  alembic revision --autogenerate -m "mô tả thay đổi"
  alembic upgrade head
  ```
