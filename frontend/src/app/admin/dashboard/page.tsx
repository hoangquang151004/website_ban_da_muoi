import AdminHeader from "@/components/admin/Header";

const kpiCards = [
  {
    icon: "payments",
    iconBg: "bg-primary/10 text-primary",
    label: "Doanh thu tháng này",
    value: "125.000.000đ",
    trend: "+12.5%",
    trendColor: "text-emerald-500",
    trendIcon: "trending_up",
  },
  {
    icon: "shopping_bag",
    iconBg: "bg-blue-500/10 text-blue-500",
    label: "Tổng đơn hàng",
    value: "450 đơn",
    trend: "+8.2%",
    trendColor: "text-emerald-500",
    trendIcon: "trending_up",
  },
  {
    icon: "person_add",
    iconBg: "bg-emerald-500/10 text-emerald-500",
    label: "Khách hàng mới",
    value: "120",
    trend: "+5.4%",
    trendColor: "text-emerald-500",
    trendIcon: "trending_up",
  },
  {
    icon: "inventory",
    iconBg: "bg-red-500/10 text-red-500",
    label: "Sản phẩm tồn kho thấp",
    value: "15 mã",
    trend: "Cần nhập",
    trendColor: "text-red-500",
    trendIcon: "warning",
  },
];

const chartBars = [
  { month: "T1", heightPct: 45, value: "45tr", isHighlight: false },
  { month: "T2", heightPct: 35, value: "35tr", isHighlight: false },
  { month: "T3", heightPct: 60, value: "60tr", isHighlight: false },
  { month: "T4", heightPct: 55, value: "55tr", isHighlight: false },
  { month: "T5", heightPct: 75, value: "75tr", isHighlight: false },
  { month: "T6", heightPct: 90, value: "90tr", isHighlight: true },
];

const recentOrders = [
  {
    code: "#ORD-2851",
    customer: "Trần Thị B",
    city: "Hà Nội",
    product: "Đèn đá muối tự nhiên (Size L)",
    total: "850.000đ",
    status: "Đang xử lý",
    statusCls: "bg-amber-100 text-amber-700 border border-amber-200",
  },
  {
    code: "#ORD-2850",
    customer: "Lê Văn C",
    city: "Đà Nẵng",
    product: "Đèn đá muối hình cầu",
    total: "1.200.000đ",
    status: "Đã giao",
    statusCls: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  },
  {
    code: "#ORD-2849",
    customer: "Phạm Văn D",
    city: "TP. HCM",
    product: "Hộp đá muối xông chân",
    total: "2.450.000đ",
    status: "Đang giao",
    statusCls: "bg-blue-100 text-blue-700 border border-blue-200",
  },
];

const topProducts = [
  {
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCPcUBVXSV1DmvLvSYmS-1xM6vsrJWQSRAvJwjr7EnA-ltmSV9VDa_hxGTPHOtlctuDmxnEOtbyL1gr1JIEdvVJKaGy9QQw_mvfnb_Qy3riNjombkSJx8vgSFZw5w-Oi4Ekh8A5c_8b6P7vctnlfwonPHN_xDI9sEwTnK1owhOJO88SMxihJukmgQ3CzhrWVWHYlTv6Y4IROYJ3ruJ_9eLUgh0BjS2kotihxF0o02kokQXIaFVwPV-p4-cuV2lHcXI2IJ8_qoj6ejN5",
    name: "Đèn đá muối tự nhiên",
    sold: 124,
    pct: 90,
  },
  {
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuARfNoJFyfCJZYiAUBZMfpCG_XMkkyrfImUwqSBJOfm6EIWfcxaulEwIBGH2MApZf7CHVoygueRQ_KY-4D_PhfXy1Xep9fWN1PInXqpho8e-fag87QDb3H1j5FzOJh-VEuuBchLWPk6IroCeNatVAwu3NJj5iYiBF-qs__bVH2HfCEpKwO3rCYHeGu2UsAJBvhODiNe059MZMTFIAXTkknCmXhxZG6gk-Rz855xhINJjqYrnBggyLL16H3XyWjov7pyBY4W6Os1WmT6",
    name: "Hộp đá muối xông chân",
    sold: 98,
    pct: 70,
  },
  {
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBeLfMOGr3wixczVIp73qqMC7-nU8xCAlQeupjNSBtWEpox50vIGpUEtxvnluXjq_r3PW_gsR9adJX7cV0djT59XKlFl4Wz4enAIgeffOtxgtiVttdvRidyCKn1wkKUN8f8jiuk58ATYZYk2Uq9rBhlAObM2avGG3_TPddt4jJV2sB8egi_PXnnhyF5BDKub34MEvpxBhawFk4qRlNIDQK6iHIXQJqp7xa43tAeSaH3PU6y_GnSo50eie9I4uIXiOZqBXSrtKpWmvFl",
    name: "Đèn đá muối hình cầu",
    sold: 76,
    pct: 55,
  },
];

export default function AdminDashboardPage() {
  return (
    <div className="flex flex-col overflow-y-auto flex-1">
      <AdminHeader
        placeholder="Tìm kiếm đơn hàng, khách hàng..."
        actionLabel="Tạo đơn mới"
      />

      <div className="p-8 space-y-8">
        {/* KPI Cards */}
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
                    {card.trendIcon}
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Revenue chart */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Doanh thu hàng tháng
                  </h2>
                  <p className="text-sm text-slate-500">
                    Tổng quan 6 tháng qua
                  </p>
                </div>
                <select className="bg-slate-100 border-none rounded-lg text-sm focus:ring-primary outline-none px-3 py-1.5">
                  <option>Năm 2024</option>
                  <option>Năm 2023</option>
                </select>
              </div>
              <div className="flex h-[280px] pb-4">
                {/* Y-axis */}
                <div className="flex flex-col justify-between items-end text-xs text-slate-400 font-medium pr-4 h-full pb-8">
                  {["100tr", "80tr", "60tr", "40tr", "20tr", "0"].map((v) => (
                    <span key={v}>{v}</span>
                  ))}
                </div>
                {/* Bars */}
                <div className="relative flex-1 flex items-end justify-between pl-4 border-l border-b border-slate-100 pb-8">
                  {/* Grid lines */}
                  <div className="absolute inset-0 flex flex-col justify-between pb-8 pointer-events-none">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className="border-b border-dashed border-slate-100 w-full h-px"
                      />
                    ))}
                    <div className="w-full h-px" />
                  </div>
                  {chartBars.map((bar) => (
                    <div
                      key={bar.month}
                      className="relative group flex flex-col items-center flex-1 h-full justify-end px-2 z-10"
                    >
                      <div
                        className={`w-full max-w-[40px] rounded-t-sm transition-all duration-300 relative cursor-pointer ${
                          bar.isHighlight
                            ? "bg-primary shadow-[0_4px_12px_rgba(242,140,38,0.3)]"
                            : "bg-primary/70 hover:bg-primary"
                        }`}
                        style={{ height: `${bar.heightPct}%` }}
                      >
                        <div className="opacity-0 group-hover:opacity-100 absolute -top-9 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-20 transition-opacity">
                          {bar.value}
                        </div>
                      </div>
                      <span
                        className={`absolute -bottom-6 text-[11px] font-medium ${
                          bar.isHighlight
                            ? "text-primary font-bold"
                            : "text-slate-500"
                        }`}
                      >
                        Tháng {bar.month.replace("T", "")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Orders */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h2 className="text-lg font-bold text-slate-900">
                  Đơn hàng mới nhất
                </h2>
                <button className="text-primary text-sm font-bold hover:underline">
                  Xem tất cả
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold">
                    <tr>
                      <th className="px-6 py-3">Mã đơn</th>
                      <th className="px-6 py-3">Khách hàng</th>
                      <th className="px-6 py-3">Sản phẩm</th>
                      <th className="px-6 py-3">Tổng tiền</th>
                      <th className="px-6 py-3">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentOrders.map((order) => (
                      <tr
                        key={order.code}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-6 py-4 text-sm font-bold text-primary">
                          {order.code}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-slate-900">
                              {order.customer}
                            </span>
                            <span className="text-xs text-slate-500">
                              {order.city}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {order.product}
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-slate-900">
                          {order.total}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2 py-1 text-[10px] font-bold rounded-full uppercase ${order.statusCls}`}
                          >
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right column - Top Products */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-6">
              Sản phẩm bán chạy
            </h2>
            <div className="space-y-5">
              {topProducts.map((product, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  <div className="size-12 rounded-lg bg-slate-100 overflow-hidden shrink-0">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">
                      {product.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {product.sold} lượt bán
                    </p>
                    <div className="mt-1.5 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${product.pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
