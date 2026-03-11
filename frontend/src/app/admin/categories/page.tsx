"use client";

import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import AdminHeader from "@/components/admin/Header";
import {
  catalogService,
  type CategoryRow,
  type UseRow,
  type CategoryCreatePayload,
  type UseCreatePayload,
} from "@/services/catalogService";

// Constants

const ICON_SUGGESTIONS = [
  "spa",
  "bedtime",
  "air",
  "self_improvement",
  "favorite",
  "psychology",
  "mood",
  "eco",
  "health_and_safety",
  "local_florist",
  "bolt",
  "star",
];

const COLOR_PRESETS = [
  {
    label: "Amber",
    bg: "bg-amber-100",
    text: "text-amber-600",
    value: "amber",
  },
  { label: "Blue", bg: "bg-blue-100", text: "text-blue-600", value: "blue" },
  {
    label: "Emerald",
    bg: "bg-emerald-100",
    text: "text-emerald-600",
    value: "emerald",
  },
  {
    label: "Purple",
    bg: "bg-purple-100",
    text: "text-purple-600",
    value: "purple",
  },
  { label: "Rose", bg: "bg-rose-100", text: "text-rose-600", value: "rose" },
  { label: "Teal", bg: "bg-teal-100", text: "text-teal-600", value: "teal" },
  {
    label: "Orange",
    bg: "bg-orange-100",
    text: "text-orange-600",
    value: "orange",
  },
  {
    label: "Indigo",
    bg: "bg-indigo-100",
    text: "text-indigo-600",
    value: "indigo",
  },
];

function getColorClasses(color: string) {
  const preset = COLOR_PRESETS.find((c) => c.value === color);
  return preset
    ? { bg: preset.bg, text: preset.text }
    : { bg: "bg-slate-100", text: "text-slate-600" };
}

// Toggle switch component
function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 ${
        checked ? "bg-primary" : "bg-slate-300"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

//  Delete confirmation modal

function ConfirmModal({
  message,
  onCancel,
  onConfirm,
  loading,
}: {
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-red-100 rounded-full">
            <span className="material-symbols-outlined text-red-600">
              warning
            </span>
          </div>
          <h3 className="text-lg font-bold text-slate-900">Xác nhận xóa</h3>
        </div>
        <p className="text-sm text-slate-600 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors disabled:opacity-60"
          >
            {loading ? "Đang xóa..." : "Xóa"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Category modal

function CategoryModal({
  initial,
  onClose,
  onSave,
}: {
  initial: CategoryRow | null;
  onClose: () => void;
  onSave: (row: CategoryRow, isNew: boolean) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [imageUrl, setImageUrl] = useState(initial?.image_url ?? "");
  const [isActive, setIsActive] = useState(initial?.is_active ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  // Auto-generate slug from name when creating new
  useEffect(() => {
    if (!initial) {
      const generated = name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/�'/g, "d")
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-");
      setSlug(generated);
    }
  }, [name, initial]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError("Tên danh mục không �'ược tr�'ng.");
    setSaving(true);
    setError("");
    try {
      const payload: CategoryCreatePayload = {
        name: name.trim(),
        slug: slug.trim() || undefined,
        description: description.trim() || undefined,
        image_url: imageUrl.trim() || undefined,
        is_active: isActive,
      };
      const saved = initial
        ? await catalogService.updateCategory(initial.id, payload)
        : await catalogService.createCategory(payload);
      onSave(saved, !initial);
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail ?? "Lưu thất bại.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-bold text-slate-900">
            {initial ? "Chỉnh sửa danh mục" : "Thêm danh mục mới"}
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wide">
              Tên danh mục <span className="text-red-500">*</span>
            </label>
            <input
              ref={nameRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              placeholder="VD: Đá phong thủy"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wide">
              Slug (URL)
            </label>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono"
              placeholder="da-phong-thuy"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wide">
              Mô tả
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              placeholder="Mô tả danh mục..."
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wide">
              URL ảnh đại diện
            </label>
            <div className="flex gap-2 items-center">
              {imageUrl && (
                <img
                  src={imageUrl}
                  alt="preview"
                  className="size-10 rounded-lg object-cover border border-slate-200"
                  onError={(e) => (e.currentTarget.style.display = "none")}
                />
              )}
              <input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="https://..."
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">
              Hiện (active)
            </span>
            <Toggle checked={isActive} onChange={setIsActive} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm font-bold text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-60"
            >
              {saving ? "Đang lưu..." : "Lưu"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Use modal

function UseModal({
  initial,
  onClose,
  onSave,
}: {
  initial: UseRow | null;
  onClose: () => void;
  onSave: (row: UseRow, isNew: boolean) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [icon, setIcon] = useState(initial?.icon ?? "spa");
  const [color, setColor] = useState(initial?.color ?? "amber");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [isActive, setIsActive] = useState(initial?.is_active ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  const { bg: previewBg, text: previewText } = getColorClasses(color);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError("Tên công dụng không �'ược tr�'ng.");
    setSaving(true);
    setError("");
    try {
      const payload: UseCreatePayload = {
        name: name.trim(),
        icon,
        color,
        description: description.trim() || undefined,
        is_active: isActive,
      };
      const saved = initial
        ? await catalogService.updateUse(initial.id, payload)
        : await catalogService.createUse(payload);
      onSave(saved, !initial);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail ?? "Lưu thất bại.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-bold text-slate-900">
            {initial ? "Sửa công dụng" : "Thêm công dụng mới"}
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wide">
              Tên công dụng <span className="text-red-500">*</span>
            </label>
            <input
              ref={nameRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              placeholder="VD: Phong thủy"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wide">
              Mô tả
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              placeholder="Mô tả lợi ích..."
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">
              Icon (Material Symbols)
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {ICON_SUGGESTIONS.map((ic) => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setIcon(ic)}
                  className={`p-2 rounded-lg border-2 transition-colors ${
                    icon === ic
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-slate-200 text-slate-500 hover:border-primary/50"
                  }`}
                  title={ic}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {ic}
                  </span>
                </button>
              ))}
            </div>
            <input
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono"
              placeholder="Nhập tên icon tùy Chỉnh..."
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">
              Màu sắc
            </label>
            <div className="flex gap-2 flex-wrap">
              {COLOR_PRESETS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all ${c.bg} ${c.text} ${
                    color === c.value
                      ? "border-current ring-2 ring-current/30"
                      : "border-transparent"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Preview:</span>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 ${previewBg} ${previewText} text-sm font-medium rounded-full`}
            >
              <span className="material-symbols-outlined text-[16px]">
                {icon}
              </span>
              {name || "Tên công dụng"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">
              Hiện (active)
            </span>
            <Toggle checked={isActive} onChange={setIsActive} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm font-bold text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-60"
            >
              {saving ? "Đang lưu..." : "Lưu"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

//  Main Page

type TabType = "categories" | "uses";

export default function AdminCategoriesPage() {
  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>("categories");

  //  Categories state
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [catLoading, setCatLoading] = useState(true);
  const [catSearch, setCatSearch] = useState("");
  const [catPage, setCatPage] = useState(1);
  const [catPageSize, setCatPageSize] = useState(10);
  const [catTotalPages, setCatTotalPages] = useState(1);
  const [catTotal, setCatTotal] = useState(0);

  // Uses state
  const [uses, setUses] = useState<UseRow[]>([]);
  const [usesLoading, setUsesLoading] = useState(true);
  const [useSearch, setUseSearch] = useState("");
  const [usePage, setUsePage] = useState(1);
  const [usePageSize, setUsePageSize] = useState(10);
  const [useTotalPages, setUseTotalPages] = useState(1);
  const [useTotal, setUseTotal] = useState(0);

  //  Modal state
  const [catModal, setCatModal] = useState<{
    open: boolean;
    row: CategoryRow | null;
  }>({
    open: false,
    row: null,
  });
  const [useModal, setUseModal] = useState<{
    open: boolean;
    row: UseRow | null;
  }>({
    open: false,
    row: null,
  });
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "category" | "use";
    id: number;
    name: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [togglingCatId, setTogglingCatId] = useState<number | null>(null);
  const [togglingUseId, setTogglingUseId] = useState<number | null>(null);

  // 🔹🔹 Fetch categories 🔹🔹
  const fetchCategories = async (
    page = catPage,
    search = catSearch,
    limit = catPageSize,
  ) => {
    setCatLoading(true);
    try {
      const res = await catalogService.listCategories({
        page,
        limit,
        search: search || undefined,
      });
      setCategories(res.items);
      setCatTotalPages(res.total_pages);
      setCatTotal(res.total);
    } catch {
      // silent
    } finally {
      setCatLoading(false);
    }
  };

  // �"?�"? Fetch uses �"?�"?
  const fetchUses = async (
    page = usePage,
    search = useSearch,
    limit = usePageSize,
  ) => {
    setUsesLoading(true);
    try {
      const res = await catalogService.listUses({
        page,
        limit,
        search: search || undefined,
      });
      setUses(res.items);
      setUseTotalPages(res.total_pages);
      setUseTotal(res.total);
    } catch (err) {
      toast.error("Không thể tải danh sách công dụng");
    } finally {
      setUsesLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories(1, "", catPageSize);
  }, [catPageSize]);

  useEffect(() => {
    fetchUses(1, "", usePageSize);
  }, [usePageSize]);

  // Debounced search for categories
  useEffect(() => {
    const timer = setTimeout(() => {
      setCatPage(1);
      fetchCategories(1, catSearch, catPageSize);
    }, 400);
    return () => clearTimeout(timer);
  }, [catSearch]);

  // Debounced search for uses
  useEffect(() => {
    const timer = setTimeout(() => {
      setUsePage(1);
      fetchUses(1, useSearch, usePageSize);
    }, 400);
    return () => clearTimeout(timer);
  }, [useSearch]);

  // �"?�"? Category handlers �"?�"?
  const handleToggleCategory = async (cat: CategoryRow) => {
    setTogglingCatId(cat.id);
    try {
      const updated = await catalogService.toggleCategoryStatus(
        cat.id,
        !cat.is_active,
      );
      setCategories((prev) =>
        prev.map((c) => (c.id === updated.id ? updated : c)),
      );
      toast.success(
        `Đã ${updated.is_active ? "kích hoạt" : "vô hiệu hóa"} danh mục "${cat.name}"`,
      );
    } catch (err) {
      toast.error("Không thể cập nhật trạng thái danh mục");
    } finally {
      setTogglingCatId(null);
    }
  };

  const handleSaveCategory = (row: CategoryRow, isNew: boolean) => {
    setCatModal({ open: false, row: null });
    fetchCategories(catPage, catSearch, catPageSize);
    toast.success(
      isNew
        ? `Đã thêm danh mục "${row.name}" thành công`
        : `Đã cập nhật danh mục "${row.name}" thành công`,
    );
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      if (deleteTarget.type === "category") {
        await catalogService.deleteCategory(deleteTarget.id);
        fetchCategories(catPage, catSearch, catPageSize);
        toast.success(`Đã xóa danh mục "${deleteTarget.name}" thành công`);
      } else {
        await catalogService.deleteUse(deleteTarget.id);
        fetchUses(usePage, useSearch, usePageSize);
        toast.success(`Đã xóa công dụng "${deleteTarget.name}" thành công`);
      }
      setDeleteTarget(null);
    } catch (err) {
      toast.error(
        `Không thể xóa ${deleteTarget.type === "category" ? "danh mục" : "công dụng"}`,
      );
    } finally {
      setDeleting(false);
    }
  };

  // �"?�"? Use handlers �"?�"?
  const handleToggleUse = async (use: UseRow) => {
    setTogglingUseId(use.id);
    try {
      const updated = await catalogService.toggleUseStatus(
        use.id,
        !use.is_active,
      );
      setUses((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      toast.success(
        `Đã ${updated.is_active ? "kích hoạt" : "vô hiệu hóa"} công dụng "${use.name}"`,
      );
    } catch (err) {
      toast.error("Không thể cập nhật trạng thái công dụng");
    } finally {
      setTogglingUseId(null);
    }
  };

  const handleSaveUse = (row: UseRow, isNew: boolean) => {
    setUseModal({ open: false, row: null });
    fetchUses(usePage, useSearch, usePageSize);
    toast.success(
      isNew
        ? `Đã thêm công dụng "${row.name}" thành công`
        : `Đã cập nhật công dụng "${row.name}" thành công`,
    );
  };

  const tabs = [
    {
      id: "categories" as TabType,
      label: "Quản lý Danh mục",
      icon: "category",
    },
    { id: "uses" as TabType, label: "Quản lý Công dụng", icon: "spa" },
  ];

  return (
    <>
      <AdminHeader
        placeholder={
          activeTab === "categories"
            ? "Tìm kiếm danh mục..."
            : "Tìm kiếm công dụng..."
        }
        searchValue={activeTab === "categories" ? catSearch : useSearch}
        onSearchChange={
          activeTab === "categories" ? setCatSearch : setUseSearch
        }
      />
      <main className="flex-1 overflow-y-auto p-8">
        {/* Tab Navigation */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-6">
          <div className="flex border-b border-slate-200">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold transition-all relative ${
                  activeTab === tab.id
                    ? "text-primary border-b-2 border-primary"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">
                  {tab.icon}
                </span>
                {tab.label}
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content: Categories */}
        {activeTab === "categories" && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between gap-3 items-start sm:items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Quản lý Danh mục
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  {catLoading ? "Đang tải..." : `${catTotal} danh mục`}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCatModal({ open: true, row: null })}
                  className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-primary/90 transition-all whitespace-nowrap"
                >
                  <span className="material-symbols-outlined text-sm">add</span>
                  Thêm mới
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold">
                  <tr>
                    <th className="px-6 py-4 w-20">Ảnh</th>
                    <th className="px-6 py-4">Tên danh mục</th>
                    <th className="px-6 py-4">Số lượng SP</th>
                    <th className="px-6 py-4">Ngày tạo</th>
                    <th className="px-6 py-4 text-center">Trạng thái</th>
                    <th className="px-6 py-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {catLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="px-6 py-4">
                          <div className="size-10 rounded-lg bg-slate-200" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 w-40 bg-slate-200 rounded" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 w-20 bg-slate-200 rounded" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 w-24 bg-slate-200 rounded" />
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="h-6 w-12 bg-slate-200 rounded-full mx-auto" />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="h-8 w-16 bg-slate-200 rounded ml-auto" />
                        </td>
                      </tr>
                    ))
                  ) : categories.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-12 text-center text-slate-400"
                      >
                        <span className="material-symbols-outlined text-4xl block mb-2">
                          category
                        </span>
                        Chưa có danh mục nào
                      </td>
                    </tr>
                  ) : (
                    categories.map((cat) => (
                      <tr
                        key={cat.id}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          {cat.image_url ? (
                            <div className="size-10 rounded-lg bg-slate-100 overflow-hidden">
                              <img
                                src={cat.image_url}
                                alt={cat.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="size-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                              <span className="material-symbols-outlined">
                                image_not_supported
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-bold text-slate-900">
                            {cat.name}
                          </span>
                          {cat.description && (
                            <p className="text-xs text-slate-500 mt-0.5 max-w-xs truncate">
                              {cat.description}
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-medium bg-slate-100 px-2 py-1 rounded text-slate-600">
                            {cat.product_count ?? 0} sản phẩm
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500">
                          {cat.created_at
                            ? new Date(cat.created_at).toLocaleDateString(
                                "vi-VN",
                              )
                            : ""}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Toggle
                            checked={cat.is_active}
                            onChange={() => handleToggleCategory(cat)}
                            disabled={togglingCatId === cat.id}
                          />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() =>
                                setCatModal({ open: true, row: cat })
                              }
                              className="p-1.5 text-slate-500 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                            >
                              <span className="material-symbols-outlined text-lg">
                                edit
                              </span>
                            </button>
                            <button
                              onClick={() =>
                                setDeleteTarget({
                                  type: "category",
                                  id: cat.id,
                                  name: cat.name,
                                })
                              }
                              className="p-1.5 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                            >
                              <span className="material-symbols-outlined text-lg">
                                delete
                              </span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            {!catLoading && catTotal > 0 && (
              <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <select
                    className="px-2 py-1.5 border border-slate-200 rounded-md text-xs text-slate-600 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all cursor-pointer"
                    value={catPageSize}
                    onChange={(e) => {
                      setCatPageSize(Number(e.target.value));
                      setCatPage(1);
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
                      {catTotal === 0
                        ? "0"
                        : `${(catPage - 1) * catPageSize + 1}–${Math.min(catPage * catPageSize, catTotal)}`}
                    </span>{" "}
                    trong <span className="font-bold">{catTotal}</span> danh mục
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    disabled={catPage === 1}
                    onClick={() => {
                      const p = catPage - 1;
                      setCatPage(p);
                      fetchCategories(p, catSearch, catPageSize);
                    }}
                    className="size-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40"
                  >
                    <span className="material-symbols-outlined text-sm">
                      chevron_left
                    </span>
                  </button>
                  {Array.from({ length: catTotalPages }, (_, i) => i + 1)
                    .filter(
                      (p) =>
                        p === 1 ||
                        p === catTotalPages ||
                        Math.abs(p - catPage) <= 1,
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
                          onClick={() => {
                            setCatPage(item as number);
                            fetchCategories(
                              item as number,
                              catSearch,
                              catPageSize,
                            );
                          }}
                          className={`size-8 flex items-center justify-center rounded-lg text-xs font-medium ${catPage === item ? "bg-primary text-white shadow-sm" : "border border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                        >
                          {item}
                        </button>
                      ),
                    )}
                  <button
                    disabled={catPage === catTotalPages}
                    onClick={() => {
                      const p = catPage + 1;
                      setCatPage(p);
                      fetchCategories(p, catSearch, catPageSize);
                    }}
                    className="size-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40"
                  >
                    <span className="material-symbols-outlined text-sm">
                      chevron_right
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab Content: Uses */}
        {activeTab === "uses" && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between gap-3 items-start sm:items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Quản lý Công dụng
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  {usesLoading
                    ? "Đang tải..."
                    : `${useTotal || uses.length} công dụng`}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setUseModal({ open: true, row: null })}
                  className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-primary/90 transition-all whitespace-nowrap"
                >
                  <span className="material-symbols-outlined text-sm">add</span>
                  Thêm mới
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold">
                  <tr>
                    <th className="px-6 py-4 w-1/4">Tên công dụng</th>
                    <th className="px-6 py-4 w-1/2">Mô tả</th>
                    <th className="px-6 py-4 text-center">Trạng thái</th>
                    <th className="px-6 py-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {usesLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="px-6 py-4">
                          <div className="h-8 w-32 bg-slate-200 rounded-full" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 w-48 bg-slate-200 rounded" />
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="h-6 w-12 bg-slate-200 rounded-full mx-auto" />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="h-8 w-16 bg-slate-200 rounded ml-auto" />
                        </td>
                      </tr>
                    ))
                  ) : uses.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-6 py-12 text-center text-slate-400"
                      >
                        <span className="material-symbols-outlined text-4xl block mb-2">
                          spa
                        </span>
                        Chưa có công dụng nào
                      </td>
                    </tr>
                  ) : (
                    uses.map((use) => {
                      const { bg, text } = getColorClasses(use.color);
                      return (
                        <tr
                          key={use.id}
                          className="hover:bg-slate-50 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 ${bg} ${text} text-sm font-medium rounded-full`}
                            >
                              <span className="material-symbols-outlined text-[16px]">
                                {use.icon}
                              </span>
                              {use.name}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-slate-600">
                              {use.description || ""}
                            </p>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <Toggle
                              checked={use.is_active}
                              onChange={() => handleToggleUse(use)}
                              disabled={togglingUseId === use.id}
                            />
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() =>
                                  setUseModal({ open: true, row: use })
                                }
                                className="p-1.5 text-slate-500 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                              >
                                <span className="material-symbols-outlined text-lg">
                                  edit
                                </span>
                              </button>
                              <button
                                onClick={() =>
                                  setDeleteTarget({
                                    type: "use",
                                    id: use.id,
                                    name: use.name,
                                  })
                                }
                                className="p-1.5 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                              >
                                <span className="material-symbols-outlined text-lg">
                                  delete
                                </span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            {/* Pagination for Uses */}
            {!usesLoading && useTotal > 0 && (
              <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <select
                    className="px-2 py-1.5 border border-slate-200 rounded-md text-xs text-slate-600 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all cursor-pointer"
                    value={usePageSize}
                    onChange={(e) => {
                      setUsePageSize(Number(e.target.value));
                      setUsePage(1);
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
                      {useTotal === 0
                        ? "0"
                        : `${(usePage - 1) * usePageSize + 1}–${Math.min(usePage * usePageSize, useTotal)}`}
                    </span>{" "}
                    trong <span className="font-bold">{useTotal}</span> công
                    dụng
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    disabled={usePage === 1}
                    onClick={() => {
                      const p = usePage - 1;
                      setUsePage(p);
                      fetchUses(p, useSearch, usePageSize);
                    }}
                    className="size-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40"
                  >
                    <span className="material-symbols-outlined text-sm">
                      chevron_left
                    </span>
                  </button>
                  {Array.from({ length: useTotalPages }, (_, i) => i + 1)
                    .filter(
                      (p) =>
                        p === 1 ||
                        p === useTotalPages ||
                        Math.abs(p - usePage) <= 1,
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
                          onClick={() => {
                            setUsePage(item as number);
                            fetchUses(item as number, useSearch, usePageSize);
                          }}
                          className={`size-8 flex items-center justify-center rounded-lg text-xs font-medium ${usePage === item ? "bg-primary text-white shadow-sm" : "border border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                        >
                          {item}
                        </button>
                      ),
                    )}
                  <button
                    disabled={usePage === useTotalPages}
                    onClick={() => {
                      const p = usePage + 1;
                      setUsePage(p);
                      fetchUses(p, useSearch, usePageSize);
                    }}
                    className="size-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40"
                  >
                    <span className="material-symbols-outlined text-sm">
                      chevron_right
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* �"?�"? Modals �"?�"? */}
      {catModal.open && (
        <CategoryModal
          initial={catModal.row}
          onClose={() => setCatModal({ open: false, row: null })}
          onSave={handleSaveCategory}
        />
      )}
      {useModal.open && (
        <UseModal
          initial={useModal.row}
          onClose={() => setUseModal({ open: false, row: null })}
          onSave={handleSaveUse}
        />
      )}
      {deleteTarget && (
        <ConfirmModal
          message={`Xóa "${deleteTarget.name}"? Hành độngng này không thể hoàn tác.`}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDeleteConfirm}
          loading={deleting}
        />
      )}
    </>
  );
}
