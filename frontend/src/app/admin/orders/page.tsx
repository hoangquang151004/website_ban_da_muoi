"use client";
import { useState, useEffect } from "react";
import AdminHeader from "@/components/admin/Header";
import { orderService } from "@/services/orderService";

type OrderStatus =
  | "pending"
  | "processing"
  | "shipping"
  | "delivered"
  | "cancelled";
type TabKey = "all" | OrderStatus;

type OrderRow = {
  id: number;
  code: string;
  customer: string;
  city: string;
  product: string;
  qty: number;
  total: string;
  status: OrderStatus;
};

const STATUS_META: Record<
  OrderStatus,
  { label: string; cls: string; dot: string }
> = {
  pending: {
    label: "Chờ xác nhận",
    cls: "bg-amber-100 text-amber-700 border border-amber-200",
    dot: "bg-amber-500",
  },
  processing: {
    label: "Đang chuẩn bị",
    cls: "bg-purple-100 text-purple-700 border border-purple-200",
    dot: "bg-purple-500",
  },
  shipping: {
    label: "Đang giao",
    cls: "bg-blue-100 text-blue-700 border border-blue-200",
    dot: "bg-blue-500",
  },
  delivered: {
    label: "Đã giao",
    cls: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    dot: "bg-emerald-500",
  },
  cancelled: {
    label: "Đã hủy",
    cls: "bg-red-100 text-red-700 border border-red-200",
    dot: "bg-red-500",
  },
};

const TABS: { key: TabKey; label: string }[] = [
  { key: "all", label: "Tất cả" },
  { key: "pending", label: "Chờ xác nhận" },
  { key: "processing", label: "Đang chuẩn bị" },
  { key: "shipping", label: "Đang giao" },
  { key: "delivered", label: "Đã giao" },
  { key: "cancelled", label: "Đã hủy" },
];

const MOCK_ORDERS: OrderRow[] = [
  {
    id: 2851,
    code: "#ORD-2851",
    customer: "Trần Thị B",
    city: "Hà Nội",
    product: "Đèn đá muối tự nhiên (Size L)",
    qty: 1,
    total: "850.000đ",
    status: "pending",
  },
  {
    id: 2850,
    code: "#ORD-2850",
    customer: "Lê Văn C",
    city: "Đà Nẵng",
    product: "Đèn đá muối hình cầu",
    qty: 2,
    total: "1.200.000đ",
    status: "shipping",
  },
  {
    id: 2849,
    code: "#ORD-2849",
    customer: "Phạm Văn D",
    city: "TP. HCM",
    product: "Hộp đá muối xông chân",
    qty: 1,
    total: "2.450.000đ",
    status: "delivered",
  },
  {
    id: 2848,
    code: "#ORD-2848",
    customer: "Nguyễn Thị E",
    city: "Huế",
    product: "Đèn đá muối Kim tự tháp",
    qty: 3,
    total: "3.600.000đ",
    status: "processing",
  },
  {
    id: 2847,
    code: "#ORD-2847",
    customer: "Hoàng Văn F",
    city: "Cần Thơ",
    product: "Đèn đá muối tự nhiên (Size S)",
    qty: 1,
    total: "650.000đ",
    status: "cancelled",
  },
];

export default function AdminOrdersPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [orders, setOrders] = useState<OrderRow[]>(MOCK_ORDERS);
  const [viewOrder, setViewOrder] = useState<OrderRow | null>(null);
  const [newStatus, setNewStatus] = useState<OrderStatus>("pending");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const params: any = {};
    if (activeTab !== "all") params.status = activeTab;
    orderService
      .getAllOrders(params)
      .then((res: any) => {
        const data = res.data ?? res.results ?? [];
        if (data.length > 0) {
          setOrders(
            data.map((o: any) => ({
              id: o.id,
              code: o.code ?? `#ORD-${o.id}`,
              customer: o.customerName ?? o.customer_name ?? "",
              city: o.shippingAddress?.split(",").pop()?.trim() ?? "",
              product: o.items?.[0]?.productName ?? o.items?.[0]?.name ?? "",
              qty:
                o.items?.reduce((s: number, i: any) => s + i.quantity, 0) ?? 1,
              total: `${Number(o.total ?? 0).toLocaleString("vi-VN")}đ`,
              status: o.status as OrderStatus,
            })),
          );
        }
      })
      .catch(() => {
        /* keep mock */
      });
  }, [activeTab]);

  function openView(order: OrderRow) {
    setViewOrder(order);
    setNewStatus(order.status);
  }

  async function handleStatusUpdate() {
    if (!viewOrder) return;
    setUpdating(true);
    try {
      await orderService.updateOrderStatus(viewOrder.id, newStatus);
      setOrders((prev) =>
        prev.map((o) =>
          o.id === viewOrder.id ? { ...o, status: newStatus } : o,
        ),
      );
      setViewOrder(null);
    } catch {
      alert("Lỗi khi cập nhật trạng thái.");
    } finally {
      setUpdating(false);
    }
  }

  const displayed =
    activeTab === "all" ? orders : orders.filter((o) => o.status === activeTab);

  return (
    <>
      <div className="flex flex-col overflow-hidden flex-1">
        <AdminHeader
          placeholder="Tìm kiếm đơn hàng, khách hàng..."
          actionLabel="Tạo đơn mới"
        />

        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Quản lý Đơn hàng
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Theo dõi và xử lý các đơn hàng hiện có
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors shadow-sm">
                <span className="material-symbols-outlined text-sm">
                  filter_list
                </span>
                Lọc
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors shadow-sm">
                <span className="material-symbols-outlined text-sm">
                  download
                </span>
                Xuất Excel
              </button>
            </div>
          </div>

          {/* Table container */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Tabs */}
            <div className="border-b border-slate-200 px-2 overflow-x-auto">
              <div className="flex w-max min-w-full">
                {TABS.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`px-6 py-4 text-sm border-b-2 transition-colors whitespace-nowrap ${
                      activeTab === tab.key
                        ? "font-bold text-primary border-primary"
                        : "font-medium text-slate-500 border-transparent hover:text-slate-700"
                    }`}
                  >
                    {tab.label}{" "}
                    <span
                      className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                        activeTab === tab.key
                          ? "bg-primary/10 text-primary"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {activeTab === tab.key
                        ? displayed.length
                        : tab.key === "all"
                          ? orders.length
                          : orders.filter((o) => o.status === tab.key).length}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold sticky top-0">
                  <tr>
                    <th className="px-6 py-4 border-b border-slate-100">
                      Mã đơn
                    </th>
                    <th className="px-6 py-4 border-b border-slate-100">
                      Khách hàng
                    </th>
                    <th className="px-6 py-4 border-b border-slate-100">
                      Sản phẩm
                    </th>
                    <th className="px-6 py-4 border-b border-slate-100">
                      Tổng tiền
                    </th>
                    <th className="px-6 py-4 border-b border-slate-100">
                      Trạng thái
                    </th>
                    <th className="px-6 py-4 border-b border-slate-100 text-center">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {displayed.map((order) => (
                    <tr
                      key={order.code}
                      className="hover:bg-slate-50 transition-colors group"
                    >
                      <td className="px-6 py-4 text-sm font-bold text-primary whitespace-nowrap">
                        {order.code}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-slate-900">
                            {order.customer}
                          </span>
                          <span className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <span className="material-symbols-outlined text-[10px]">
                              location_on
                            </span>
                            {order.city}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm text-slate-600 font-medium">
                            {order.product}
                          </span>
                          <span className="text-xs text-slate-400">
                            SL: {order.qty}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-900 whitespace-nowrap">
                        {order.total}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 text-[10px] font-bold rounded-full uppercase ${STATUS_META[order.status].cls}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full mr-1.5 ${STATUS_META[order.status].dot}`}
                          />
                          {STATUS_META[order.status].label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                          title="Xem chi tiết"
                          onClick={() => openView(order)}
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
          </div>
        </div>
      </div>

      {/* Order detail + status update modal */}
      {viewOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">
                Chi tiết đơn hàng {viewOrder.code}
              </h2>
              <button
                onClick={() => setViewOrder(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 space-y-3 text-sm text-slate-600">
              <div className="flex justify-between">
                <span className="font-medium text-slate-500">Khách hàng:</span>
                <span>{viewOrder.customer}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-slate-500">Thành phố:</span>
                <span>{viewOrder.city}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-slate-500">Sản phẩm:</span>
                <span>
                  {viewOrder.product} (x{viewOrder.qty})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-slate-500">Tổng tiền:</span>
                <span className="font-bold text-primary">
                  {viewOrder.total}
                </span>
              </div>
              <div className="pt-3 border-t border-slate-100">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Cập nhật trạng thái
                </label>
                <select
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
                >
                  {(Object.keys(STATUS_META) as OrderStatus[]).map((s) => (
                    <option key={s} value={s}>
                      {STATUS_META[s].label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="p-6 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                onClick={() => setViewOrder(null)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleStatusUpdate}
                disabled={updating || newStatus === viewOrder.status}
                className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 disabled:opacity-60 transition-colors"
              >
                {updating ? "Đang lưu..." : "Cập nhật"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
