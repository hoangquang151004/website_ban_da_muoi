# Task 05 — Kết nối Admin Khách hàng & Đánh giá với API

**Ước tính:** 60 phút  
**Phụ thuộc:** Task 01 hoàn thành  
**File cần tạo:** `frontend/src/services/adminService.ts`  
**File cần sửa:** `frontend/src/app/admin/customers/page.tsx`  
**File cần sửa:** `frontend/src/app/admin/reviews/page.tsx`

---

## Bước 1 — Tạo `frontend/src/services/adminService.ts`

```typescript
import httpClient from "@/lib/httpClient";

export const adminService = {
  // ─── Khách hàng ─────────────────────────────────────────
  async getCustomers(params?: {
    search?: string;
    is_active?: boolean;
    page?: number;
    limit?: number;
  }) {
    const { data } = await httpClient.get("/admin/users", { params });
    return data?.data ?? data; // { items: User[], total, page, limit }
  },

  async toggleUserActive(userId: number, is_active: boolean) {
    const { data } = await httpClient.patch(`/admin/users/${userId}/status`, {
      is_active,
    });
    return data?.data ?? data;
  },

  async updateUserRole(userId: number, role: "admin" | "customer") {
    const { data } = await httpClient.patch(`/admin/users/${userId}/role`, {
      role,
    });
    return data?.data ?? data;
  },

  // ─── Đánh giá ───────────────────────────────────────────
  async getReviews(params?: {
    search?: string;
    status?: "pending" | "approved" | "rejected";
    rating?: number;
    page?: number;
    limit?: number;
  }) {
    const { data } = await httpClient.get("/admin/reviews", { params });
    return data?.data ?? data; // { items: Review[], total }
  },

  async approveReview(reviewId: number) {
    const { data } = await httpClient.patch(
      `/admin/reviews/${reviewId}/approve`,
    );
    return data?.data ?? data;
  },

  async rejectReview(reviewId: number) {
    const { data } = await httpClient.patch(
      `/admin/reviews/${reviewId}/reject`,
    );
    return data?.data ?? data;
  },

  async deleteReview(reviewId: number) {
    const { data } = await httpClient.delete(`/admin/reviews/${reviewId}`);
    return data;
  },
};
```

---

## Bước 2 — Sửa `admin/customers/page.tsx`

### Thay mock data bằng fetch từ API

```tsx
"use client";
import { useEffect, useState, useMemo } from "react";
import { adminService } from "@/services/adminService";

// ─── Thêm state ────────────────────────────────────────────────────────────
const [customers, setCustomers] = useState<Customer[]>([]);
const [isLoading, setIsLoading] = useState(true);
const [searchQuery, setSearchQuery] = useState("");
const [filterStatus, setFilterStatus] = useState<"all" | "active" | "locked">(
  "all",
);

// ─── Load khi mount hoặc filter thay đổi ───────────────────────────────────
useEffect(() => {
  const load = async () => {
    setIsLoading(true);
    try {
      const result = await adminService.getCustomers({
        search: searchQuery || undefined,
        is_active:
          filterStatus === "all" ? undefined : filterStatus === "active",
        limit: 50,
      });
      const items = result?.items ?? [];
      setCustomers(
        items.map((u: any) => ({
          id: u.id,
          name: u.full_name,
          email: u.email,
          phone: u.phone ?? "—",
          orderCount: u.order_count ?? 0,
          totalSpend: u.total_spend ?? 0,
          joinDate: new Date(u.created_at).toLocaleDateString("vi-VN"),
          isActive: u.is_active,
          role: u.role,
        })),
      );
    } catch (err) {
      console.error("Lỗi tải danh sách khách hàng:", err);
    } finally {
      setIsLoading(false);
    }
  };
  load();
}, [searchQuery, filterStatus]);
```

> **Lưu ý:** Nếu backend không hỗ trợ filter server-side, tải một lần rồi filter client-side bằng `useMemo`.

### Nối nút Khóa / Mở khoá

```tsx
const handleToggleLock = async (customerId: number, currentActive: boolean) => {
  try {
    await adminService.toggleUserActive(customerId, !currentActive);
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === customerId ? { ...c, isActive: !currentActive } : c,
      ),
    );
    setConfirmModal({ open: false, customerId: null });
  } catch (err: any) {
    alert(err?.response?.data?.message ?? "Lỗi cập nhật trạng thái");
  }
};
```

---

## Bước 3 — Sửa `admin/reviews/page.tsx`

```tsx
"use client";
import { useEffect, useState } from "react";
import { adminService } from "@/services/adminService";

// ─── Thay mock array bằng state ───────────────────────────────────────────
const [reviews, setReviews] = useState<Review[]>([]);
const [isLoading, setIsLoading] = useState(true);
const [filterRating, setFilterRating] = useState<number | "all">("all");
const [filterStatus, setFilterStatus] = useState<
  "pending" | "approved" | "rejected" | "all"
>("all");

useEffect(() => {
  const load = async () => {
    setIsLoading(true);
    try {
      const result = await adminService.getReviews({
        rating: filterRating === "all" ? undefined : filterRating,
        status: filterStatus === "all" ? undefined : filterStatus,
        limit: 100,
      });
      const items = result?.items ?? [];
      setReviews(
        items.map((r: any) => ({
          id: r.id,
          productName: r.product?.name ?? "—",
          productImage: r.product?.image_url ?? null,
          rating: r.rating,
          comment: r.comment,
          customerName: r.user?.full_name ?? "Ẩn danh",
          date: new Date(r.created_at).toLocaleDateString("vi-VN"),
          status: r.status,
        })),
      );
    } catch (err) {
      console.error("Lỗi tải đánh giá:", err);
    } finally {
      setIsLoading(false);
    }
  };
  load();
}, [filterRating, filterStatus]);
```

### Nối nút Duyệt / Từ chối / Xóa

```tsx
const handleApprove = async (reviewId: number) => {
  await adminService.approveReview(reviewId);
  setReviews((prev) =>
    prev.map((r) => (r.id === reviewId ? { ...r, status: "approved" } : r)),
  );
};

const handleReject = async (reviewId: number) => {
  await adminService.rejectReview(reviewId);
  setReviews((prev) =>
    prev.map((r) => (r.id === reviewId ? { ...r, status: "rejected" } : r)),
  );
};

const handleDelete = async (reviewId: number) => {
  await adminService.deleteReview(reviewId);
  setReviews((prev) => prev.filter((r) => r.id !== reviewId));
  setDeleteId(null);
};
```

---

## Kiểm tra hoàn thành (DoD)

- [ ] `/admin/customers` hiển thị danh sách người dùng từ DB
- [ ] Tìm kiếm khách hàng theo tên/email → lọc đúng
- [ ] Nút Khóa → tài khoản bị khoá (không thể đăng nhập)
- [ ] Nút Mở khoá → tài khoản hoạt động lại
- [ ] `/admin/reviews` hiển thị đánh giá từ DB
- [ ] Filter theo số sao → đúng
- [ ] Duyệt / Từ chối review → cập nhật trạng thái ngay
- [ ] Xóa review → biến mất khỏi danh sách
