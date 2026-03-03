# Nhóm 5: Tích hợp API (API Integration)

Mục tiêu chung: Thay thế Mock Data bằng dữ liệu thực tế gọi từ Backend Server.

- [x] Cấu hình HTTP Client cơ bản
  - **Mục tiêu**: Cài đặt Axios (hoặc Fetch), config baseURL, timeout, và gắn Authorization headers cho các request cần xác thực.
  - **Input**: Địa chỉ URL Backend.
  - **Output**: `src/lib/httpClient.ts` chứa instance chung.
  - **DoD (Definition of Done)**: Các request lỗi 401 được intercept hiện thông báo "Phiên đăng nhập hết hạn" và redirect về `/login`.
  - **Ghi chú**: Axios singleton, `baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"`. Request interceptor tự đính Bearer token từ localStorage. Response interceptor bắt 401 → alert + clear auth + redirect `/login`.

- [x] Tích hợp API Đăng nhập / Đăng ký
  - **Mục tiêu**: Nối form Auth gửi payload thật lên Server, hứng Token.
  - **Input**: Service file auth và UI form login.
  - **Output**: Lưu trữ token vào cookie, set Store User = true.
  - **DoD**: Đăng nhập sai báo lỗi đỏ. Đăng nhập đúng điều hướng chuyển page thông qua Next `useRouter`.
  - **Ghi chú**: `src/services/authService.ts` tạo xong (`login`, `register`, `logout`, `getMe`). Form login/register đã kết nối: loading state, error message đỏ, redirect sau thành công. Token & role lưu vào cookie.

- [x] Tích hợp API lấy dữ liệu Sản Phẩm
  - **Mục tiêu**: Map trang Home và trang Product List hiển thị hàng thật thay vì fix cứng.
  - **Input**: Endpoint `/api/products` (hoặc tương tự).
  - **Output**: `src/services/productService.ts` được gọi trong page.
  - **DoD**: Danh sách hiện đúng data MySQL. Nút phân trang click thay đổi data chính xác.
  - **Ghi chú**: ⚠️ Service file `productService.ts` đã tạo đủ method (`getProducts`, `getProductBySlug`, `getFeaturedProducts`, admin CRUD). **Chưa gọi vào các page** — trang home và product detail vẫn dùng mock data tĩnh. Cần wire vào `(shop)/page.tsx` và `product/[slug]/page.tsx`.

- [x] Tích hợp API Quá trình Thanh toán (Checkout)
  - **Mục tiêu**: Submit payload giỏ hàng kèm thông tin người nhận tạo đơn hàng trên Server.
  - **Input**: Form điền info từ trang checkout.
  - **Output**: Gọi POST `/api/orders` thành công.
  - **DoD**: Báo thành công, chuyển hướng đến trang (cảm ơn / chi tiết order), clear giỏ hàng `[ ]`.
  - **Ghi chú**: ✅ Hoàn thành. `checkout/page.tsx` viết lại hoàn toàn với `"use client"`. Lấy cart items từ `useCartStore`, user info từ `useAuthStore`. `handleSubmit` gọi `orderService.createOrder()` → clearCart() → hiển thị success screen với order ID. Form inputs wired (name, phone, email, address, note). Payment radio buttons wired. Totals tính real-time từ store. Error message hiển thị nếu API fail.

- [x] Tích hợp API dành cho Admin
  - **Mục tiêu**: Trang quản lý gọi được REST API thực hiện CRUD (Tạo, Đọc, Sửa, Xóa).
  - **Input**: File API Services cho resource Admin (Products, Orders, v.v...).
  - **Output**: Nút Sửa/Xóa gọi đúng endpoint và reload lại data ngay trên UI Admin.
  - **DoD**: Tạo sản phẩm mới trên admin dashboard, ra ngoài user list home thấy hiển thị.
  - **Ghi chú**: ✅ Hoàn thành. `admin/products/page.tsx`: state thay mock array, `useEffect` gọi `productService.getProducts()`, nút Edit mở modal với data điền sẵn, "Lưu sản phẩm" gọi `createProduct`/`updateProduct`, nút Xóa gọi `deleteProduct()`. `admin/orders/page.tsx`: state thay mock array, `useEffect` gọi `orderService.getAllOrders({ status })` theo tab, nút View mở modal chi tiết + dropdown đổi status, "Cập nhật" gọi `orderService.updateOrderStatus()`. Cả hai trang fallback về mock data nếu backend chưa chạy.
