# Task 04 — Kết nối Admin Danh mục & Công dụng với API

**Ước tính:** 60 phút  
**Phụ thuộc:** Task 01 hoàn thành  
**File cần sửa:** `frontend/src/app/admin/categories/page.tsx`  
**File cần sửa:** `frontend/src/services/productService.ts`

---

## Vấn đề hiện tại

`admin/categories/page.tsx` dùng `INITIAL_CATEGORIES[]` và `INITIAL_USES[]` tĩnh.  
Mọi thao tác Create/Edit/Delete chỉ cập nhật `useState` local — không gọi API.

---

## Bước 1 — Thêm service methods vào `productService.ts`

Thêm vào cuối object `productService`:

```typescript
// ─── Admin: Categories ─────────────────────────────────────────────────────

async adminGetCategories(params?: { search?: string; is_active?: boolean; page?: number; limit?: number }) {
  const { data } = await httpClient.get("/admin/categories", { params });
  return data?.data ?? data; // unwrap BaseResponse
},

async adminCreateCategory(payload: { name: string; description?: string; image_url?: string }) {
  const { data } = await httpClient.post("/admin/categories", payload);
  return data?.data ?? data;
},

async adminUpdateCategory(id: number, payload: { name?: string; description?: string; image_url?: string }) {
  const { data } = await httpClient.put(`/admin/categories/${id}`, payload);
  return data?.data ?? data;
},

async adminToggleCategoryStatus(id: number, is_active: boolean) {
  const { data } = await httpClient.patch(`/admin/categories/${id}/status`, { is_active });
  return data?.data ?? data;
},

async adminDeleteCategory(id: number) {
  const { data } = await httpClient.delete(`/admin/categories/${id}`);
  return data;
},

// ─── Admin: Uses ───────────────────────────────────────────────────────────

async adminGetUses(params?: { is_active?: boolean }) {
  const { data } = await httpClient.get("/admin/uses", { params });
  return data?.data ?? data;
},

async adminCreateUse(payload: { name: string; icon: string; color: string; description?: string }) {
  const { data } = await httpClient.post("/admin/uses", payload);
  return data?.data ?? data;
},

async adminUpdateUse(id: number, payload: { name?: string; icon?: string; color?: string; description?: string }) {
  const { data } = await httpClient.put(`/admin/uses/${id}`, payload);
  return data?.data ?? data;
},

async adminToggleUseStatus(id: number, is_active: boolean) {
  const { data } = await httpClient.patch(`/admin/uses/${id}/status`, { is_active });
  return data?.data ?? data;
},

async adminDeleteUse(id: number) {
  const { data } = await httpClient.delete(`/admin/uses/${id}`);
  return data;
},
```

---

## Bước 2 — Sửa `admin/categories/page.tsx`

### Thay mock data bằng API load

```tsx
const [categories, setCategories] = useState<Category[]>([]);
const [uses, setUses] = useState<Use[]>([]);
const [isLoading, setIsLoading] = useState(true);

// Load khi mount
useEffect(() => {
  const load = async () => {
    setIsLoading(true);
    try {
      const [catRes, useRes] = await Promise.all([
        productService.adminGetCategories({ limit: 100 }),
        productService.adminGetUses(),
      ]);
      // Map API fields → component fields
      setCategories(mapCategories(catRes?.items ?? catRes ?? []));
      setUses(mapUses(Array.isArray(useRes) ? useRes : (useRes?.items ?? [])));
    } catch (err) {
      console.error("Lỗi tải dữ liệu:", err);
    } finally {
      setIsLoading(false);
    }
  };
  load();
}, []);
```

### Map function (API → component type)

```tsx
function mapCategories(items: any[]): Category[] {
  return items.map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description ?? "",
    image: c.image_url ?? null,
    productCount: c.product_count ?? 0,
    createdAt: new Date(c.created_at).toLocaleDateString("vi-VN"),
    isActive: c.is_active,
  }));
}

function mapUses(items: any[]): Use[] {
  return items.map((u) => ({
    id: u.id,
    name: u.name,
    icon: u.icon,
    // Chuyển color string "amber" → class Tailwind
    colorBg: colorToBg(u.color),
    colorText: colorToText(u.color),
    description: u.description ?? "",
    isActive: u.is_active,
  }));
}

function colorToBg(color: string) {
  const map: Record<string, string> = {
    amber: "bg-amber-100",
    blue: "bg-blue-100",
    emerald: "bg-emerald-100",
    purple: "bg-purple-100",
    red: "bg-red-100",
    slate: "bg-slate-100",
    teal: "bg-teal-100",
  };
  return map[color] ?? "bg-slate-100";
}
function colorToText(color: string) {
  const map: Record<string, string> = {
    amber: "text-amber-600",
    blue: "text-blue-600",
    emerald: "text-emerald-600",
    purple: "text-purple-600",
    red: "text-red-600",
    slate: "text-slate-600",
    teal: "text-teal-600",
  };
  return map[color] ?? "text-slate-600";
}
```

### Nối modal Create/Edit Category với API

Thay hàm `handleSaveCategory` hiện tại:

```tsx
const handleSaveCategory = async (formData: Partial<Category>) => {
  try {
    const payload = {
      name: formData.name!,
      description: formData.description,
    };
    if (modalCategory.editing) {
      const updated = await productService.adminUpdateCategory(
        modalCategory.editing.id,
        payload,
      );
      setCategories((prev) =>
        prev.map((c) =>
          c.id === updated.id ? mapCategories([updated])[0] : c,
        ),
      );
    } else {
      const created = await productService.adminCreateCategory(payload);
      setCategories((prev) => [...prev, mapCategories([created])[0]]);
    }
    setModalCategory({ open: false, editing: null });
  } catch (err: any) {
    alert(err?.response?.data?.message ?? "Lỗi lưu danh mục");
  }
};
```

### Nối toggle status với API

```tsx
const handleToggleCategory = async (id: number, currentActive: boolean) => {
  try {
    await productService.adminToggleCategoryStatus(id, !currentActive);
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isActive: !currentActive } : c)),
    );
  } catch (err) {
    alert("Lỗi cập nhật trạng thái");
  }
};
```

### Nối xóa với API

```tsx
const handleConfirmDelete = async () => {
  if (!deleteTarget) return;
  try {
    if (deleteTarget.type === "category") {
      await productService.adminDeleteCategory(deleteTarget.id);
      setCategories((prev) => prev.filter((c) => c.id !== deleteTarget.id));
    } else {
      await productService.adminDeleteUse(deleteTarget.id);
      setUses((prev) => prev.filter((u) => u.id !== deleteTarget.id));
    }
    setDeleteTarget(null);
  } catch (err: any) {
    alert(err?.response?.data?.message ?? "Không thể xóa");
  }
};
```

Thực hiện tương tự với **Uses** (adminCreateUse, adminUpdateUse, adminToggleUseStatus, adminDeleteUse).

---

## Kiểm tra hoàn thành (DoD)

- [ ] Trang `/admin/categories` load và hiển thị categories + uses từ DB
- [ ] Tạo category mới → xuất hiện trong danh sách, lưu vào DB
- [ ] Edit category → form điền sẵn data, lưu thành công
- [ ] Toggle status → DB cập nhật, trang shop không hiển thị category đã tắt
- [ ] Xóa category không có sản phẩm → thành công
- [ ] Xóa category đang có sản phẩm active → hiện thông báo lỗi từ backend
- [ ] Tương tự với Uses (create, edit, toggle, delete)
