# Nhóm 4: State Management & Routing

Mục tiêu chung: Xây dựng cơ chế luân chuyển dữ liệu, lưu trữ thông tin nội bộ (Local/Global) và bảo vệ các luồng điều hướng của luồng Next.js.

- [x] Tích hợp Global State cho Giỏ hàng (Cart)
  - **Mục tiêu**: Quản lý list item trong cart kể cả khi chuyển trang và tính tổng tiền sản phẩm.
  - **Input**: Layout Giỏ hàng và logic nút "Thêm vào giỏ" bên trang sản phẩm.
  - **Output**: `src/store/cartStore.ts` (Sử dụng Zustand hoặc Redux).
  - **DoD (Definition of Done)**: Bấm thêm vào giỏ thì icon giỏ hàng trên Header nảy số. Vào trang Cart thấy đúng danh sách đã chọn.
  - **Ghi chú**: Dùng Zustand + persist vào `localStorage` (key `himalayan-cart`). Các method: `addItem`, `removeItem`, `updateQuantity`, `clearCart`, `totalItems()`, `totalPrice()`. Header shop đã kết nối hiển thị badge số lượng.

- [x] Tích hợp Global State Auth (Tài khoản)
  - **Mục tiêu**: Lưu trạng thái xác thực để biết khách / admin đã đăng nhập hay chưa.
  - **Input**: Form Login đã thiết kế layout.
  - **Output**: `src/store/authStore.ts` và logic hiển thị theo Auth (Avatar, Logout nút).
  - **DoD**: Tắt tab mở lại vẫn giữ trạng thái đăng nhập (đọc từ LocalStorage / Cookies). Đăng xuất clear state.
  - **Ghi chú**: Zustand + persist vào `localStorage` (key `himalayan-auth`). Fields: `user`, `token`, `isAuthenticated`. Header shop hiển thị dropdown user (avatar chữ cái, link Account/Orders/Admin, nút Đăng xuất).

- [x] Thiết lập Protected Routes (Middleware)
  - **Mục tiêu**: Chặn user lạ vào `/admin` hoặc guest chưa login truy cập vào user dashboard `/account`.
  - **Input**: Token/Cookie xác thực (hiện tại có thể dùng local storage biến hoặc cookie giả).
  - **Output**: `src/proxy.ts` ở thư mục dự án Next.js gốc (Next.js 16 đổi tên từ `middleware.ts` → `proxy.ts`).
  - **DoD**: Chưa login gõ URL `/admin` bị redirect thẳng về `/login`.
  - **Ghi chú**: Đọc cookie `auth-token` và `user-role`. Logic: guest → redirect `/login?redirect=...`; non-admin vào `/admin` → redirect `/`; đã login vào `/login|/register` → redirect `/` hoặc `/admin/dashboard`.

- [x] Quản lý State cho Form & Bộ lọc (Filters)
  - **Mục tiêu**: Handle việc thay đổi URL khi filter tìm kiếm (e.g., `?category=Ao&sort=desc`).
  - **Input**: Form Search / Filter trên Header hoặc Trang bộ lọc Sản phẩm.
  - **Output**: State liên kết chặt chẽ với query string qua `useSearchParams`, `useRouter`.
  - **DoD**: Gõ text => URL đổi dạng query params `?q=text`. Load lại trang URL đó thì ô input vẫn giữ nguyên giá trị `text`.
  - **Ghi chú**: Đã triển khai trong `(shop)/page.tsx`. Search debounce 450ms → `?q=`. Category checkboxes multi-select → `?category=den-nuong,den-ngu`. Sort select → `?sort=ban-chay|gia-tang|gia-giam|moi-nhat`. Filter + sort chạy trên mock data. Mỗi product card là `<Link href=/product/[slug]>`. Trang bọc trong `<Suspense>` để đáp ứng yêu cầu `useSearchParams`.
