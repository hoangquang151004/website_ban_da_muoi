# Báo Cáo Phân Tích Chức Năng Dự Án Website Bán Đá Muối

**Dựa trên cấu trúc giao diện thư mục UI, dự án này là một nền tảng Thương mại điện tử (E-commerce B2C) hoàn chỉnh, phục vụ 3 nhóm đối tượng người dùng chính: Khách hàng vãng lai (Public/Guest), Khách hàng thành viên (User), và Quản trị viên (Admin).**

Dưới đây là phân tích chi tiết các module và chức năng của dự án:

## 1. Khu Vực Khách Hàng (Front-end Public)

Phần giao diện công khai dành cho mọi người dùng truy cập, tìm hiểu thông tin và thực hiện luồng mua sắm cơ bản.

- **Trang chủ (`home`):** Giao diện chính của website, hiển thị các sản phẩm nổi bật, banner quảng cáo, danh mục và điều hướng người dùng.
- **Giới thiệu (`about`):** Cung cấp thông tin về cửa hàng, tầm nhìn, sứ mệnh và lịch sử hình thành.
- **Liên hệ (`contact`):** Trang thông tin liên hệ bao gồm địa chỉ, số điện thoại, và form để khách hàng gửi tin nhắn/phản hồi.
- **Chi tiết sản phẩm (`product_detail`):** Trang hiển thị thông tin chi tiết của một sản phẩm (hình ảnh, giá cả, thông số kỹ thuật, đánh giá) và nút chức năng thêm vào giỏ hàng.
- **Giỏ hàng & Thanh toán (`cart_checkout`):** Quản lý các sản phẩm khách hàng đã chọn mua và quy trình điền thông tin giao hàng để tiến hành thanh toán.
- **Hỗ trợ tự động (`chatbot`):** Tích hợp trợ lý ảo Chatbot trên giao diện để tự động giải đáp các thắc mắc thường gặp của khách hàng.
- **Đăng nhập/Đăng ký (`login`):** Hệ thống xác thực cho phép người dùng tạo tài khoản mới hoặc đăng nhập vào hệ thống.

## 2. Khu Vực Quản Lý Tài Khoản (User Dashboard)

Dành cho người dùng (khách hàng) đã đăng ký và đăng nhập, giúp họ quản lý thông tin cá nhân và theo dõi hoạt động mua sắm.

- **Bảng điều khiển (`account_dashboard`):** Trang tổng quan hiển thị sau khi người dùng đăng nhập thành công.
- **Hồ sơ cá nhân (`account_profile`):** Quản lý và chỉnh sửa thông tin cá nhân (Họ tên, số điện thoại, địa chỉ nhận hàng, thay đổi mật khẩu...).
- **Lịch sử đơn hàng (`account_orders`):** Nơi người dùng theo dõi trạng thái các đơn hàng đang giao và xem lại chi tiết các đơn hàng đã hoàn tất.

## 3. Khu Vực Quản Trị Hệ Thống (Admin Dashboard)

Khu vực dành riêng cho chủ cửa hàng hoặc nhân viên quản trị để vận hành và kiểm soát toàn bộ hoạt động kinh doanh trên website.

- **Tổng quan quản trị (`admin_general`):** Trang Dashboard của Admin, tóm tắt các số liệu quan trọng nhất (doanh thu ngày, đơn hàng pending, thông báo hệ thống...).
- **Quản lý sản phẩm (`admin_products`):** Chức năng thêm mới, chỉnh sửa, xóa và phân loại (danh mục) các sản phẩm được bán trên website.
- **Quản lý đơn hàng (`admin_orders`):** Theo dõi danh sách toàn bộ đơn hàng, cập nhật và thay đổi trạng thái đơn (chờ xác nhận, đang đóng gói, đang giao, đã giao, hoàn hủy...).
- **Quản lý khách hàng (`admin_customer`):** Quản lý dữ liệu người dùng đã đăng ký, hỗ trợ kiểm tra thông tin liên hệ và lịch sử mua hàng của từng tài khoản.
- **Quản lý đánh giá (`admin_reviews`):** Quản lý, kiểm duyệt và phản hồi các đánh giá của khách hàng về sản phẩm trên website.
- **Quản lý kho hàng (`admin_stock`):** Quản trị số lượng sản phẩm nhập, xuất và tồn kho nhằm đảm bảo nguồn cung ổn định.
- **Thống kê & Báo cáo (`admin_statistic`):** Cung cấp các công cụ tổng hợp dữ liệu, báo cáo doanh thu, sản phẩm bán chạy, lưu lượng truy cập... theo các mốc thời gian (ngày/tuần/tháng) phục vụ cho việc ra quyết định kinh doanh.

---

**Kết luận:**
Dự án Web Bán Đá Muối được tổ chức bài bản, bám sát nghiệp vụ một website e-commerce tiêu chuẩn. Ngoài các tính năng cốt lõi (Xem hàng - Đặt hàng - Quản trị đơn/kho), dự án còn chú trọng đến trải nghiệm người dùng thông qua hệ thống Chatbot tự động và khả năng cung cấp số liệu thống kê chi tiết cho việc quản lý kinh doanh.
