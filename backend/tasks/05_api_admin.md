# Nhóm 5: Admin APIs

Mục tiêu chung: Xây dựng toàn bộ API dành cho Quản trị viên — quản lý sản phẩm, đơn hàng, khách hàng, kho hàng và thống kê báo cáo. Tất cả routes trong nhóm này đều yêu cầu `Depends(require_admin)`.

---

## Các Task

### --- Quản lý Danh mục ---

- [ ] API `GET /api/admin/categories` — Danh sách danh mục
  - **Query Params**: `page`, `limit`, `search` (theo tên), `is_active?`
  - **Response**: `[CategoryResponse]` kèm `product_count` (số sản phẩm active thuộc danh mục) và `created_at`.
  - **DoD**: Sort theo `created_at DESC` mặc định. Filter `is_active=false` trả đúng danh mục đã ẩn.

- [ ] API `POST /api/admin/categories` — Tạo danh mục mới
  - **Request Body**: `CategoryCreate` — `name`, `description?`, `image_url?`
  - **Logic**: Tự sinh `slug` từ `name` (slugify + ensure unique).
  - **Response**: `CategoryResponse` vừa tạo.
  - **DoD**: Tạo thành công → danh mục hiện trên menu filter trang shop.

- [ ] API `PUT /api/admin/categories/{id}` — Cập nhật danh mục
  - **Request Body**: `CategoryUpdate` (partial — chỉ truyền trường muốn sửa)
  - **Logic**: Nếu đổi `name` → cập nhật `slug` tương ứng, đảm bảo không trùng slug cũ của danh mục khác.
  - **Response**: `CategoryResponse` đã cập nhật.
  - **DoD**: Đổi tên → slug thay đổi theo. Các sản phẩm thuộc danh mục không bị ảnh hưởng.

- [ ] API `PATCH /api/admin/categories/{id}/status` — Bật/Tắt danh mục
  - **Request Body**: `{ "is_active": true | false }`
  - **Logic**: Toggle `is_active`. Tắt danh mục → sản phẩm thuộc danh mục đó vẫn còn trong DB nhưng danh mục không hiện trên shop filter.
  - **DoD**: Toggle UI trên trang admin hoạt động qua endpoint này. Danh mục tắt không xuất hiện ở `GET /api/categories` (public).

- [ ] API `DELETE /api/admin/categories/{id}` — Xóa danh mục
  - **Logic**: Không cho xóa nếu danh mục còn sản phẩm `is_active = True` → `400 "Danh mục còn sản phẩm đang hoạt động"`.
  - **DoD**: Xóa thành công → hard delete. Xóa danh mục có SP active → trả lỗi rõ ràng.

---

### --- Quản lý Công dụng (Uses / Tags) ---

- [ ] API `GET /api/admin/uses` — Danh sách công dụng
  - **Query Params**: `is_active?`
  - **Response**: `[UseResponse]` — gồm `id`, `name`, `icon`, `color`, `description`, `is_active`, `created_at`.
  - **DoD**: Trả về toàn bộ công dụng (không phân trang do số lượng nhỏ).

- [ ] API `POST /api/admin/uses` — Tạo công dụng mới
  - **Request Body**: `UseCreate` — `name`, `icon`, `color`, `description?`
  - **Logic**: `name` phải unique → `400` nếu trùng.
  - **Response**: `UseResponse` vừa tạo.
  - **DoD**: Công dụng mới có thể gắn ngay vào sản phẩm thông qua `PUT /api/admin/products/{id}`.

- [ ] API `PUT /api/admin/uses/{id}` — Cập nhật công dụng
  - **Request Body**: `UseUpdate` (partial)
  - **DoD**: Cập nhật `icon` hoặc `color` → các sản phẩm đang gắn tag này hiển thị đúng icon/màu mới.

- [ ] API `PATCH /api/admin/uses/{id}/status` — Bật/Tắt công dụng
  - **Request Body**: `{ "is_active": true | false }`
  - **Logic**: Tắt công dụng → tag này không còn hiện trên giao diện shop, nhưng quan hệ `product_uses` vẫn giữ nguyên trong DB.
  - **DoD**: Toggle UI trên trang admin `/admin/categories` hoạt động qua endpoint này.

- [ ] API `DELETE /api/admin/uses/{id}` — Xóa công dụng
  - **Logic**: Hard delete. Cascade xóa toàn bộ bản ghi trong bảng trung gian `product_uses` liên quan.
  - **DoD**: Xóa Use → sản phẩm đang gắn tag đó tự động không còn tag này trong response.

---

### --- Quản lý Sản phẩm ---

- [ ] API CRUD Sản phẩm — `POST/PUT/DELETE /api/admin/products`
  - **Mục tiêu**: Thêm mới, cập nhật thông tin, ẩn/xóa sản phẩm.
  - **`POST /api/admin/products`**:
    - **Request**: `ProductCreate` — tên, mô tả, giá, stock, category_id, image_url, model_3d_url, **`use_ids: list[int]`** (danh sách ID công dụng gắn vào sản phẩm)
    - **Logic**: Tự sinh `slug` từ `name`, đảm bảo unique. Gắn các `Use` theo `use_ids` vào bảng `product_uses`.
    - **Response**: `ProductResponse` mới tạo kèm `uses: [UseResponse]`.
  - **`PUT /api/admin/products/{id}`**:
    - **Request**: `ProductUpdate` (partial — kể cả `use_ids?`)
    - **Logic**: Nếu có `use_ids` → xóa toàn bộ bản ghi cũ trong `product_uses` rồi insert lại (replace strategy). Nếu thay đổi `stock` → tạo `StockLog` với `reason = "adjustment"`.
  - **`DELETE /api/admin/products/{id}`**: Soft delete — set `is_active = False`, không xóa khỏi DB.
  - **DoD**: Sản phẩm sau khi soft-delete không hiện ở trang shop. Sửa stock tạo đúng StockLog. Gắn/gỡ tag công dụng hoạt động đúng.

- [ ] API Upload ảnh — `POST /api/admin/upload`
  - **Mục tiêu**: Nhận file ảnh, lưu vào server (hoặc cloud storage), trả về URL.
  - **Input**: `multipart/form-data` với field `file`.
  - **Logic**: Validate type (jpg, png, webp), giới hạn kích thước (5MB), sinh tên file unique (UUID).
  - **Output**: `{ "url": "/static/uploads/xxx.jpg" }`
  - **DoD**: Upload ảnh thành công → URL dùng được trong `ProductCreate.image_url`.

---

### --- Quản lý Đơn hàng ---

- [ ] API `GET /api/admin/orders` — Danh sách tất cả đơn hàng
  - **Query Params**: `status?`, `page`, `limit`, `search` (theo tên/SĐT người nhận), `date_from`, `date_to`
  - **Response**: Danh sách `OrderResponse` đầy đủ với thông tin khách hàng.
  - **DoD**: Filter theo `status` trả đúng. Sort theo `created_at DESC` mặc định.

- [ ] API `PUT /api/admin/orders/{id}/status` — Cập nhật trạng thái đơn
  - **Request Body**: `{ "status": "confirmed" | "packing" | "shipping" | "delivered" | "cancelled" }`
  - **Logic**: Trạng thái chỉ được đi theo một chiều (ví dụ: không được chuyển từ `delivered` về `pending`). Khi `status = "cancelled"` → cộng lại `stock` cho từng `OrderItem` và tạo `StockLog` với `reason = "adjustment"`.
  - **DoD**: Hủy đơn → stock được hoàn trả đúng số lượng. Chuyển trạng thái sai chiều → `400`.

---

### --- Quản lý Khách hàng ---

- [ ] API `GET /api/admin/users` — Danh sách khách hàng
  - **Query Params**: `page`, `limit`, `search` (theo tên/email/SĐT), `is_active?`
  - **Response**: `[UserResponse]` (không có password), kèm `order_count` và `total_spent` cho mỗi user.
  - **DoD**: Không trả về tài khoản có `role = "admin"`.

- [ ] API `PUT /api/admin/users/{id}/status` — Khóa/Mở tài khoản
  - **Request Body**: `{ "is_active": true | false }`
  - **Logic**: Tài khoản `is_active = False` → login trả về `403`.
  - **DoD**: Khóa tài khoản → người dùng đó không thể đăng nhập. Admin không thể tự khóa chính mình.

---

### --- Quản lý Đánh giá ---

- [ ] API `GET /api/admin/reviews` — Danh sách đánh giá chờ duyệt
  - **Query Params**: `is_approved?` (default: `false` — xem pending), `product_id?`, `page`, `limit`
  - **Response**: `[ReviewResponse]` kèm thông tin `user` và `product`.
  - **DoD**: Filter `is_approved=false` chỉ trả về review chưa duyệt.

- [ ] API `PUT /api/admin/reviews/{id}` — Duyệt hoặc xóa đánh giá
  - **Request Body**: `{ "is_approved": true }` hoặc `DELETE /api/admin/reviews/{id}`.
  - **Logic**: Khi `is_approved = True` → review hiện với khách hàng. Xóa → hard delete.
  - **DoD**: Duyệt review → `GET /api/products/{slug}` của sản phẩm đó bao gồm review này.

---

### --- Quản lý Kho hàng ---

- [ ] API `GET /api/admin/stock` — Báo cáo tồn kho
  - **Response**: Danh sách sản phẩm với `current_stock`, `stock_value` (stock \* price), cờ `low_stock` (khi stock < 5).
  - **DoD**: Sort được theo `current_stock ASC` để phát hiện hàng sắp hết.

- [ ] API `POST /api/admin/stock/restock` — Nhập kho
  - **Request Body**: `{ "product_id": int, "quantity": int, "note"?: str }`
  - **Logic**: Cộng `quantity` vào `product.stock`. Tạo `StockLog` với `reason = "restock"`.
  - **DoD**: Sau khi nhập kho, `product.stock` tăng đúng số lượng. `StockLog` ghi nhận đầy đủ.

- [ ] API `GET /api/admin/stock/logs` — Lịch sử xuất nhập kho
  - **Query Params**: `product_id?`, `reason?`, `date_from`, `date_to`, `page`, `limit`
  - **Response**: `[StockLogResponse]` kèm tên sản phẩm.
  - **DoD**: Filter kết hợp `product_id` + `reason` + khoảng thời gian hoạt động đúng.

---

### --- Thống kê & Báo cáo ---

- [ ] API `GET /api/admin/statistics/overview` — Tổng quan Dashboard
  - **Response**:
    ```json
    {
      "today_revenue": 0,
      "today_orders": 0,
      "pending_orders": 0,
      "total_customers": 0,
      "total_products_active": 0,
      "low_stock_count": 0
    }
    ```
  - **DoD**: Tất cả số liệu tính theo thời gian thực từ DB, không cache tĩnh.

- [ ] API `GET /api/admin/statistics/revenue` — Biểu đồ doanh thu
  - **Query Params**: `period` (daily/weekly/monthly), `date_from`, `date_to`
  - **Response**: `[{ "label": "2026-03-03", "revenue": 12500000, "order_count": 5 }]`
  - **Logic**: Chỉ tính đơn hàng có `status = "delivered"`.
  - **DoD**: `period=daily` → mỗi ngày 1 điểm dữ liệu. `period=monthly` → mỗi tháng 1 điểm.

- [ ] API `GET /api/admin/statistics/top-products` — Sản phẩm bán chạy
  - **Query Params**: `limit` (default 10), `date_from`, `date_to`
  - **Response**: `[{ "product_id", "product_name", "total_sold", "total_revenue" }]`
  - **DoD**: Kết quả sort theo `total_sold DESC`.
