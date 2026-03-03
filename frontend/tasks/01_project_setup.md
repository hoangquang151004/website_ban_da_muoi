# Nhóm 1: Cấu trúc Project & Thiết lập ban đầu

Mục tiêu chung: Xây dựng nền móng cấu trúc thư mục, config cần thiết để bắt đầu code giao diện.

- [x] Thiết lập cấu trúc thư mục chuẩn
  - **Mục tiêu**: Tạo các folder `components`, `lib`, `hooks`, `services`, `types`, `store` trong `src/`.
  - **Input**: Không bài bản (setup ban đầu từ khung Next.js).
  - **Output**: Cấu trúc thư mục tương ứng `setup.md`.
  - **DoD (Definition of Done)**: Có đầy đủ thư mục phân tách, không có lỗi cấu trúc.

- [x] Cấu hình Global Styles & Layout
  - **Mục tiêu**: Đưa CSS global vào `src/app/globals.css`, tạo `RootLayout` kết nối các font chữ hệ thống hoặc icon chung.
  - **Input**: File CSS hoặc font chuẩn lấy từ file gốc của team UI.
  - **Output**: File `src/app/globals.css`, `src/app/layout.tsx`.
  - **DoD**: CSS chạy được, app hiển thị cơ bản không bị vỡ font hay mất normalize.

- [x] Khởi tạo UI Components dùng chung (Cơ bản)
  - **Mục tiêu**: Cắt các thành phần dùng mọi nơi: Button, Input, Modal, Pagination tránh bị lặp code.
  - **Input**: Nhận diện các elements chung xuyên suốt toàn bộ thư mục `UI/`.
  - **Output**: Các component đặt trong `src/components/ui/`.
  - **DoD**: Gọi thử component vào `page.tsx` test và hiển thị chuẩn UI, truyền nhận `props` hoạt động ổn định.
