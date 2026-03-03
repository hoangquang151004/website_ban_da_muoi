import React from "react";
import Link from "next/link";

export default function OrdersPage() {
  return (
    <main className="p-4 sm:p-6 lg:p-10 flex-grow">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900">
              Lịch sử đơn hàng
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              Quản lý và theo dõi trạng thái các đơn hàng của bạn.
            </p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button className="w-full sm:w-auto px-4 py-2 text-sm font-medium bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
              Xuất báo cáo
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-8">
          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-6 border-b border-slate-100 mb-8 scrollbar-hide shrink-0">
            <button className="shrink-0 px-5 py-2 bg-primary text-white rounded-full text-sm font-bold shadow-md shadow-primary/20">
              Tất cả
            </button>
            <button className="shrink-0 px-5 py-2 bg-slate-50 text-slate-500 hover:bg-slate-100 rounded-full text-sm font-medium transition-colors">
              Chờ xác nhận
            </button>
            <button className="shrink-0 px-5 py-2 bg-slate-50 text-slate-500 hover:bg-slate-100 rounded-full text-sm font-medium transition-colors">
              Đang giao
            </button>
            <button className="shrink-0 px-5 py-2 bg-slate-50 text-slate-500 hover:bg-slate-100 rounded-full text-sm font-medium transition-colors">
              Đã hoàn thành
            </button>
          </div>

          <div className="space-y-6">
            {/* Order Item 1 */}
            <div className="group border border-slate-100 rounded-xl p-4 sm:p-6 hover:border-primary/30 hover:bg-orange-50/10 transition-all">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div className="flex gap-4">
                  <div
                    className="size-14 rounded-lg bg-cover bg-center border border-slate-100 shrink-0"
                    style={{
                      backgroundImage:
                        "url('https://lh3.googleusercontent.com/aida-public/AB6AXuC3AlJr_8uIdjr6k2X39fEDGz2FT274ZFEiIOml9zU7N2qxq0-ZNBaclLfGbPBZlxm_tThIOd-cV0Egmot30PnJstR4OF0JUEpF2eOTjnm3_axk7NSQ7MaL6_qmXhuH9oLamjrTzdg_8Mdu2eczweNxVTM_mr2LCb0rpOK0Qw7RMUs2tz0eo_aeWVmUJP-MuqzqaguVI0Btp4EuFuJAi2y0ESIYvNg9YCUqNRHF75nbayM4X-AMDcIGl_CslNnghBSfczoBnV4ywLmV')",
                    }}
                  ></div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-sm font-bold text-slate-900">
                        #ORD-2026
                      </span>
                      <span className="text-xs text-slate-500">
                        • 24/05/2024
                      </span>
                    </div>
                    <h3 className="text-slate-700 font-medium truncate">
                      Đèn Đá Muối Himalaya Tự Nhiên (Size L)
                    </h3>
                  </div>
                </div>
                <div className="text-left md:text-right shrink-0">
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                    Tổng thanh toán
                  </p>
                  <p className="text-xl font-extrabold text-primary">
                    1.250.000₫
                  </p>
                </div>
              </div>

              {/* Progress */}
              <div className="relative mb-8 px-4 hidden sm:block">
                <div className="absolute top-[15px] left-0 w-full h-1 bg-slate-100 rounded"></div>
                <div className="absolute top-[15px] left-0 w-[33%] h-1 bg-primary rounded transition-all"></div>

                <div className="relative flex justify-between">
                  {/* Step 1 */}
                  <div className="flex flex-col items-center gap-3">
                    <div className="size-8 rounded-full bg-primary flex items-center justify-center text-white z-10 shadow-sm ring-4 ring-white">
                      <span className="material-symbols-outlined text-[16px] font-bold">
                        check
                      </span>
                    </div>
                    <span className="text-xs font-bold text-primary text-center">
                      Chờ xác nhận
                    </span>
                  </div>
                  {/* Step 2 */}
                  <div className="flex flex-col items-center gap-3">
                    <div className="size-8 rounded-full bg-primary flex items-center justify-center text-white z-10 shadow-sm ring-4 ring-white">
                      <span className="material-symbols-outlined text-[16px] font-bold">
                        inventory_2
                      </span>
                    </div>
                    <span className="text-xs font-bold text-primary text-center">
                      Đang chuẩn bị
                    </span>
                  </div>
                  {/* Step 3 */}
                  <div className="flex flex-col items-center gap-3">
                    <div className="size-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 z-10 ring-4 ring-white">
                      <span className="material-symbols-outlined text-[16px]">
                        local_shipping
                      </span>
                    </div>
                    <span className="text-xs font-medium text-slate-500 text-center">
                      Đang giao hàng
                    </span>
                  </div>
                  {/* Step 4 */}
                  <div className="flex flex-col items-center gap-3">
                    <div className="size-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 z-10 ring-4 ring-white">
                      <span className="material-symbols-outlined text-[16px]">
                        home
                      </span>
                    </div>
                    <span className="text-xs font-medium text-slate-500 text-center">
                      Đã giao
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-50">
                <Link
                  href="/account/orders/ORD-2026"
                  className="px-6 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 hover:text-primary hover:border-primary transition-all flex items-center gap-2"
                >
                  Xem chi tiết
                  <span className="material-symbols-outlined text-[18px]">
                    arrow_forward
                  </span>
                </Link>
              </div>
            </div>

            {/* Order Item 2 */}
            <div className="group border border-slate-100 rounded-xl p-4 sm:p-6 hover:border-primary/30 hover:bg-orange-50/10 transition-all">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div className="flex gap-4">
                  <div
                    className="size-14 rounded-lg bg-cover bg-center border border-slate-100 shrink-0"
                    style={{
                      backgroundImage:
                        "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAd_j1VvAOUp5Aw92BnD8M_bl9kGs4wMMvBh9Ll9dMf1fmM-pwKRS1mTi5mV_6hi4hMjJM8EUruzprCQWpcEMSZPBPSSqh4vyVUVcMKxeCOBsSJCdvmXEmcQHvS-lTqrv7eSMYHu7lziBdnyykO8exUfWfkoeywfe6VtPX7FaAoAIYbKS7Td2H7YPi-viLtJMl-na9NppVdacGYnJLafB9M9gmj5NleH8mo7lYdueMfs2-usgXL5MJm81tWNVw-P6r3Z0e1AO24i7EI')",
                    }}
                  ></div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-sm font-bold text-slate-900">
                        #ORD-2021
                      </span>
                      <span className="text-xs text-slate-500">
                        • 20/05/2024
                      </span>
                    </div>
                    <h3 className="text-slate-700 font-medium truncate">
                      Đèn Đá Muối Hình Cầu
                    </h3>
                  </div>
                </div>
                <div className="text-left md:text-right shrink-0">
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                    Tổng thanh toán
                  </p>
                  <p className="text-xl font-extrabold text-primary">
                    850.000₫
                  </p>
                </div>
              </div>

              {/* Progress */}
              <div className="relative mb-8 px-4 hidden sm:block">
                <div className="absolute top-[15px] left-0 w-full h-1 bg-slate-100 rounded"></div>
                <div className="absolute top-[15px] left-0 w-[66%] h-1 bg-primary rounded transition-all"></div>

                <div className="relative flex justify-between">
                  {/* Step 1 */}
                  <div className="flex flex-col items-center gap-3">
                    <div className="size-8 rounded-full bg-primary flex items-center justify-center text-white z-10 shadow-sm ring-4 ring-white">
                      <span className="material-symbols-outlined text-[16px] font-bold">
                        check
                      </span>
                    </div>
                    <span className="text-xs font-bold text-primary text-center">
                      Chờ xác nhận
                    </span>
                  </div>
                  {/* Step 2 */}
                  <div className="flex flex-col items-center gap-3">
                    <div className="size-8 rounded-full bg-primary flex items-center justify-center text-white z-10 shadow-sm ring-4 ring-white">
                      <span className="material-symbols-outlined text-[16px] font-bold">
                        check
                      </span>
                    </div>
                    <span className="text-xs font-bold text-primary text-center">
                      Đang chuẩn bị
                    </span>
                  </div>
                  {/* Step 3 */}
                  <div className="flex flex-col items-center gap-3">
                    <div className="size-8 rounded-full bg-primary flex items-center justify-center text-white z-10 shadow-sm ring-4 ring-white animate-pulse">
                      <span className="material-symbols-outlined text-[16px] font-bold">
                        local_shipping
                      </span>
                    </div>
                    <span className="text-xs font-bold text-primary text-center">
                      Đang giao hàng
                    </span>
                  </div>
                  {/* Step 4 */}
                  <div className="flex flex-col items-center gap-3">
                    <div className="size-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 z-10 ring-4 ring-white">
                      <span className="material-symbols-outlined text-[16px]">
                        home
                      </span>
                    </div>
                    <span className="text-xs font-medium text-slate-500 text-center">
                      Đã giao
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-50">
                <Link
                  href="/account/orders/ORD-2021"
                  className="px-6 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 hover:text-primary hover:border-primary transition-all flex items-center gap-2"
                >
                  Xem chi tiết
                  <span className="material-symbols-outlined text-[18px]">
                    arrow_forward
                  </span>
                </Link>
              </div>
            </div>

            {/* Order Item 3 (Completed) */}
            <div className="group border border-slate-100 rounded-xl p-4 sm:p-6 hover:border-primary/30 transition-all bg-slate-50/30 opacity-80 hover:opacity-100">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div className="flex gap-4">
                  <div
                    className="size-14 rounded-lg bg-cover bg-center border border-slate-100 shrink-0"
                    style={{
                      backgroundImage:
                        "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAje0zjsMJ6ICl1q96Sfs2RbobA4ry6gUZ8C3shb62kjSfr8jr44_yq9zOvUyeAzNWJxlmKvCY0gNk7dKopqcZVBkn1j_cqdQlPX_eu7sKFUivW2QtMdisbehgchAMv9cDdLRlUMRXQ0QeEl0I4oUCHa72yQ6yTgHyQZmJ-GQVOic6LxJmlWESTcDNJez_-hgsey5JVoU5XZp3q3JokScD6psTzuhwCyas_-Qz0uxBwSzH2pa6gr7Ac42rHj1wEePup_wLb2ACfzwXF')",
                    }}
                  ></div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase self-start mt-0.5 shrink-0">
                        Đã giao
                      </span>
                      <span className="text-sm font-bold text-slate-900">
                        #ORD-1985
                      </span>
                      <span className="text-xs text-slate-500">
                        • 02/05/2024
                      </span>
                    </div>
                    <h3 className="text-slate-700 font-medium truncate">
                      Combo Thư Giãn Đá Muối
                    </h3>
                  </div>
                </div>
                <div className="text-left md:text-right shrink-0">
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                    Tổng thanh toán
                  </p>
                  <p className="text-xl font-extrabold text-primary">
                    2.100.000₫
                  </p>
                </div>
              </div>

              {/* Progress */}
              <div className="relative mb-8 px-4 hidden sm:block">
                <div className="absolute top-[15px] left-0 w-full h-1 bg-primary rounded"></div>
                <div className="relative flex justify-between">
                  <div className="flex flex-col items-center gap-3">
                    <div className="size-8 rounded-full bg-primary flex items-center justify-center text-white z-10 shadow-sm ring-4 ring-white">
                      <span className="material-symbols-outlined text-[16px] font-bold">
                        check
                      </span>
                    </div>
                    <span className="text-xs font-bold text-primary text-center">
                      Đã nhận
                    </span>
                  </div>
                  <div className="flex flex-col items-center gap-3">
                    <div className="size-8 rounded-full bg-primary flex items-center justify-center text-white z-10 shadow-sm ring-4 ring-white">
                      <span className="material-symbols-outlined text-[16px] font-bold">
                        check
                      </span>
                    </div>
                    <span className="text-xs font-bold text-primary text-center">
                      Chuẩn bị
                    </span>
                  </div>
                  <div className="flex flex-col items-center gap-3">
                    <div className="size-8 rounded-full bg-primary flex items-center justify-center text-white z-10 shadow-sm ring-4 ring-white">
                      <span className="material-symbols-outlined text-[16px] font-bold">
                        check
                      </span>
                    </div>
                    <span className="text-xs font-bold text-primary text-center">
                      Đang giao
                    </span>
                  </div>
                  <div className="flex flex-col items-center gap-3">
                    <div className="size-8 rounded-full bg-primary flex items-center justify-center text-white z-10 shadow-sm ring-4 ring-white">
                      <span className="material-symbols-outlined text-[16px] font-bold">
                        check
                      </span>
                    </div>
                    <span className="text-xs font-bold text-primary text-center">
                      Đã giao
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-50">
                <button className="px-5 py-2.5 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 transition-all flex items-center gap-2 shadow-sm shadow-primary/30">
                  <span className="material-symbols-outlined text-[18px]">
                    refresh
                  </span>
                  Mua lại
                </button>
                <Link
                  href="/account/orders/ORD-1985"
                  className="px-5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 hover:text-primary hover:border-primary transition-all"
                >
                  Chi tiết
                </Link>
              </div>
            </div>
          </div>

          {/* Pagination */}
          <div className="mt-10 flex items-center justify-center gap-2">
            <button className="size-10 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:border-primary hover:text-primary transition-colors">
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <button className="size-10 flex items-center justify-center rounded-lg bg-primary text-white font-bold">
              1
            </button>
            <button className="size-10 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:border-primary hover:text-primary transition-colors">
              2
            </button>
            <button className="size-10 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:border-primary hover:text-primary transition-colors">
              3
            </button>
            <button className="size-10 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:border-primary hover:text-primary transition-colors">
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
