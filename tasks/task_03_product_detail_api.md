# Task 03 — Kết nối Trang Chi tiết Sản phẩm với API

**Ước tính:** 40 phút  
**Phụ thuộc:** Task 01 hoàn thành  
**File cần sửa:** `frontend/src/app/(shop)/product/[slug]/page.tsx`

---

## Vấn đề hiện tại

File `product/[slug]/page.tsx` hiện là Server Component thuần tĩnh — không nhận `params.slug`, không gọi API. Mọi URL `/product/bat-ky-slug-nao` đều render cùng một trang giống nhau.

---

## Thay đổi cần thực hiện

### 1. Chuyển thành dynamic page nhận params

Đổi signature của component:

```tsx
"use client";
import { useEffect, useState } from "react";
import { useParams, notFound } from "next/navigation";
import { productService } from "@/services/productService";

interface ProductDetail {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  original_price: number | null;
  stock: number;
  image_url: string | null;
  is_featured: boolean;
  category: { id: number; name: string; slug: string };
  uses: { id: number; name: string; icon: string; color: string }[];
  reviews: ReviewItem[];
  average_rating: number;
}

interface ReviewItem {
  id: number;
  rating: number;
  comment: string;
  created_at: string;
  user: { full_name: string };
}

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFoundError, setNotFoundError] = useState(false);

  useEffect(() => {
    if (!slug) return;
    const fetchProduct = async () => {
      setIsLoading(true);
      try {
        const res = await productService.getProductBySlug(slug);
        // Backend trả BaseResponse → truy cập .data
        const data = (res as any)?.data ?? res;
        setProduct(data);
      } catch (err: any) {
        if (err?.response?.status === 404) {
          setNotFoundError(true);
        }
        console.error("Lỗi tải sản phẩm:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProduct();
  }, [slug]);

  if (isLoading) return <ProductDetailSkeleton />;
  if (notFoundError || !product) return notFound();

  // render UI với product thực...
}
```

### 2. Thay đổi các chỗ hiển thị data cứng → dùng biến `product`

| Vị trí trong UI         | Data cứng hiện tại                | Thay bằng                                     |
| ----------------------- | --------------------------------- | --------------------------------------------- |
| Breadcrumb tên danh mục | `"Đèn ngủ"`                       | `product.category.name`                       |
| Breadcrumb tên sản phẩm | `"Đèn đá muối hình cầu tự nhiên"` | `product.name`                                |
| Ảnh sản phẩm            | URL cứng                          | `product.image_url \|\| '/placeholder.jpg'`   |
| Tên sản phẩm h1         | hardcoded                         | `product.name`                                |
| Giá                     | `"2.300.000đ"`                    | `product.price.toLocaleString('vi-VN') + 'đ'` |
| Giá gốc                 | `"2.800.000đ"`                    | `product.original_price` (ẩn nếu null)        |
| Mô tả                   | hardcoded                         | `product.description`                         |
| Tags công dụng          | hardcoded                         | `product.uses.map(u => <span>...)`            |
| Tồn kho / nút mua       | hardcoded "còn 15 cái"            | `product.stock > 0 ? "Còn hàng" : "Hết hàng"` |
| Rating                  | `4.8`                             | `product.average_rating`                      |
| Reviews                 | mock array                        | `product.reviews`                             |

### 3. Thêm nút "Thêm vào giỏ" thực sự

```tsx
import { useCartStore } from "@/store/cartStore";

const addToCart = useCartStore((s) => s.addItem);

const handleAddToCart = () => {
  addToCart({
    id: product.id,
    name: product.name,
    price: product.price,
    image: product.image_url ?? "",
    slug: product.slug,
    quantity: selectedQuantity,
  });
  // Hiển thị toast thông báo
};
```

### 4. Thêm skeleton component

```tsx
function ProductDetailSkeleton() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="bg-slate-100 rounded-2xl h-96 animate-pulse" />
        <div className="space-y-4">
          <div className="h-8 bg-slate-100 rounded w-3/4 animate-pulse" />
          <div className="h-6 bg-slate-100 rounded w-1/2 animate-pulse" />
          <div className="h-4 bg-slate-100 rounded animate-pulse" />
          <div className="h-4 bg-slate-100 rounded animate-pulse" />
        </div>
      </div>
    </main>
  );
}
```

### 5. Sửa `productService.getProductBySlug` để xử lý BaseResponse

Backend trả `BaseResponse<ProductResponse>`, nên cần unwrap:

```typescript
// Trong productService.ts — sửa method getProductBySlug:
async getProductBySlug(slug: string): Promise<any> {
  const { data } = await httpClient.get(`/products/${slug}`);
  // data là BaseResponse { status, data: ProductResponse, message }
  return data?.data ?? data;
},
```

---

## Kiểm tra hoàn thành (DoD)

- [ ] Truy cập `/product/den-da-muoi-tu-nhien-size-l` → hiển thị đúng sản phẩm từ DB
- [ ] Breadcrumb hiển thị đúng tên và danh mục
- [ ] Ảnh sản phẩm hiện ra (hoặc placeholder nếu không có)
- [ ] Tags công dụng hiển thị đúng theo dữ liệu DB
- [ ] `/product/slug-khong-ton-tai` trả về trang 404
- [ ] Nút "Thêm vào giỏ" hoạt động → badge số ở header tăng
- [ ] Loading skeleton hiển thị khi đang fetch
