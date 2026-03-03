"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/admin/dashboard", icon: "dashboard", label: "Tổng quan" },
  { href: "/admin/products", icon: "package", label: "Sản phẩm" },
  {
    href: "/admin/categories",
    icon: "category",
    label: "Danh mục & Công dụng",
  },
  { href: "/admin/orders", icon: "shopping_cart", label: "Đơn hàng" },
  { href: "/admin/customers", icon: "group", label: "Khách hàng" },
  { href: "/admin/reviews", icon: "star", label: "Đánh giá" },
  { href: "/admin/stock", icon: "inventory_2", label: "Kho hàng" },
  { href: "/admin/statistics", icon: "analytics", label: "Báo cáo" },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[250px] bg-white border-r border-slate-200 flex flex-col flex-shrink-0">
      {/* Logo */}
      <div className="p-6 flex items-center gap-3">
        <div className="bg-primary size-10 rounded-lg flex items-center justify-center text-white">
          <span className="material-symbols-outlined">lightbulb</span>
        </div>
        <div className="flex flex-col">
          <h1 className="text-slate-900 text-base font-bold leading-none">
            Đèn Đá Muối
          </h1>
          <p className="text-primary text-xs font-medium">Hệ thống quản trị</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 flex flex-col gap-2">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/admin/dashboard" &&
              pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <p
                className={`text-sm ${isActive ? "font-semibold" : "font-medium"}`}
              >
                {item.label}
              </p>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-200">
        <Link
          href="/admin/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <span className="material-symbols-outlined">settings</span>
          <p className="text-sm font-medium">Cài đặt</p>
        </Link>
        <div className="mt-4 flex items-center gap-3 px-3">
          <div className="size-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs flex-shrink-0">
            AD
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900">Nguyễn Văn A</p>
            <p className="text-[10px] text-slate-500">Quản trị viên</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
