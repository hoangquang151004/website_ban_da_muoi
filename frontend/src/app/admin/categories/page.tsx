"use client";
import { useState } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

type Category = {
  id: number;
  name: string;
  description: string;
  image: string | null;
  productCount: number;
  createdAt: string;
  isActive: boolean;
};

type Use = {
  id: number;
  name: string;
  icon: string;
  colorBg: string;
  colorText: string;
  description: string;
  isActive: boolean;
};

type DeleteTarget = { type: "category" | "use"; id: number; name: string };
type ModalCategoryState = { open: boolean; editing: Category | null };
type ModalUseState = { open: boolean; editing: Use | null };

// ─── Mock data ────────────────────────────────────────────────────────────────

const INITIAL_CATEGORIES: Category[] = [
  {
    id: 1,
    name: "Đèn đá muối tự nhiên",
    description: "Dành cho trang trí phòng khách",
    image: null,
    productCount: 45,
    createdAt: "20/05/2024",
    isActive: true,
  },
  {
    id: 2,
    name: "Đá muối ngâm chân",
    description: "Hỗ trợ sức khỏe, thư giãn",
    image: null,
    productCount: 12,
    createdAt: "15/05/2024",
    isActive: true,
  },
  {
    id: 3,
    name: "Đá massage",
    description: "Spa và trị liệu",
    image: null,
    productCount: 28,
    createdAt: "10/05/2024",
    isActive: false,
  },
  {
    id: 4,
    name: "Đèn ngủ chế tác",
    description: "Đèn ngủ hình thú, hình hoa",
    image: null,
    productCount: 18,
    createdAt: "05/05/2024",
    isActive: true,
  },
];

const INITIAL_USES: Use[] = [
  {
    id: 1,
    name: "Phong thủy",
    icon: "spa",
    colorBg: "bg-amber-100",
    colorText: "text-amber-600",
    description: "Cân bằng năng lượng, thu hút tài lộc và may mắn cho gia chủ.",
    isActive: true,
  },
  {
    id: 2,
    name: "Trị mất ngủ",
    icon: "bedtime",
    colorBg: "bg-blue-100",
    colorText: "text-blue-600",
    description:
      "Ánh sáng dịu nhẹ giúp thư giãn thần kinh, cải thiện chất lượng giấc ngủ.",
    isActive: true,
  },
  {
    id: 3,
    name: "Lọc không khí",
    icon: "air",
    colorBg: "bg-emerald-100",
    colorText: "text-emerald-600",
    description:
      "Giải phóng ion âm, làm sạch bụi bẩn và vi khuẩn trong không khí.",
    isActive: true,
  },
  {
    id: 4,
    name: "Thiền định",
    icon: "self_improvement",
    colorBg: "bg-purple-100",
    colorText: "text-purple-600",
    description:
      "Tạo không gian tĩnh lặng, hỗ trợ tập trung trong quá trình thiền định và yoga.",
    isActive: false,
  },
];

const COLOR_OPTIONS = [
  { label: "Amber", bg: "bg-amber-100", text: "text-amber-600" },
  { label: "Blue", bg: "bg-blue-100", text: "text-blue-600" },
  { label: "Emerald", bg: "bg-emerald-100", text: "text-emerald-600" },
  { label: "Purple", bg: "bg-purple-100", text: "text-purple-600" },
  { label: "Red", bg: "bg-red-100", text: "text-red-600" },
  { label: "Slate", bg: "bg-slate-100", text: "text-slate-600" },
];

// ─── Toggle switch component ──────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
        checked
          ? "bg-primary focus:ring-primary"
          : "bg-slate-200 focus:ring-slate-400"
      }`}
    >
      <span className="sr-only">{checked ? "Enable" : "Disable"}</span>
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

// ─── Delete confirmation modal ────────────────────────────────────────────────

function DeleteModal({
  target,
  onCancel,
  onConfirm,
}: {
  target: DeleteTarget;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center text-center gap-4">
          <div className="size-14 rounded-full bg-red-100 flex items-center justify-center text-red-500">
            <span className="material-symbols-outlined text-3xl">warning</span>
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Xác nhận xóa</h3>
            <p className="text-sm text-slate-500 mt-1">
              Bạn có chắc muốn xóa{" "}
              <span className="font-semibold text-slate-700">
                {target.name}
              </span>
              ? Hành động này không thể hoàn tác.
            </p>
          </div>
          <div className="flex gap-3 w-full">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors"
            >
              Xóa
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Category modal ───────────────────────────────────────────────────────────

function CategoryModal({
  state,
  onClose,
  onSave,
}: {
  state: ModalCategoryState;
  onClose: () => void;
  onSave: (data: Omit<Category, "id" | "productCount" | "createdAt">) => void;
}) {
  const isEdit = !!state.editing;
  const [name, setName] = useState(state.editing?.name ?? "");
  const [description, setDescription] = useState(
    state.editing?.description ?? "",
  );
  const [isActive, setIsActive] = useState(state.editing?.isActive ?? true);
  const [preview, setPreview] = useState<string | null>(
    state.editing?.image ?? null,
  );

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({ name, description, image: preview, isActive });
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900">
            {isEdit ? "Chỉnh sửa danh mục" : "Thêm danh mục mới"}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Tên danh mục <span className="text-red-500">*</span>
            </label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition"
              placeholder="Nhập tên danh mục..."
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Mô tả
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition resize-none"
              placeholder="Nhập mô tả danh mục..."
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Ảnh đại diện
            </label>
            <div className="flex items-center gap-4">
              <div className="size-16 rounded-lg bg-slate-100 overflow-hidden flex items-center justify-center text-slate-400 shrink-0">
                {preview ? (
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="material-symbols-outlined">
                    image_not_supported
                  </span>
                )}
              </div>
              <label className="cursor-pointer flex items-center gap-2 px-3 py-2 border border-dashed border-slate-300 rounded-lg text-sm text-slate-500 hover:border-primary hover:text-primary transition-colors">
                <span className="material-symbols-outlined text-lg">
                  upload
                </span>
                Chọn ảnh
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFile}
                />
              </label>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-slate-700">
              Trạng thái
            </label>
            <Toggle
              checked={isActive}
              onChange={() => setIsActive(!isActive)}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              {isEdit ? "Lưu thay đổi" : "Thêm mới"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Use modal ────────────────────────────────────────────────────────────────

function UseModal({
  state,
  onClose,
  onSave,
}: {
  state: ModalUseState;
  onClose: () => void;
  onSave: (data: Omit<Use, "id">) => void;
}) {
  const isEdit = !!state.editing;
  const [name, setName] = useState(state.editing?.name ?? "");
  const [icon, setIcon] = useState(state.editing?.icon ?? "spa");
  const [colorBg, setColorBg] = useState(
    state.editing?.colorBg ?? "bg-amber-100",
  );
  const [colorText, setColorText] = useState(
    state.editing?.colorText ?? "text-amber-600",
  );
  const [description, setDescription] = useState(
    state.editing?.description ?? "",
  );
  const [isActive, setIsActive] = useState(state.editing?.isActive ?? true);

  function handleColorChange(bg: string, text: string) {
    setColorBg(bg);
    setColorText(text);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({ name, icon, colorBg, colorText, description, isActive });
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900">
            {isEdit ? "Chỉnh sửa công dụng" : "Thêm công dụng mới"}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Tên công dụng <span className="text-red-500">*</span>
            </label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition"
              placeholder="Nhập tên công dụng..."
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Icon (Material Symbols)
            </label>
            <div className="flex gap-3 items-center">
              <div
                className={`size-10 rounded-full ${colorBg} ${colorText} flex items-center justify-center shrink-0`}
              >
                <span className="material-symbols-outlined">{icon}</span>
              </div>
              <input
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition"
                placeholder="VD: spa, bedtime, air..."
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Màu sắc
            </label>
            <div className="flex gap-2 flex-wrap">
              {COLOR_OPTIONS.map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => handleColorChange(opt.bg, opt.text)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border-2 transition-all ${opt.bg} ${opt.text} ${
                    colorBg === opt.bg
                      ? "border-current ring-2 ring-current/30"
                      : "border-transparent"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Mô tả
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition resize-none"
              placeholder="Nhập mô tả ngắn..."
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-slate-700">
              Trạng thái
            </label>
            <Toggle
              checked={isActive}
              onChange={() => setIsActive(!isActive)}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              {isEdit ? "Lưu thay đổi" : "Thêm mới"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [uses, setUses] = useState<Use[]>(INITIAL_USES);

  const [catModal, setCatModal] = useState<ModalCategoryState>({
    open: false,
    editing: null,
  });
  const [useModal, setUseModal] = useState<ModalUseState>({
    open: false,
    editing: null,
  });
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  // ── Category handlers ──
  function openAddCategory() {
    setCatModal({ open: true, editing: null });
  }
  function openEditCategory(cat: Category) {
    setCatModal({ open: true, editing: cat });
  }
  function closeCatModal() {
    setCatModal({ open: false, editing: null });
  }
  function handleSaveCategory(
    data: Omit<Category, "id" | "productCount" | "createdAt">,
  ) {
    if (catModal.editing) {
      setCategories((prev) =>
        prev.map((c) =>
          c.id === catModal.editing!.id ? { ...c, ...data } : c,
        ),
      );
    } else {
      const now = new Date();
      const created = `${String(now.getDate()).padStart(2, "0")}/${String(
        now.getMonth() + 1,
      ).padStart(2, "0")}/${now.getFullYear()}`;
      setCategories((prev) => [
        ...prev,
        { id: Date.now(), productCount: 0, createdAt: created, ...data },
      ]);
    }
  }
  function toggleCategory(id: number) {
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isActive: !c.isActive } : c)),
    );
  }

  // ── Use handlers ──
  function openAddUse() {
    setUseModal({ open: true, editing: null });
  }
  function openEditUse(use: Use) {
    setUseModal({ open: true, editing: use });
  }
  function closeUseModal() {
    setUseModal({ open: false, editing: null });
  }
  function handleSaveUse(data: Omit<Use, "id">) {
    if (useModal.editing) {
      setUses((prev) =>
        prev.map((u) =>
          u.id === useModal.editing!.id ? { ...u, ...data } : u,
        ),
      );
    } else {
      setUses((prev) => [...prev, { id: Date.now(), ...data }]);
    }
  }
  function toggleUse(id: number) {
    setUses((prev) =>
      prev.map((u) => (u.id === id ? { ...u, isActive: !u.isActive } : u)),
    );
  }

  // ── Delete handlers ──
  function handleDeleteConfirm() {
    if (!deleteTarget) return;
    if (deleteTarget.type === "category") {
      setCategories((prev) => prev.filter((c) => c.id !== deleteTarget.id));
    } else {
      setUses((prev) => prev.filter((u) => u.id !== deleteTarget.id));
    }
    setDeleteTarget(null);
  }

  return (
    <>
      <div className="p-8 space-y-8">
        {/* ── Section 1: Categories ── */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Quản lý Danh mục
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Phân loại sản phẩm theo nhóm hàng
              </p>
            </div>
            <button
              onClick={openAddCategory}
              className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-primary/90 transition-all"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              Thêm mới
            </button>
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
                {categories.map((cat) => (
                  <tr
                    key={cat.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      {cat.image ? (
                        <div className="size-10 rounded-lg bg-slate-100 overflow-hidden">
                          <img
                            src={cat.image}
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
                      <p className="text-xs text-slate-500 mt-0.5">
                        {cat.description}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium bg-slate-100 px-2 py-1 rounded text-slate-600">
                        {cat.productCount} sản phẩm
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {cat.createdAt}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Toggle
                        checked={cat.isActive}
                        onChange={() => toggleCategory(cat.id)}
                      />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditCategory(cat)}
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
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Section 2: Uses ── */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Quản lý Công dụng
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Các thẻ gắn lợi ích sản phẩm (Tag)
              </p>
            </div>
            <button
              onClick={openAddUse}
              className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-primary/90 transition-all"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              Thêm mới
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold">
                <tr>
                  <th className="px-6 py-4 w-1/4">Tên công dụng</th>
                  <th className="px-6 py-4 w-1/2">Mô tả hiển thị</th>
                  <th className="px-6 py-4 text-center">Trạng thái</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {uses.map((use) => (
                  <tr
                    key={use.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`size-8 rounded-full ${use.colorBg} ${use.colorText} flex items-center justify-center`}
                        >
                          <span className="material-symbols-outlined text-lg">
                            {use.icon}
                          </span>
                        </div>
                        <span className="text-sm font-bold text-slate-900">
                          {use.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-600">
                        {use.description}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Toggle
                        checked={use.isActive}
                        onChange={() => toggleUse(use.id)}
                      />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditUse(use)}
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Modals ── */}
      {catModal.open && (
        <CategoryModal
          state={catModal}
          onClose={closeCatModal}
          onSave={handleSaveCategory}
        />
      )}
      {useModal.open && (
        <UseModal
          state={useModal}
          onClose={closeUseModal}
          onSave={handleSaveUse}
        />
      )}
      {deleteTarget && (
        <DeleteModal
          target={deleteTarget}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </>
  );
}
