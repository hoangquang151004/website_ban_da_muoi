# Nhóm 2: Chuyển đổi UI - Trang dành cho Khách hàng (Shop/User)

Mục tiêu chung: Map toàn bộ giao diện HTML bên phía user sang React Component.

- [x] Trang Chủ (Home)
  - **Mục tiêu**: Xây dựng trang chủ hiển thị banner, danh sách sản phẩm nổi bật, header, footer toàn cục.
  - **Input**: Thư mục `UI/home`.
  - **Output**: `src/app/(shop)/page.tsx` và các component `Header`, `Footer`, `HeroBanner`, `ProductList`.
  - **DoD (Definition of Done)**: Giao diện giống 100% với HTML gốc, header và footer dùng chung được cho các trang con. Responsive tốt.
- [x] Chi tiết sản phẩm (Product Detail)
  - **Mục tiêu**: Xây dựng UI xem chi tiết một sản phẩm, đánh giá, các tùy chọn biến thể màu sắc/size (nếu có).
  - **Input**: Thư mục `UI/product_detail`.
  - **Output**: `src/app/(shop)/product/[slug]/page.tsx`.
  - **DoD**: Layout sản phẩm hiển thị chuẩn xác, thư viện slider (VD: Swiper) để lướt ảnh hoạt động mượt mà.

- [x] Giỏ hàng & Thanh toán (Cart & Checkout)
  - **Mục tiêu**: Map giao diện giỏ hàng, mẫu điền thông tin người vận chuyển, step thanh toán.
  - **Input**: Thư mục `UI/cart_checkout`.
  - **Output**: `src/app/(shop)/cart/page.tsx` và `src/app/(shop)/checkout/page.tsx`.
  - **DoD**: UI hoàn tất, có form nhập liệu rõ ràng phân vùng, chuẩn bị sẵn sự kiện `onSubmit` trống.

- [x] Đăng nhập & Đăng ký (Auth)
  - **Mục tiêu**: Xây dựng UI cho trang Login và Register.
  - **Input**: Thư mục `UI/login` (và có thể register chung layout).
  - **Output**: `src/app/(auth)/login/page.tsx` và `src/app/(auth)/register/page.tsx`.
  - **DoD**: Form có đủ các trường cần thiết, Validation UI cơ bản (hiển thị trạng thái lỗi nếu nhập sai), Responsive tốt trên mobile.

- [x] Các trang thông tin tĩnh (About, Contact)
  - **Mục tiêu**: Map giao diện trang liên hệ và trang giới thiệu.
  - **Input**: Thư mục `UI/about` và `UI/contact`.
  - **Output**: `src/app/(shop)/about/page.tsx`, `src/app/(shop)/contact/page.tsx`.
  - **DoD**: Tối ưu chuẩn SEO title/description cho từng page.ct nhận focus mượt mà.

- [x] Dashboard & Quản lý tài khoản (Account)
  - **Mục tiêu**: Giao diện cho khách hàng xem lịch sử đơn, thông tin cá nhân.
  - **Input**: Thư mục `UI/account_dashboard`, `UI/account_orders`, `UI/account_profile`.
  - **Output**: Thư mục `src/app/(shop)/account/` với các file `layout.tsx`, `page.tsx` (dashboard), `orders/page.tsx`, `profile/page.tsx`.
  - **DoD**: Sidebar sticky navigation hoạt động tốt; Layout không bị vỡ giữa các màn hình.ướng, UI chia tab hoạt động với mock data.

- [x] Global Chatbot Component
  - **Mục tiêu**: Frame chat floating trôi nổi góc dưới màn hình.
  - **Input**: Thư mục `UI/chatbot`.
  - **Output**: `src/components/shop/Chatbot.tsx`.
  - **DoD**: Nút icon chat có thể toggle đóng/mở khung chat box nhỏ. Màn hình không đè che nội dung content trang.
