"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { orderService } from "@/services/orderService";
import { useCartStore } from "@/store/cartStore";
import { getAbsoluteImageUrl } from "@/lib/imageUrl";
import type { Order, OrderStatus } from "@/types";

// ---------------------------------------------------------------------------
// Types & constants
// ---------------------------------------------------------------------------
type FilterTab = "all" | OrderStatus;

const TABS: { label: string; value: FilterTab }[] = [
  { label: "Tất cả", value: "all" },
  { label: "Chờ xác nhận", value: "pending" },
  { label: "Đã xác nhận", value: "confirmed" },
  { label: "Đang chuẩn bị", value: "packing" },
  { label: "Đang giao", value: "shipping" },
  { label: "Đã giao", value: "delivered" },
  { label: "Đã hủy", value: "cancelled" },
];

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

const LIMIT = 5;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatDate(dateString: string): string {
  const d = new Date(dateString);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

function formatCurrency(amount: number | string): string {
  return new Intl.NumberFormat("vi-VN").format(Number(amount)) + "₫";
}

// ---------------------------------------------------------------------------
// Order progress bar
// ---------------------------------------------------------------------------
function OrderProgressBar({ status }: { status: OrderStatus }) {
  const currentStep = STATUS_STEP[status];
  const total = PROGRESS_STEPS.length - 1;
  const progressPct = currentStep < 0 ? 0 : (currentStep / total) * 100;

  return (
    <div className="relative mb-8 px-4 hidden sm:block">
      <div className="absolute top-[15px] left-0 w-full h-1 bg-slate-100 rounded"></div>
      <div
        className="absolute top-[15px] left-0 h-1 rounded transition-all bg-primary"
        style={{ width: `${progressPct}%` }}
      ></div>

      <div className="relative flex justify-between">
        {PROGRESS_STEPS.map((step, idx) => {
          const isCompleted = currentStep > idx;
          const isCurrent = currentStep === idx;
          const isActive = isCompleted || isCurrent;

          return (
            <div key={idx} className="flex flex-col items-center gap-3">
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
                className={`text-xs text-center ${isActive ? "font-bold text-primary" : "font-medium text-slate-500"}`}
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
// Skeleton loader
// ---------------------------------------------------------------------------
function OrderSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="border border-slate-100 rounded-xl p-6 animate-pulse"
        >
          <div className="flex gap-4 mb-8">
            <div className="size-14 rounded-lg bg-slate-200 shrink-0"></div>
            <div className="flex-1 space-y-2 py-1">
              <div className="h-4 bg-slate-200 rounded w-36"></div>
              <div className="h-4 bg-slate-200 rounded w-52"></div>
            </div>
            <div className="space-y-2 text-right">
              <div className="h-3 bg-slate-200 rounded w-24"></div>
              <div className="h-6 bg-slate-200 rounded w-32"></div>
            </div>
          </div>
          <div className="flex justify-between mb-8 px-4 hidden sm:flex">
            {[1, 2, 3, 4].map((j) => (
              <div key={j} className="flex flex-col items-center gap-3">
                <div className="size-8 rounded-full bg-slate-200"></div>
                <div className="h-3 bg-slate-200 rounded w-16"></div>
              </div>
            ))}
          </div>
          <div className="flex justify-end pt-4 border-t border-slate-50">
            <div className="h-9 bg-slate-200 rounded-lg w-28"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Single order card
// ---------------------------------------------------------------------------
function OrderCard({
  order,
  onReorder,
}: {
  order: Order;
  onReorder: (order: Order) => void;
}) {
  const firstItem = order.items[0];
  const isDelivered = order.status === "delivered";
  const isCancelled = order.status === "cancelled";

  return (
    <div
      className={`group border border-slate-100 rounded-xl p-4 sm:p-6 transition-all
        ${isDelivered ? "bg-slate-50/30 opacity-80 hover:opacity-100 hover:border-primary/30" : "hover:border-primary/30 hover:bg-orange-50/10"}
      `}
    >
      {/* Header row */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="flex gap-4">
          {/* Product thumbnail */}
          <div
            className="size-14 rounded-lg bg-slate-100 bg-cover bg-center border border-slate-100 shrink-0 flex items-center justify-center"
            style={
              firstItem?.image_url
                ? {
                    backgroundImage: `url('${getAbsoluteImageUrl(firstItem.image_url)}')`,
                  }
                : undefined
            }
          >
            {!firstItem?.image_url && (
              <span className="material-symbols-outlined text-slate-300 text-2xl">
                image
              </span>
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {isCancelled && (
                <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase shrink-0">
                  Đã hủy
                </span>
              )}
              {isDelivered && (
                <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase shrink-0">
                  Đã giao
                </span>
              )}
              <span className="text-sm font-bold text-slate-900">
                #ORD-{String(order.id).padStart(4, "0")}
              </span>
              <span className="text-xs text-slate-500">
                • {formatDate(order.created_at)}
              </span>
            </div>
            <h3 className="text-slate-700 font-medium truncate">
              {firstItem?.product_name ?? `Đơn hàng #${order.id}`}
              {order.items.length > 1 && (
                <span className="text-slate-400 text-sm ml-1">
                  (+{order.items.length - 1} sản phẩm)
                </span>
              )}
            </h3>
          </div>
        </div>

        <div className="text-left md:text-right shrink-0">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
            Tổng thanh toán
          </p>
          <p className="text-xl font-extrabold text-primary">
            {formatCurrency(order.total_amount)}
          </p>
        </div>
      </div>

      {/* Progress */}
      {!isCancelled && <OrderProgressBar status={order.status} />}
      {isCancelled && (
        <div className="mb-8 flex items-center gap-2 text-sm text-red-500">
          <span className="material-symbols-outlined text-[18px]">cancel</span>
          Đơn hàng đã bị hủy
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-slate-50">
        {isDelivered && (
          <button
            onClick={() => onReorder(order)}
            className="px-5 py-2.5 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 transition-all flex items-center gap-2 shadow-sm shadow-primary/30"
          >
            <span className="material-symbols-outlined text-[18px]">
              refresh
            </span>
            Mua lại
          </button>
        )}
        <Link
          href={`/account/orders/${order.id}`}
          className="px-6 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 hover:text-primary hover:border-primary transition-all flex items-center gap-2"
        >
          Xem chi tiết
          <span className="material-symbols-outlined text-[18px]">
            arrow_forward
          </span>
        </Link>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function OrdersPage() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);

  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: { page: number; limit: number; status?: string } = {
        page,
        limit: LIMIT,
      };
      if (activeTab !== "all") params.status = activeTab;
      const result = await orderService.getMyOrders(params);
      setOrders(result.items);
      setTotal(result.total);
      setTotalPages(result.total_pages);
    } catch {
      setError("Không thể tải danh sách đơn hàng. Vui lòng thử lại.");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [page, activeTab]);

  useEffect(() => {
    if (!mounted) return;
    if (!isAuthenticated) {
      router.push("/login?redirect=/account/orders");
      return;
    }
    fetchOrders();
  }, [mounted, isAuthenticated, fetchOrders, router]);

  const handleTabChange = (tab: FilterTab) => {
    setActiveTab(tab);
    setPage(1);
  };

  const handleReorder = (order: Order) => {
    order.items.forEach((item) => {
      addItem({
        id: item.product_id,
        productId: item.product_id,
        name: item.product_name ?? `Sản phẩm #${item.product_id}`,
        price: Number(item.unit_price),
        image: getAbsoluteImageUrl(item.image_url),
        quantity: item.quantity,
        slug: item.product_slug ?? "",
      });
    });
    router.push("/cart");
  };

  if (!mounted) return null;

  // Pagination range (max 5 buttons)
  const pageRange = (() => {
    const half = 2;
    let start = Math.max(1, page - half);
    const end = Math.min(totalPages, start + 4);
    start = Math.max(1, end - 4);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  })();

  return (
    <main className="p-4 sm:p-6 lg:p-8 flex-grow">
      <div>
        {/* Page header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 w-full">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900">
              Lịch sử đơn hàng
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              {total > 0
                ? `${total} đơn hàng của bạn`
                : "Quản lý và theo dõi trạng thái các đơn hàng của bạn."}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-8">
          {/* Status tabs */}
          <div className="flex gap-2 overflow-x-auto pb-6 border-b border-slate-100 mb-8 scrollbar-hide">
            {TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => handleTabChange(tab.value)}
                className={`shrink-0 px-5 py-2 rounded-full text-sm transition-colors
                  ${
                    activeTab === tab.value
                      ? "bg-primary text-white font-bold shadow-md shadow-primary/20"
                      : "bg-slate-50 text-slate-500 hover:bg-slate-100 font-medium"
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          {loading ? (
            <OrderSkeleton />
          ) : error ? (
            <div className="text-center py-20 text-red-500">
              <span className="material-symbols-outlined text-5xl mb-3 block opacity-60">
                error
              </span>
              <p className="text-sm font-medium">{error}</p>
              <button
                onClick={fetchOrders}
                className="mt-4 px-5 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 transition-all"
              >
                Thử lại
              </button>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-20 text-slate-400">
              <span className="material-symbols-outlined text-6xl mb-4 block opacity-30">
                receipt_long
              </span>
              <p className="text-base font-medium text-slate-500">
                Không có đơn hàng nào
              </p>
              <p className="text-sm mt-1 mb-5">
                {activeTab !== "all"
                  ? "Bạn chưa có đơn hàng nào ở trạng thái này."
                  : "Hãy mua sắm để tạo đơn hàng đầu tiên của bạn!"}
              </p>
              <Link
                href="/products"
                className="inline-block px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 transition-all"
              >
                Mua sắm ngay
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onReorder={handleReorder}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="size-10 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:border-primary hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              {pageRange.map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`size-10 flex items-center justify-center rounded-lg text-sm font-bold transition-colors
                    ${page === p ? "bg-primary text-white" : "border border-slate-200 text-slate-600 hover:border-primary hover:text-primary"}
                  `}
                >
                  {p}
                </button>
              ))}
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="size-10 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:border-primary hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
