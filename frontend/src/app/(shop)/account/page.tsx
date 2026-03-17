import React from "react";
import Link from "next/link";

export default function AccountDashboardPage() {
  return (
    <main className="p-4 sm:p-6 lg:p-8 space-y-8 flex-grow overflow-y-auto">
      {/* Welcome Section */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
          Chào mừng bạn trở lại! ✨
        </h2>
        <p className="text-slate-500 mt-2">
          Dưới đây là tóm tắt hoạt động tài khoản của bạn trong tháng này.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-500">
              Đơn hàng đang giao
            </p>
            <p className="text-3xl font-extrabold text-slate-900">
              03{" "}
              <span className="text-sm font-normal text-slate-400">
                đơn hàng
              </span>
            </p>
            <div className="flex items-center gap-1 text-green-500 text-sm font-medium">
              <span className="material-symbols-outlined text-sm">
                trending_up
              </span>
              <span>+1 từ hôm qua</span>
            </div>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <span className="material-symbols-outlined">local_shipping</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-500">Tổng chi tiêu</p>
            <p className="text-3xl font-extrabold text-primary">1.250.000đ</p>
            <div className="text-slate-400 text-sm font-medium">
              Cập nhật: 2 giờ trước
            </div>
          </div>
          <div className="p-3 bg-orange-50 text-primary rounded-lg">
            <span className="material-symbols-outlined">
              account_balance_wallet
            </span>
          </div>
        </div>

        {/* <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-500">
              Điểm thưởng tích lũy
            </p>
            <div className="flex items-center gap-2">
              <p className="text-3xl font-extrabold text-slate-900">450</p>
              <span className="material-symbols-outlined text-yellow-500 fill-current">
                stars
              </span>
            </div>
            <div className="flex items-center gap-1 text-green-500 text-sm font-medium">
              <span className="material-symbols-outlined text-sm">
                add_circle
              </span>
              <span>+50 điểm mới</span>
            </div>
          </div>
          <div className="p-3 bg-yellow-50 text-yellow-600 rounded-lg">
            <span className="material-symbols-outlined">loyalty</span>
          </div>
        </div> */}
      </div>

      {/* Secondary Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
        {/* Recent Orders Table (60%) */}
        <div className="xl:col-span-3 bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-lg text-slate-900">
              Đơn hàng gần đây
            </h3>
            <Link
              href="/account/orders"
              className="text-primary text-sm font-semibold hover:underline"
            >
              Xem tất cả
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-slate-50/50">
                <tr className="text-slate-400 text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 font-semibold">Mã đơn hàng</th>
                  <th className="px-6 py-4 font-semibold">Ngày đặt</th>
                  <th className="px-6 py-4 font-semibold">Trạng thái</th>
                  <th className="px-6 py-4 font-semibold">Tổng tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-900">
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-bold">#HS-9921</td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    22/10/2023
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold inline-block">
                      Hoàn tất
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold">450.000đ</td>
                </tr>
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-bold">#HS-9945</td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    24/10/2023
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold inline-block">
                      Đang giao
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold">320.000đ</td>
                </tr>
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-bold">#HS-9980</td>
                  <td className="px-6 py-4 text-sm text-slate-500">Hôm nay</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold inline-block">
                      Chờ xác nhận
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold">480.000đ</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Sidebar: Recommendation & Promo (40%) */}
        <div className="xl:col-span-2 space-y-6">
          {/* Recommendation Card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg text-slate-900">
                Gợi ý cho bạn
              </h3>
              <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded">
                Dành riêng cho An
              </span>
            </div>

            <Link
              href="/product/den-da-muoi-tu-nhien-size-l"
              className="block group cursor-pointer"
            >
              <div className="relative aspect-video rounded-xl overflow-hidden mb-4 bg-slate-100">
                <img
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCCkomOvMTBkq-y-oj4E5j8-93UDErv-UtCRSXS73w4SaRLB9JIf0hHurjDklkY5ROhEKY3ogSuGn7A2ORJIJWk7WpmdgWbTuxAMhQDv3peynpme_H1Djw7B5DIkDR9U16sKwjorFMx6O9wAz0538IyY9Kgufn6nzPO8p6QW_gwhb1Year67Yl-n6AxLT8s6vUAc0uTcO3EDPIYIG1l-fe049ufn548A_8RAc1ApoFqGhY-Qtog6kPx2yVmSVR7ZmZ1UgOuf-w8UttZ"
                  alt="Product"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-white text-xs font-medium">
                    Sản phẩm bán chạy nhất tháng 10
                  </p>
                </div>
              </div>
              <h4 className="font-bold text-slate-800 group-hover:text-primary transition-colors">
                Đèn đá muối tự nhiên - Size L
              </h4>
              <p className="text-slate-500 text-sm mt-1 line-clamp-2">
                Cải thiện chất lượng không khí và giấc ngủ với ánh sáng ấm áp từ
                dãy Himalaya.
              </p>

              <div className="mt-4 flex items-center justify-between">
                <p className="text-lg font-extrabold text-primary">590.000đ</p>
                <div className="bg-primary hover:bg-primary/90 text-white px-5 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 pointer-events-none">
                  Xem ngay
                  <span className="material-symbols-outlined text-sm">
                    arrow_forward
                  </span>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
