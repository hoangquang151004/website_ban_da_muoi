"use client";
import { useState } from "react";
import AdminHeader from "@/components/admin/Header";

const reviews = [
  {
    id: 1,
    initials: "TB",
    color: "bg-indigo-100 text-indigo-600",
    name: "Trần Thị B",
    product: "Đèn đá muối tự nhiên",
    rating: 5,
    comment: "Sản phẩm rất đẹp, ánh sáng ấm áp, giao hàng nhanh. Rất hài lòng!",
    date: "12/06/2024",
    isApproved: true,
  },
  {
    id: 2,
    initials: "LC",
    color: "bg-emerald-100 text-emerald-600",
    name: "Lê Văn C",
    product: "Hộp đá muối xông chân",
    rating: 4,
    comment: "Chất lượng ổn, đóng gói cẩn thận. Sẽ mua lại.",
    date: "10/06/2024",
    isApproved: true,
  },
  {
    id: 3,
    initials: "PD",
    color: "bg-pink-100 text-pink-600",
    name: "Phạm Văn D",
    product: "Đèn đá muối hình cầu",
    rating: 3,
    comment: "Sản phẩm bình thường, màu sắc không giống ảnh lắm.",
    date: "08/06/2024",
    isApproved: false,
  },
  {
    id: 4,
    initials: "NE",
    color: "bg-orange-100 text-orange-600",
    name: "Nguyễn Thị E",
    product: "Đèn đá muối Kim tự tháp",
    rating: 5,
    comment: "Tuyệt vời! Căn phòng thêm ấm cúng hẳn. Chụp ảnh cũng đẹp lắm.",
    date: "05/06/2024",
    isApproved: false,
  },
];

export default function AdminReviewsPage() {
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<number | "all">("all");

  const starTabs: (number | "all")[] = ["all", 5, 4, 3, 2, 1];

  return (
    <div className="flex flex-col overflow-y-auto flex-1">
      <AdminHeader placeholder="Tìm kiếm đánh giá, khách hàng..." />

      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Quản lý đánh giá khách hàng
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Theo dõi và phản hồi ý kiến từ khách hàng về sản phẩm.
            </p>
          </div>
          <div className="flex gap-4">
            <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center">
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                Tổng đánh giá
              </span>
              <span className="text-lg font-bold text-slate-900">1,284</span>
            </div>
            <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center">
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                Trung bình
              </span>
              <div className="flex items-center gap-1">
                <span className="text-lg font-bold text-slate-900">4.8</span>
                <span className="material-symbols-outlined text-primary text-sm">
                  star
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          {/* Star tabs */}
          <div className="border-b border-slate-100 px-6">
            <div className="flex gap-8 overflow-x-auto">
              {starTabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 text-sm border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab
                      ? "font-bold text-primary border-primary"
                      : "font-medium text-slate-500 border-transparent hover:text-slate-900"
                  }`}
                >
                  {tab === "all" ? "Tất cả" : `${tab} sao`}
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase font-bold">
                <tr>
                  <th className="px-6 py-4">Khách hàng</th>
                  <th className="px-6 py-4">Sản phẩm</th>
                  <th className="px-6 py-4">Đánh giá</th>
                  <th className="px-6 py-4">Nội dung</th>
                  <th className="px-6 py-4">Ngày</th>
                  <th className="px-6 py-4">Trạng thái</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reviews.map((review) => (
                  <tr
                    key={review.id}
                    className="hover:bg-slate-50/50 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`size-9 rounded-full flex items-center justify-center font-bold text-xs ${review.color}`}
                        >
                          {review.initials}
                        </div>
                        <span className="text-sm font-medium text-slate-900 whitespace-nowrap">
                          {review.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 max-w-[150px]">
                      <span className="truncate block">{review.product}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <span
                            key={i}
                            className={`material-symbols-outlined text-[14px] ${
                              i < review.rating
                                ? "text-primary"
                                : "text-slate-300"
                            }`}
                          >
                            star
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 max-w-[200px]">
                      <span className="line-clamp-2">{review.comment}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">
                      {review.date}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          review.isApproved
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {review.isApproved ? "Đã duyệt" : "Chờ duyệt"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!review.isApproved && (
                          <button
                            className="p-1.5 text-slate-500 hover:text-emerald-500 hover:bg-emerald-50 rounded-md transition-colors"
                            title="Duyệt"
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              check_circle
                            </span>
                          </button>
                        )}
                        <button
                          className="p-1.5 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                          title="Xóa"
                          onClick={() => setDeleteId(review.id)}
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
                  Xóa đánh giá
                </h2>
                <p className="text-sm text-slate-500">
                  Đánh giá sẽ bị xóa vĩnh viễn
                </p>
              </div>
            </div>
            <p className="text-sm text-slate-600 mb-6">
              Bạn có chắc muốn xóa đánh giá <strong>#{deleteId}</strong>?
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-bold hover:bg-red-600 transition-colors"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
