# Task 02 — Kết nối Trang Chủ với API

**Ước tính:** 45 phút  
**Phụ thuộc:** Task 01 hoàn thành  
**File cần sửa:** `frontend/src/app/(shop)/page.tsx`

---

## Vấn đề hiện tại

File `(shop)/page.tsx` hiện đang dùng mảng tĩnh `PRODUCTS[]` và `CATEGORIES[]` hardcoded.  
Filter/sort chạy trên mock data local — không phản ánh dữ liệu thực từ DB.

---

## Thay đổi cần thực hiện

### 1. Xóa mock data, thay bằng state từ API

Ở đầu component, thêm import và state:

```tsx
import { productService } from "@/services/productService";

// Thêm các state:
const [products, setProducts] = useState<Product[]>([]);
const [categories, setCategories] = useState<Category[]>([]);
const [totalPages, setTotalPages] = useState(1);
const [isLoading, setIsLoading] = useState(true);
```

### 2. Thêm useEffect fetch sản phẩm

Thay toàn bộ logic filter mock bằng:

```tsx
useEffect(() => {
  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const params: Record<string, unknown> = {
        page: currentPage,
        limit: 12,
      };
      if (searchQuery) params.search = searchQuery;
      if (selectedCategories.length === 1)
        params.category_slug = selectedCategories[0];
      if (sortBy === "gia-tang") params.sort_by = "price_asc";
      else if (sortBy === "gia-giam") params.sort_by = "price_desc";
      else if (sortBy === "moi-nhat") params.sort_by = "newest";

      const res = await productService.getProducts(params);
      // Backend trả BaseResponse<PaginatedData> — truy cập .data.items
      const paginatedData = (res as any)?.data ?? res;
      setProducts(paginatedData.items ?? []);
      setTotalPages(paginatedData.total_pages ?? 1);
    } catch (err) {
      console.error("Lỗi tải sản phẩm:", err);
    } finally {
      setIsLoading(false);
    }
  };
  fetchProducts();
}, [searchQuery, selectedCategories, sortBy, currentPage]);
```

### 3. Fetch danh mục từ API

```tsx
useEffect(() => {
  const fetchCategories = async () => {
    try {
      const res = await productService.getCategories();
      const data = (res as any)?.data ?? res;
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Lỗi tải danh mục:", err);
    }
  };
  fetchCategories();
}, []);
```

### 4. Thêm method `getCategories` vào `productService.ts`

```typescript
// Thêm vào cuối object productService:
async getCategories(): Promise<Category[]> {
  const { data } = await httpClient.get("/categories");
  return data;
},
```

### 5. Hiển thị loading skeleton

Bao quanh phần product grid bằng điều kiện:

```tsx
{isLoading ? (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
    {Array.from({ length: 8 }).map((_, i) => (
      <div key={i} className="bg-slate-100 rounded-2xl h-72 animate-pulse" />
    ))}
  </div>
) : products.length === 0 ? (
  <div className="text-center py-20 text-slate-400">
    <span className="material-symbols-outlined text-5xl">search_off</span>
    <p className="mt-3">Không tìm thấy sản phẩm phù hợp</p>
  </div>
) : (
  <div className="grid ...">
    {products.map((product) => (
      // render ProductCard như cũ nhưng dùng product.slug, product.name, product.price
    ))}
  </div>
)}
```

### 6. Map field API → UI

Backend trả về các field theo snake_case, cần map khi render:

| Field UI hiện tại | Field từ API backend                                 |
| ----------------- | ---------------------------------------------------- |
| `product.name`    | `product.name` ✅                                    |
| `product.price`   | `product.price` (số, đơn vị VND) ✅                  |
| `product.slug`    | `product.slug` ✅                                    |
| `product.image`   | `product.image_url` ⚠️ cần đổi                       |
| `product.rating`  | Tính từ review hoặc để mặc định 4.5 nếu API chưa trả |
| `product.badge`   | Dùng `product.is_featured` → badge "Nổi bật"         |

---

## Kiểm tra hoàn thành (DoD)

- [ ] Trang chủ hiển thị đúng sản phẩm từ DB (không phải mock)
- [ ] Filter theo danh mục hoạt động (gọi API với `category_slug`)
- [ ] Search theo tên sản phẩm hoạt động (debounce 450ms)
- [ ] Sort theo giá / mới nhất hoạt động
- [ ] Hiện skeleton loading khi đang fetch
- [ ] Khi không có kết quả → hiển thị empty state
- [ ] Click vào product card → điều hướng đến `/product/[slug]`
