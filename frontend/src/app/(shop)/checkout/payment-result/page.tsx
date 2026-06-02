"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import DownloadInvoiceButton from "@/components/shop/DownloadInvoiceButton";
import { loadOrderForInvoice } from "@/lib/invoiceOrderStorage";
import { orderService } from "@/services/orderService";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { onlinePaymentLabel } from "@/lib/paymentLabels";
import type { Order } from "@/types";

function PaymentResultContent() {
  const searchParams = useSearchParams();
  const clearCart = useCartStore((s) => s.clearCart);
  const { isAuthenticated } = useAuthStore();

  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);
  const [loadingInvoice, setLoadingInvoice] = useState(false);

  const { isSuccess, orderId, responseCode, gateway } = useMemo(() => {
    const status = searchParams.get("status") || "failed";
    return {
      isSuccess: status === "success",
      orderId: searchParams.get("order_id"),
      responseCode: searchParams.get("response_code"),
      gateway: searchParams.get("gateway") || "vnpay",
    };
  }, [searchParams]);

  const numericOrderId = orderId ? Number(orderId) : NaN;

  useEffect(() => {
    if (isSuccess) {
      clearCart();
    }
  }, [clearCart, isSuccess]);

  useEffect(() => {
    if (!isSuccess || !orderId || Number.isNaN(numericOrderId)) {
      setInvoiceOrder(null);
      return;
    }

    const cached = loadOrderForInvoice(numericOrderId);
    if (cached) {
      setInvoiceOrder(
        isSuccess && cached.status === "pending"
          ? { ...cached, status: "confirmed" }
          : cached,
      );
      return;
    }

    if (!isAuthenticated) {
      setInvoiceOrder(null);
      return;
    }

    setLoadingInvoice(true);
    orderService
      .getOrderById(numericOrderId)
      .then(setInvoiceOrder)
      .catch(() => setInvoiceOrder(null))
      .finally(() => setLoadingInvoice(false));
  }, [isSuccess, orderId, numericOrderId, isAuthenticated]);

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
          {responseCode && (
            <p className="text-sm text-neutral-medium">
              Mã phản hồi {onlinePaymentLabel(gateway)}:{" "}
              <span className="font-semibold text-neutral-dark">
                {responseCode}
              </span>
            </p>
          )}
        </div>

        {isSuccess && (
          <div className="w-full space-y-2">
            {loadingInvoice ? (
              <p className="text-sm text-neutral-medium">
                Đang tải thông tin hóa đơn...
              </p>
            ) : (
              <DownloadInvoiceButton
                order={invoiceOrder}
                fullWidth
                variant="primary"
              />
            )}
            {!loadingInvoice && !invoiceOrder && (
              <p className="text-xs text-neutral-medium">
                Đăng nhập và xem chi tiết đơn hàng để tải hóa đơn nếu bạn đã
                thanh toán trên thiết bị khác.
              </p>
            )}
          </div>
        )}

        <div className="flex gap-3 w-full">
          <Link
            href={
              isSuccess && orderId
                ? `/account/orders/${orderId}`
                : "/account/orders"
            }
            className="flex-1 py-3 rounded-xl border border-border-color text-sm font-bold text-neutral-dark hover:bg-neutral-light transition-colors text-center"
          >
            {isSuccess ? "Chi tiết đơn" : "Xem đơn hàng"}
          </Link>
          <Link
            href={isSuccess ? "/" : "/checkout"}
            className="flex-1 py-3 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors text-center"
          >
            {isSuccess ? "Tiếp tục mua sắm" : "Quay lại thanh toán"}
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function PaymentResultPage() {
  return (
    <Suspense
      fallback={
        <main className="flex-grow container mx-auto px-4 py-16 max-w-[640px] text-center">
          <p className="text-neutral-medium">Đang tải kết quả thanh toán...</p>
        </main>
      }
    >
      <PaymentResultContent />
    </Suspense>
  );
}
