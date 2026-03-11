# Trạng thái dự án — Cập nhật 03/03/2026

## Tổng quan nhanh

| Tầng                                                             | Mức hoàn thành | Trạng thái  |
| ---------------------------------------------------------------- | -------------- | ----------- |
| Backend — Hạ tầng (DB, Auth, Config)                             | 100%           | ✅ Xong     |
| Backend — API công khai (Products, Orders, Reviews)              | 100%           | ✅ Xong     |
| Backend — API Admin (CRUD, Statistics, Stock)                    | 100%           | ✅ Xong     |
| Backend — AI Agent (RAG, Recommend, Order, Text-to-SQL)          | 100%           | ✅ Xong     |
| Frontend — UI tĩnh (Shop + Admin)                                | 100%           | ✅ Xong     |
| Frontend — State & Routing                                       | 100%           | ✅ Xong     |
| Frontend — Kết nối API (Auth, Checkout, Admin Products/Orders)   | 60%            | ⚠️ Chưa đủ  |
| Frontend — Kết nối API (Home, Product Detail, Admin Categories…) | 0%             | ❌ Chưa làm |
| Frontend — Tích hợp AI Chatbot                                   | 0%             | ❌ Chưa làm |

---

## Chi tiết từng phần

### ✅ BACKEND — Đã hoàn thành

**Hạ tầng:**

- `app/main.py`, `app/core/config.py`, `app/core/security.py`, `app/core/dependencies.py`
- MySQL + SQLAlchemy async + Alembic migrations
- Tất cả models: `User`, `Product`, `Category`, `Use`, `Order`, `OrderItem`, `Review`, `StockLog`

**Auth APIs** (`/api/v1/auth/*`):

- `POST /register` — Đăng ký
- `POST /login` — Đăng nhập (JWT)
- `GET /me` — Lấy thông tin user hiện tại
- `PUT /me` — Cập nhật hồ sơ

**E-commerce APIs** (`/api/v1/*`):

- `GET /products` — Danh sách sản phẩm (phân trang, lọc, tìm kiếm)
- `GET /products/{slug}` — Chi tiết sản phẩm
- `GET /categories` — Danh sách danh mục active
- `GET /uses` — Danh sách tag công dụng active
- `GET/POST /products/{id}/reviews` — Xem và gửi đánh giá
- `POST /orders` — Tạo đơn hàng (guest + đăng nhập, transaction an toàn)
- `GET /orders/my` — Lịch sử đơn hàng
- `GET /orders/{id}` — Chi tiết đơn hàng

**Admin APIs** (`/api/v1/admin/*`):

- Categories & Uses: CRUD + toggle status + delete
- Products: CRUD + upload ảnh + manage use_ids
- Orders: list all, update status
- Users: list, toggle active, update role
- Reviews: list, approve/reject, delete
- Stock: adjust, list logs
- Statistics: doanh thu, đơn hàng, sản phẩm bán chạy

**AI Agent** (`/api/v1/chat/*`, `/api/v1/admin/chat/*`):

- `POST /chat` — Auto-routing (RAG / Recommend / Order)
- `POST /chat/knowledge` — RAG tư vấn kiến thức
- `POST /chat/recommend` — Gợi ý sản phẩm (Vector + SQL)
- `POST /chat/order` — Đặt hàng qua chat (auth required)
- `POST /admin/chat/report` — Text-to-SQL báo cáo (admin only)

---

### ⚠️ FRONTEND — Đã làm nhưng chưa kết nối API

| Trang / Component                                    | Trạng thái      | Vấn đề                                                                   |
| ---------------------------------------------------- | --------------- | ------------------------------------------------------------------------ |
| `(shop)/page.tsx` — Trang chủ                        | ⚠️ Mock data    | Vẫn dùng mảng `PRODUCTS[]` tĩnh, chưa gọi `productService.getProducts()` |
| `product/[slug]/page.tsx` — Chi tiết SP              | ⚠️ Static       | Không nhận `slug` từ URL, hiển thị data cứng                             |
| `admin/categories/page.tsx` — Quản lý DM & Công dụng | ⚠️ Mock data    | Dùng `INITIAL_CATEGORIES[]` tĩnh, chưa gọi API admin                     |
| `admin/orders/page.tsx` — Đơn hàng admin             | ⚠️ Có fallback  | Gọi API nhưng fallback về `MOCK_ORDERS` khi lỗi                          |
| `admin/products/page.tsx` — Sản phẩm admin           | ⚠️ Có fallback  | Gọi API nhưng fallback về mock khi lỗi                                   |
| `admin/customers/page.tsx` — Khách hàng              | ❌ Chưa kết nối | Chưa có service method cho admin users                                   |
| `admin/reviews/page.tsx` — Đánh giá                  | ❌ Chưa kết nối | Chưa có service method cho admin reviews                                 |
| `admin/statistics/page.tsx` — Thống kê               | ❌ Chưa kết nối | Dùng số liệu tĩnh, chưa gọi statistics API                               |
| `admin/stock/page.tsx` — Kho hàng                    | ❌ Chưa kết nối | Dùng mock, chưa gọi stock API                                            |
| `components/shop/Chatbot.tsx` — Chatbot              | ❌ Chưa kết nối | Chưa gọi `/api/v1/chat` endpoint                                         |

**Đã kết nối đầy đủ:**

- ✅ `(auth)/login/page.tsx` — Gọi `authService.login()`, lưu token, redirect
- ✅ `(auth)/register/page.tsx` — Gọi `authService.register()`
- ✅ `(shop)/checkout/page.tsx` — Gọi `orderService.createOrder()`, clear cart
- ✅ `lib/httpClient.ts` — Auto-attach Bearer token từ localStorage
- ✅ `store/authStore.ts` — Zustand persist
- ✅ `store/cartStore.ts` — Zustand persist
- ✅ `proxy.ts` (middleware) — Bảo vệ `/admin` và `/account` routes

---

### ❌ LÝ DO WEBSITE CHƯA CHẠY ĐƯỢC (cần fix ngay)

#### 1. Backend chưa có database data

```
Alembic đã tạo schema nhưng DB trống → frontend gọi API trả về mảng rỗng
hoặc lỗi nếu có foreign key constraint.
```

**Fix:** Chạy seed data (xem mục "Bước tiếp theo").

#### 2. Frontend home page dùng mock data tĩnh

Trang chủ không gọi API → người dùng thấy sản phẩm giả, không phản ánh DB.

#### 3. Product detail page không dynamic

`app/(shop)/product/[slug]/page.tsx` không đọc `params.slug` → mọi slug đều hiển thị cùng 1 sản phẩm giả.

#### 4. AI Agent cần seed ChromaDB

Chatbot sẽ lỗi nếu ChromaDB trống.

#### 5. Thiếu file `.env.local` ở frontend

Frontend cần biết URL backend qua `NEXT_PUBLIC_API_URL`.

---

## Bước tiếp theo (theo thứ tự ưu tiên)

### Bước 1 — Seed database (15 phút)

```powershell
# Đảm bảo MySQL đang chạy, DB da_muoi_db tồn tại
cd D:\web_ban_da_muoi\backend

# Chạy migration (tạo bảng nếu chưa có)
alembic upgrade head

# Tạo file seed SQL hoặc dùng admin API để nhập dữ liệu mẫu:
# - Tạo 1 admin account qua endpoint POST /api/v1/auth/register
#   rồi đổi role = "admin" trực tiếp trong DB
# - Tạo categories, uses, products qua Swagger UI: http://localhost:8000/docs
```

### Bước 2 — Tạo file `.env.local` cho frontend (2 phút)

```powershell
# Tạo file D:\web_ban_da_muoi\frontend\.env.local
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

### Bước 3 — Kết nối trang Chủ với API (30 phút)

Sửa `frontend/src/app/(shop)/page.tsx`:

- Thay mảng `PRODUCTS[]` tĩnh bằng `useEffect` gọi `productService.getProducts()`
- Kết nối filter (category, search, sort) với query params của API
- Hiển thị loading skeleton khi đang fetch

### Bước 4 — Kết nối trang Chi tiết Sản phẩm (30 phút)

Sửa `frontend/src/app/(shop)/product/[slug]/page.tsx`:

- Nhận `params: { slug: string }` từ Next.js
- Gọi `productService.getProductBySlug(slug)` để lấy data thực
- Hiển thị reviews thực từ API

### Bước 5 — Kết nối Admin Categories & Uses (45 phút)

Sửa `frontend/src/app/admin/categories/page.tsx`:

- Thêm service methods cho admin categories/uses vào `productService.ts`
  - `adminGetCategories()`, `adminCreateCategory()`, `adminUpdateCategory()`, `adminDeleteCategory()`
  - `adminGetUses()`, `adminCreateUse()`, `adminUpdateUse()`, `adminDeleteUse()`
- Thay `INITIAL_CATEGORIES[]` và `INITIAL_USES[]` bằng `useEffect` gọi API
- Nối các modal Add/Edit/Delete với API calls

### Bước 6 — Kết nối Admin Customers & Reviews (45 phút)

Tạo `frontend/src/services/adminService.ts` bao gồm:

- `getCustomers()`, `toggleUserActive()`, `updateUserRole()`
- `getReviews()`, `approveReview()`, `rejectReview()`, `deleteReview()`

Sửa `admin/customers/page.tsx` và `admin/reviews/page.tsx` gọi service tương ứng.

### Bước 7 — Kết nối Admin Statistics & Stock (30 phút)

- `admin/statistics/page.tsx`: Gọi `/api/v1/admin/statistics` để lấy KPI thực
- `admin/stock/page.tsx`: Gọi `/api/v1/admin/stock` để lấy tồn kho thực, nối nút "Nhập kho"

### Bước 8 — Seed ChromaDB & Kết nối Chatbot (30 phút)

```powershell
cd D:\web_ban_da_muoi\backend
python scripts/seed_vector_store.py
```

Sửa `frontend/src/components/shop/Chatbot.tsx`:

- Tạo `frontend/src/services/chatService.ts` với method `sendMessage(message: string)`
- Nối form chat gọi `POST /api/v1/chat`
- Hiển thị `answer` từ response + render danh sách sản phẩm nếu `products[]` có trong response

### Bước 9 — Admin Chat Report (20 phút)

Thêm tab/input trong `admin/dashboard/page.tsx` hoặc `admin/statistics/page.tsx`
để admin nhập câu hỏi → gọi `POST /api/v1/admin/chat/report` → hiển thị kết quả.

---

## Cách khởi động toàn bộ hệ thống

```powershell
# Terminal 1 — Backend
cd D:\web_ban_da_muoi\backend
uvicorn app.main:app --reload --port 8000

# Terminal 2 — Frontend
cd D:\web_ban_da_muoi\frontend
npm run dev

# Swagger UI để test API:
# http://localhost:8000/docs

# Website:
# http://localhost:3000
```

---

## Checklist cuối cùng trước khi demo

- [ ] MySQL đang chạy, DB `da_muoi_db` có data
- [ ] Backend chạy tại `http://localhost:8000` — kiểm tra `GET /health`
- [ ] Frontend có file `.env.local` với `NEXT_PUBLIC_API_URL`
- [ ] Frontend chạy tại `http://localhost:3000`
- [ ] Trang chủ hiển thị sản phẩm từ DB (không phải mock)
- [ ] Đăng nhập được với tài khoản admin
- [ ] Admin dashboard hiển thị số liệu thực
- [ ] Chatbot trả lời câu hỏi (sau khi seed ChromaDB)
