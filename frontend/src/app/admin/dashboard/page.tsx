"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import AdminHeader from "@/components/admin/Header";
import {
  adminStatisticsService,
  type StatisticsOverview,
  type RevenuePoint,
  type TopProductItem,
} from "@/services/adminStatisticsService";
import { orderService } from "@/services/orderService";
import type { Order } from "@/types";

// ─── Helpers ───────────────────────────────────────────────────────────────

function fmtVND(val: number): string {
  if (val >= 1_000_000_000) return (val / 1_000_000_000).toFixed(1) + " tỷ";
  if (val >= 1_000_000) return Math.round(val / 1_000_000) + "tr";
  if (val >= 1_000) return Math.round(val / 1_000) + "k";
  return val.toLocaleString("vi-VN") + "đ";
}

function fmtVNDFull(val: number): string {
  return Number(val).toLocaleString("vi-VN") + "đ";
}

function fmtDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// ─── Status config ─────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  pending: {
    label: "Chờ xác nhận",
    cls: "bg-amber-100 text-amber-700 border border-amber-200",
  },
  confirmed: {
    label: "Đã xác nhận",
    cls: "bg-blue-100 text-blue-700 border border-blue-200",
  },
  packing: {
    label: "Đóng gói",
    cls: "bg-purple-100 text-purple-700 border border-purple-200",
  },
  shipping: {
    label: "Đang giao",
    cls: "bg-cyan-100 text-cyan-700 border border-cyan-200",
  },
  delivered: {
    label: "Đã giao",
    cls: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  },
  cancelled: {
    label: "Đã huỷ",
    cls: "bg-red-100 text-red-700 border border-red-200",
  },
};

// ─── Skeleton ──────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm animate-pulse">
      <div className="flex justify-between items-start mb-4">
        <div className="size-10 bg-slate-200 rounded-lg" />
        <div className="h-4 w-16 bg-slate-200 rounded" />
      </div>
      <div className="h-3 w-28 bg-slate-200 rounded mb-2" />
      <div className="h-8 w-24 bg-slate-200 rounded" />
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const router = useRouter();

  const [overview, setOverview] = useState<StatisticsOverview | null>(null);
  const [revenueChart, setRevenueChart] = useState<RevenuePoint[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [topProducts, setTopProducts] = useState<TopProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const today = new Date();
      const sixMonthsAgo = new Date(today);
      sixMonthsAgo.setMonth(today.getMonth() - 5);
      sixMonthsAgo.setDate(1);

      const [overviewData, chartData, ordersData, topData] = await Promise.all([
        adminStatisticsService.getOverview(),
        adminStatisticsService.getRevenueChart(
          "monthly",
          fmtDate(sixMonthsAgo),
          fmtDate(today),
        ),
        orderService.getAllOrders({ limit: 5, page: 1 }),
        adminStatisticsService.getTopProducts(undefined, undefined, 3),
      ]);

      setOverview(overviewData);
      setRevenueChart(chartData);
      setRecentOrders(ordersData.data);
      setTopProducts(topData);
    } catch {
      setError("Không thể tải dữ liệu. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ── KPI cards derived from overview ──
  const kpiCards = overview
    ? [
        {
          icon: "payments",
          iconBg: "bg-primary/10 text-primary",
          label: "Doanh thu hôm nay",
          value: fmtVNDFull(overview.today_revenue),
          trend: overview.today_orders + " đơn hôm nay",
          trendColor: "text-slate-500",
          trendIcon: "shopping_bag",
        },
        {
          icon: "shopping_bag",
          iconBg: "bg-blue-500/10 text-blue-500",
          label: "Tổng đơn hôm nay",
          value: overview.today_orders + " đơn",
          trend: overview.pending_orders + " chờ xử lý",
          trendColor: "text-amber-500",
          trendIcon: "access_time",
        },
        {
          icon: "hourglass_top",
          iconBg: "bg-amber-500/10 text-amber-500",
          label: "Đơn chờ xử lý",
          value: overview.pending_orders + " đơn",
          trend: "Cần xử lý",
          trendColor: "text-amber-500",
          trendIcon: "warning",
        },
        {
          icon: "inventory",
          iconBg: "bg-red-500/10 text-red-500",
          label: "Tồn kho thấp",
          value: overview.low_stock_count + " mã",
          trend: "Cần nhập hàng",
          trendColor: "text-red-500",
          trendIcon: "warning",
        },
      ]
    : null;

  // ── Revenue chart bars ──
  const maxRevenue = Math.max(...revenueChart.map((p) => p.revenue), 1);
  const chartBars = revenueChart.map((point, idx) => ({
    label: point.label,
    displayLabel: "T" + point.label.slice(5, 7).replace(/^0/, ""),
    tooltip: fmtVND(point.revenue),
    heightPct:
      point.revenue === 0
        ? 0
        : Math.max(Math.round((point.revenue / maxRevenue) * 88) + 8, 4),
    isHighlight: idx === revenueChart.length - 1,
    isEmpty: point.revenue === 0,
  }));

  // Y-axis labels: 0 → maxRevenue in 5 steps
  const yStep = maxRevenue / 5;
  const yLabels = [5, 4, 3, 2, 1, 0].map((i) =>
    i === 0 ? "0" : fmtVND(yStep * i),
  );

  return (
    <div className="flex flex-col overflow-y-auto flex-1">
      <AdminHeader
        hideSearch
        actionLabel="Tạo đơn mới"
        onAction={() => router.push("/admin/orders")}
      />

      <div className="p-8 space-y-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={fetchAll}
              className="ml-4 underline font-bold hover:no-underline"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading || !kpiCards
            ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
            : kpiCards.map((card) => (
                <div
                  key={card.label}
                  className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className={`p-2 rounded-lg ${card.iconBg}`}>
                      <span className="material-symbols-outlined">
                        {card.icon}
                      </span>
                    </div>
                    <span
                      className={`${card.trendColor} text-xs font-bold flex items-center gap-0.5`}
                    >
                      <span className="material-symbols-outlined text-xs">
                        {card.trendIcon}
                      </span>
                      {card.trend}
                    </span>
                  </div>
                  <p className="text-slate-500 text-sm font-medium">
                    {card.label}
                  </p>
                  <h3 className="text-2xl font-bold text-slate-900 mt-1">
                    {card.value}
                  </h3>
                </div>
              ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Revenue chart */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Doanh thu hàng tháng
                  </h2>
                  <p className="text-sm text-slate-500">
                    Tổng quan 6 tháng qua
                  </p>
                </div>
                <button
                  onClick={fetchAll}
                  className="text-slate-400 hover:text-primary transition-colors p-1 rounded"
                  title="Làm mới"
                >
                  <span className="material-symbols-outlined text-sm">
                    refresh
                  </span>
                </button>
              </div>

              {loading ? (
                <div className="h-70 bg-slate-100 rounded-lg animate-pulse" />
              ) : (
                <div className="flex h-70 pb-4">
                  {/* Y-axis */}
                  <div className="flex flex-col justify-between items-end text-xs text-slate-400 font-medium pr-4 h-full pb-8">
                    {yLabels.map((v) => (
                      <span key={v}>{v}</span>
                    ))}
                  </div>
                  {/* Bars */}
                  <div className="relative flex-1 flex items-end justify-between pl-4 border-l border-b border-slate-100 pb-8">
                    {/* Grid lines */}
                    <div className="absolute inset-0 flex flex-col justify-between pb-8 pointer-events-none">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className="border-b border-dashed border-slate-100 w-full h-px"
                        />
                      ))}
                      <div className="w-full h-px" />
                    </div>

                    {chartBars.length === 0 ? (
                      <div className="flex-1 flex items-center justify-center text-sm text-slate-400">
                        Chưa có dữ liệu doanh thu
                      </div>
                    ) : (
                      chartBars.map((bar) => (
                        <div
                          key={bar.label}
                          className="relative group flex flex-col items-center flex-1 h-full justify-end px-2 z-10"
                        >
                          <div
                            className={`w-full max-w-10 rounded-t-sm transition-all duration-300 relative cursor-default ${
                              bar.isEmpty
                                ? "bg-slate-200"
                                : bar.isHighlight
                                  ? "bg-primary shadow-[0_4px_12px_rgba(242,140,38,0.3)]"
                                  : "bg-primary/70 hover:bg-primary"
                            }`}
                            style={{
                              height: bar.isEmpty ? "4px" : `${bar.heightPct}%`,
                            }}
                          >
                            {!bar.isEmpty && (
                              <div className="opacity-0 group-hover:opacity-100 absolute -top-9 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-20 transition-opacity">
                                {bar.tooltip}
                              </div>
                            )}
                          </div>
                          <span
                            className={`absolute -bottom-6 text-[11px] font-medium ${
                              bar.isHighlight
                                ? "text-primary font-bold"
                                : "text-slate-500"
                            }`}
                          >
                            {bar.displayLabel}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Recent Orders */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h2 className="text-lg font-bold text-slate-900">
                  Đơn hàng mới nhất
                </h2>
                <button
                  onClick={() => router.push("/admin/orders")}
                  className="text-primary text-sm font-bold hover:underline"
                >
                  Xem tất cả
                </button>
              </div>
              <div className="overflow-x-auto">
                {loading ? (
                  <div className="p-6 space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-10 bg-slate-100 rounded animate-pulse"
                      />
                    ))}
                  </div>
                ) : (
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold">
                      <tr>
                        <th className="px-6 py-3">Mã đơn</th>
                        <th className="px-6 py-3">Khách hàng</th>
                        <th className="px-6 py-3">Tổng tiền</th>
                        <th className="px-6 py-3">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {recentOrders.length === 0 ? (
                        <tr>
                          <td
                            colSpan={4}
                            className="px-6 py-8 text-center text-sm text-slate-400"
                          >
                            Chưa có đơn hàng nào
                          </td>
                        </tr>
                      ) : (
                        recentOrders.map((order) => {
                          const s = STATUS_CONFIG[order.status] ?? {
                            label: order.status,
                            cls: "bg-slate-100 text-slate-700",
                          };
                          return (
                            <tr
                              key={order.id}
                              className="hover:bg-slate-50 transition-colors cursor-pointer"
                              onClick={() =>
                                router.push(`/admin/orders/${order.id}`)
                              }
                            >
                              <td className="px-6 py-4 text-sm font-bold text-primary">
                                #ORD-{order.id}
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex flex-col">
                                  <span className="text-sm font-medium text-slate-900">
                                    {order.receiver_name}
                                  </span>
                                  <span className="text-xs text-slate-500">
                                    {order.receiver_phone}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm font-bold text-slate-900">
                                {fmtVNDFull(order.total_amount)}
                              </td>
                              <td className="px-6 py-4">
                                <span
                                  className={`px-2 py-1 text-[10px] font-bold rounded-full uppercase ${s.cls}`}
                                >
                                  {s.label}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>

          {/* Right column - Top Products */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-6">
              Sản phẩm bán chạy
            </h2>

            {loading ? (
              <div className="space-y-5">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 animate-pulse"
                  >
                    <div className="size-12 rounded-lg bg-slate-200 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-slate-200 rounded w-3/4" />
                      <div className="h-3 bg-slate-200 rounded w-1/2" />
                      <div className="h-1.5 bg-slate-200 rounded w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : topProducts.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">
                Chưa có dữ liệu
              </p>
            ) : (
              <div className="space-y-5">
                {topProducts.map((product, idx) => {
                  const maxSold = topProducts[0]?.total_sold || 1;
                  const pct = Math.max(
                    Math.round((product.total_sold / maxSold) * 88) + 8,
                    4,
                  );
                  return (
                    <div
                      key={product.product_id}
                      className="flex items-center gap-4"
                    >
                      <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 text-primary font-bold text-sm">
                        #{idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">
                          {product.product_name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {product.total_sold} lượt bán ·{" "}
                          {fmtVND(product.total_revenue)}
                        </p>
                        <div className="mt-1.5 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
