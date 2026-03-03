# Hướng dẫn Thiết lập và Chuyển đổi Giao diện (UI Mapping Guide)

Tài liệu này mô tả chi tiết quy trình chuyển đổi các giao diện tĩnh từ thư mục `UI` tích hợp vào hệ thống frontend (Next.js) của dự án. Mục tiêu là tạo ra tính đồng nhất trong tổ chức thư mục, quy tắc đặt tên, cấu trúc component và tiến độ thực hiện cho toàn bộ nhóm phát triển.

---

## 1. Tổ chức Thư mục (Directory Structure)

Dự án sử dụng Next.js (App Router hoặc Pages Router tùy thuộc vào cấu hình, ở đây giả định sử dụng cấu trúc `src` tiêu chuẩn).

Cấu trúc thư mục được đề xuất bên trong `src/`:

```text
src/
├── app/                  # Chứa các routes chính (Next.js App Router)
│   ├── (admin)/          # Group routes cho phần quản trị admin
│   ├── (shop)/           # Group routes cho phần cửa hàng hiển thị với user
│   ├── (auth)/           # Group routes cho phần xác thực (login, register)
│   └── globals.css       # Style global
├── components/           # Các React components có thể tái sử dụng
│   ├── ui/               # Components cơ bản (Button, Input, Modal, ...)
│   ├── layout/           # Components bố cục (Header, Footer, Sidebar, ...)
│   ├── admin/            # Components đặc thù cho trang admin
│   └── shop/             # Components đặc thù cho trang cửa hàng
├── lib/                  # Các hàm tiện ích (utils), configs, axios wrapper
├── hooks/                # Custom React hooks (ví dụ: useDebounce, useAuth, ...)
├── store/                # Quản lý state toàn cục (Zustand/Redux/Context API)
├── services/             # Lớp gọi API (fetch data), chia theo các entities
└── types/                # Types/Interfaces cho TypeScript (models)
```

---

## 2. Quy tắc Đặt tên (Naming Conventions)

- **Thư mục & Tên file Route (App Router):** Kebab-case (`kebab-case`). Ví dụ: `product-detail`, `cart-checkout`.
- **Tên file Component (.tsx):** PascalCase (`PascalCase`). Ví dụ: `ProductCard.tsx`, `Header.tsx`.
- **Hàm/Biến (.ts):** camelCase (`camelCase`). Ví dụ: `formatCurrency()`, `userData`.
- **Tên Component:** Phải rõ ràng, phản ánh chức năng của nó. Ví dụ: `AdminSidebar`, không đặt là `Sidebar2`.
- **Styles/CSS (nếu dùng module):** Kebab-case. Ví dụ: `button-styles.module.css`. (Khuyến khích dùng TailwindCSS thống nhất để xử lý style trực tiếp).

---

## 3. Cấu trúc Component Mẫu

Một component tiêu chuẩn phải được chia rõ ràng theo cấu trúc phân tách logic và giao diện.

```tsx
"use client"; // Nếu component có tương tác state hoặc lifecycle

import React, { useState, useEffect } from "react";
import styles from "./Component.module.css"; // Nếu không xài Tailwind

// 1. Khai báo Types
interface IProductCardProps {
  id: string;
  name: string;
  price: number;
}

// 2. Định nghĩa Component
const ProductCard: React.FC<IProductCardProps> = ({ id, name, price }) => {
  // 3. State và Hooks
  const [isHovered, setIsHovered] = useState(false);

  // 4. Hàm xử lý logic (Event handlers)
  const handleAddToCart = () => {
    // Xử lý thêm vào giỏ hàng
  };

  // 5. Render UI
  return (
    <div
      className="p-4 border rounded shadow-sm"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <h3>{name}</h3>
      <p>{price} VNĐ</p>
      <button onClick={handleAddToCart}>Thêm vào giỏ hàng</button>
    </div>
  );
};

export default ProductCard;
```

---

## 4. Quản lý State, Routing, và Tích hợp API

### 4.1. Quản lý State (State Management)

- **Local State:** Sử dụng `useState` và `useReducer` cho các state chỉ tồn tại bên trong nội bộ Component.
- **Global State:** Sử dụng Context API hoặc Zustand/Redux Toolkit cho state chia sẻ giữa nhiều pages, ví dụ:
  - Thông tin user đã đăng nhập (`auth state`).
  - Dữ liệu giỏ hàng (`cart state`).
- **Server State (API Data):** Khuyến khích sử dụng `React Query` (TanStack Query) hoặc `SWR` để quản lý caching, background fetching.

### 4.2. Routing (Điều hướng)

- Sử dụng cơ chế App Router của Next.js, ánh xạ các file UI thành các folder route trong `src/app`.
- Sử dụng thẻ `Link` (import từ `next/link`) thay vì thẻ `<a>` để điều hướng nội bộ (giúp SPA transition mượt mà).
- Route bảo vệ (Protected Routes): Sử dụng Middleware (`middleware.ts`) của Next.js để chặn chưa đăng nhập truy cập vào `(admin)/*` hoặc user dashboard.

### 4.3. Tích hợp API (API Integration)

- Khởi tạo base instance (sử dụng Axios hoặc Fetch API) trong `src/lib/httpClient.ts`, đính kèm cấu hình mặc định như Token xác thực ở Header.
- Xây dựng lớp dịch vụ riêng rẽ tại `src/services/` cho các endpoint (ví dụ: `src/services/productService.ts`).
- Xử lý lỗi (Error Handling): Base component cần bắt các lỗi HTTP Exception chuẩn (401 Unauthorized, 404 Not Found, 500 Internal Error) và hiển thị thông báo thay vì sập ứng dụng.

---

## 5. Tiến độ Chuyển đổi và Checklist (UI Mapping Tracker)

Sử dụng checklist dưới đây để theo dõi tiến độ tích hợp HTML/CSS từ thư mục `UI/` sang React Component / Next.js Pages.

> Đánh dấu `[x]` khi hoàn thành các bước: (1) Cắt HTML sang TSX, (2) Chia Component con, (3) Hook up state tạm thời, (4) Responsive.

### Danh sách các trang (Pages)

- [ ] **Home** (`UI/home`)
  - [ ] Map thành trang chủ route `/`
- [ ] **Login** (`UI/login`)
  - [ ] Map thành `/login`, `/register`
- [ ] **Product Detail** (`UI/product_detail`)
  - [ ] Map thành `/product/[slug]` hoặc `/product/[id]`
- [ ] **Cart & Checkout** (`UI/cart_checkout`)
  - [ ] Map thành `/cart` và `/checkout`
- [ ] **About** (`UI/about`)
  - [ ] Map thành `/about`
- [ ] **Contact** (`UI/contact`)
  - [ ] Map thành `/contact`
- [ ] **Chatbot** (`UI/chatbot`)
  - [ ] Map thành component Global Chat floating trên mọi trang

### User Account Dashboard

- [ ] **Account Dashboard** (`UI/account_dashboard`)
  - [ ] Map thành `/account`
- [ ] **Account Profile** (`UI/account_profile`)
  - [ ] Map thành `/account/profile`
- [ ] **Account Orders** (`UI/account_orders`)
  - [ ] Map thành `/account/orders`

### Trình quản trị Admin (Admin Portal)

_Lưu ý dùng chung một Admin Layout._

- [ ] **Admin General (Dashboard)** (`UI/admin_general`)
  - [ ] Map thành `/admin` hoặc `/admin/dashboard`
- [ ] **Admin Products** (`UI/admin_products`)
  - [ ] Map thành `/admin/products`
- [ ] **Admin Orders** (`UI/admin_orders`)
  - [ ] Map thành `/admin/orders`
- [ ] **Admin Customer** (`UI/admin_customer`)
  - [ ] Map thành `/admin/customers`
- [ ] **Admin Reviews** (`UI/admin_reviews`)
  - [ ] Map thành `/admin/reviews`
- [ ] **Admin Statistic** (`UI/admin_statistic`)
  - [ ] Map thành `/admin/statistics`
- [ ] **Admin Stock** (`UI/admin_stock`)
  - [ ] Map thành `/admin/stock`

---

## 6. Quy trình làm việc (Workflow) khi chuyển đổi UI

1. **Kiểm tra UI tĩnh**: Mở trang HTML từ thư mục `UI` để xem tổng quan, phân tích chia tách component trên bản giấy/nháp (đâu là Header, Footer, SideBar, Content).
2. **Setup Route mới**: Tạo thư mục route tương ứng trong `src/app`.
3. **Copy cấu trúc**: Copy mã HTML vào file `.tsx`, đổi class thành `className`, đóng các thẻ tự đóng (`<img />`, `<input />`...), thay thế `<img src...>` bằng `<Image />` của Next.
4. **Viết Component dùng chung**: Những gì xuất hiện lại trên 2 nơi (như Product Card) phải được đưa ra `src/components/ui` hoặc `src/components/shop`.
5. **Thêm logic giả lập (Mocking)**: Sử dụng mảng array ảo để map data ban đầu cho các danh sách (như list sản phẩm).
6. **Kiểm tra Responsive**: Xác nhận hoạt động tốt trên Mobile/Tablet sau khi chuyển sang React.
7. **Commit & Push**: Xác nhận thay đổi tương ứng trên Git và đánh dấu trạng thái vào Checklist trong tài liệu này.
