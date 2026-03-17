# Task 02 — Frontend: Sửa contract `orderService.createOrder()` và typing checkout

**Giai đoạn:** 3 - Checkout trong chat  
**Ưu tiên:** 🔴 P0  
**Ước lượng:** 1-1.5 giờ  
**File chính:** `frontend/src/services/orderService.ts`  
**Phụ thuộc:** Task 01

---

## Bối cảnh

Rủi ro hiện tại: frontend có thể unwrap sai shape `BaseResponse` khi gọi tạo đơn hàng.  
Nếu contract unwrap sai, submit checkout trong chat sẽ fail dù backend trả thành công.

---

## Công việc cần làm

### Bước 1 — Kiểm tra shape API thật

Xác nhận API trả theo chuẩn:

```ts
type BaseResponse<T> = {
  success: boolean;
  message?: string;
  data: T;
};
```

### Bước 2 — Sửa `createOrder()` unwrap đúng

Mẫu xử lý mong muốn:

```ts
const res = await httpClient.post<BaseResponse<CreateOrderResponse>>(
  "/orders",
  payload,
);
return res.data.data;
```

Không trả nhầm `res.data` khi caller kỳ vọng object order thực tế.

### Bước 3 — Bổ sung type cho checkout payload/response

Đảm bảo có type rõ ràng cho:

- `CreateOrderPayload`
- `CreateOrderItemPayload`
- `CreateOrderResponse`

Nếu đã có type tương đương trong `src/types`, reuse thay vì định nghĩa trùng.

### Bước 4 — Đồng bộ nơi gọi service

Rà soát nơi dùng `createOrder()`:

- `checkout page`
- `chat checkout panel` (sẽ làm ở task sau)

Đảm bảo không còn assumption cũ về response shape.

---

## Definition of Done (DoD)

- [ ] `orderService.createOrder()` unwrap đúng `BaseResponse.data`.
- [ ] TypeScript không báo lỗi kiểu dữ liệu ở các nơi gọi.
- [ ] Không regress luồng checkout trang `/checkout` hiện có.

---

## Ghi chú

- Đây là task cần hoàn thành sớm vì là nút chặn của toàn bộ submit flow phase3.
- Tránh xử lý business rule trong service, chỉ tập trung contract/typing.
