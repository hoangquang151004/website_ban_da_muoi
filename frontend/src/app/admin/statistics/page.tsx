import AdminHeader from "@/components/admin/Header";

const kpiCards = [
  {
    icon: "attach_money",
    iconBg: "bg-primary/10 text-primary",
    label: "Lợi nhuận gộp",
    value: "45.250.000đ",
    trend: "+15.3%",
    trendColor: "text-emerald-500",
  },
  {
    icon: "show_chart",
    iconBg: "bg-purple-500/10 text-purple-500",
    label: "Tăng trưởng tháng",
    value: "+12.4%",
    trend: "+5.8%",
    trendColor: "text-emerald-500",
  },
  {
    icon: "shopping_cart",
    iconBg: "bg-blue-500/10 text-blue-500",
    label: "Đơn hàng hoàn thành",
    value: "312",
    trend: "+8.1%",
    trendColor: "text-emerald-500",
  },
  {
    icon: "person",
    iconBg: "bg-emerald-500/10 text-emerald-500",
    label: "Khách hàng mới",
    value: "87",
    trend: "+4.2%",
    trendColor: "text-emerald-500",
  },
];

const topCategories = [
  { name: "Đèn ngủ", revenue: "48.200.000đ", pct: 85, orders: 156 },
  { name: "Đá massage", revenue: "28.700.000đ", pct: 60, orders: 92 },
  { name: "Đèn trang trí", revenue: "18.100.000đ", pct: 40, orders: 64 },
  { name: "Vật phẩm phong thủy", revenue: "12.400.000đ", pct: 25, orders: 41 },
];

const monthlyData = [
  { month: "T1", revenue: 42, orders: 31 },
  { month: "T2", revenue: 38, orders: 28 },
  { month: "T3", revenue: 55, orders: 42 },
  { month: "T4", revenue: 60, orders: 48 },
  { month: "T5", revenue: 72, orders: 55 },
  { month: "T6", revenue: 90, orders: 68 },
];

export default function AdminStatisticsPage() {
  return (
    <div className="flex flex-col overflow-y-auto flex-1">
      <AdminHeader
        placeholder="Tìm kiếm báo cáo, dữ liệu..."
        actionLabel="Xuất báo cáo"
        actionIcon="download"
      />

      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Báo cáo kinh doanh
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Phân tích chi tiết hiệu quả hoạt động kinh doanh.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center bg-white border border-slate-200 rounded-lg px-3 py-2 gap-2">
              <span className="material-symbols-outlined text-slate-400 text-sm">
                calendar_today
              </span>
              <input
                className="bg-transparent border-none p-0 text-sm text-slate-600 focus:ring-0 w-28 outline-none"
                placeholder="Từ ngày"
                type="text"
                defaultValue="01/06/2024"
              />
              <span className="text-slate-300">-</span>
              <input
                className="bg-transparent border-none p-0 text-sm text-slate-600 focus:ring-0 w-28 outline-none"
                placeholder="Đến ngày"
                type="text"
                defaultValue="30/06/2024"
              />
            </div>
            <select className="bg-white border border-slate-200 rounded-lg text-sm text-slate-600 py-2 pl-3 pr-8 focus:ring-primary focus:border-primary outline-none">
              <option>Tất cả danh mục</option>
              <option>Đèn đá muối</option>
              <option>Đá muối spa</option>
              <option>Vật phẩm phong thủy</option>
            </select>
            <button className="bg-primary hover:bg-primary/90 text-white p-2 rounded-lg transition-colors">
              <span className="material-symbols-outlined text-xl">
                filter_list
              </span>
            </button>
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {kpiCards.map((card) => (
            <div
              key={card.label}
              className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm"
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`p-2 rounded-lg ${card.iconBg}`}>
                  <span className="material-symbols-outlined">{card.icon}</span>
                </div>
                <span
                  className={`${card.trendColor} text-xs font-bold flex items-center gap-0.5`}
                >
                  <span className="material-symbols-outlined text-xs">
                    trending_up
                  </span>
                  {card.trend}
                </span>
              </div>
              <p className="text-slate-500 text-sm font-medium">{card.label}</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">
                {card.value}
              </h3>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue & Orders chart */}
          <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Doanh thu & Đơn hàng
                </h2>
                <p className="text-sm text-slate-500">6 tháng gần nhất</p>
              </div>
              <div className="flex gap-4 text-xs font-medium">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-primary inline-block" />
                  Doanh thu (triệu)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-blue-400 inline-block" />
                  Đơn hàng
                </span>
              </div>
            </div>
            <div className="flex h-[240px]">
              <div className="flex flex-col justify-between text-xs text-slate-400 pr-4 h-full pb-8">
                {["100", "80", "60", "40", "20", "0"].map((v) => (
                  <span key={v}>{v}</span>
                ))}
              </div>
              <div className="relative flex-1 flex items-end justify-around pl-4 border-l border-b border-slate-100 pb-8">
                <div className="absolute inset-0 flex flex-col justify-between pb-8 pointer-events-none">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="border-b border-dashed border-slate-100 w-full h-px"
                    />
                  ))}
                  <div className="w-full h-px" />
                </div>
                {monthlyData.map((item) => (
                  <div
                    key={item.month}
                    className="relative flex flex-col items-center gap-1 h-full justify-end z-10 flex-1 px-1"
                  >
                    <div className="flex items-end gap-1 h-full justify-center">
                      <div
                        className="w-4 bg-primary rounded-t-sm"
                        style={{ height: `${item.revenue}%` }}
                        title={`${item.revenue}tr`}
                      />
                      <div
                        className="w-4 bg-blue-400 rounded-t-sm"
                        style={{ height: `${item.orders}%` }}
                        title={`${item.orders} đơn`}
                      />
                    </div>
                    <span className="absolute -bottom-6 text-[11px] font-medium text-slate-500">
                      {item.month}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top categories */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-6">
              Doanh thu theo danh mục
            </h2>
            <div className="space-y-5">
              {topCategories.map((cat) => (
                <div key={cat.name}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-sm font-medium text-slate-700">
                      {cat.name}
                    </span>
                    <span className="text-xs font-bold text-slate-900">
                      {cat.revenue}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${cat.pct}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {cat.orders} đơn hàng
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
