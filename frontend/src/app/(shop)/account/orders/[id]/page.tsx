"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { orderService } from "@/services/orderService";
import { getAbsoluteImageUrl } from "@/lib/imageUrl";
import type { Order, OrderStatus } from "@/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  packing: "Đang chuẩn bị",
  shipping: "Đang giao hàng",
  delivered: "Đã giao",
  cancelled: "Đã hủy",
};

const STATUS_COLOR: Record<OrderStatus, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-blue-100 text-blue-700",
  packing: "bg-indigo-100 text-indigo-700",
  shipping: "bg-orange-100 text-orange-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

const PAYMENT_LABEL: Record<string, string> = {
  cod: "Thanh toán khi nhận hàng (COD)",
  bank_transfer: "Chuyển khoản ngân hàng",
};

const STATUS_STEP: Record<OrderStatus, number> = {
  pending: 0,
  confirmed: 1,
  packing: 1,
  shipping: 2,
  delivered: 3,
  cancelled: -1,
};

const PROGRESS_STEPS = [
  { icon: "receipt_long", label: "Chờ xác nhận" },
  { icon: "inventory_2", label: "Đang chuẩn bị" },
  { icon: "local_shipping", label: "Đang giao hàng" },
  { icon: "home", label: "Đã giao" },
];

function formatDate(dateString: string): string {
  const d = new Date(dateString);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function formatCurrency(amount: number | string): string {
  return new Intl.NumberFormat("vi-VN").format(Number(amount)) + "₫";
}

// ---------------------------------------------------------------------------
// Progress bar
// ---------------------------------------------------------------------------
function OrderProgressBar({ status }: { status: OrderStatus }) {
  const currentStep = STATUS_STEP[status];
  const total = PROGRESS_STEPS.length - 1;
  const progressPct = currentStep < 0 ? 0 : (currentStep / total) * 100;

  return (
    <div className="relative py-2 px-4">
      <div className="absolute top-[31px] left-4 right-4 h-1 bg-slate-100 rounded"></div>
      <div
        className="absolute top-[31px] left-4 h-1 rounded transition-all bg-primary"
        style={{ width: `calc(${progressPct}% * (100% - 2rem) / 100%)` }}
      ></div>
      <div className="relative flex justify-between">
        {PROGRESS_STEPS.map((step, idx) => {
          const isCompleted = currentStep > idx;
          const isCurrent = currentStep === idx;
          const isActive = isCompleted || isCurrent;
          return (
            <div key={idx} className="flex flex-col items-center gap-3 w-20">
              <div
                className={`size-8 rounded-full flex items-center justify-center z-10 ring-4 ring-white shadow-sm
                  ${isActive ? "bg-primary text-white" : "bg-slate-100 text-slate-400"}
                  ${isCurrent && status === "shipping" ? "animate-pulse" : ""}
                `}
              >
                <span className="material-symbols-outlined text-[16px] font-bold">
                  {isCompleted ? "check" : step.icon}
                </span>
              </div>
              <span
                className={`text-xs text-center leading-tight ${isActive ? "font-bold text-primary" : "font-medium text-slate-500"}`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------
function DetailSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 bg-slate-200 rounded w-48"></div>
      <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
        <div className="h-5 bg-slate-200 rounded w-36"></div>
        <div className="flex justify-between py-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex flex-col items-center gap-3 w-20">
              <div className="size-8 rounded-full bg-slate-200"></div>
              <div className="h-3 bg-slate-200 rounded w-14"></div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="flex gap-4 py-3">
            <div className="size-16 rounded-lg bg-slate-200 shrink-0"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-200 rounded w-48"></div>
              <div className="h-4 bg-slate-200 rounded w-24"></div>
            </div>
            <div className="h-4 bg-slate-200 rounded w-24"></div>
          </div>
        ))}
        <div className="border-t border-slate-100 pt-4 space-y-2">
          <div className="h-4 bg-slate-200 rounded w-full"></div>
          <div className="h-6 bg-slate-200 rounded w-40 ml-auto"></div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  const [mounted, setMounted] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!isAuthenticated) {
      router.push(`/login?redirect=/account/orders/${params.id}`);
      return;
    }
    const orderId = Number(params.id);
    if (isNaN(orderId)) {
      setError("Đơn hàng không hợp lệ.");
      setLoading(false);
      return;
    }
    orderService
      .getOrderById(orderId)
      .then(setOrder)
      .catch(() =>
        setError("Không tìm thấy đơn hàng hoặc bạn không có quyền xem."),
      )
      .finally(() => setLoading(false));
  }, [mounted, isAuthenticated, params.id, router]);

  if (!mounted) return null;

  return (
    <main className="p-4 sm:p-6 lg:p-8 flex-grow">
      <div>
        {/* Back link */}
        <Link
          href="/account/orders"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary transition-colors mb-6"
        >
          <span className="material-symbols-outlined text-[18px]">
            arrow_back
          </span>
          Quay lại lịch sử đơn hàng
        </Link>

        {loading ? (
          <DetailSkeleton />
        ) : error ? (
          <div className="text-center py-20 text-red-500">
            <span className="material-symbols-outlined text-5xl mb-3 block opacity-60">
              error
            </span>
            <p className="text-sm font-medium">{error}</p>
            <Link
              href="/account/orders"
              className="mt-4 inline-block px-5 py-2 bg-primary text-white rounded-lg text-sm font-bold"
            >
              Quay lại
            </Link>
          </div>
        ) : order ? (
          <div className="space-y-6">
            {/* Title row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900">
                  Đơn hàng #ORD-{String(order.id).padStart(4, "0")}
                </h2>
                <p className="text-slate-500 text-sm mt-0.5">
                  Đặt lúc {formatDate(order.created_at)}
                </p>
              </div>
              <span
                className={`self-start sm:self-auto px-3 py-1.5 rounded-full text-xs font-bold uppercase ${STATUS_COLOR[order.status]}`}
              >
                {STATUS_LABEL[order.status]}
              </span>
            </div>

            {/* Progress tracker */}
            {order.status !== "cancelled" && (
              <div className="bg-white rounded-2xl border border-slate-100 p-6">
                <h3 className="text-sm font-bold text-slate-700 mb-6">
                  Trạng thái vận chuyển
                </h3>
                <OrderProgressBar status={order.status} />
              </div>
            )}

            {/* Product items */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <h3 className="text-sm font-bold text-slate-700 mb-4">
                Sản phẩm đã đặt
              </h3>
              <div className="divide-y divide-slate-50">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 py-4">
                    <div
                      className="size-16 rounded-lg bg-slate-100 bg-cover bg-center border border-slate-100 shrink-0 flex items-center justify-center"
                      style={
                        item.image_url
                          ? {
                              backgroundImage: `url('${getAbsoluteImageUrl(item.image_url)}')`,
                            }
                          : undefined
                      }
                    >
                      {!item.image_url && (
                        <span className="material-symbols-outlined text-slate-300 text-2xl">
                          image
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">
                        {item.product_name ?? `Sản phẩm #${item.product_id}`}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {formatCurrency(item.unit_price)} × {item.quantity}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-slate-800 shrink-0">
                      {formatCurrency(item.subtotal)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Order total */}
              <div className="border-t border-slate-100 pt-4 space-y-2">
                <div className="flex justify-between text-sm text-slate-500">
                  <span>Tạm tính</span>
                  <span>{formatCurrency(order.total_amount)}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-500">
                  <span>Phí vận chuyển</span>
                  <span className="text-green-600 font-medium">Miễn phí</span>
                </div>
                <div className="flex justify-between text-base font-extrabold text-slate-900 pt-2 border-t border-slate-100">
                  <span>Tổng thanh toán</span>
                  <span className="text-primary text-xl">
                    {formatCurrency(order.total_amount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Delivery & payment info */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl border border-slate-100 p-6">
                <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-primary">
                    location_on
                  </span>
                  Địa chỉ nhận hàng
                </h3>
                <p className="text-sm font-semibold text-slate-800">
                  {order.receiver_name}
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  {order.receiver_phone}
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  {order.receiver_address}
                </p>
                {order.note && (
                  <p className="text-sm text-slate-400 mt-2 italic">
                    Ghi chú: {order.note}
                  </p>
                )}
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 p-6">
                <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-primary">
                    payments
                  </span>
                  Phương thức thanh toán
                </h3>
                <p className="text-sm text-slate-700 font-medium">
                  {PAYMENT_LABEL[order.payment_method] ?? order.payment_method}
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
