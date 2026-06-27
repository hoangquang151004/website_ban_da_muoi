"use client";
import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import AdminHeader from "@/components/admin/Header";
import {
  productService,
  type AdminProductItem,
} from "@/services/productService";
import {
  catalogService,
  type CategoryRow,
  type UseRow,
} from "@/services/catalogService";
import ModelViewer from "@/components/admin/ModelViewer";

type ProductRow = {
  id: number;
  name: string;
  category: string;
  categoryId: number;
  price: number;
  originalPrice: number | null;
  stock: number;
  isActive: boolean;
  isFeatured: boolean;
  imageUrl: string | null;
  model3DUrl: string | null;
  uses: { id: number; name: string }[];
  images: { id: number; image_url: string }[];
  description: string;
};

function mapItem(p: AdminProductItem): ProductRow {
  return {
    id: p.id,
    name: p.name,
    category: p.category?.name ?? "",
    categoryId: p.category_id,
    price: typeof p.price === "string" ? parseFloat(p.price) : p.price,
    originalPrice:
      p.original_price != null
        ? typeof p.original_price === "string"
          ? parseFloat(p.original_price as any)
          : p.original_price
        : null,
    stock: p.stock,
    isActive: p.is_active,
    isFeatured: p.is_featured,
    imageUrl: p.image_url ?? null,
    model3DUrl: p.model_3d_url ?? null,
    uses: p.uses ?? [],
    images: p.images ?? [],
    description: p.description ?? "",
  };
}

function fmtPrice(p: number) {
  return p.toLocaleString("vi-VN") + " VNĐ";
}

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") ??
  "http://localhost:8000";

function resolveImageUrl(url: string | null): string | null {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `${API_BASE}${url}`;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [uses, setUses] = useState<UseRow[]>([]);

  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  const [showModal, setShowModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [editProduct, setEditProduct] = useState<ProductRow | null>(null);

  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formSalePrice, setFormSalePrice] = useState("");
  const [formStock, setFormStock] = useState("");
  const [formCategoryId, setFormCategoryId] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);
  const [formIsFeatured, setFormIsFeatured] = useState(false);
  const [formUseIds, setFormUseIds] = useState<number[]>([]);
  const [formImagePreview, setFormImagePreview] = useState<string | null>(null);
  const [formImageFile, setFormImageFile] = useState<File | null>(null);
  const mainImageInputRef = useRef<HTMLInputElement>(null);

  const [formAdditionalImages, setFormAdditionalImages] = useState<string[]>(
    [],
  );
  const additionalImageInputRef = useRef<HTMLInputElement>(null);

  const [formModelFile, setFormModelFile] = useState<File | null>(null);
  const [formModelPreview, setFormModelPreview] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  // Fetch init data
  useEffect(() => {
    Promise.all([
      catalogService.listCategories({ limit: 100 }).catch(() => null),
      catalogService.listUses().catch(() => null),
    ]).then(([catRes, usesRes]) => {
      if (catRes?.items) setCategories(catRes.items);
      if (Array.isArray(usesRes)) setUses(usesRes);
    });
  }, []);

  // Fetch products
  useEffect(() => {
    setLoading(true);
    let is_active_param: boolean | undefined = undefined;
    if (filterStatus === "published") is_active_param = true;
    if (filterStatus === "hidden") is_active_param = false;

    productService
      .listAdminProducts({
        page: currentPage,
        limit: pageSize,
        search: debouncedSearch || undefined,
        category_id: filterCategory ? Number(filterCategory) : undefined,
        is_active: is_active_param,
      })
      .then((res) => {
        if (res?.items) {
          setProducts(res.items.map(mapItem));
          setTotalProducts(res.total || 0);
        }
      })
      .catch(() => {
        toast.error("Lỗi tải danh sách sản phẩm");
      })
      .finally(() => setLoading(false));
  }, [currentPage, pageSize, debouncedSearch, filterCategory, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(totalProducts / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const pageRows = products;

  function handleSearchChange(v: string) {
    setSearch(v);
  }
  function handleCategoryChange(v: string) {
    setFilterCategory(v);
    setCurrentPage(1);
  }
  function handleStatusChange(v: string) {
    setFilterStatus(v);
    setCurrentPage(1);
  }

  function resetForm() {
    setFormName("");
    setFormDesc("");
    setFormPrice("");
    setFormSalePrice("");
    setFormStock("");
    setFormCategoryId("");
    setFormIsActive(true);
    setFormIsFeatured(false);
    setFormUseIds([]);
    setFormImagePreview(null);
    setFormImageFile(null);
    setFormAdditionalImages([]);
    setFormModelFile(null);
    setFormModelPreview(null);
  }

  function openCreate() {
    setEditProduct(null);
    resetForm();
    setShowModal(true);
  }

  function openEdit(p: ProductRow) {
    setEditProduct(p);
    setFormName(p.name);
    setFormDesc(p.description);
    setFormPrice(String(p.price));
    setFormSalePrice(p.originalPrice != null ? String(p.originalPrice) : "");
    setFormStock(String(p.stock));
    setFormCategoryId(String(p.categoryId));
    setFormIsActive(p.isActive);
    setFormIsFeatured(p.isFeatured);
    setFormUseIds(p.uses.map((u) => u.id));
    setFormImagePreview(resolveImageUrl(p.imageUrl));
    setFormImageFile(null);
    setFormAdditionalImages(p.images.map((img) => img.image_url));
    setFormModelFile(null);
    setFormModelPreview(p.model3DUrl ? resolveImageUrl(p.model3DUrl) : null);
    setShowModal(true);
  }

  async function handleSave() {
    if (!formName.trim() || !formCategoryId || !formPrice) return;

    const priceNum = Number(formPrice);
    const originPriceNum = formSalePrice ? Number(formSalePrice) : 0;
    if (formSalePrice && originPriceNum < priceNum) {
      return toast.error("Giá gốc phải lớn hơn hoặc bằng giá bán");
    }

    setSaving(true);
    let tid = toast.loading("Đang lưu sản phẩm...");
    try {
      let imageUrl: string | null = editProduct?.imageUrl ?? null;
      if (formImageFile) {
        toast.loading("Đang tải ảnh lên...", { id: tid });
        imageUrl = await productService.uploadImage(formImageFile);
      }
      if (!formImagePreview && !formImageFile) imageUrl = null;

      let model3DUrl: string | null = editProduct?.model3DUrl ?? null;
      if (formModelFile) {
        toast.loading("Đang tải mô hình 3D lên...", { id: tid });
        model3DUrl = await productService.uploadImage(formModelFile);
      }
      if (!formModelPreview && !formModelFile) model3DUrl = null;

      toast.loading("Đang cập nhật dữ liệu...", { id: tid });

      const payload = {
        name: formName.trim(),
        description: formDesc.trim() || " ",
        price: priceNum,
        original_price: formSalePrice ? originPriceNum : null,
        stock: Number(formStock) || 0,
        image_url: imageUrl,
        model_3d_url: model3DUrl,
        is_active: formIsActive,
        is_featured: formIsFeatured,
        category_id: Number(formCategoryId),
        use_ids: formUseIds,
        additional_images: formAdditionalImages,
      };

      if (editProduct) {
        const updated = await productService.updateProduct(
          editProduct.id,
          payload,
        );
        const row = mapItem(updated as AdminProductItem);
        setProducts((prev) =>
          prev.map((p) => (p.id === editProduct.id ? row : p)),
        );
        toast.success("Cập nhật sản phẩm thành công!", { id: tid });
      } else {
        const created = await productService.createProduct(payload);
        setProducts((prev) => [...prev, mapItem(created as AdminProductItem)]);
        toast.success("Tạo sản phẩm thành công!", { id: tid });
      }
      setShowModal(false);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ??
        "Lỗi khi lưu sản phẩm. Vui lòng thử lại.";
      toast.error(msg, { id: tid });
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setDeleting(true);
    let tid = toast.loading("Đang xóa sản phẩm...");
    try {
      await productService.deleteProduct(deleteTarget.id);
      setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast.success("Xóa sản phẩm thành công", { id: tid });
    } catch {
      toast.error("Lỗi khi xóa sản phẩm.", { id: tid });
    } finally {
      setDeleting(false);
    }
  }

  async function handleToggleStatus(product: ProductRow) {
    if (togglingId === product.id) return;
    setTogglingId(product.id);
    setProducts((prev) =>
      prev.map((p) =>
        p.id === product.id ? { ...p, isActive: !p.isActive } : p,
      ),
    );
    try {
      await productService.updateProduct(product.id, {
        is_active: !product.isActive,
      });
      toast.success(`Đã đổi trạng thái "${product.name}"`);
    } catch {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id ? { ...p, isActive: product.isActive } : p,
        ),
      );
      toast.error("Không thể cập nhật trạng thái.");
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <div className="flex flex-col">
      <AdminHeader
        placeholder="Tìm kiếm sản phẩm..."
        actionLabel="Tạo sản phẩm"
        onAction={openCreate}
        searchValue={search}
        onSearchChange={handleSearchChange}
      />

      <div className="p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Danh sách sản phẩm
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Tổng cộng{" "}
              <span className="font-bold text-slate-900">{totalProducts}</span>{" "}
              sản phẩm
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select
              className="pl-3 pr-10 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-primary focus:border-primary outline-none"
              value={filterCategory}
              onChange={(e) => handleCategoryChange(e.target.value)}
            >
              <option value="">Tất cả danh mục</option>
              {categories.map((cat) => (
                <option key={cat.id} value={String(cat.id)}>
                  {cat.name}
                </option>
              ))}
            </select>
            <select
              className="pl-3 pr-10 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-primary focus:border-primary outline-none"
              value={filterStatus}
              onChange={(e) => handleStatusChange(e.target.value)}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="published">Đang bán</option>
              <option value="hidden">Đã ẩn</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Sản phẩm</th>
                  <th className="px-6 py-4">Danh mục</th>
                  <th className="px-6 py-4">Giá bán</th>
                  <th className="px-6 py-4 text-center">Tồn kho</th>
                  <th className="px-6 py-4 text-center">Trạng thái</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-12 text-center text-sm text-slate-400"
                    >
                      <span className="inline-block size-5 border-2 border-slate-300 border-t-primary rounded-full animate-spin mr-2 align-middle" />
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                )}
                {!loading && pageRows.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-12 text-center text-sm text-slate-400"
                    >
                      Không tìm thấy sản phẩm phù hợp.
                    </td>
                  </tr>
                )}
                {!loading &&
                  pageRows.map((product) => (
                    <tr
                      key={product.id}
                      className="hover:bg-slate-50 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                            {product.imageUrl ? (
                              <img
                                src={resolveImageUrl(product.imageUrl) ?? ""}
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
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {product.category || "—"}
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-bold text-primary">
                            {fmtPrice(product.price)}
                          </p>
                          {product.originalPrice != null && (
                            <p className="text-xs text-slate-400 line-through">
                              {fmtPrice(product.originalPrice)}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`text-sm font-medium ${product.stock === 0 ? "text-red-500" : product.stock < 20 ? "text-amber-600" : "text-slate-700"}`}
                        >
                          {product.stock} cái
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <label className="inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={product.isActive}
                            onChange={() => handleToggleStatus(product)}
                            disabled={togglingId === product.id}
                            className="sr-only peer"
                          />
                          <div
                            className={`relative w-9 h-5 rounded-full peer after:content-[''] after:absolute after:top-0.5 after:inset-s-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full peer-checked:after:border-white transition-colors ${product.isActive ? "bg-emerald-500" : "bg-slate-200"} ${togglingId === product.id ? "opacity-60" : ""}`}
                          />
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
                            onClick={() =>
                              setDeleteTarget({
                                id: product.id,
                                name: product.name,
                              })
                            }
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
          <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <select
                className="px-2 py-1.5 border border-slate-200 rounded-md text-xs text-slate-600 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all cursor-pointer"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value={5}>5 / trang</option>
                <option value={10}>10 / trang</option>
                <option value={20}>20 / trang</option>
                <option value={50}>50 / trang</option>
              </select>
              <p className="text-xs text-slate-500">
                Hiển thị{" "}
                <span className="font-bold">
                  {totalProducts === 0
                    ? "0"
                    : `${(safePage - 1) * pageSize + 1}–${Math.min(safePage * pageSize, totalProducts)}`}
                </span>{" "}
                trong <span className="font-bold">{totalProducts}</span> sản
                phẩm
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
                    p === 1 || p === totalPages || Math.abs(p - safePage) <= 1,
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
                      className={`size-8 flex items-center justify-center rounded-lg text-xs font-medium ${safePage === item ? "bg-primary text-white shadow-sm" : "border border-slate-200 text-slate-600 hover:bg-slate-50"}`}
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

      {showModal && (
        <div
          className="fixed inset-0 bg-background-dark/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
        >
          <div className="bg-white w-full max-w-3xl rounded-xl shadow-2xl overflow-hidden flex flex-col my-6 max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center sticky top-0 z-10 bg-white">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editProduct ? "Chỉnh sửa Sản phẩm" : "Thêm Sản phẩm Mới"}
                </h2>
                <p className="text-slate-500 text-sm">
                  {editProduct
                    ? `ID: ${editProduct.id}`
                    : "Quản lý danh mục đèn đá muối Himalaya"}
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <span className="material-symbols-outlined text-2xl">
                  close
                </span>
              </button>
            </div>

            <div className="p-5 flex flex-col lg:flex-row gap-5 overflow-y-auto flex-1 min-h-0">
              <div className="flex-[0.6] space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">
                    Tên sản phẩm <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-sm"
                    placeholder="Ví dụ: Đèn đá muối hình cầu tự nhiên"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">
                    Mô tả chi tiết
                  </label>
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <textarea
                      rows={3}
                      className="w-full px-3 py-2 bg-white focus:outline-none border-none resize-none text-sm"
                      placeholder="Nhập mô tả chi tiết về sản phẩm, nguồn gốc và hướng dẫn sử dụng..."
                      value={formDesc}
                      onChange={(e) => setFormDesc(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700">
                      Giá bán (VND) <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm"
                      placeholder="0"
                      value={formPrice}
                      onChange={(e) => setFormPrice(e.target.value)}
                    />
                    {formPrice && (
                      <p className="text-xs text-slate-400">
                        {Number(formPrice).toLocaleString("vi-VN")}d
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700">
                      Giá gốc / KM (VND)
                    </label>
                    <input
                      type="number"
                      min={0}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm"
                      placeholder="0"
                      value={formSalePrice}
                      onChange={(e) => setFormSalePrice(e.target.value)}
                    />
                    {formSalePrice && (
                      <p className="text-xs text-slate-400">
                        {Number(formSalePrice).toLocaleString("vi-VN")}d
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5 col-span-2">
                    <label className="text-sm font-semibold text-slate-700">
                      Số lượng tồn kho
                    </label>
                    <input
                      type="number"
                      min={0}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm"
                      placeholder="0"
                      value={formStock}
                      onChange={(e) => setFormStock(e.target.value)}
                    />
                  </div>
                </div>

                {uses.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">
                      Công dụng
                    </label>
                    <div className="flex flex-wrap gap-x-5 gap-y-2">
                      {uses.map((u) => (
                        <label
                          key={u.id}
                          className="flex items-center gap-2 cursor-pointer group"
                        >
                          <input
                            type="checkbox"
                            className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary accent-primary"
                            checked={formUseIds.includes(u.id)}
                            onChange={(e) =>
                              setFormUseIds((prev) =>
                                e.target.checked
                                  ? [...prev, u.id]
                                  : prev.filter((id) => id !== u.id),
                              )
                            }
                          />
                          <span className="text-slate-600 text-sm group-hover:text-primary transition-colors">
                            {u.name}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-700">
                      Sản phẩm nổi bật
                    </p>
                    <p className="text-xs text-slate-500">
                      Hiển thị nổi bật trên trang chủ
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={formIsFeatured}
                      onChange={(e) => setFormIsFeatured(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-400" />
                  </label>
                </div>
              </div>

              <div className="flex-[0.4] space-y-4">
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-slate-700">
                    Hình ảnh sản phẩm
                  </label>
                  <label className="block cursor-pointer">
                    <div className="border-2 border-dashed border-slate-200 rounded-xl p-3 flex flex-col items-center justify-center bg-slate-50 hover:bg-primary/5 hover:border-primary/50 transition-all group">
                      {formImagePreview ? (
                        <div className="relative w-full aspect-video">
                          <img
                            src={formImagePreview}
                            alt="preview"
                            className="w-full h-full object-contain rounded-lg"
                          />
                        </div>
                      ) : (
                        <>
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                            <span className="material-symbols-outlined text-primary text-xl">
                              photo_camera
                            </span>
                          </div>
                          <p className="text-xs font-medium text-slate-700 text-center">
                            Tải ảnh lên hoặc kéo thả
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            PNG, JPG tối đa 5MB
                          </p>
                        </>
                      )}
                    </div>
                    <input
                      ref={mainImageInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 5 * 1024 * 1024) {
                            toast.error("Ảnh tối đa 5MB");
                            if (mainImageInputRef.current)
                              mainImageInputRef.current.value = "";
                            return;
                          }
                          setFormImageFile(file);
                          setFormImagePreview(URL.createObjectURL(file));
                        }
                      }}
                    />
                  </label>
                  {formImagePreview && (
                    <button
                      type="button"
                      onClick={() => {
                        setFormImagePreview(null);
                        setFormImageFile(null);
                        if (mainImageInputRef.current)
                          mainImageInputRef.current.value = "";
                      }}
                      className="text-xs text-red-400 hover:text-red-600 transition-colors"
                    >
                      Xóa ảnh chính
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-semibold text-slate-700">
                      Hình ảnh phụ
                    </label>
                    <button
                      type="button"
                      onClick={() => additionalImageInputRef.current?.click()}
                      className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                    >
                      + Thêm ảnh phụ
                    </button>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {formAdditionalImages.map((url, idx) => (
                      <div
                        key={idx}
                        className="relative aspect-square border border-slate-200 rounded-lg overflow-hidden group"
                      >
                        <img
                          src={resolveImageUrl(url)!}
                          alt=""
                          className="w-full h-full object-contain"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setFormAdditionalImages(
                              formAdditionalImages.filter((_, i) => i !== idx),
                            )
                          }
                          className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <span className="material-symbols-outlined text-white">
                            delete
                          </span>
                        </button>
                      </div>
                    ))}
                    <input
                      ref={additionalImageInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 5 * 1024 * 1024)
                            return toast.error("Ảnh tối đa 5MB");
                          const tid = toast.loading("Đang tải ảnh phụ lên...");
                          try {
                            const url = await productService.uploadImage(file);
                            setFormAdditionalImages((prev) => [...prev, url]);
                            toast.success("Tải ảnh phụ thành công", {
                              id: tid,
                            });
                          } catch {
                            toast.error("Lỗi khi tải ảnh", { id: tid });
                          }
                        }
                        if (additionalImageInputRef.current)
                          additionalImageInputRef.current.value = "";
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-semibold text-slate-700">
                    Mô hình 3D (GLB/GLTF)
                  </label>

                  {formModelPreview ? (
                    <div className="border-2 border-dashed border-primary/50 bg-primary/5 rounded-xl p-3 flex flex-col gap-3">
                      <div
                        className="w-full h-40 bg-slate-50 rounded-lg overflow-hidden border border-slate-200"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ModelViewer url={formModelPreview} />
                      </div>
                      <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-primary text-xl">
                            deployed_code
                          </span>
                          <div className="flex flex-col">
                            <span className="text-xs font-medium text-primary truncate max-w-[150px]">
                              {formModelFile
                                ? formModelFile.name
                                : "Đã có mô hình 3D"}
                            </span>
                            {formModelFile && (
                              <span className="text-[10px] text-slate-500">
                                {(formModelFile.size / 1024 / 1024).toFixed(2)}{" "}
                                MB
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <label className="cursor-pointer text-xs font-medium text-blue-500 hover:text-blue-700">
                            Thay đổi
                            <input
                              type="file"
                              accept=".glb,.gltf"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0] ?? null;
                                if (file) {
                                  if (file.size > 150 * 1024 * 1024) {
                                    toast.error("File 3D tối đa 150MB");
                                    e.target.value = "";
                                    return;
                                  }
                                  setFormModelFile(file);
                                  setFormModelPreview(
                                    URL.createObjectURL(file),
                                  );
                                }
                              }}
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              setFormModelFile(null);
                              setFormModelPreview(null);
                            }}
                            className="text-xs font-medium text-red-500 hover:text-red-700"
                          >
                            Xóa tệp
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <label className="block cursor-pointer">
                      <div className="border-2 border-dashed border-slate-200 rounded-xl p-3 flex flex-col items-center justify-center bg-slate-50 hover:bg-primary/5 hover:border-primary/50 transition-all group">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                          <span className="material-symbols-outlined text-primary text-xl">
                            view_in_ar
                          </span>
                        </div>
                        <p className="text-xs font-medium text-slate-700 text-center">
                          Tải lên mô hình 3D hoặc kéo thả
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Hỗ trợ định dạng .glb, .gltf (Max 150MB)
                        </p>
                      </div>
                      <input
                        type="file"
                        accept=".glb,.gltf"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0] ?? null;
                          if (file) {
                            if (file.size > 150 * 1024 * 1024) {
                              toast.error("File 3D tối đa 150MB");
                              e.target.value = "";
                              return;
                            }
                            setFormModelFile(file);
                            setFormModelPreview(URL.createObjectURL(file));
                          }
                        }}
                      />
                    </label>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">
                    Danh mục <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <select
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white appearance-none focus:ring-2 focus:ring-primary focus:border-primary outline-none cursor-pointer text-sm"
                      value={formCategoryId}
                      onChange={(e) => setFormCategoryId(e.target.value)}
                    >
                      <option value="">Chọn danh mục</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={String(cat.id)}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <span className="material-symbols-outlined">
                        expand_more
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-700">
                      Trạng thái
                    </p>
                    <p className="text-xs text-slate-500">
                      Hiển thị trên website
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={formIsActive}
                      onChange={(e) => setFormIsActive(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
                  </label>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-white sticky bottom-0 z-10">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-2.5 rounded-lg border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-all"
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                disabled={
                  saving || !formName.trim() || !formCategoryId || !formPrice
                }
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-white font-bold hover:shadow-lg hover:brightness-110 active:scale-[0.98] disabled:opacity-50 transition-all"
              >
                {saving && (
                  <span className="size-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                )}
                {saving ? "Đang lưu..." : "Lưu sản phẩm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget !== null && (
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
              Bạn có chắc chắn muốn xóa sản phẩm{" "}
              <strong className="text-slate-900">"{deleteTarget.name}"</strong>{" "}
              khong?
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-bold hover:bg-red-600 disabled:opacity-60 transition-colors flex items-center gap-2"
              >
                {deleting && (
                  <span className="size-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                )}
                {deleting ? "Đang xóa..." : "Xóa sản phẩm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
