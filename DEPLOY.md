# Deploy lên Railway (Docker full-stack)

Một container chạy **Next.js** (cổng `PORT` của Railway) và **FastAPI** (nội bộ `127.0.0.1:8000`). File build: [`Dockerfile`](Dockerfile) ở thư mục gốc repo.

## 1. Chuẩn bị repository

- Push code lên GitHub.
- Đảm bảo có [`Dockerfile`](Dockerfile), [`.dockerignore`](.dockerignore), [`scripts/docker-entrypoint.sh`](scripts/docker-entrypoint.sh).

## 2. Tạo project Railway

1. [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**.
2. Chọn repo → Railway build từ `Dockerfile` ở root.
3. **Settings** → **Networking** → **Generate Domain**.

## 3. MySQL

1. Trong project: **+ New** → **Database** → **MySQL**.
2. Trên service web app: **Variables** → **Add Reference** → `DATABASE_URL` từ MySQL.
3. Nếu URL bắt đầu bằng `mysql://`, đổi thành:

```text
mysql+aiomysql://USER:PASS@HOST:PORT/DATABASE
```

## 4. Biến môi trường (service web)

| Biến | Ví dụ / ghi chú |
|------|------------------|
| `SECRET_KEY` | Chuỗi random dài (bắt buộc) |
| `DEBUG` | `false` |
| `DATABASE_URL` | Reference MySQL (`mysql+aiomysql://...`) |
| `FRONTEND_URL` | `https://your-app.up.railway.app` |
| `BACKEND_URL` | Cùng URL (single-origin) |
| `CORS_ORIGINS` | `["https://your-app.up.railway.app"]` |
| `CHROMA_DB_PATH` | `/app/chroma_db` |
| `LLM_API_KEY`, `GOOGLE_API_KEY`, … | Theo `backend/.env.example` |
| `VNPAY_RETURN_URL` | `https://your-app.up.railway.app/api/v1/payments/vnpay/return` |
| `MOMO_RETURN_URL` | `https://your-app.up.railway.app/api/v1/payments/momo/return` |
| `MOMO_IPN_URL` | `https://your-app.up.railway.app/api/v1/payments/momo/ipn` |

Railway tự gán `PORT` — không cần set thủ công.

## 5. Volume (khuyến nghị)

| Mount path | Mục đích |
|------------|----------|
| `/app/static` | Ảnh upload (`static/uploads`) |
| `/app/chroma_db` | Vector DB chatbot |

Không mount → dữ liệu mất khi redeploy.

## 6. Kiểm tra sau deploy

- [ ] Trang chủ shop mở được.
- [ ] Đăng nhập / API trả 200 qua `/api/v1/...`.
- [ ] Ảnh sản phẩm load qua `/static/uploads/...`.
- [ ] Callback VNPay/MoMo trùng domain public.

## 7. Test Docker local (Windows)

```powershell
docker build -t da-muoi .
docker run --env-file backend/.env -p 3000:3000 -e PORT=3000 da-muoi
```

MySQL trong container phải reach được host DB (ví dụ `host.docker.internal` trong `DATABASE_URL`).

## Ghi chú

- `backend/Dockerfile` cũ đã bỏ; chỉ dùng `Dockerfile` ở root.
- Build image nặng do AI deps (`sentence-transformers`, `chromadb`); nên dùng plan RAM ≥ 2GB khi build trên Railway.
