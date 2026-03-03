# Nhóm 6: Chuyển đổi UI - Trang Quản lý Danh mục & Công dụng

Mục tiêu chung: Chuyển đổi trang mới `UI/admin_categories_and_uses/code.html` thành Next.js page, tích hợp vào Admin Layout sẵn có. Trang gồm 2 section độc lập: **Quản lý Danh mục** và **Quản lý Công dụng (Tag)**.

---

- [ ] Tạo route & page Quản lý Danh mục & Công dụng
  - **Mục tiêu**: Chuyển file HTML tĩnh thành `page.tsx` Next.js, đặt đúng route admin.
  - **Input**: `UI/admin_categories_and_uses/code.html`
  - **Output**: `src/app/admin/categories/page.tsx`
  - **Ghi chú route**: Thêm mục `Danh mục & Công dụng` vào `Sidebar.tsx` với `href="/admin/categories"`, icon `category` (Material Symbols), highlight active khi đang ở route này.
  - **DoD**: Truy cập `/admin/categories` render đúng layout admin (sidebar + header), không bị lỗi hydration.

- [ ] Section 1 — Bảng Quản lý Danh mục
  - **Mục tiêu**: Dựng bảng danh sách danh mục với đầy đủ cột và tương tác UI.
  - **Cấu trúc bảng** (6 cột):
    - **Ảnh**: thumbnail `size-10 rounded-lg`, fallback icon `image_not_supported` khi không có ảnh
    - **Tên danh mục**: tên in đậm + mô tả phụ chữ nhỏ bên dưới
    - **Số lượng SP**: badge `bg-slate-100` hiển thị số sản phẩm thuộc danh mục
    - **Ngày tạo**: định dạng `dd/MM/yyyy`
    - **Trạng thái**: toggle switch — `bg-primary` khi bật, `bg-slate-200` khi tắt, thumb dịch chuyển `translate-x-6` / `translate-x-1`
    - **Thao tác**: nút Edit (hover `text-primary`) + nút Delete (hover `text-red-500`)
  - **Mock data**: 4 danh mục — Đèn đá muối tự nhiên (45 SP), Đá muối ngâm chân (12 SP), Đá massage (28 SP, tắt), Đèn ngủ chế tác (18 SP)
  - **DoD**: Bảng render đúng 4 dòng mock. Toggle click đổi visual state (CSS only, chưa cần gọi API). Nút delete hiển thị hover state đổi màu đỏ.

- [ ] Section 2 — Bảng Quản lý Công dụng (Tag)
  - **Mục tiêu**: Dựng bảng quản lý tag công dụng gắn vào sản phẩm — kiểu thiết kế nhẹ hơn, không có ảnh.
  - **Cấu trúc bảng** (4 cột):
    - **Tên công dụng**: icon tròn màu (Material Symbols) + tên in đậm — mỗi tag một màu riêng:
      - Phong thủy: `bg-amber-100 text-amber-600`, icon `spa`
      - Trị mất ngủ: `bg-blue-100 text-blue-600`, icon `bedtime`
      - Lọc không khí: `bg-emerald-100 text-emerald-600`, icon `air`
      - Thiền định: `bg-purple-100 text-purple-600`, icon `self_improvement`
    - **Mô tả hiển thị**: đoạn text mô tả ngắn
    - **Trạng thái**: toggle switch (cùng pattern với bảng Danh mục)
    - **Thao tác**: nút Edit + nút Delete
  - **Mock data**: 4 tag — Phong thủy (bật), Trị mất ngủ (bật), Lọc không khí (bật), Thiền định (tắt)
  - **DoD**: Icon màu đúng từng tag. Toggle Thiền định render ở trạng thái off (thumb `translate-x-1`, bg `slate-200`).

- [ ] Modal Thêm/Sửa Danh mục
  - **Mục tiêu**: Popup form khi click nút **"Thêm mới"** hoặc nút Edit ở bảng Danh mục.
  - **Fields**:
    - Tên danh mục (input text, required)
    - Mô tả (textarea)
    - Upload ảnh (input file, preview thumbnail)
    - Trạng thái (toggle switch)
  - **Behavior**:
    - Nút "Thêm mới" → form trống, tiêu đề modal "Thêm danh mục mới"
    - Nút Edit trên dòng → form điền sẵn dữ liệu dòng đó, tiêu đề "Chỉnh sửa danh mục"
    - Click backdrop hoặc nút Cancel → đóng modal
  - **DoD**: Modal mở/đóng không gây re-render toàn trang. `useState` quản lý `isOpen` và `editingItem`.

- [ ] Modal Thêm/Sửa Công dụng
  - **Mục tiêu**: Popup form tương tự cho bảng Công dụng.
  - **Fields**:
    - Tên công dụng (input text, required)
    - Icon (input text — tên Material Symbols icon, VD: `spa`)
    - Màu sắc (select — Amber, Blue, Emerald, Purple, Red, Slate)
    - Mô tả (textarea)
    - Trạng thái (toggle switch)
  - **DoD**: Chọn màu → preview icon tròn đổi màu tương ứng ngay trong form.

- [ ] Modal xác nhận Xóa (dùng chung)
  - **Mục tiêu**: Dialog confirm trước khi xóa — dùng chung cho cả danh mục lẫn công dụng.
  - **Nội dung**: Icon cảnh báo đỏ + text "Bạn có chắc muốn xóa [tên item]? Hành động này không thể hoàn tác."
  - **Buttons**: "Hủy" (secondary) + "Xóa" (red, `bg-red-500`)
  - **DoD**: Click "Xóa" → xóa item khỏi mock array bằng `useState`. Click "Hủy" → đóng modal, không thay đổi data.

- [ ] Cập nhật Sidebar — Thêm mục điều hướng mới
  - **Mục tiêu**: Thêm link `Danh mục & Công dụng` vào `Sidebar.tsx` đúng vị trí trong menu (giữa Sản phẩm và Đơn hàng).
  - **Input**: `src/components/admin/Sidebar.tsx`
  - **Output**: Sidebar có thêm mục với `href="/admin/categories"`, icon `category`.
  - **DoD**: Active state highlight (`bg-primary/10 text-primary`) khi đang ở `/admin/categories`. Các trang admin khác không bị ảnh hưởng.
