"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useCartStore } from "@/store/cartStore";

export default function PaymentResultPage() {
  const searchParams = useSearchParams();
  const clearCart = useCartStore((s) => s.clearCart);

  const { isSuccess, orderId, responseCode } = useMemo(() => {
    const status = searchParams.get("status") || "failed";
    return {
      isSuccess: status === "success",
      orderId: searchParams.get("order_id"),
      responseCode: searchParams.get("response_code"),
    };
  }, [searchParams]);

  useEffect(() => {
    if (isSuccess) {
      clearCart();
    }
  }, [clearCart, isSuccess]);

  return (
    <main className="flex-grow container mx-auto px-4 py-16 max-w-[640px] text-center">
      <div className="bg-white rounded-2xl shadow-sm border border-neutral-light p-10 flex flex-col items-center gap-6">
        <div
          className={`size-20 rounded-full flex items-center justify-center ${
            isSuccess ? "bg-emerald-100" : "bg-red-100"
          }`}
        >
          <span
            className={`material-symbols-outlined text-5xl ${
              isSuccess ? "text-emerald-500" : "text-red-500"
            }`}
          >
            {isSuccess ? "check_circle" : "cancel"}
          </span>
        </div>

        <div>
          <h1 className="text-2xl font-extrabold text-neutral-dark mb-2">
            {isSuccess ? "Thanh toán thành công" : "Thanh toán chưa thành công"}
          </h1>
          <p className="text-neutral-medium text-sm">
            {isSuccess
              ? "Đơn hàng của bạn đã được ghi nhận. Cảm ơn bạn đã mua sắm tại Himalayan Salt."
              : "Bạn có thể thử lại thanh toán hoặc chọn phương thức COD để hoàn tất đơn hàng."}
          </p>
        </div>

        <div className="bg-neutral-light/60 rounded-xl px-6 py-4 w-full text-left space-y-1">
          <p className="text-sm text-neutral-medium">
            Mã đơn hàng:{" "}
            <span className="font-semibold text-neutral-dark">
              #{orderId ?? "N/A"}
            </span>
          </p>
          <p className="text-sm text-neutral-medium">
            Mã phản hồi VNPay:{" "}
            <span className="font-semibold text-neutral-dark">
              {responseCode ?? "N/A"}
            </span>
          </p>
        </div>

        <div className="flex gap-3 w-full">
          <Link
            href="/account/orders"
            className="flex-1 py-3 rounded-xl border border-border-color text-sm font-bold text-neutral-dark hover:bg-neutral-light transition-colors text-center"
          >
            Xem đơn hàng
          </Link>
          <Link
            href="/checkout"
            className="flex-1 py-3 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors text-center"
          >
            Quay lại thanh toán
          </Link>
        </div>
      </div>
    </main>
  );
}
