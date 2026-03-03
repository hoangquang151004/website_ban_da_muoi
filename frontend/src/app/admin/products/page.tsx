"use client";
import { useState, useEffect } from "react";
import AdminHeader from "@/components/admin/Header";
import { productService } from "@/services/productService";

type ProductRow = {
  id: number;
  name: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
  isActive: boolean;
  image: string | null;
};

function fmtPrice(p: number) {
  return p.toLocaleString("vi-VN") + "đ";
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductRow[]>(() => [
    {
      id: 8274,
      name: "Đèn đá muối tự nhiên (Size L)",
      sku: "HML-001",
      category: "Đèn ngủ",
      price: 850000,
      stock: 45,
      isActive: true,
      image: null,
    },
    {
      id: 8275,
      name: "Hộp đá muối xông chân",
      sku: "HML-002",
      category: "Chăm sóc sức khỏe",
      price: 2450000,
      stock: 12,
      isActive: true,
      image: null,
    },
    {
      id: 8276,
      name: "Chân nến đá muối",
      sku: "HML-003",
      category: "Đèn trang trí",
      price: 350000,
      stock: 128,
      isActive: true,
      image: null,
    },
    {
      id: 8277,
      name: "Đèn đá muối hình cầu",
      sku: "HML-004",
      category: "Đèn trang trí",
      price: 1200000,
      stock: 0,
      isActive: false,
      image: null,
    },
  ]);
  const [showModal, setShowModal] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editProduct, setEditProduct] = useState<ProductRow | null>(null);
  const [formName, setFormName] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formStock, setFormStock] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    productService
      .getProducts()
      .then((res: any) => {
        const data = res.data ?? res.results ?? [];
        if (data.length > 0) {
          setProducts(
            data.map((p: any) => ({
              id: p.id,
              name: p.name,
              sku: p.sku ?? "",
              category: p.category?.name ?? p.category ?? "",
              price: p.price,
              stock: p.stock ?? p.stockQuantity ?? p.stock_quantity ?? 0,
              isActive: p.isActive ?? p.is_active ?? true,
              image: p.image ?? p.thumbnail ?? null,
            })),
          );
        }
      })
      .catch(() => {
        /* keep mock */
      });
  }, []);

  function openCreate() {
    setEditProduct(null);
    setFormName("");
    setFormPrice("");
    setFormStock("");
    setFormCategory("");
    setFormDesc("");
    setShowModal(true);
  }

  function openEdit(p: ProductRow) {
    setEditProduct(p);
    setFormName(p.name);
    setFormPrice(String(p.price));
    setFormStock(String(p.stock));
    setFormCategory(p.category);
    setFormDesc("");
    setShowModal(true);
  }

  async function handleSave() {
    setSaving(true);
    const payload = {
      name: formName,
      price: Number(formPrice),
      stock: Number(formStock),
      category: formCategory,
      description: formDesc,
    };
    try {
      if (editProduct) {
        const updated: any = await productService.updateProduct(
          editProduct.id,
          payload,
        );
        setProducts((prev) =>
          prev.map((p) =>
            p.id === editProduct.id
              ? {
                  ...p,
                  name: updated.name ?? formName,
                  price: updated.price ?? Number(formPrice),
                  stock: updated.stock ?? Number(formStock),
                  category: updated.category ?? formCategory,
                }
              : p,
          ),
        );
      } else {
        const created: any = await productService.createProduct(payload);
        setProducts((prev) => [
          ...prev,
          {
            id: created.id,
            name: created.name ?? formName,
            sku: created.sku ?? "",
            category: created.category ?? formCategory,
            price: created.price ?? Number(formPrice),
            stock: created.stock ?? Number(formStock),
            isActive: true,
            image: null,
          },
        ]);
      }
      setShowModal(false);
    } catch {
      alert("Lỗi khi lưu sản phẩm.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteConfirm() {
    if (deleteId === null) return;
    setDeleting(true);
    try {
      await productService.deleteProduct(deleteId);
      setProducts((prev) => prev.filter((p) => p.id !== deleteId));
      setDeleteId(null);
    } catch {
      alert("Lỗi khi xóa sản phẩm.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col overflow-y-auto flex-1">
      <AdminHeader
        placeholder="Tìm kiếm sản phẩm..."
        actionLabel="Tạo sản phẩm"
        onAction={openCreate}
      />

      <div className="p-8 space-y-6">
        {/* Page title + filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Danh sách sản phẩm
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Tổng cộng{" "}
              <span className="font-bold text-slate-900">
                {products.length}
              </span>{" "}
              sản phẩm trong kho
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                filter_alt
              </span>
              <input
                className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-primary focus:border-primary w-[240px] outline-none"
                placeholder="Tìm theo tên hoặc SKU"
                type="text"
              />
            </div>
            <select className="pl-3 pr-10 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-primary focus:border-primary outline-none">
              <option value="">Tất cả danh mục</option>
              <option value="1">Đèn ngủ</option>
              <option value="2">Đèn trang trí</option>
              <option value="3">Chăm sóc sức khỏe</option>
            </select>
            <select className="pl-3 pr-10 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-primary focus:border-primary outline-none">
              <option value="">Tất cả trạng thái</option>
              <option value="published">Đang bán</option>
              <option value="draft">Bản nháp</option>
              <option value="hidden">Đã ẩn</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Sản phẩm</th>
                  <th className="px-6 py-4">SKU</th>
                  <th className="px-6 py-4">Danh mục</th>
                  <th className="px-6 py-4">Giá bán</th>
                  <th className="px-6 py-4 text-center">Tồn kho</th>
                  <th className="px-6 py-4 text-center">Trạng thái</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((product) => (
                  <tr
                    key={product.id}
                    className="hover:bg-slate-50 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                          {product.image ? (
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="material-symbols-outlined text-slate-400">
                              image
                            </span>
                          )}
                        </div>
                        <div className="min-w-0 max-w-[200px]">
                          <p
                            className="text-sm font-bold text-slate-900 truncate"
                            title={product.name}
                          >
                            {product.name}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            ID: {product.id}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-600">
                      {product.sku}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {product.category}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-primary">
                      {fmtPrice(product.price)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`text-sm font-medium ${
                          product.stock === 0
                            ? "text-red-500"
                            : product.stock < 20
                              ? "text-amber-600"
                              : "text-slate-700"
                        }`}
                      >
                        {product.stock} cái
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <label className="inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          defaultChecked={product.isActive}
                          className="sr-only peer"
                        />
                        <div className="relative w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                      </label>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          className="p-1.5 text-slate-500 hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
                          title="Chỉnh sửa"
                          onClick={() => openEdit(product)}
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            edit
                          </span>
                        </button>
                        <button
                          className="p-1.5 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                          title="Xóa"
                          onClick={() => setDeleteId(product.id)}
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            delete
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add/Edit Product Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">
                {editProduct ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Tên sản phẩm
                </label>
                <input
                  type="text"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  placeholder="Nhập tên sản phẩm"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Giá bán (VNĐ)
                  </label>
                  <input
                    type="number"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                    placeholder="0"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Số lượng tồn kho
                  </label>
                  <input
                    type="number"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                    placeholder="0"
                    value={formStock}
                    onChange={(e) => setFormStock(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Danh mục
                </label>
                <select
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                >
                  <option value="">Chọn danh mục</option>
                  <option value="Đèn ngủ">Đèn ngủ</option>
                  <option value="Đèn trang trí">Đèn trang trí</option>
                  <option value="Chăm sóc sức khỏe">Chăm sóc sức khỏe</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Mô tả sản phẩm
                </label>
                <textarea
                  rows={3}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none"
                  placeholder="Mô tả chi tiết về sản phẩm..."
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                />
              </div>
            </div>
            <div className="p-6 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 disabled:opacity-60 transition-colors"
              >
                {saving ? "Đang lưu..." : "Lưu sản phẩm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteId !== null && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="size-12 rounded-full bg-red-100 flex items-center justify-center">
                <span className="material-symbols-outlined text-red-500">
                  warning
                </span>
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Xác nhận xóa
                </h2>
                <p className="text-sm text-slate-500">
                  Hành động này không thể hoàn tác
                </p>
              </div>
            </div>
            <p className="text-sm text-slate-600 mb-6">
              Bạn có chắc chắn muốn xóa sản phẩm <strong>#{deleteId}</strong>{" "}
              không?
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-bold hover:bg-red-600 disabled:opacity-60 transition-colors"
              >
                {deleting ? "Đang xóa..." : "Xóa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
