"use client";

import { useState, useEffect, useCallback } from "react";
import AdminHeader from "@/components/admin/Header";
import {
  adminStatisticsService,
  type StatisticsKPI,
  type RevenuePoint,
  type OrderStatusItem,
  type TopProductItem,
  type CategoryRevenueItem,
  type ChartPeriod,
} from "@/services/adminStatisticsService";

// ─── Helpers ─────────────────────────────────────────────────

function fmtDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function fmtVND(val: number): string {
  if (val >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(1)}tỷ`;
  if (val >= 1_000_000) return `${Math.round(val / 1_000_000)}tr`;
  return val.toLocaleString("vi-VN") + "đ";
}

function fmtPct(val: number): string {
  return (val >= 0 ? "+" : "") + val.toFixed(1) + "%";
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  packing: "Đang đóng gói",
  shipping: "Đang giao",
  delivered: "Đã giao",
  cancelled: "Đã huỷ",
};

const STATUS_COLORS: Record<string, string> = {
  delivered: "#10b981",
  shipping: "#f28c26",
  packing: "#3b82f6",
  confirmed: "#8b5cf6",
  pending: "#f59e0b",
  cancelled: "#ef4444",
};

// ─── Bar Chart ────────────────────────────────────────────────

function RevenueBarChart({ data }: { data: RevenuePoint[] }) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-60 text-slate-400 text-sm">
        Không có dữ liệu trong khoảng thời gian này.
      </div>
    );
  }
  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1);
  const maxOrders = Math.max(...data.map((d) => d.order_count), 1);
  const showEvery = Math.ceil(data.length / 12);

  return (
    <div className="flex h-60">
      <div className="flex flex-col justify-between text-xs text-slate-400 pr-4 h-full pb-8">
        {["100%", "80%", "60%", "40%", "20%", "0"].map((v) => (
          <span key={v}>{v}</span>
        ))}
      </div>
      <div className="relative flex-1 flex items-end justify-around pl-4 border-l border-b border-slate-100 pb-8 overflow-hidden">
        <div className="absolute inset-0 flex flex-col justify-between pb-8 pointer-events-none">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="border-b border-dashed border-slate-100 w-full h-px"
            />
          ))}
          <div className="w-full h-px" />
        </div>
        {data.map((item, idx) => (
          <div
            key={item.label}
            className="relative flex flex-col items-center gap-1 h-full justify-end z-10 flex-1 min-w-0"
            title={`${item.label}: ${fmtVND(item.revenue)} | ${item.order_count} đơn`}
          >
            <div className="flex items-end gap-0.5 h-full justify-center w-full px-0.5">
              <div
                className="flex-1 bg-primary rounded-t-sm transition-all duration-300"
                style={{ height: `${(item.revenue / maxRevenue) * 90}%` }}
              />
              <div
                className="flex-1 bg-blue-400 rounded-t-sm transition-all duration-300"
                style={{ height: `${(item.order_count / maxOrders) * 90}%` }}
              />
            </div>
            {idx % showEvery === 0 && (
              <span className="absolute -bottom-6 text-[10px] font-medium text-slate-400 truncate max-w-full">
                {data.length <= 12 ? item.label : item.label.slice(5)}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Donut Chart ──────────────────────────────────────────────

function OrderStatusDonut({ data }: { data: OrderStatusItem[] }) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-40 text-slate-400 text-sm">
        Không có dữ liệu.
      </div>
    );
  }
  const total = data.reduce((s, d) => s + d.count, 0);
  const circumference = 2 * Math.PI * 16;
  let offset = 0;
  const segments = data.map((item) => {
    const dash = (item.percentage / 100) * circumference;
    const seg = { ...item, dash, dashOffset: -offset };
    offset += dash;
    return seg;
  });

  return (
    <div className="flex items-center gap-6 h-45">
      <div className="relative size-32 shrink-0">
        <svg className="size-full -rotate-90" viewBox="0 0 36 36">
          <circle
            cx="18"
            cy="18"
            r="16"
            fill="none"
            stroke="#f1f5f9"
            strokeWidth="4"
          />
          {segments.map((seg) => (
            <circle
              key={seg.status}
              cx="18"
              cy="18"
              r="16"
              fill="none"
              stroke={STATUS_COLORS[seg.status] ?? "#94a3b8"}
              strokeWidth="4"
              strokeDasharray={`${seg.dash} ${circumference}`}
              strokeDashoffset={seg.dashOffset}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs text-slate-500">Tổng</span>
          <span className="text-lg font-bold text-slate-900">{total}</span>
        </div>
      </div>
      <div className="flex-1 space-y-2 overflow-auto">
        {data.map((item) => (
          <div
            key={item.status}
            className="flex justify-between items-center text-xs"
          >
            <div className="flex items-center gap-2">
              <span
                className="size-2 rounded-full shrink-0"
                style={{ background: STATUS_COLORS[item.status] ?? "#94a3b8" }}
              />
              <span className="text-slate-600 truncate">
                {STATUS_LABELS[item.status] ?? item.status}
              </span>
            </div>
            <span className="font-bold text-slate-900 ml-2">
              {item.percentage}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm animate-pulse">
      <div className="flex justify-between items-start mb-4">
        <div className="size-10 bg-slate-100 rounded-lg" />
        <div className="h-4 w-16 bg-slate-100 rounded" />
      </div>
      <div className="h-4 w-28 bg-slate-100 rounded mb-2" />
      <div className="h-7 w-36 bg-slate-100 rounded" />
    </div>
  );
}

// ─── Export ──────────────────────────────────────────────────

function exportReport(
  dateFrom: string,
  dateTo: string,
  kpi: StatisticsKPI | null,
  revenueChart: RevenuePoint[],
  topProducts: TopProductItem[],
  categoryRevenue: CategoryRevenueItem[],
) {
  const BOM = "\uFEFF";
  const sections: string[] = [];

  // Section 1: KPI
  sections.push("=== KPI TỔNG HỢP ===");
  sections.push(`Kỳ báo cáo,${dateFrom} - ${dateTo}`);
  if (kpi) {
    sections.push(`Doanh thu,${kpi.total_revenue}`);
    sections.push(`Lợi nhuận gộp,${kpi.gross_profit}`);
    sections.push(`Giá vốn hàng bán,${kpi.total_cost}`);
    sections.push(`Giá trị đơn trung bình,${kpi.avg_order_value}`);
    sections.push(`Đơn hoàn thành,${kpi.completed_orders}`);
    sections.push(`Khách hàng mới,${kpi.new_customers}`);
    sections.push(`Tăng trưởng doanh thu,${kpi.growth_pct}%`);
  }

  // Section 2: Revenue chart
  sections.push("");
  sections.push("=== DOANH THU THEO THỜI GIAN ===");
  sections.push("Nhãn,Doanh thu,Số đơn");
  revenueChart.forEach((p) => {
    sections.push(`${p.label},${p.revenue},${p.order_count}`);
  });

  // Section 3: Top products
  sections.push("");
  sections.push("=== TOP SẢN PHẨM BÁN CHẠY ===");
  sections.push("Hạng,Tên sản phẩm,Số lượng bán,Doanh thu");
  topProducts.forEach((p, idx) => {
    sections.push(
      `${idx + 1},"${p.product_name.replace(/"/g, '""')}",${p.total_sold},${p.total_revenue}`,
    );
  });

  // Section 4: Category revenue
  sections.push("");
  sections.push("=== DOANH THU THEO DANH MỤC ===");
  sections.push(
    "Danh mục,Số lượng bán,Doanh thu,Giá vốn,Lợi nhuận,Tỷ suất LN (%)",
  );
  categoryRevenue.forEach((c) => {
    sections.push(
      `"${c.category_name.replace(/"/g, '""')}",${c.qty_sold},${c.revenue},${c.cost},${c.profit},${c.margin_pct}`,
    );
  });

  const csv = BOM + sections.join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `bao-cao-kinh-doanh_${dateFrom}_${dateTo}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ─── Page ─────────────────────────────────────────────────────

export default function AdminStatisticsPage() {
  const today = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 29);

  const [dateFrom, setDateFrom] = useState(fmtDate(thirtyDaysAgo));
  const [dateTo, setDateTo] = useState(fmtDate(today));
  const [period, setPeriod] = useState<ChartPeriod>("daily");

  const [kpi, setKpi] = useState<StatisticsKPI | null>(null);
  const [revenueChart, setRevenueChart] = useState<RevenuePoint[]>([]);
  const [orderStatus, setOrderStatus] = useState<OrderStatusItem[]>([]);
  const [topProducts, setTopProducts] = useState<TopProductItem[]>([]);
  const [categoryRevenue, setCategoryRevenue] = useState<CategoryRevenueItem[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [kpiData, chartData, statusData, topData, catData] =
        await Promise.all([
          adminStatisticsService.getKPI(dateFrom, dateTo),
          adminStatisticsService.getRevenueChart(period, dateFrom, dateTo),
          adminStatisticsService.getOrderStatus(dateFrom, dateTo),
          adminStatisticsService.getTopProducts(dateFrom, dateTo, 5),
          adminStatisticsService.getCategoryRevenue(dateFrom, dateTo),
        ]);
      setKpi(kpiData);
      setRevenueChart(chartData);
      setOrderStatus(statusData);
      setTopProducts(topData);
      setCategoryRevenue(catData);
    } catch {
      setError("Không thể tải dữ liệu. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, period]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const kpiCards = kpi
    ? [
        {
          icon: "attach_money",
          iconBg: "bg-primary/10 text-primary",
          label: "Lợi nhuận gộp",
          value: fmtVND(kpi.gross_profit),
          trend: fmtPct(kpi.growth_pct),
          positive: kpi.growth_pct >= 0,
        },
        {
          icon: "show_chart",
          iconBg: "bg-purple-500/10 text-purple-500",
          label: "Tăng trưởng doanh thu",
          value: fmtPct(kpi.growth_pct),
          trend: fmtVND(kpi.total_revenue),
          positive: kpi.growth_pct >= 0,
        },
        {
          icon: "receipt_long",
          iconBg: "bg-blue-500/10 text-blue-500",
          label: "Giá vốn hàng bán",
          value: fmtVND(kpi.total_cost),
          trend: `${kpi.completed_orders} đơn`,
          positive: true,
        },
        {
          icon: "shopping_cart_checkout",
          iconBg: "bg-orange-500/10 text-orange-500",
          label: "Giá trị đơn TB",
          value: fmtVND(kpi.avg_order_value),
          trend: `+${kpi.new_customers} KH mới`,
          positive: true,
        },
      ]
    : [];

  const maxProductRevenue = Math.max(
    ...topProducts.map((p) => p.total_revenue),
    1,
  );

  return (
    <div className="flex flex-col overflow-y-auto flex-1">
      <AdminHeader
        hideSearch
        actionLabel="Xuất báo cáo"
        actionIcon="download"
        onAction={() =>
          exportReport(
            dateFrom,
            dateTo,
            kpi,
            revenueChart,
            topProducts,
            categoryRevenue,
          )
        }
      />

      <div className="p-8 space-y-6">
        {/* ── Header + Filters ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Báo cáo kinh doanh
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Phân tích chi tiết hiệu quả hoạt động kinh doanh.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center bg-white border border-slate-200 rounded-lg px-3 py-2 gap-2">
              <span className="material-symbols-outlined text-slate-400 text-sm">
                calendar_today
              </span>
              <input
                type="date"
                className="bg-transparent border-none p-0 text-sm text-slate-600 focus:ring-0 outline-none"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
              <span className="text-slate-300">-</span>
              <input
                type="date"
                className="bg-transparent border-none p-0 text-sm text-slate-600 focus:ring-0 outline-none"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <select
              className="bg-white border border-slate-200 rounded-lg text-sm text-slate-600 py-2 pl-3 pr-8 focus:ring-primary focus:border-primary outline-none"
              value={period}
              onChange={(e) => setPeriod(e.target.value as ChartPeriod)}
            >
              <option value="daily">Theo ngày</option>
              <option value="weekly">Theo tuần</option>
              <option value="monthly">Theo tháng</option>
            </select>
            <button
              onClick={fetchAll}
              disabled={loading}
              className="bg-primary hover:bg-primary/90 disabled:opacity-60 text-white p-2 rounded-lg transition-colors"
            >
              <span className="material-symbols-outlined text-xl">
                filter_list
              </span>
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading
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
                      className={`text-xs font-bold flex items-center gap-0.5 ${
                        card.positive ? "text-emerald-500" : "text-red-500"
                      }`}
                    >
                      <span className="material-symbols-outlined text-xs">
                        {card.positive ? "trending_up" : "trending_down"}
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

        {/* ── Revenue Chart + Order Status ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Doanh thu & Đơn hàng
                </h2>
                <p className="text-sm text-slate-500">
                  {dateFrom} → {dateTo}
                </p>
              </div>
              <div className="flex gap-4 text-xs font-medium">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-primary inline-block" />
                  Doanh thu
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-blue-400 inline-block" />
                  Đơn hàng
                </span>
              </div>
            </div>
            {loading ? (
              <div className="h-60 bg-slate-50 rounded-lg animate-pulse" />
            ) : (
              <RevenueBarChart data={revenueChart} />
            )}
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 mb-4">
              Trạng thái đơn hàng
            </h2>
            {loading ? (
              <div className="h-45 bg-slate-50 rounded-lg animate-pulse" />
            ) : (
              <OrderStatusDonut data={orderStatus} />
            )}
          </div>
        </div>

        {/* ── Top Products + Category Revenue ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-6">
              Top sản phẩm bán chạy
            </h2>
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-10 bg-slate-100 rounded animate-pulse"
                  />
                ))}
              </div>
            ) : topProducts.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">
                Không có dữ liệu.
              </p>
            ) : (
              <div className="space-y-4">
                {topProducts.map((prod, idx) => (
                  <div
                    key={prod.product_id}
                    className="flex items-center gap-3"
                  >
                    <span className="text-lg font-bold text-slate-300 w-4 shrink-0">
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {prod.product_name}
                      </p>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1">
                        <div
                          className="bg-primary h-1.5 rounded-full transition-all duration-500"
                          style={{
                            width: `${(prod.total_revenue / maxProductRevenue) * 100}%`,
                            opacity: 1 - idx * 0.15,
                          }}
                        />
                      </div>
                    </div>
                    <span className="text-xs font-bold text-primary shrink-0">
                      {fmtVND(prod.total_revenue)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-900">
                Doanh thu theo danh mục
              </h2>
            </div>
            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-6 space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-10 bg-slate-100 rounded animate-pulse"
                    />
                  ))}
                </div>
              ) : categoryRevenue.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">
                  Không có dữ liệu trong khoảng thời gian này.
                </div>
              ) : (
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold">
                    <tr>
                      <th className="px-6 py-3">Danh mục</th>
                      <th className="px-6 py-3">Số lượng bán</th>
                      <th className="px-6 py-3">Doanh thu</th>
                      <th className="px-6 py-3">Giá vốn</th>
                      <th className="px-6 py-3">Lợi nhuận</th>
                      <th className="px-6 py-3 text-right">Tỷ suất LN</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {categoryRevenue.map((cat) => {
                      const marginColor =
                        cat.margin_pct >= 30
                          ? "bg-emerald-100 text-emerald-700"
                          : cat.margin_pct >= 15
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700";
                      return (
                        <tr
                          key={cat.category_id}
                          className="hover:bg-slate-50 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <span className="text-sm font-medium text-slate-900">
                              {cat.category_name}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">
                            {cat.qty_sold.toLocaleString("vi-VN")}
                          </td>
                          <td className="px-6 py-4 text-sm font-bold text-slate-900">
                            {fmtVND(cat.revenue)}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">
                            {fmtVND(cat.cost)}
                          </td>
                          <td className="px-6 py-4 text-sm font-bold text-emerald-600">
                            {fmtVND(cat.profit)}
                          </td>
                          <td className="px-6 py-4 text-sm text-right">
                            <span
                              className={`px-2 py-1 text-xs font-bold rounded-full ${marginColor}`}
                            >
                              {cat.margin_pct}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
