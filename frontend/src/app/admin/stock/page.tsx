"use client";
import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import AdminHeader from "@/components/admin/Header";
import {
  adminStockService,
  type StockReportItem,
  type StockSummary,
  type WriteOffReason,
} from "@/services/adminStockService";
import { catalogService, type CategoryRow } from "@/services/catalogService";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") ??
  "http://localhost:8000";

function resolveImage(url: string | null): string | null {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `${API_BASE}${url}`;
}

const getStockStatus = (stock: number, min: number) => {
  if (stock === 0) return { label: "Hết hàng", cls: "bg-red-100 text-red-700" };
  if (stock < min)
    return { label: "Sắp hết", cls: "bg-amber-200 text-amber-700" };
  return { label: "Còn hàng", cls: "bg-emerald-200 text-emerald-700" };
};

function fmtPrice(p: number) {
  return p.toLocaleString("vi-VN") + "đ";
}

function normalizeVN(str: string) {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, (c) => (c === "đ" ? "d" : "D"))
    .toLowerCase();
}

function fmtValue(v: number) {
  if (v >= 1_000_000_000) return (v / 1_000_000_000).toFixed(1) + " tỷ";
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + " tr";
  return v.toLocaleString("vi-VN") + "đ";
}

function exportToCSV(items: StockReportItem[]) {
  const BOM = "\uFEFF";
  const headers = [
    "ID",
    "Tên sản phẩm",
    "Tồn kho",
    "Mức tối thiểu",
    "Trạng thái",
    "Giá bán",
    "Giá nhập",
    "Giá trị tồn kho",
  ];
  const rows = items.map((item) => {
    const { label } = getStockStatus(item.current_stock, item.min_stock);
    return [
      item.product_id,
      `"${item.product_name.replace(/"/g, '""')}"`,
      item.current_stock,
      item.min_stock,
      label,
      item.price,
      item.cost_price ?? "",
      item.stock_value,
    ].join(",");
  });
  const csv = BOM + [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `ton-kho-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Modal nhập kho
interface ImportModalProps {
  products: StockReportItem[];
  defaultProductId?: number;
  onClose: () => void;
  onSuccess: (updated: StockReportItem) => void;
}

function ImportModal({
  products,
  defaultProductId,
  onClose,
  onSuccess,
}: ImportModalProps) {
  const [productId, setProductId] = useState<number>(
    defaultProductId ?? products[0]?.product_id ?? 0,
  );
  const [quantity, setQuantity] = useState("");
  const [note, setNote] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const qty = parseInt(quantity);
    if (!productId || isNaN(qty) || qty <= 0) {
      toast.error("Vui lòng chọn sản phẩm và nhập số lượng hợp lệ");
      return;
    }
    setLoading(true);
    try {
      const updated = await adminStockService.restock({
        product_id: productId,
        quantity: qty,
        note: note || undefined,
        unit_cost: unitCost ? parseFloat(unitCost) : undefined,
      });
      toast.success("Nhập kho thành công!");
      onSuccess(updated);
      onClose();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Nhập kho thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Nhập kho hàng</h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Sản phẩm
            </label>
            <select
              value={productId}
              onChange={(e) => setProductId(Number(e.target.value))}
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            >
              {products.map((p) => (
                <option key={p.product_id} value={p.product_id}>
                  {p.product_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Số lượng nhập
            </label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Ghi chú
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none"
              placeholder="Nhập ghi chú..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Giá nhập (tùy chọn)
            </label>
            <input
              type="number"
              min="0"
              value={unitCost}
              onChange={(e) => setUnitCost(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              placeholder="VD: 650000"
            />
            <p className="text-xs text-slate-400 mt-1">
              Để trống nếu giữ nguyên giá nhập cũ
            </p>
          </div>
        </div>
        <div className="p-6 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            {loading ? "Đang xử lý..." : "Xác nhận nhập"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Modal đặt cảnh báo mức tồn kho tối thiểu
interface StockAlertModalProps {
  products: StockReportItem[];
  defaultProductId?: number;
  onClose: () => void;
  onSuccess: (updated: StockReportItem) => void;
}

function StockAlertModal({
  products,
  defaultProductId,
  onClose,
  onSuccess,
}: StockAlertModalProps) {
  const [productId, setProductId] = useState<number>(
    defaultProductId ?? products[0]?.product_id ?? 0,
  );
  const selectedProduct = products.find((p) => p.product_id === productId);
  const [minStock, setMinStock] = useState(
    String(selectedProduct?.min_stock ?? 0),
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const p = products.find((p) => p.product_id === productId);
    if (p) setMinStock(String(p.min_stock));
  }, [productId, products]);

  const handleSubmit = async () => {
    const val = parseInt(minStock);
    if (isNaN(val) || val < 0) {
      toast.error("Giá trị không hợp lệ");
      return;
    }
    setLoading(true);
    try {
      const updated = await adminStockService.updateMinStock(productId, val);
      toast.success("Cập nhật cảnh báo tồn kho thành công!");
      onSuccess(updated);
      onClose();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Cập nhật thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Cài đặt cảnh báo tồn kho
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Hệ thống cảnh báo khi tồn kho dưới mức tối thiểu
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Sản phẩm
            </label>
            {defaultProductId ? (
              <div className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-slate-50 text-slate-700 font-medium">
                {selectedProduct?.product_name}
              </div>
            ) : (
              <select
                value={productId}
                onChange={(e) => setProductId(Number(e.target.value))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              >
                {products.map((p) => (
                  <option key={p.product_id} value={p.product_id}>
                    {p.product_name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {selectedProduct && (
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg text-sm">
              <span className="material-symbols-outlined text-slate-400">
                inventory
              </span>
              <span className="text-slate-500">Tồn kho hiện tại:</span>
              <span
                className={`font-bold ${
                  selectedProduct.current_stock < selectedProduct.min_stock
                    ? "text-red-600"
                    : "text-emerald-600"
                }`}
              >
                {selectedProduct.current_stock}
              </span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Mức tồn kho tối thiểu (ngưỡng cảnh báo)
            </label>
            <input
              type="number"
              min="0"
              value={minStock}
              onChange={(e) => setMinStock(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            />
            <p className="text-xs text-slate-400 mt-1">
              Hệ thống sẽ hiển thị cảnh báo &quot;Sắp hết hàng&quot; khi tồn kho
              thấp hơn mức này
            </p>
          </div>
        </div>
        <div className="p-6 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-bold hover:bg-amber-600 disabled:opacity-60"
          >
            {loading ? "Đang lưu..." : "Lưu cảnh báo"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Modal xuất kho điều chỉnh (write-off)
interface WriteOffModalProps {
  products: StockReportItem[];
  defaultProductId?: number;
  onClose: () => void;
  onSuccess: (updated: StockReportItem) => void;
}

const WRITE_OFF_REASONS: { value: WriteOffReason; label: string }[] = [
  { value: "damaged", label: "Hàng hỏng" },
  { value: "expired", label: "Hết hạn" },
  { value: "lost", label: "Mất mát / Thất thoát" },
  { value: "other", label: "Lý do khác" },
];

function WriteOffModal({
  products,
  defaultProductId,
  onClose,
  onSuccess,
}: WriteOffModalProps) {
  const validProducts = products.filter((p) => p.current_stock > 0);
  const [productId, setProductId] = useState<number>(
    defaultProductId ?? validProducts[0]?.product_id ?? 0,
  );
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState<WriteOffReason>("damaged");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const selectedProduct = validProducts.find((p) => p.product_id === productId);

  const handleSubmit = async () => {
    const qty = parseInt(quantity);
    if (!productId || isNaN(qty) || qty <= 0) {
      toast.error("Vui lòng chọn sản phẩm và nhập số lượng hợp lệ");
      return;
    }
    if (selectedProduct && qty > selectedProduct.current_stock) {
      toast.error(`Tồn kho chỉ còn ${selectedProduct.current_stock}`);
      return;
    }
    setLoading(true);
    try {
      const updated = await adminStockService.writeOff({
        product_id: productId,
        quantity: qty,
        write_off_reason: reason,
        note: note || undefined,
      });
      toast.success("Xuất kho điều chỉnh thành công!");
      onSuccess(updated);
      onClose();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Xuất kho thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">
            Điều chỉnh kho / Xuất hàng hỏng
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Sản phẩm
            </label>
            <select
              value={productId}
              onChange={(e) => setProductId(Number(e.target.value))}
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            >
              {validProducts.map((p) => (
                <option key={p.product_id} value={p.product_id}>
                  {p.product_name} (tồn: {p.current_stock})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Số lượng xuất
            </label>
            <input
              type="number"
              min="1"
              max={selectedProduct?.current_stock}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              placeholder="0"
            />
            {selectedProduct && (
              <p className="text-xs text-slate-400 mt-1">
                Tối đa: {selectedProduct.current_stock}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Lý do
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as WriteOffReason)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            >
              {WRITE_OFF_REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Ghi chú
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none"
              placeholder="Mô tả chi tiết lý do..."
            />
          </div>
        </div>
        <div className="p-6 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-colors disabled:opacity-60"
          >
            {loading ? "Đang xử lý..." : "Xác nhận xuất kho"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Main page
export default function AdminStockPage() {
  const [stockItems, setStockItems] = useState<StockReportItem[]>([]);
  const [summary, setSummary] = useState<StockSummary | null>(null);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");

  const [showImportModal, setShowImportModal] = useState(false);
  const [importTargetId, setImportTargetId] = useState<number | undefined>(
    undefined,
  );
  const [showWriteOffModal, setShowWriteOffModal] = useState(false);
  const [writeOffTargetId, setWriteOffTargetId] = useState<number | undefined>(
    undefined,
  );
  const [alertTargetId, setAlertTargetId] = useState<number | undefined>(
    undefined,
  );
  const [showAlertModal, setShowAlertModal] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [summaryData, itemsData, catsData] = await Promise.all([
        adminStockService.getSummary(),
        adminStockService.getStockReport({
          category_id: filterCategory ? Number(filterCategory) : undefined,
          status: (filterStatus as any) || undefined,
        }),
        catalogService.listCategories({ limit: 100 }),
      ]);
      setSummary(summaryData);
      setStockItems(itemsData);
      setCategories(catsData.items);
    } catch (e: any) {
      toast.error("Không thể tải dữ liệu tồn kho");
    } finally {
      setLoading(false);
    }
  }, [filterCategory, filterStatus]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRestockSuccess = (updated: StockReportItem) => {
    setStockItems((prev) =>
      prev.map((i) => (i.product_id === updated.product_id ? updated : i)),
    );
    // reload summary
    adminStockService
      .getSummary()
      .then(setSummary)
      .catch(() => {});
  };

  const handleAlertSuccess = (updated: StockReportItem) => {
    setStockItems((prev) =>
      prev.map((i) => (i.product_id === updated.product_id ? updated : i)),
    );
  };

  const openWriteOffModal = (productId?: number) => {
    setWriteOffTargetId(productId);
    setShowWriteOffModal(true);
  };

  const openAlertModal = (productId?: number) => {
    setAlertTargetId(productId);
    setShowAlertModal(true);
  };

  const filteredItems = searchQuery
    ? stockItems.filter((item) => {
        const q = normalizeVN(searchQuery);
        return (
          normalizeVN(item.product_name).includes(q) ||
          String(item.product_id).includes(searchQuery)
        );
      })
    : stockItems;

  const handleWriteOffSuccess = (updated: StockReportItem) => {
    setStockItems((prev) =>
      prev.map((i) => (i.product_id === updated.product_id ? updated : i)),
    );
    adminStockService
      .getSummary()
      .then(setSummary)
      .catch(() => {});
  };

  const openImportModal = (productId?: number) => {
    setImportTargetId(productId);
    setShowImportModal(true);
  };

  return (
    <div className="flex flex-col overflow-y-auto flex-1">
      <AdminHeader
        placeholder="Tìm kiếm sản phẩm, SKU..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        actionLabel="Nhập kho"
        actionIcon="add_box"
        onAction={() => openImportModal()}
      />

      <div className="p-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Quản lý tồn kho
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Theo dõi tình trạng hàng hóa và cập nhật số lượng
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => exportToCSV(filteredItems)}
              disabled={loading || filteredItems.length === 0}
              className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-sm">
                download
              </span>
              Xuất Excel
            </button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 text-blue-500 rounded-lg">
              <span className="material-symbols-outlined text-2xl">
                inventory
              </span>
            </div>
            <div>
              <p className="text-slate-500 text-sm font-medium">Tổng tồn kho</p>
              <h3 className="text-2xl font-bold text-slate-900">
                {loading ? "—" : summary?.total_stock.toLocaleString("vi-VN")}
              </h3>
              <p className="text-xs text-emerald-500 font-medium mt-1">
                +{loading ? "—" : summary?.new_imported} sp mới nhập (30 ngày)
              </p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-red-100 shadow-sm flex items-center gap-4 relative overflow-hidden">
            <div className="absolute right-0 top-0 p-2 opacity-5">
              <span className="material-symbols-outlined text-8xl text-red-500">
                warning
              </span>
            </div>
            <div className="p-3 bg-red-500/10 text-red-500 rounded-lg z-10">
              <span className="material-symbols-outlined text-2xl">
                notification_important
              </span>
            </div>
            <div className="z-10">
              <p className="text-slate-500 text-sm font-medium">
                Sản phẩm sắp hết
              </p>
              <h3 className="text-2xl font-bold text-red-600">
                {loading
                  ? "—"
                  : summary
                    ? summary.low_stock_count + summary.out_of_stock_count
                    : 0}
              </h3>
              <p className="text-xs text-red-500 font-medium mt-1">
                Cần nhập hàng ngay
              </p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-lg">
              <span className="material-symbols-outlined text-2xl">
                attach_money
              </span>
            </div>
            <div>
              <p className="text-slate-500 text-sm font-medium">
                Giá trị tồn kho
              </p>
              <h3 className="text-2xl font-bold text-slate-900">
                {loading
                  ? "—"
                  : summary
                    ? fmtValue(summary.total_stock_value)
                    : "—"}
              </h3>
              <p className="text-xs text-slate-400 font-medium mt-1">
                Giá trị vốn ước tính
              </p>
            </div>
          </div>
        </div>

        {/* Stock table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between flex-wrap gap-4">
            <h2 className="text-base font-bold text-slate-900">
              Chi tiết tồn kho
            </h2>
            <div className="flex items-center gap-3">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg text-sm py-2 px-3 focus:ring-primary focus:border-primary outline-none"
              >
                <option value="">Tất cả danh mục</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg text-sm py-2 px-3 focus:ring-primary focus:border-primary outline-none"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="in_stock">Còn hàng</option>
                <option value="low_stock">Sắp hết</option>
                <option value="out_of_stock">Hết hàng</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400">
              <span className="material-symbols-outlined text-4xl animate-spin">
                sync
              </span>
              <p className="mt-2 text-sm">Đang tải...</p>
            </div>
          ) : stockItems.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <span className="material-symbols-outlined text-4xl">
                inventory_2
              </span>
              <p className="mt-2 text-sm">Không có sản phẩm nào</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <span className="material-symbols-outlined text-4xl">
                search_off
              </span>
              <p className="mt-2 text-sm">Không tìm thấy sản phẩm phù hợp</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">Sản phẩm</th>
                    <th className="px-6 py-4 text-center">Tồn kho</th>
                    <th className="px-6 py-4 text-center">Mức tối thiểu</th>
                    <th className="px-6 py-4">Giá bán</th>
                    <th className="px-6 py-4">Giá nhập</th>
                    <th className="px-6 py-4">Giá trị tồn</th>
                    <th className="px-6 py-4">Trạng thái</th>
                    <th className="px-6 py-4 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredItems.map((item) => {
                    const status = getStockStatus(
                      item.current_stock,
                      item.min_stock,
                    );
                    const imgUrl = resolveImage(item.image_url);
                    return (
                      <tr
                        key={item.product_id}
                        className="hover:bg-slate-50 transition-colors group"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="size-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                              {imgUrl ? (
                                <img
                                  src={imgUrl}
                                  alt={item.product_name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="material-symbols-outlined text-slate-400">
                                  image
                                </span>
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900 max-w-45 truncate">
                                {item.product_name}
                              </p>
                              <p className="text-xs text-slate-400">
                                ID: {item.product_id}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-center">
                          <span
                            className={`text-sm font-bold ${item.current_stock < item.min_stock ? "text-red-600" : "text-slate-900"}`}
                          >
                            {item.current_stock}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => openAlertModal(item.product_id)}
                            title="Chỉnh sửa mức cảnh báo tối thiểu"
                            className="text-sm text-slate-500 hover:text-amber-600 underline decoration-dashed underline-offset-2"
                          >
                            {item.min_stock}
                          </button>
                        </td>
                        <td className="px-4 py-4 text-sm font-bold text-primary whitespace-nowrap">
                          {fmtPrice(item.price)}
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-500 whitespace-nowrap">
                          {item.cost_price ? (
                            fmtPrice(item.cost_price)
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-600 whitespace-nowrap">
                          {fmtValue(item.stock_value)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${status.cls}`}
                          >
                            {status.label}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right w-px whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100">
                            <button
                              onClick={() => openImportModal(item.product_id)}
                              className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 hover:border-primary hover:text-primary transition-all"
                            >
                              <span className="material-symbols-outlined text-[14px]">
                                add_box
                              </span>
                              Nhập
                            </button>
                            <button
                              onClick={() => openWriteOffModal(item.product_id)}
                              className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 hover:border-red-400 hover:text-red-500 transition-all"
                            >
                              <span className="material-symbols-outlined text-[14px]">
                                remove_circle
                              </span>
                              Xuất
                            </button>
                            <button
                              onClick={() => openAlertModal(item.product_id)}
                              className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 hover:border-amber-400 hover:text-amber-500 transition-all"
                            >
                              <span className="material-symbols-outlined text-[14px]">
                                notifications_active
                              </span>
                              Cảnh báo
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <ImportModal
          products={stockItems}
          defaultProductId={importTargetId}
          onClose={() => {
            setShowImportModal(false);
            setImportTargetId(undefined);
          }}
          onSuccess={handleRestockSuccess}
        />
      )}

      {/* Stock Alert Modal */}
      {showAlertModal && (
        <StockAlertModal
          products={stockItems}
          defaultProductId={alertTargetId}
          onClose={() => {
            setShowAlertModal(false);
            setAlertTargetId(undefined);
          }}
          onSuccess={handleAlertSuccess}
        />
      )}

      {/* Write-off Modal */}
      {showWriteOffModal && (
        <WriteOffModal
          products={stockItems}
          defaultProductId={writeOffTargetId}
          onClose={() => {
            setShowWriteOffModal(false);
            setWriteOffTargetId(undefined);
          }}
          onSuccess={handleWriteOffSuccess}
        />
      )}
    </div>
  );
}
