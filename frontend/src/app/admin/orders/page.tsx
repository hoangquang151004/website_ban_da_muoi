"use client";
import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import AdminHeader from "@/components/admin/Header";
import {
  orderService,
  type OrderAdminDetail,
  type OrderStats,
} from "@/services/orderService";

// ─── Types ────────────────────────────────────────────────────────────────────
type OrderStatus =
  | "pending"
  | "confirmed"
  | "packing"
  | "shipping"
  | "delivered"
  | "cancelled";

type TabKey = "all" | OrderStatus;

type OrderRow = {
  id: number;
  code: string;
  customer: string;
  phone: string;
  address: string;
  totalItems: number;
  total: number;
  paymentMethod: string;
  status: OrderStatus;
  createdAt: string;
};

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_META: Record<
  OrderStatus,
  { label: string; cls: string; dot: string; icon: string }
> = {
  pending: {
    label: "Chờ xác nhận",
    cls: "bg-amber-100 text-amber-700 border border-amber-200",
    dot: "bg-amber-500",
    icon: "schedule",
  },
  confirmed: {
    label: "Đã xác nhận",
    cls: "bg-indigo-100 text-indigo-700 border border-indigo-200",
    dot: "bg-indigo-500",
    icon: "check_circle",
  },
  packing: {
    label: "Đang đóng gói",
    cls: "bg-purple-100 text-purple-700 border border-purple-200",
    dot: "bg-purple-500",
    icon: "inventory_2",
  },
  shipping: {
    label: "Đang giao",
    cls: "bg-blue-100 text-blue-700 border border-blue-200",
    dot: "bg-blue-500",
    icon: "local_shipping",
  },
  delivered: {
    label: "Đã giao",
    cls: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    dot: "bg-emerald-500",
    icon: "done_all",
  },
  cancelled: {
    label: "Đã hủy",
    cls: "bg-red-100 text-red-700 border border-red-200",
    dot: "bg-red-500",
    icon: "cancel",
  },
};

// State machine — which transitions are allowed
const ALLOWED_NEXT: Record<OrderStatus, OrderStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["packing", "cancelled"],
  packing: ["shipping", "cancelled"],
  shipping: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
};

const PAYMENT_LABEL: Record<string, string> = {
  cod: "COD",
  bank_transfer: "VNPay",
  vnpay: "VNPay",
  momo: "MoMo",
};

const TABS: { key: TabKey; label: string }[] = [
  { key: "all", label: "Tất cả" },
  { key: "pending", label: "Chờ xác nhận" },
  { key: "confirmed", label: "Đã xác nhận" },
  { key: "packing", label: "Đang đóng gói" },
  { key: "shipping", label: "Đang giao" },
  { key: "delivered", label: "Đã giao" },
  { key: "cancelled", label: "Đã hủy" },
];

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") ??
  "http://localhost:8000";

function resolveImageUrl(url: string | null): string | null {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `${API_BASE}${url}`;
}

function fmtCurrency(val: number) {
  return val.toLocaleString("vi-VN") + "đ";
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function AdminOrdersPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<OrderStats | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Detail modal
  const [viewId, setViewId] = useState<number | null>(null);
  const [detail, setDetail] = useState<OrderAdminDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [newStatus, setNewStatus] = useState<OrderStatus>("pending");
  const [updating, setUpdating] = useState(false);

  // Debounce search
  useEffect(() => {
    const h = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(h);
  }, [search]);

  // Reset page when tab/date changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, dateFrom, dateTo]);

  // Load stats
  const loadStats = useCallback(() => {
    orderService
      .getAdminOrderStats()
      .then(setStats)
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Load orders
  useEffect(() => {
    setLoading(true);
    const params: Record<string, any> = {
      page: currentPage,
      limit: pageSize,
    };
    if (activeTab !== "all") params.status = activeTab;
    if (debouncedSearch) params.search = debouncedSearch;
    if (dateFrom) params.date_from = dateFrom;
    if (dateTo) params.date_to = dateTo;

    orderService
      .getAllOrders(params)
      .then((res: any) => {
        const items = res.data ?? [];
        setOrders(
          items.map((o: any) => ({
            id: o.id,
            code: `#ORD-${o.id}`,
            customer: o.receiver_name ?? o.customerName ?? "",
            phone: o.receiver_phone ?? "",
            address: o.receiver_address ?? "",
            totalItems:
              o.items?.reduce((s: number, i: any) => s + i.quantity, 0) ?? 0,
            total: Number(o.total_amount ?? o.total ?? 0),
            paymentMethod: o.payment_method ?? "cod",
            status: o.status as OrderStatus,
            createdAt: o.created_at ?? new Date().toISOString(),
          })),
        );
        setTotalOrders(res.total ?? 0);
        setTotalPages(res.totalPages ?? 1);
      })
      .catch(() => {
        toast.error("Không thể tải danh sách đơn hàng");
      })
      .finally(() => setLoading(false));
  }, [activeTab, currentPage, pageSize, debouncedSearch, dateFrom, dateTo]);

  // Open detail modal
  async function openDetail(id: number) {
    setViewId(id);
    setDetail(null);
    setDetailLoading(true);
    try {
      const d = await orderService.getAdminOrderDetail(id);
      setDetail(d);
      setNewStatus(d.status as OrderStatus);
    } catch {
      toast.error("Không thể tải chi tiết đơn hàng");
      setViewId(null);
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleStatusUpdate() {
    if (!detail) return;
    setUpdating(true);
    const tid = toast.loading("Đang cập nhật trạng thái...");
    try {
      await orderService.updateOrderStatus(detail.id, newStatus as any);
      toast.success("Cập nhật trạng thái thành công!", { id: tid });
      setOrders((prev) =>
        prev.map((o) => (o.id === detail.id ? { ...o, status: newStatus } : o)),
      );
      setDetail((prev) => (prev ? { ...prev, status: newStatus } : prev));
      loadStats();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ?? "Lỗi khi cập nhật trạng thái.";
      toast.error(msg, { id: tid });
    } finally {
      setUpdating(false);
    }
  }

  const allowedNext = detail
    ? (ALLOWED_NEXT[detail.status as OrderStatus] ?? [])
    : [];

  const safePage = Math.min(currentPage, totalPages);

  // ── UI ──────────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="flex flex-col overflow-hidden flex-1">
        <AdminHeader
          placeholder="Tìm kiếm tên khách hàng, SĐT..."
          actionLabel=""
          searchValue={search}
          onSearchChange={setSearch}
        />

        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          {/* Page header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Quản lý Đơn hàng
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Theo dõi và xử lý các đơn hàng
              </p>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                title="Từ ngày"
              />
              <span className="text-slate-400 text-sm">→</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                title="Đến ngày"
              />
              {(dateFrom || dateTo) && (
                <button
                  onClick={() => {
                    setDateFrom("");
                    setDateTo("");
                  }}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm text-slate-600 transition-colors"
                  title="Xóa bộ lọc ngày"
                >
                  <span className="material-symbols-outlined text-sm">
                    close
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Stats bar */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              {(["all", ...Object.keys(STATUS_META)] as TabKey[]).map((key) => {
                const count =
                  key === "all"
                    ? stats.total
                    : (stats[key as keyof OrderStats] ?? 0);
                const meta =
                  key !== "all" ? STATUS_META[key as OrderStatus] : null;
                return (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className={`flex flex-col gap-1 p-3 rounded-xl border transition-all text-left ${
                      activeTab === key
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`material-symbols-outlined text-base ${
                          activeTab === key ? "text-primary" : "text-slate-400"
                        }`}
                      >
                        {meta?.icon ?? "list_alt"}
                      </span>
                      <span
                        className={`text-xs font-medium truncate ${
                          activeTab === key ? "text-primary" : "text-slate-500"
                        }`}
                      >
                        {key === "all" ? "Tất cả" : (meta?.label ?? key)}
                      </span>
                    </div>
                    <p
                      className={`text-xl font-bold ${
                        activeTab === key ? "text-primary" : "text-slate-900"
                      }`}
                    >
                      {count}
                    </p>
                  </button>
                );
              })}
            </div>
          )}

          {/* Table card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Tabs */}
            <div className="border-b border-slate-200 px-2 overflow-x-auto">
              <div className="flex w-max min-w-full">
                {TABS.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`px-5 py-3.5 text-sm border-b-2 transition-colors whitespace-nowrap ${
                      activeTab === tab.key
                        ? "font-bold text-primary border-primary"
                        : "font-medium text-slate-500 border-transparent hover:text-slate-700"
                    }`}
                  >
                    {tab.label}
                    {stats && (
                      <span
                        className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${
                          activeTab === tab.key
                            ? "bg-primary/10 text-primary"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {tab.key === "all"
                          ? stats.total
                          : (stats[tab.key as keyof OrderStats] ?? 0)}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold sticky top-0">
                  <tr>
                    <th className="px-5 py-4 border-b border-slate-100 whitespace-nowrap">
                      Mã đơn
                    </th>
                    <th className="px-5 py-4 border-b border-slate-100 whitespace-nowrap">
                      Khách hàng
                    </th>
                    <th className="px-5 py-4 border-b border-slate-100 whitespace-nowrap">
                      Địa chỉ
                    </th>
                    <th className="px-5 py-4 border-b border-slate-100 whitespace-nowrap">
                      Tổng tiền
                    </th>
                    <th className="px-5 py-4 border-b border-slate-100 whitespace-nowrap">
                      Thanh toán
                    </th>
                    <th className="px-5 py-4 border-b border-slate-100 whitespace-nowrap">
                      Trạng thái
                    </th>
                    <th className="px-5 py-4 border-b border-slate-100 whitespace-nowrap">
                      Ngày đặt
                    </th>
                    <th className="px-5 py-4 border-b border-slate-100 text-center whitespace-nowrap">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading && (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-5 py-14 text-center text-sm text-slate-400"
                      >
                        <span className="inline-block size-5 border-2 border-slate-300 border-t-primary rounded-full animate-spin mr-2 align-middle" />
                        Đang tải dữ liệu...
                      </td>
                    </tr>
                  )}
                  {!loading && orders.length === 0 && (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-5 py-14 text-center text-sm text-slate-400"
                      >
                        <span className="material-symbols-outlined text-4xl text-slate-300 block mb-2">
                          inbox
                        </span>
                        Không có đơn hàng nào.
                      </td>
                    </tr>
                  )}
                  {!loading &&
                    orders.map((order) => (
                      <tr
                        key={order.id}
                        className="hover:bg-slate-50 transition-colors group"
                      >
                        <td className="px-5 py-4">
                          <span className="text-sm font-bold text-primary whitespace-nowrap">
                            {order.code}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-slate-900 whitespace-nowrap">
                              {order.customer}
                            </span>
                            <span className="text-xs text-slate-400 mt-0.5">
                              {order.phone}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className="text-sm text-slate-600 max-w-[200px] truncate block"
                            title={order.address}
                          >
                            {order.address || "—"}
                          </span>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div>
                            <p className="text-sm font-bold text-slate-900">
                              {fmtCurrency(order.total)}
                            </p>
                            {order.totalItems > 0 && (
                              <p className="text-xs text-slate-400">
                                {order.totalItems} sản phẩm
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded-full whitespace-nowrap">
                            {PAYMENT_LABEL[order.paymentMethod] ??
                              order.paymentMethod}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold rounded-full uppercase ${STATUS_META[order.status].cls}`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${STATUS_META[order.status].dot}`}
                            />
                            {STATUS_META[order.status].label}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-xs text-slate-500 whitespace-nowrap">
                          {fmtDate(order.createdAt)}
                        </td>
                        <td className="px-5 py-4 text-center">
                          <button
                            className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                            title="Xem chi tiết"
                            onClick={() => openDetail(order.id)}
                          >
                            <span className="material-symbols-outlined text-xl">
                              visibility
                            </span>
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-5 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-4">
                <select
                  className="px-2 py-1.5 border border-slate-200 rounded-md text-xs text-slate-600 outline-none focus:border-primary cursor-pointer"
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                >
                  {[10, 15, 20, 50].map((n) => (
                    <option key={n} value={n}>
                      {n} / trang
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-500">
                  Hiển thị{" "}
                  <span className="font-bold">
                    {totalOrders === 0
                      ? "0"
                      : `${(safePage - 1) * pageSize + 1}–${Math.min(
                          safePage * pageSize,
                          totalOrders,
                        )}`}
                  </span>{" "}
                  trong <span className="font-bold">{totalOrders}</span> đơn
                  hàng
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  disabled={safePage === 1}
                  onClick={() => setCurrentPage(safePage - 1)}
                  className="size-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40"
                >
                  <span className="material-symbols-outlined text-sm">
                    chevron_left
                  </span>
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(
                    (p) =>
                      p === 1 ||
                      p === totalPages ||
                      Math.abs(p - safePage) <= 1,
                  )
                  .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                    if (
                      idx > 0 &&
                      typeof arr[idx - 1] === "number" &&
                      (p as number) - (arr[idx - 1] as number) > 1
                    )
                      acc.push("...");
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((item, i) =>
                    item === "..." ? (
                      <span
                        key={`e-${i}`}
                        className="size-8 flex items-center justify-center text-xs text-slate-400"
                      >
                        ...
                      </span>
                    ) : (
                      <button
                        key={item}
                        onClick={() => setCurrentPage(item as number)}
                        className={`size-8 flex items-center justify-center rounded-lg text-xs font-medium ${
                          safePage === item
                            ? "bg-primary text-white shadow-sm"
                            : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {item}
                      </button>
                    ),
                  )}
                <button
                  disabled={safePage === totalPages}
                  onClick={() => setCurrentPage(safePage + 1)}
                  className="size-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40"
                >
                  <span className="material-symbols-outlined text-sm">
                    chevron_right
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Detail Modal ────────────────────────────────────────────────────── */}
      {viewId !== null && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Chi tiết đơn hàng{" "}
                  <span className="text-primary">#ORD-{viewId}</span>
                </h2>
                {detail && (
                  <p className="text-xs text-slate-400 mt-0.5">
                    Đặt lúc {fmtDate(detail.created_at)}
                  </p>
                )}
              </div>
              <button
                onClick={() => {
                  setViewId(null);
                  setDetail(null);
                }}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto flex-1 p-6 space-y-6">
              {detailLoading && (
                <div className="py-12 text-center text-slate-400">
                  <span className="inline-block size-6 border-2 border-slate-300 border-t-primary rounded-full animate-spin mb-2" />
                  <p className="text-sm">Đang tải chi tiết...</p>
                </div>
              )}

              {detail && !detailLoading && (
                <>
                  {/* Status badge */}
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full uppercase ${STATUS_META[detail.status as OrderStatus].cls}`}
                    >
                      <span className="material-symbols-outlined text-sm">
                        {STATUS_META[detail.status as OrderStatus].icon}
                      </span>
                      {STATUS_META[detail.status as OrderStatus].label}
                    </span>
                    <span className="text-xs text-slate-400">
                      {PAYMENT_LABEL[detail.payment_method] ??
                        detail.payment_method}
                    </span>
                  </div>

                  {/* Customer + address */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Khách hàng
                      </p>
                      <p className="text-sm font-semibold text-slate-900">
                        {detail.receiver_name}
                      </p>
                      <p className="text-sm text-slate-600">
                        {detail.receiver_phone}
                      </p>
                      {detail.user && (
                        <p className="text-xs text-slate-400">
                          {detail.user.email}
                        </p>
                      )}
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Địa chỉ giao hàng
                      </p>
                      <p className="text-sm text-slate-700 leading-relaxed">
                        {detail.receiver_address}
                      </p>
                      {detail.note && (
                        <p className="text-xs text-slate-500 italic">
                          Ghi chú: {detail.note}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Items */}
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                      Sản phẩm ({detail.items.length})
                    </p>
                    <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden">
                      {detail.items.map((item) => {
                        const imgUrl = resolveImageUrl(
                          item.product_image ?? null,
                        );
                        return (
                          <div
                            key={item.id}
                            className="flex items-center gap-3 px-4 py-3 bg-white hover:bg-slate-50 transition-colors"
                          >
                            <div className="size-12 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                              {imgUrl ? (
                                <img
                                  src={imgUrl}
                                  alt={item.product_name ?? ""}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="material-symbols-outlined text-slate-400 text-xl">
                                  image
                                </span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-900 truncate">
                                {item.product_name ??
                                  `Sản phẩm #${item.product_id}`}
                              </p>
                              <p className="text-xs text-slate-400">
                                {fmtCurrency(Number(item.unit_price))} ×{" "}
                                {item.quantity}
                              </p>
                            </div>
                            <p className="text-sm font-bold text-slate-900 whitespace-nowrap">
                              {fmtCurrency(Number(item.subtotal))}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Total */}
                  <div className="flex items-center justify-between py-3 border-t border-slate-200">
                    <span className="text-sm font-semibold text-slate-700">
                      Tổng cộng
                    </span>
                    <span className="text-xl font-bold text-primary">
                      {fmtCurrency(Number(detail.total_amount))}
                    </span>
                  </div>

                  {/* Status update */}
                  {allowedNext.length > 0 && (
                    <div className="bg-slate-50 rounded-xl p-4 space-y-3 border border-slate-200">
                      <p className="text-sm font-semibold text-slate-700">
                        Cập nhật trạng thái
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {allowedNext.map((s) => (
                          <button
                            key={s}
                            onClick={() => setNewStatus(s)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                              newStatus === s
                                ? STATUS_META[s].cls + " scale-105 shadow-sm"
                                : "border-slate-200 text-slate-600 hover:border-slate-300 bg-white"
                            }`}
                          >
                            <span className="material-symbols-outlined text-sm mr-1 align-middle">
                              {STATUS_META[s].icon}
                            </span>
                            {STATUS_META[s].label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {allowedNext.length === 0 && (
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-center">
                      <span className="material-symbols-outlined text-2xl text-slate-400 block mb-1">
                        lock
                      </span>
                      <p className="text-sm text-slate-500">
                        Đơn hàng đã ở trạng thái cuối, không thể thay đổi thêm.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0">
              <button
                onClick={() => {
                  setViewId(null);
                  setDetail(null);
                }}
                className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Đóng
              </button>
              {allowedNext.length > 0 && (
                <button
                  onClick={handleStatusUpdate}
                  disabled={
                    updating ||
                    !newStatus ||
                    newStatus === detail?.status ||
                    !allowedNext.includes(newStatus)
                  }
                  className="px-5 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                  {updating && (
                    <span className="inline-block size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  )}
                  {updating ? "Đang lưu..." : "Xác nhận cập nhật"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
