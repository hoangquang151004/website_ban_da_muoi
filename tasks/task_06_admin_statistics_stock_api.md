# Task 06 — Kết nối Admin Thống kê & Tồn kho với API

**Ước tính:** 60 phút  
**Phụ thuộc:** Task 01 hoàn thành  
**File cần sửa:** `frontend/src/app/admin/statistics/page.tsx`  
**File cần sửa:** `frontend/src/app/admin/stock/page.tsx`  
**File cần sửa:** `frontend/src/services/adminService.ts` (thêm methods)

---

## Bước 1 — Thêm methods vào `adminService.ts`

```typescript
// ─── Thống kê ──────────────────────────────────────────────────────────────
async getStatistics(params?: { period?: "day" | "week" | "month" | "year"; date?: string }) {
  const { data } = await httpClient.get("/admin/statistics", { params });
  return data?.data ?? data;
},

async getRevenueChart(params?: { period?: "month" | "year"; year?: number }) {
  const { data } = await httpClient.get("/admin/statistics/revenue", { params });
  return data?.data ?? data;
},

async getTopProducts(params?: { limit?: number; period?: "month" | "year" }) {
  const { data } = await httpClient.get("/admin/statistics/top-products", { params });
  return data?.data ?? data;
},

// ─── Tồn kho ───────────────────────────────────────────────────────────────
async getStock(params?: { search?: string; category_id?: number; low_stock?: boolean; page?: number; limit?: number }) {
  const { data } = await httpClient.get("/admin/stock", { params });
  return data?.data ?? data; // { items: StockItem[], total }
},

async adjustStock(productId: number, payload: { quantity: number; note: string; type: "in" | "out" | "adjustment" }) {
  const { data } = await httpClient.post("/admin/stock/adjust", { product_id: productId, ...payload });
  return data?.data ?? data;
},

async getStockHistory(productId: number, params?: { limit?: number }) {
  const { data } = await httpClient.get(`/admin/stock/${productId}/history`, { params });
  return data?.data ?? data;
},
```

---

## Bước 2 — Sửa `admin/statistics/page.tsx`

Trang này hiện là **Server Component** (không có `"use client"`). Phải chuyển thành Client Component.

### Thêm `"use client"` và import hooks

```tsx
"use client";
import { useEffect, useState } from "react";
import { adminService } from "@/services/adminService";
```

### Thay hardcoded state bằng fetch

```tsx
interface StatsData {
  total_revenue: number;
  total_orders: number;
  total_customers: number;
  total_products: number;
  revenue_growth: number;
  orders_growth: number;
  customers_growth: number;
}

interface MonthlyData {
  month: string;
  revenue: number;
  orders: number;
}

interface TopCategory {
  name: string;
  revenue: number;
  percentage: number;
}

const [stats, setStats] = useState<StatsData | null>(null);
const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
const [topCategories, setTopCategories] = useState<TopCategory[]>([]);
const [isLoading, setIsLoading] = useState(true);
const [period, setPeriod] = useState<"month" | "year">("month");

useEffect(() => {
  const load = async () => {
    setIsLoading(true);
    try {
      const [overview, revenue, topCats] = await Promise.all([
        adminService.getStatistics({ period }),
        adminService.getRevenueChart({ period }),
        adminService.getTopProducts({ limit: 5, period }),
      ]);
      setStats(overview);
      setMonthlyData(Array.isArray(revenue) ? revenue : (revenue?.items ?? []));
      setTopCategories(
        Array.isArray(topCats) ? topCats : (topCats?.items ?? []),
      );
    } catch (err) {
      console.error("Lỗi tải thống kê:", err);
    } finally {
      setIsLoading(false);
    }
  };
  load();
}, [period]);
```

### Mapping KPI cards từ data thực

```tsx
const kpiCards = stats
  ? [
      {
        label: "Doanh thu tháng này",
        value: stats.total_revenue.toLocaleString("vi-VN") + "đ",
        growth: stats.revenue_growth,
      },
      {
        label: "Đơn hàng",
        value: stats.total_orders.toString(),
        growth: stats.orders_growth,
      },
      {
        label: "Khách hàng mới",
        value: stats.total_customers.toString(),
        growth: stats.customers_growth,
      },
      {
        label: "Sản phẩm",
        value: stats.total_products.toString(),
        growth: 0,
      },
    ]
  : [];
```

---

## Bước 3 — Sửa `admin/stock/page.tsx`

```tsx
// ─── Thay mock array bằng state ───────────────────────────────────────────
const [stockItems, setStockItems] = useState<StockItem[]>([]);
const [isLoading, setIsLoading] = useState(true);
const [searchQuery, setSearchQuery] = useState("");
const [showLowStockOnly, setShowLowStockOnly] = useState(false);

useEffect(() => {
  const load = async () => {
    setIsLoading(true);
    try {
      const result = await adminService.getStock({
        search: searchQuery || undefined,
        low_stock: showLowStockOnly || undefined,
        limit: 100,
      });
      const items = result?.items ?? [];
      setStockItems(
        items.map((p: any) => ({
          id: p.id,
          name: p.name,
          sku: p.sku ?? `SP${String(p.id).padStart(4, "0")}`,
          category: p.category?.name ?? "—",
          image: p.image_url ?? null,
          stock: p.stock,
          lowStockThreshold: p.low_stock_threshold ?? 10,
          price: p.price,
        })),
      );
    } catch (err) {
      console.error("Lỗi tải tồn kho:", err);
    } finally {
      setIsLoading(false);
    }
  };
  load();
}, [searchQuery, showLowStockOnly]);
```

### Nối modal "Nhập kho" với API

```tsx
// State cho modal nhậpkho
const [importModal, setImportModal] = useState<{
  open: boolean;
  productId: number | null;
  quantity: number;
  note: string;
}>({ open: false, productId: null, quantity: 0, note: "" });

const handleConfirmImport = async () => {
  if (!importModal.productId || importModal.quantity <= 0) return;
  try {
    await adminService.adjustStock(importModal.productId, {
      quantity: importModal.quantity,
      note: importModal.note || "Nhập kho",
      type: "in",
    });
    // Cập nhật số lượng local
    setStockItems((prev) =>
      prev.map((s) =>
        s.id === importModal.productId
          ? { ...s, stock: s.stock + importModal.quantity }
          : s,
      ),
    );
    setImportModal({ open: false, productId: null, quantity: 0, note: "" });
  } catch (err: any) {
    alert(err?.response?.data?.message ?? "Lỗi nhập kho");
  }
};
```

---

## Kiểm tra hoàn thành (DoD)

- [ ] `/admin/statistics` hiển thị KPIs từ data thực (doanh thu, đơn hàng, khách hàng)
- [ ] Biểu đồ doanh thu theo tháng hoạt động với data thực
- [ ] Chuyển filter "tháng / năm" → chart reload với data mới
- [ ] `/admin/stock` hiển thị danh sách sản phẩm và tồn kho thực từ DB
- [ ] Sản phẩm tồn kho thấp được hiển thị badge cảnh báo
- [ ] Modal "Nhập kho" → điền số lượng → Submit → DB cập nhật → con số tăng ngay
- [ ] Thanh tìm kiếm tên sản phẩm hoạt động
