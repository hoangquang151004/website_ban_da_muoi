# Kế hoạch hoàn thiện trang Quản lý Sản phẩm (Admin)

**Tệp tin mục tiêu:** `frontend/src/app/admin/products/page.tsx`
**Service mục tiêu:** `frontend/src/services/productService.ts`

## 1. Hoàn thiện chức năng Lưu sản phẩm (Thêm mới / Chỉnh sửa)

- [ ] Xử lý Upload Mô hình 3D (`formModelFile`): Gọi API upload file `.glb` / `.gltf` và thêm `model_3d_url` vào payload khởi tạo/cập nhật sản phẩm.
- [ ] Xử lý Upload Ảnh phụ (`formExtraImages`): Tạo logic upload danh sách mảng hình ảnh phụ (nếu backend hỗ trợ trường mảng ảnh phụ).
- [ ] Logic Validation Form:
  - Kiểm tra điều kiện `original_price` >= `price`.
  - Giới hạn validate định dạng và dung lượng: Ảnh (tối đa 5MB), Mô hình 3D (tối đa 50MB).

## 2. Cập nhật dữ liệu khi mở Form Chỉnh sửa (`openEdit`)

- [ ] Cập nhật giao diện `AdminProductItem` / `ProductRow`: Thêm các trường `model_3d_url` và mảng ảnh phụ để map dữ liệu chuẩn xác.
- [ ] Load file cũ vào Form Editor: Gán lại URL cho Ảnh phụ và File 3D cũ vào màn hình edit khi nhấn nút "Chỉnh sửa" một sản phẩm thay vì tự động reset.

## 3. Tối ưu hóa Tìm kiếm, Lọc và Phân trang (Server-side Pagination)

- [ ] Tái cấu trúc logic fetch data: Dừng việc fetch toàn bộ dữ liệu (max 100 items limit) một lần, chuyển sang dùng URL param/state gọi lên `productService.listAdminProducts({ page, limit, search, ... })`.
- [ ] Xử lý Side Effects (useEffect): Fetch lại data mỗi khi `currentPage`, `filterCategory`, hoặc `filterStatus` thay đổi.
- [ ] Tích hợp **Debounce (300ms - 500ms)**: Tạo một custom hook hoặc dùng timeout cho input thanh Tìm kiếm (Search) nhằm tránh gọi API thừa mứa.

## 4. Cải thiện UX/UI & Trạng thái lỗi (Error Handling)

- [ ] Thay thế thông báo (Alert): Áp dụng components Toast/Snackbar thay cho window.alert() truyền thống khi Delete, Cập nhật thông tin thành công, hoặc lỗi.
- [ ] Render lỗi chi tiết: Bắt message cụ thể từ backend và render viền đỏ input / warning text nếu thiếu dữ liệu bắt buộc (sku trùng, giá âm, v.v).
- [ ] Trạng thái Uploading: Bổ sung chỉ báo loading state chi tiết hơn (VD: "Đang tải tệp lên 1/2...") trong lúc đợi lưu form lớn chứa media thay vì thông báo "Đang lưu..." mờ nhạt.
