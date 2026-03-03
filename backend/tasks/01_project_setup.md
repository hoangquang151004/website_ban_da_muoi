# Nhóm 1: Cấu trúc Project & Thiết lập ban đầu

Mục tiêu chung: Xây dựng nền móng Backend — tạo cấu trúc thư mục chuẩn, cấu hình FastAPI, kết nối Database và thiết lập môi trường phát triển.

---

## Các Task

- [x] Khởi tạo cấu trúc thư mục Backend chuẩn
  - **Mục tiêu**: Tổ chức thư mục theo mô hình phân tầng (Router → Service → Repository) đảm bảo tách biệt trách nhiệm.
  - **Cấu trúc mong muốn**:
    ```
    backend/
    ├── app/
    │   ├── main.py                  # Entry point FastAPI
    │   ├── core/
    │   │   ├── config.py            # Settings / biến môi trường
    │   │   ├── security.py          # JWT helpers
    │   │   └── dependencies.py      # Dependency Injection chung (get_db, get_current_user)
    │   ├── db/
    │   │   ├── base.py              # Base SQLAlchemy declarative
    │   │   └── session.py           # Engine + SessionLocal
    │   ├── models/                  # SQLAlchemy ORM models
    │   ├── schemas/                 # Pydantic request/response schemas
    │   ├── routers/                 # FastAPI APIRouter cho từng resource
    │   ├── services/
    │   │   ├── crud/                # CRUD logic thuần túy (giao tiếp DB)
    │   │   └── ai_agent/            # Toàn bộ logic AI (RAG, Agent, LLM)
    │   └── utils/                   # Hàm tiện ích dùng chung
    ├── alembic/                     # Database migrations
    ├── tests/                       # Unit & Integration tests
    ├── .env                         # Biến môi trường (không commit)
    ├── .env.example                 # Template biến môi trường
    ├── requirements.txt
    └── Dockerfile
    ```
  - **Output**: Toàn bộ thư mục và file `__init__.py` tương ứng.
  - **DoD**: `python -m app.main` chạy không lỗi import.

- [x] Cấu hình biến môi trường & Settings
  - **Mục tiêu**: Tập trung mọi config vào một nơi, đọc từ `.env` qua Pydantic `BaseSettings`.
  - **Các biến cần có**:
    - `DATABASE_URL` (MySQL connection string)
    - `SECRET_KEY`, `ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES` (JWT)
    - `OPENAI_API_KEY` (hoặc key của LLM provider đang dùng)
    - `CHROMA_DB_PATH` (đường dẫn lưu ChromaDB local)
    - `CORS_ORIGINS` (danh sách origin cho phép)
  - **Output**: `app/core/config.py` sử dụng `pydantic-settings`.
  - **DoD**: `settings.DATABASE_URL` đọc đúng từ file `.env`.

- [x] Khởi tạo FastAPI app & Cấu hình CORS
  - **Mục tiêu**: Tạo app instance, gắn CORS Middleware, đăng ký tất cả Router, tạo endpoint `GET /health` để kiểm tra server sống.
  - **Output**: `app/main.py` hoàn chỉnh.
  - **DoD**: `GET /health` trả về `{"status": "ok"}`. Frontend `localhost:3000` gọi API không bị CORS error.

- [x] Kết nối Database (MySQL) & Alembic Migration
  - **Mục tiêu**: Tạo engine SQLAlchemy, Session factory, và cấu hình Alembic để quản lý schema migrations.
  - **Output**: `app/db/session.py`, `alembic.ini`, `alembic/env.py`.
  - **DoD**: Chạy `alembic upgrade head` thành công tạo bảng trên MySQL. Không có lỗi kết nối.

- [x] Thiết lập Response Format chuẩn
  - **Mục tiêu**: Định nghĩa format response thống nhất cho toàn bộ API theo quy tắc trong `PROJECT_CONTEXT.md`.
  - **Format**: `{ "status": "success/error", "data": {...}, "message": "..." }`
  - **Output**: Pydantic generic schema `BaseResponse[T]` trong `app/schemas/base.py` và `HTTPException` handler trả cùng format.
  - **DoD**: Mọi endpoint đều trả về đúng format trên, kể cả khi có lỗi validation (422).
