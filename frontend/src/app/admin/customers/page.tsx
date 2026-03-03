"use client";
import { useState } from "react";
import AdminHeader from "@/components/admin/Header";

const customers = [
  {
    initials: "TB",
    color: "bg-indigo-100 text-indigo-600",
    name: "Trần Thị B",
    email: "tranthib@gmail.com",
    phone: "0901234567",
    orders: 12,
    spent: "14.200.000đ",
    tier: "VIP",
    tierCls: "bg-amber-100 text-amber-700",
    joined: "12/01/2023",
  },
  {
    initials: "LC",
    color: "bg-emerald-100 text-emerald-600",
    name: "Lê Văn C",
    email: "levanc@gmail.com",
    phone: "0912345678",
    orders: 8,
    spent: "8.500.000đ",
    tier: "Thân thiết",
    tierCls: "bg-blue-100 text-blue-700",
    joined: "05/03/2023",
  },
  {
    initials: "PD",
    color: "bg-pink-100 text-pink-600",
    name: "Phạm Văn D",
    email: "phamvand@gmail.com",
    phone: "0923456789",
    orders: 3,
    spent: "3.750.000đ",
    tier: "Mới",
    tierCls: "bg-slate-100 text-slate-600",
    joined: "18/11/2023",
  },
  {
    initials: "NE",
    color: "bg-orange-100 text-orange-600",
    name: "Nguyễn Thị E",
    email: "nguyenthie@gmail.com",
    phone: "0934567890",
    orders: 21,
    spent: "32.600.000đ",
    tier: "VIP",
    tierCls: "bg-amber-100 text-amber-700",
    joined: "03/06/2022",
  },
];

export default function AdminCustomersPage() {
  const [lockId, setLockId] = useState<string | null>(null);

  return (
    <div className="flex flex-col overflow-y-auto flex-1">
      <AdminHeader placeholder="Tìm kiếm khách hàng, email, số điện thoại..." />

      <div className="p-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Danh sách khách hàng
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Quản lý thông tin và lịch sử mua hàng
            </p>
          </div>
          <button className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-slate-50 transition-all">
            <span className="material-symbols-outlined text-sm">
              person_add
            </span>
            Thêm khách hàng
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50">
            <span className="material-symbols-outlined text-slate-400 text-lg">
              filter_alt
            </span>
            <span className="font-medium text-slate-700">Lọc theo:</span>
          </div>
          <select className="bg-slate-50 border-slate-200 rounded-lg text-sm focus:ring-primary focus:border-primary text-slate-700 py-2 px-3 outline-none">
            <option>Tất cả hạng thành viên</option>
            <option>Thành viên VIP</option>
            <option>Thành viên Thân thiết</option>
            <option>Thành viên Mới</option>
          </select>
          <select className="bg-slate-50 border-slate-200 rounded-lg text-sm focus:ring-primary focus:border-primary text-slate-700 py-2 px-3 outline-none">
            <option>Sắp xếp theo chi tiêu</option>
            <option>Sắp xếp theo ngày tham gia</option>
            <option>Sắp xếp theo tên A-Z</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Khách hàng</th>
                  <th className="px-6 py-4">Liên hệ</th>
                  <th className="px-6 py-4 text-center">Tổng đơn</th>
                  <th className="px-6 py-4">Tổng chi tiêu</th>
                  <th className="px-6 py-4">Hạng</th>
                  <th className="px-6 py-4">Ngày tham gia</th>
                  <th className="px-6 py-4 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map((c) => (
                  <tr
                    key={c.name}
                    className="hover:bg-slate-50 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`size-10 rounded-full flex items-center justify-center font-bold text-sm ${c.color}`}
                        >
                          {c.initials}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">
                            {c.name}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-700">{c.email}</p>
                      <p className="text-xs text-slate-400">{c.phone}</p>
                    </td>
                    <td className="px-6 py-4 text-center text-sm font-bold text-slate-900">
                      {c.orders}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-primary">
                      {c.spent}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold ${c.tierCls}`}
                      >
                        {c.tier}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {c.joined}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          className="p-1.5 text-slate-500 hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
                          title="Xem"
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            visibility
                          </span>
                        </button>
                        <button
                          className="p-1.5 text-slate-500 hover:text-amber-500 hover:bg-amber-50 rounded-md transition-colors"
                          title="Khóa tài khoản"
                          onClick={() => setLockId(c.name)}
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            lock
                          </span>
                        </button>
                        <button
                          className="p-1.5 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                          title="Xóa"
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

      {/* Lock confirm modal */}
      {lockId !== null && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="size-12 rounded-full bg-amber-100 flex items-center justify-center">
                <span className="material-symbols-outlined text-amber-500">
                  lock
                </span>
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Khóa tài khoản
                </h2>
                <p className="text-sm text-slate-500">
                  Người dùng sẽ không thể đăng nhập
                </p>
              </div>
            </div>
            <p className="text-sm text-slate-600 mb-6">
              Bạn có chắc muốn khóa tài khoản của <strong>{lockId}</strong>?
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setLockId(null)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={() => setLockId(null)}
                className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-bold hover:bg-amber-600 transition-colors"
              >
                Khóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
