# Task 03 — Frontend: Render Product Cards tương tác trong Chatbot

**Giai đoạn:** 2 - Tư vấn sản phẩm & CSKH  
**Ưu tiên:** 🔴 P0  
**Ước lượng:** 2–3 giờ  
**File chính:** `frontend/src/components/shop/Chatbot.tsx`  
**Phụ thuộc:** Phase 1 dispatcher đã xong, Task 02 backend payload đã xong

---

## Bối cảnh

Ở Giai đoạn 1, `response_type = "product_cards"` mới dừng ở placeholder.  
Task này thay placeholder bằng UI card thật để chatbot có thể tư vấn sản phẩm usable.

---

## Công việc cần làm

### Bước 1 — Tạo renderer `ProductCardList`

Trong `Chatbot.tsx` hoặc tách file riêng nếu component dài, thêm:

```tsx
function ProductCardList({ products }: { products?: ChatProductCard[] }) {
  if (!products?.length) return null;

  return (
    <div className="flex flex-col gap-2 w-full">
      {products.map((product) => (
        <div
          key={product.id}
          className="bg-white p-2.5 rounded-xl shadow-sm border border-slate-100 w-full overflow-hidden hover:shadow-md transition-shadow"
        >
          <div className="flex gap-3">
            <div className="w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-slate-100">
              {product.image_url ? (
                <img
                  alt={product.name}
                  className="w-full h-full object-cover"
                  src={product.image_url}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs">
                  No image
                </div>
              )}
            </div>
            <div className="flex flex-col justify-between flex-1 py-0.5">
              <div>
                <h4 className="text-slate-900 font-bold text-sm line-clamp-1">
                  {product.name}
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                  {product.short_description ??
                    "Sản phẩm đèn đá muối phù hợp cho nhu cầu của bạn."}
                </p>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-primary font-bold text-xs">
                  {product.price.toLocaleString("vi-VN")}đ
                </span>
                <span className="text-[10px] text-slate-400">
                  Còn {product.stock}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-2 flex gap-2">
            <button className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50">
              Xem chi tiết
            </button>
            <button className="rounded-lg border border-primary/20 px-3 py-2 text-xs font-medium text-primary hover:bg-primary/5">
              Thêm vào giỏ
            </button>
            <button className="rounded-lg bg-primary px-3 py-2 text-xs font-medium text-white hover:bg-orange-600">
              Mua ngay
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
```

### Bước 2 — Gắn vào `MessageRenderer`

Thay placeholder của nhánh `product_cards` bằng:

```tsx
case "product_cards":
  return (
    <>
      <TextBubble content={message.content} role={message.role} />
      <ProductCardList products={message.data?.products} />
    </>
  );
```

### Bước 3 — Wire hành động button

- `Xem chi tiết`: `router.push(`/product/${product.slug}`)`
- `Thêm vào giỏ`: gọi `useCartStore().addItem(...)`
- `Mua ngay`: thêm vào giỏ rồi điều hướng `/checkout`

Nếu chưa muốn nối hành động đầy đủ, ít nhất:

- `Xem chi tiết` phải điều hướng đúng.
- `Thêm vào giỏ` phải toast hoặc cập nhật store.

### Bước 4 — Dùng lại design hiện tại

Giữ nguyên visual language trong `Chatbot.tsx` hiện có:

- bo góc
- shadow nhẹ
- border slate
- badge giá màu primary

Không redesign toàn bộ chatbot ở phase này.

---

## Definition of Done (DoD)

- [ ] Khi backend trả `response_type = "product_cards"`, chat hiển thị danh sách card thật.
- [ ] Card hiển thị được tên, ảnh, mô tả ngắn, giá, tồn kho.
- [ ] `Xem chi tiết` mở đúng trang sản phẩm theo `slug`.
- [ ] `Thêm vào giỏ` hoạt động hoặc có stub rõ ràng.
- [ ] Giao diện mobile không bị vỡ layout trong khung chat.

---

## Ghi chú

- Nên import `useRouter` từ `next/navigation`.
- Nếu product image là URL tương đối từ backend, cần đảm bảo đã được prepend đúng host hoặc backend trả absolute URL.
- Nếu `useCartStore` đang dùng persist, nhớ tránh hydration mismatch theo pattern mounted guard đã lưu trong memory.
