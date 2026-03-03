"use client";
import { useState } from "react";
import AdminHeader from "@/components/admin/Header";

const stockItems = [
  {
    id: "HML-001",
    name: "Đèn đá muối tự nhiên (Size L)",
    category: "Đèn ngủ",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCPcUBVXSV1DmvLvSYmS-1xM6vsrJWQSRAvJwjr7EnA-ltmSV9VDa_hxGTPHOtlctuDmxnEOtbyL1gr1JIEdvVJKaGy9QQw_mvfnb_Qy3riNjombkSJx8vgSFZw5w-Oi4Ekh8A5c_8b6P7vctnlfwonPHN_xDI9sEwTnK1owhOJO88SMxihJukmgQ3CzhrWVWHYlTv6Y4IROYJ3ruJ_9eLUgh0BjS2kotihxF0o02kokQXIaFVwPV-p4-cuV2lHcXI2IJ8_qoj6ejN5",
    stock: 45,
    minStock: 20,
    costPrice: "650.000đ",
    sellPrice: "850.000đ",
    lastImport: "15/05/2024",
  },
  {
    id: "HML-002",
    name: "Hộp đá muối xông chân Himalaya",
    category: "Chăm sóc sức khỏe",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuARfNoJFyfCJZYiAUBZMfpCG_XMkkyrfImUwqSBJOfm6EIWfcxaulEwIBGH2MApZf7CHVoygueRQ_KY-4D_PhfXy1Xep9fWN1PInXqpho8e-fag87QDb3H1j5FzOJh-VEuuBchLWPk6IroCeNatVAwu3NJj5iYiBF-qs__bVH2HfCEpKwO3rCYHeGu2UsAJBvhODiNe059MZMTFIAXTkknCmXhxZG6gk-Rz855xhINJjqYrnBggyLL16H3XyWjov7pyBY4W6Os1WmT6",
    stock: 8,
    minStock: 15,
    costPrice: "1.800.000đ",
    sellPrice: "2.450.000đ",
    lastImport: "10/05/2024",
  },
  {
    id: "HML-003",
    name: "Chân nến đá muối",
    category: "Đèn trang trí",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBeLfMOGr3wixczVIp73qqMC7-nU8xCAlQeupjNSBtWEpox50vIGpUEtxvnluXjq_r3PW_gsR9adJX7cV0djT59XKlFl4Wz4enAIgeffOtxgtiVttdvRidyCKn1wkKUN8f8jiuk58ATYZYk2Uq9rBhlAObM2avGG3_TPddt4jJV2sB8egi_PXnnhyF5BDKub34MEvpxBhawFk4qRlNIDQK6iHIXQJqp7xa43tAeSaH3PU6y_GnSo50eie9I4uIXiOZqBXSrtKpWmvFl",
    stock: 128,
    minStock: 30,
    costPrice: "280.000đ",
    sellPrice: "350.000đ",
    lastImport: "01/06/2024",
  },
  {
    id: "HML-004",
    name: "Đèn đá muối Kim tự tháp",
    category: "Đèn trang trí",
    image: null,
    stock: 5,
    minStock: 20,
    costPrice: "3.000.000đ",
    sellPrice: "4.100.000đ",
    lastImport: "20/04/2024",
  },
];

const getStockStatus = (stock: number, min: number) => {
  if (stock === 0) return { label: "Hết hàng", cls: "bg-red-100 text-red-700" };
  if (stock < min)
    return { label: "Sắp hết", cls: "bg-amber-100 text-amber-700" };
  return { label: "Còn hàng", cls: "bg-emerald-100 text-emerald-700" };
};

export default function AdminStockPage() {
  const [showImportModal, setShowImportModal] = useState(false);

  const lowStock = stockItems.filter((i) => i.stock < i.minStock).length;

  return (
    <div className="flex flex-col overflow-y-auto flex-1">
      <AdminHeader
        placeholder="Tìm kiếm sản phẩm, SKU..."
        actionLabel="Nhập kho"
        actionIcon="add_box"
        onAction={() => setShowImportModal(true)}
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
          <button className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-50 transition-all">
            <span className="material-symbols-outlined text-sm">download</span>
            Xuất Excel
          </button>
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
              <h3 className="text-2xl font-bold text-slate-900">2,450</h3>
              <p className="text-xs text-emerald-500 font-medium mt-1">
                +120 sp mới nhập
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
              <h3 className="text-2xl font-bold text-red-600">{lowStock}</h3>
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
              <h3 className="text-2xl font-bold text-slate-900">850.5tr</h3>
              <p className="text-xs text-slate-400 font-medium mt-1">
                Ước tính giá vốn
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
              <select className="bg-slate-50 border border-slate-200 rounded-lg text-sm py-2 px-3 focus:ring-primary focus:border-primary outline-none">
                <option>Tất cả danh mục</option>
                <option>Đèn ngủ</option>
                <option>Đèn trang trí</option>
                <option>Chăm sóc sức khỏe</option>
              </select>
              <select className="bg-slate-50 border border-slate-200 rounded-lg text-sm py-2 px-3 focus:ring-primary focus:border-primary outline-none">
                <option>Tất cả trạng thái</option>
                <option>Còn hàng</option>
                <option>Sắp hết</option>
                <option>Hết hàng</option>
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Sản phẩm</th>
                  <th className="px-6 py-4">SKU</th>
                  <th className="px-6 py-4">Danh mục</th>
                  <th className="px-6 py-4 text-center">Tồn kho</th>
                  <th className="px-6 py-4 text-center">Mức tối thiểu</th>
                  <th className="px-6 py-4">Giá vốn</th>
                  <th className="px-6 py-4">Giá bán</th>
                  <th className="px-6 py-4">Trạng thái</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stockItems.map((item) => {
                  const status = getStockStatus(item.stock, item.minStock);
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="material-symbols-outlined text-slate-400">
                                image
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-bold text-slate-900 max-w-[160px] truncate">
                            {item.name}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-600">
                        {item.id}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {item.category}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`text-sm font-bold ${
                            item.stock < item.minStock
                              ? "text-red-600"
                              : "text-slate-900"
                          }`}
                        >
                          {item.stock}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-slate-500">
                        {item.minStock}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {item.costPrice}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-primary">
                        {item.sellPrice}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${status.cls}`}
                        >
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setShowImportModal(true)}
                          className="flex items-center gap-1 ml-auto px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 hover:border-primary hover:text-primary transition-all opacity-0 group-hover:opacity-100"
                        >
                          <span className="material-symbols-outlined text-[14px]">
                            add_box
                          </span>
                          Nhập kho
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">
                Nhập kho hàng
              </h2>
              <button
                onClick={() => setShowImportModal(false)}
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
                <select className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none">
                  <option>Chọn sản phẩm</option>
                  {stockItems.map((item) => (
                    <option key={item.id}>{item.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Số lượng nhập
                </label>
                <input
                  type="number"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  placeholder="0"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Ghi chú
                </label>
                <textarea
                  rows={2}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none"
                  placeholder="Nhập ghi chú..."
                />
              </div>
            </div>
            <div className="p-6 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Hủy
              </button>
              <button className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors">
                Xác nhận nhập
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
