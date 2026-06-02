# Cấu Trúc Thư Mục Dự Án - Website Bán Đá Muối

Dưới đây là tổng quan về cấu trúc các thư mục và file chính của dự án, được chia thành các phân hệ Frontend, Backend, UI tĩnh và Tài liệu:

## 1. Các File & Thư Mục Gốc (Root)

- **`UI/`**: Chứa các file mẫu giao diện (HTML/CSS) tĩnh được phân chia theo từng trang và chức năng cụ thể (ví dụ: `home`, `admin_general`, `cart_checkout`, `login`...).
- **`tasks/`**: Thư mục quản lý tiến độ, chứa tài liệu chia nhỏ các công việc (tasks) theo các giai đoạn (từ `phase1` đến `phase6`) của toàn bộ dự án và ai/data tasks.
- **`docs/`**: Chứa các tài liệu kỹ thuật cơ bản của dự án (`mo_ta_du_an.md`).
- **`AGENTS.md`, `Bao_Cao_Phan_Tich_Chuc_Nang.md`, `phan_tich_du_an.md`**: Các tài liệu thiết kế hệ thống, phân tích yêu cầu chức năng, và định cấu hình cho các hệ thống Agent/AI.

## 2. Thư mục Backend (`/backend`)

Được xây dựng bằng **Python**, sử dụng các framework như **FastAPI**, **SQLAlchemy**, tích hợp AI (Gemini/ChromaDB).

- **`app/`**: Nơi chứa mã nguồn chính của ứng dụng backend.
  - `core/`: Các cấu hình cốt lõi của hệ thống (bảo mật, config môi trường, JWT, ...).
  - `db/`: Quản lý kết nối cơ sở dữ liệu và session.
  - `models/`: Định nghĩa các Entity Database Model (SQLAlchemy).
  - `routers/`: Controller phân luồng và định nghĩa các Web API endpoints.
  - `schemas/`: Các Pydantic classes thực hiện validate dữ liệu request và response.
  - `services/`: Nơi chứa business logic, xử lý dữ liệu (CRUD, thanh toán VNPAY, v.v.).
  - `utils/`: Các script và functions tiện ích độc lập giúp tái sử dụng mã (helpers).
- **`alembic/` & `alembic.ini`**: Công cụ quản lý di trú cơ sở dữ liệu (Database Migration - versions).
- **`chroma_db/`**: Thư mục lưu trữ CSDL Vector cục bộ (ChromaDB) được AI đọc/ghi.
- **`sample_data/`**: Lưu trữ các file mẫu `.txt`, `.md` để huấn luyện/nhúng dữ liệu vào vector store cho chatbot.
- **`scripts/`**: Các script hỗ trợ tự động hóa dùng để benchmark, seeding data (đẩy dữ liệu mẫu), insert vào database.
- **`tests/`**: Các file integration và unit test chạy bằng `pytest` dành riêng cho hệ thống backend.
- **`tasks/`**: Các task quản lý việc xây dựng module backend (API, Database, AI...).

## 3. Thư mục Frontend (`/frontend`)

Được xây dựng bằng **Next.js**, **React** và **TypeScript**.

- **`src/`**: Thư mục chứa mã nguồn chính của Next.js ứng dụng.
  - `app/`: Thư mục điều hướng chính theo Next.js App Router (chứa các file `page.tsx`, `layout.tsx` thiết lập routing cho các trang web và admin dashboard).
  - `components/`: Các React Components chia nhỏ (UI, Layouts, Buttons, Table...) có thể được tái sử dụng qua các trang.
  - `lib/`: Các thư viện tiện ích dùng chung hoặc config third-party clients (Axios, Utils).
  - `services/`: Tầng giao tiếp (Call API) tương tác với hệ thống Backend.
  - `store/`: Tầng quản lý trạng thái/state toàn cục ứng dụng (VD: Redux, Zustand).
  - `types/`: Chứa các tệp khai báo TypeScript types/interfaces cho các models, prop types toàn cục.
- **`public/`**: Thư mục chứa nội dung tĩnh như hình ảnh, manifest, font chữ và các file 3d (`models/`). Không thông qua webpack.
- **`tasks/`**: Các tiến độ xây dựng UI, config Routing và call API của phần frontend.
- `next.config.ts`, `package.json`, `eslint.config.mjs`, `tsconfig.json`: File cấu hình nền tảng, thiết lập package dependencies, typing, và routing cho Next.js project.

## 4. Cây Thư Mục Chi Tiết (File Tree)

### Backend

```text
backend/
├── alembic/                      # Cấu hình và các file migrate của Alembic cho SQLAlchemy
│   ├── versions/                 # Các version scripts di trú DB
│   ├── env.py
│   └── script.py.mako
├── app/                          # Source code chính của backend
│   ├── core/                     # Chứa cấu hình cốt lõi (config, settings, security)
│   ├── db/                       # Khởi tạo connect database
│   ├── models/                   # SQLAlchemy ORM models
│   ├── routers/                  # Khai báo các API routes / endpoints (FastAPI)
│   ├── schemas/                  # Pydantic schemas cho logic validate I/O
│   ├── services/                 # Business logic, các hàm xử lý dữ liệu và AI
│   ├── utils/                    # Các utilities/helpers functions dùng chung
│   ├── __init__.py
│   └── main.py                   # File entrypoint khởi chạy FastAPI app
├── chroma_db/                    # Thư mục lưu trữ database vector nhúng cục bộ (ChromaDB)
│   ├── a1f0b3e1-0766-.../
│   └── chroma.sqlite3
├── static/
│   └── uploads/                  # Nơi lưu trữ ảnh, media public
├── alembic.ini                   # Cấu hình alembic DB migration
├── pytest.ini                    # Thuộc tính tự động cấu hình Pytest
└── requirements.txt              # Danh sách thư viện Python
frontend/
├── public/                       # Nơi lưu trữ ảnh, font, raw resources
│   └── models/                   # Nơi chứa các file 3D model (nếu có sử dụng)
├── src/                          # Source code chính của ứng dụng Next.js
│   ├── app/                      # Nơi định nghĩa App routes: trang chính, layout, pages
│   ├── components/               # Chứa các component độc lập tái sử dụng (Header, Button...)
│   ├── lib/                      # Các hàm tiện ích, cấu hình constants
│   ├── services/                 # Cấu hình gọi API sang backend
│   ├── store/                    # File dùng cho State Management (Zustand/Redux...)
│   ├── types/                    # Nơi định nghĩa các Type/Interface cho TypeScript
│   └── proxy.ts                  # Middleware hoặc API proxy (tuỳ dự án)
├── eslint.config.mjs             # Config quy chuẩn code ESLint
├── next.config.ts                # File cấu hình Next.js (chạy port, proxy, url...)
├── package.json                  # Chứa danh sách dependencies frontend (React, Nextjs, Tailwind...)
├── postcss.config.mjs            # Cấu hình tool biên dịch CSS (chủ yếu cho Tailwind)
└── tsconfig.json                 # Cài đặt trình biên dịch code cho TypeScript
o                        # File build Docker
```
