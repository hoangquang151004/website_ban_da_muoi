# Nhóm 4: E-commerce APIs (Public & User)

Mục tiêu chung: Xây dựng toàn bộ các API phục vụ luồng mua sắm của khách hàng — từ duyệt sản phẩm, xem chi tiết, đến đặt hàng và đánh giá.

---

## Các Task

### --- Module Sản phẩm (Products) ---

- [ ] API `GET /api/products` — Danh sách sản phẩm
  - **Mục tiêu**: Lấy danh sách sản phẩm có phân trang, lọc, tìm kiếm.
  - **Query Params**: `page`, `limit`, `category_slug`, `use_id` (lọc theo công dụng), `is_featured`, `min_price`, `max_price`, `search` (tìm theo tên/mô tả), `sort_by` (price_asc, price_desc, newest)
  - **Logic**: Chỉ trả về sản phẩm có `is_active = True`. Danh mục/ công dụng `is_active = False` không được dùng để lọc.
  - **Response**: `{ items: [ProductListItem], total, page, limit, total_pages }` — mỗi `ProductListItem` kèm `uses: [UseResponse]`.
  - **DoD**: Phân trang hoạt động. Lọc theo `category_slug` và `use_id` trả đúng. `search` khớp theo `name` hoặc `description`.

- [ ] API `GET /api/products/{slug}` — Chi tiết sản phẩm
  - **Mục tiêu**: Lấy đầy đủ thông tin một sản phẩm kèm review và danh sách công dụng.
  - **Response**: `ProductResponse` kèm:
    - `category: CategoryResponse`
    - `uses: [UseResponse]` — danh sách tag công dụng gắn vào sản phẩm
    - `reviews: [ReviewResponse]` (chỉ review `is_approved = True`)
    - `average_rating: float`
  - **DoD**: Sản phẩm không tồn tại → `404`. `model_3d_url` có trong response cho frontend dùng React Three Fiber.

- [ ] API `GET /api/categories` — Danh sách danh mục
  - **Mục tiêu**: Trả về các danh mục `is_active = True` để hiển thị menu filter trên shop.
  - **Response**: `[CategoryResponse]` kèm `product_count`.
  - **DoD**: Danh mục `is_active = False` không xuất hiện. Danh mục active không có sản phẩm vẫn được trả về (kèm `product_count = 0`).

- [ ] API `GET /api/uses` — Danh sách công dụng (public)
  - **Mục tiêu**: Trả về các tag công dụng `is_active = True` để frontend hiển thị bộ lọc và tag trên trang sản phẩm.
  - **Response**: `[UseResponse]` — `id`, `name`, `icon`, `color`, `description`.
  - **DoD**: Chỉ trả về tag active. AI Agent có thể dùng endpoint này để biết các tag công dụng hiện có khi gợi ý sản phẩm.

---

### --- Module Đơn hàng (Orders) ---

- [ ] API `POST /api/orders` — Tạo đơn hàng mới (Checkout)
  - **Mục tiêu**: Xử lý thanh toán, tạo đơn, trừ tồn kho trong một SQL Transaction.
  - **Auth**: Optional (cho phép guest checkout nếu không có token)
  - **Request Body**: `{ receiver_name, receiver_phone, receiver_address, note?, payment_method, items: [{product_id, quantity}] }`
  - **Logic (PHẢI dùng Transaction)**:
    1. Với mỗi item, lock row `product` (`SELECT FOR UPDATE`)
    2. Kiểm tra `product.stock >= quantity` → rollback + `400` ngay nếu không đủ
    3. Trừ `stock` = `stock - quantity`
    4. Tạo `Order` và các `OrderItem` (lưu `unit_price` = giá hiện tại)
    5. Tạo `StockLog` cho mỗi sản phẩm với `reason = "purchase"`
    6. Commit toàn bộ
  - **Response**: `OrderResponse` với `status = "pending"`
  - **DoD**: 2 request đồng thời mua cùng sản phẩm khi còn 1 cái → chỉ 1 cái thành công. Rollback hoàn toàn khi lỗi.

- [ ] API `GET /api/orders/my` — Lịch sử đơn hàng của user
  - **Auth**: `Depends(get_current_user)`
  - **Query Params**: `status?`, `page`, `limit`
  - **Response**: Danh sách `OrderResponse` (kèm `OrderItem` nested) của user đang đăng nhập.
  - **DoD**: User A không thể xem đơn hàng của User B.

- [ ] API `GET /api/orders/{order_id}` — Chi tiết một đơn hàng
  - **Auth**: `Depends(get_current_user)` — chỉ xem được đơn của chính mình (trừ admin)
  - **Response**: `OrderResponse` đầy đủ kèm `items` và thông tin `product` của mỗi item.
  - **DoD**: Truy cập đơn hàng của người khác → `403`.

---

### --- Module Đánh giá (Reviews) ---

- [ ] API `POST /api/products/{product_id}/reviews` — Gửi đánh giá
  - **Auth**: `Depends(get_current_user)` (phải đăng nhập)
  - **Request Body**: `{ "rating": 1-5, "comment"? }`
  - **Logic**: Kiểm tra user đã mua sản phẩm này chưa (có `OrderItem` với `order.status = "delivered"`) mới được review. Mỗi user chỉ review 1 lần/sản phẩm.
  - **Response**: `ReviewResponse` với `is_approved = False`.
  - **DoD**: User chưa mua sản phẩm → `403`. Review lần 2 → `409 Conflict`.

- [ ] API `GET /api/products/{product_id}/reviews` — Xem đánh giá
  - **Logic**: Chỉ trả về review có `is_approved = True`.
  - **Response**: `[ReviewResponse]` kèm `average_rating`.
  - **DoD**: Review chưa duyệt không xuất hiện với user thường.
