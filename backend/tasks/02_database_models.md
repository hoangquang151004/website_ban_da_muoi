# Nhóm 2: Database Models & Schemas

Mục tiêu chung: Định nghĩa toàn bộ bảng dữ liệu (SQLAlchemy ORM Models) và các Pydantic Schemas tương ứng cho request/response.

---

## Các Task

- [x] Model `User` (Người dùng)
  - **Mục tiêu**: Bảng lưu thông tin tài khoản khách hàng và admin.
  - **Các trường**:
    - `id` (PK, int, auto-increment)
    - `full_name` (str)
    - `email` (str, unique, indexed)
    - `hashed_password` (str)
    - `phone` (str, nullable)
    - `address` (str, nullable)
    - `role` (enum: `customer`, `admin`, default: `customer`)
    - `is_active` (bool, default: True)
    - `created_at`, `updated_at` (datetime, auto)
  - **Schemas**: `UserCreate`, `UserUpdate`, `UserResponse`, `UserPublic`.
  - **DoD**: Migration tạo bảng thành công. Schema validate đúng, không lộ `hashed_password` trong response.

- [x] Model `Category` (Danh mục sản phẩm)
  - **Mục tiêu**: Bảng phân loại sản phẩm (VD: Đèn đá muối, Đèn ngủ, Đá ngâm chân...).
  - **Các trường**:
    - `id` (PK, int)
    - `name` (str, unique)
    - `slug` (str, unique, indexed)
    - `description` (text, nullable)
    - `image_url` (str, nullable)
    - `is_active` (bool, default: True) — Admin có thể ẩn danh mục mà không xóa
    - `created_at` (datetime, auto)
  - **Schemas**: `CategoryCreate`, `CategoryUpdate`, `CategoryResponse` (kèm `product_count` computed field).
  - **DoD**: Quan hệ 1-N với `Product` hoạt động đúng. Danh mục `is_active = False` không hiện trên menu filter trang shop.

- [x] Model `Use` (Công dụng / Tag lợi ích sản phẩm)
  - **Mục tiêu**: Bảng lưu các tag công dụng gắn vào sản phẩm (VD: Phong thủy, Trị mất ngủ, Lọc không khí...). Dùng để AI Agent tìm kiếm sản phẩm theo ngữ nghĩa công dụng.
  - **Các trường**:
    - `id` (PK, int)
    - `name` (str, unique) — tên hiển thị, VD: "Trị mất ngủ"
    - `icon` (str) — tên Material Symbols icon, VD: `bedtime`
    - `color` (str) — key màu sắc, VD: `blue` (frontend map sang class Tailwind tương ứng)
    - `description` (text, nullable) — mô tả ngắn hiển thị trên UI
    - `is_active` (bool, default: True)
    - `created_at` (datetime, auto)
  - **Quan hệ**: Many-to-Many với `Product` qua bảng trung gian `product_uses` (`product_id`, `use_id`).
  - **Schemas**: `UseCreate`, `UseUpdate`, `UseResponse`.
  - **DoD**: Migration tạo cả bảng `uses` và `product_uses`. Gắn Use vào Product bằng cách thêm `use_ids: list[int]` vào `ProductCreate`/`ProductUpdate`. `ProductResponse` trả về `uses: [UseResponse]` nested.

- [x] Model `Product` (Sản phẩm)
  - **Mục tiêu**: Bảng chính lưu thông tin sản phẩm, bao gồm trường `model_3d_url` đặc thù của dự án.
  - **Các trường**:
    - `id` (PK, int)
    - `name` (str)
    - `slug` (str, unique, indexed)
    - `description` (text)
    - `price` (Numeric 10,2)
    - `original_price` (Numeric 10,2, nullable)
    - `stock` (int, default: 0)
    - `image_url` (str, nullable)
    - `model_3d_url` (str, nullable) — đặc thù cho React Three Fiber
    - `is_featured` (bool, default: False)
    - `is_active` (bool, default: True)
    - `category_id` (FK → `categories.id`)
    - `created_at`, `updated_at` (datetime, auto)
  - **Schemas**: `ProductCreate`, `ProductUpdate`, `ProductResponse` (kèm `CategoryResponse` nested), `ProductListItem`.
  - **DoD**: `slug` tự động sinh từ `name` (slugify). Query lọc theo `category_id`, `is_featured`, `stock > 0` hoạt động.

- [x] Model `Order` & `OrderItem` (Đơn hàng)
  - **Mục tiêu**: Bảng lưu đơn hàng và chi tiết từng mặt hàng trong đơn.
  - **Bảng `orders`**:
    - `id` (PK, int)
    - `user_id` (FK → `users.id`, nullable — cho phép guest checkout)
    - `receiver_name`, `receiver_phone`, `receiver_address` (str)
    - `note` (text, nullable)
    - `payment_method` (enum: `cod`, `bank_transfer`)
    - `status` (enum: `pending`, `confirmed`, `packing`, `shipping`, `delivered`, `cancelled`, default: `pending`)
    - `total_amount` (Numeric 12,2)
    - `created_at`, `updated_at` (datetime, auto)
  - **Bảng `order_items`**:
    - `id` (PK, int)
    - `order_id` (FK → `orders.id`)
    - `product_id` (FK → `products.id`)
    - `quantity` (int)
    - `unit_price` (Numeric 10,2) — lưu giá tại thời điểm đặt
    - `subtotal` (Numeric 12,2)
  - **Schemas**: `OrderCreate`, `OrderResponse` (kèm list `OrderItemResponse`), `OrderStatusUpdate`.
  - **DoD**: Khi tạo `OrderItem`, lưu `unit_price` từ `product.price` hiện tại (snapshot). Quan hệ cascade delete đúng.

- [x] Model `Review` (Đánh giá sản phẩm)
  - **Mục tiêu**: Lưu đánh giá, rating của khách hàng cho từng sản phẩm.
  - **Các trường**:
    - `id` (PK, int)
    - `product_id` (FK → `products.id`)
    - `user_id` (FK → `users.id`)
    - `rating` (int, 1→5)
    - `comment` (text, nullable)
    - `is_approved` (bool, default: False) — Admin phải duyệt trước khi hiển thị
    - `created_at` (datetime, auto)
  - **Schemas**: `ReviewCreate`, `ReviewResponse`, `ReviewAdminUpdate`.
  - **DoD**: Constraint unique `(product_id, user_id)` — mỗi user chỉ được review 1 lần/sản phẩm.

- [x] Model `StockLog` (Lịch sử nhập/xuất kho)
  - **Mục tiêu**: Ghi lại từng lần thay đổi tồn kho để truy vết (audit trail).
  - **Các trường**:
    - `id` (PK, int)
    - `product_id` (FK → `products.id`)
    - `change_amount` (int) — dương: nhập kho, âm: xuất kho
    - `reason` (enum: `purchase` (bán), `restock` (nhập), `adjustment` (điều chỉnh))
    - `reference_id` (int, nullable) — order_id nếu là do bán hàng
    - `note` (str, nullable)
    - `created_at` (datetime, auto)
  - **Schemas**: `StockLogCreate`, `StockLogResponse`.
  - **DoD**: Mỗi lần trừ kho khi tạo đơn đều tạo 1 record `StockLog` tương ứng.
