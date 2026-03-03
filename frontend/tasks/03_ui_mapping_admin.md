# Nhóm 3: Chuyển đổi UI - Trang quản trị (Admin Portal)

Mục tiêu chung: Chuyển đổi toàn bộ layout phần mềm quản trị dành cho nhân viên/admin.

- [x] Khởi tạo Admin Layout & Sidebar chung
  - **Mục tiêu**: Xây dựng bộ khung layout chung cho tất cả các trang Admin (Gồm Menu trái Sidebar, Top Header).
  - **Input**: Cấu trúc menu rút trích từ thư mục `UI/admin_general`.
  - **Output**: `src/app/(admin)/layout.tsx`, `src/components/admin/Sidebar.tsx`, `src/components/admin/Header.tsx`.
  - **DoD (Definition of Done)**: Sidebar nằm cố định đúng chuẩn admin, click các mục menu thay đổi nội dung ở giữa mà layout tổng không load lại trang.
  - **Ghi chú**: Đã tạo đủ 3 file. Sidebar dùng `usePathname()` để highlight active route. Routes admin nằm tại `/admin/*`.

- [x] Dashboard Tổng quan (Admin General)
  - **Mục tiêu**: Bảng điều khiển admin chính chứa các chỉ số KPI, thống kê nhanh định dạng thẻ.
  - **Input**: Thư mục `UI/admin_general`.
  - **Output**: `src/app/(admin)/dashboard/page.tsx`.
  - **DoD**: Giao diện hiển thị đúng HTML tĩnh (có thẻ, list hoạt động gần nhất, text chỉ số).
  - **Ghi chú**: 4 KPI cards, biểu đồ cột CSS-only 6 tháng, bảng đơn hàng gần nhất, top sản phẩm có progress bar. Dữ liệu mock tĩnh.

- [x] Quản lý Sản phẩm (Admin Products)
  - **Mục tiêu**: UI một bảng danh sách liệt kê sản phẩm, thanh search, và các form/modal thêm mới chỉnh sửa.
  - **Input**: Thư mục `UI/admin_products`.
  - **Output**: `src/app/(admin)/products/page.tsx`.
  - **DoD**: Cấu trúc bảng HTML/CSS đã ráp xong. Modal nhập sản phẩm popup đúng vị trí.
  - **Ghi chú**: Bảng sản phẩm với toggle active, nút sửa/xóa hover-reveal. Modal Add/Edit form đầy đủ fields. Modal confirm xóa.

- [x] Quản lý Đơn hàng (Admin Orders)
  - **Mục tiêu**: Giao diện theo dõi danh sách order, trang chi tiết 1 order để cập nhật trạng thái vẩn chuyển.
  - **Input**: Thư mục `UI/admin_orders`.
  - **Output**: `src/app/(admin)/orders/page.tsx`.
  - **DoD**: Dễ dàng quan sát badge trạng thái, giao diện bảng orders hiển thị trơn tru.
  - **Ghi chú**: 6 tab trạng thái (tất cả/chờ xác nhận/đang xử lý/đang giao/đã giao/đã hủy). Badge màu sắc chuẩn từng trạng thái. Dùng popup thay vì trang riêng `[id]`.

- [x] Quản lý Khách hàng & Đánh giá (Customer & Reviews)
  - **Mục tiêu**: Màn hình xem danh sách tài khoản thành viên, khóa/mở và trang kiểm duyệt các đánh giá shop.
  - **Input**: Thư mục `UI/admin_customer`, `UI/admin_reviews`.
  - **Output**: `src/app/(admin)/customers/page.tsx`, `src/app/(admin)/reviews/page.tsx`.
  - **DoD**: Bảng có chức năng filter UI, các nút Xóa/Khóa hiển thị cảnh báo popup cơ bản.
  - **Ghi chú**: Customers: avatar initials, badge tier (VIP/Thân thiết/Mới), filter select, modal confirm khóa. Reviews: tab lọc theo số sao, nút duyệt/từ chối.

- [x] Thống kê phân tích & Quản lý Kho (Admin Statistic & Stock)
  - **Mục tiêu**: Trang xem biểu đồ báo cáo và kiểm soát số lượng hàng tồn.
  - **Input**: Thư mục `UI/admin_statistic`, `UI/admin_stock`.
  - **Output**: `src/app/(admin)/statistics/page.tsx`, `src/app/(admin)/stock/page.tsx`.
  - **DoD**: UI biểu đồ (Chart.js / Recharts placeholder), UI theo dõi tồn kho chuẩn xác với thiết kế tĩnh.
  - **Ghi chú**: Statistics: 4 KPI + biểu đồ đôi (doanh thu + đơn hàng) + top danh mục. Stock: 3 summary cards, bảng tồn kho theo trạng thái, modal nhập hàng. Biểu đồ CSS-only (chưa dùng thư viện chart).
