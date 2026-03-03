import React from "react";
import Link from "next/link";

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[calc(100vh-80px)] font-display bg-[#f8f7f5]">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-slate-200 hidden lg:flex flex-col flex-shrink-0">
        <div className="p-6 flex items-center gap-3 border-b border-slate-100">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white">
            <span className="material-symbols-outlined fill-current">
              landscape
            </span>
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight">Himalayan Salt</h1>
            <p className="text-xs text-slate-500">Cửa hàng đá muối</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1">
          <Link
            href="/account"
            className="flex items-center gap-3 px-4 py-3 rounded-lg bg-primary/10 text-primary border-r-4 border-primary group"
          >
            <span className="material-symbols-outlined text-primary">
              dashboard
            </span>
            <span className="font-semibold text-sm">Bảng điều khiển</span>
          </Link>
          <Link
            href="/account/orders"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <span className="material-symbols-outlined">shopping_bag</span>
            <span className="text-sm font-medium">Đơn hàng của tôi</span>
          </Link>
          <Link
            href="/account/profile"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <span className="material-symbols-outlined">person</span>
            <span className="text-sm font-medium">Thông tin tài khoản</span>
          </Link>
          <Link
            href="/account/address"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <span className="material-symbols-outlined">location_on</span>
            <span className="text-sm font-medium">Địa chỉ</span>
          </Link>
          <Link
            href="/account/notifications"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <span className="material-symbols-outlined">notifications</span>
            <span className="text-sm font-medium">Thông báo</span>
          </Link>
        </nav>

        <div className="p-4 mt-auto border-t border-slate-100">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-500 hover:bg-red-50 transition-colors">
            <span className="material-symbols-outlined">logout</span>
            <span className="text-sm font-medium">Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar (Mobile menu toggle + Search) */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-10 shrink-0">
          <div className="flex-1 max-w-2xl">
            <div className="relative group hidden sm:block">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                search
              </span>
              <input
                className="w-full pl-12 pr-4 py-2.5 bg-slate-100 border-none rounded-xl focus:ring-2 focus:ring-primary/20 text-sm outline-none"
                placeholder="Tìm kiếm sản phẩm, đơn hàng..."
                type="text"
              />
            </div>
            {/* Mobile menu button */}
            <button className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg">
              <span className="material-symbols-outlined">menu</span>
            </button>
          </div>

          <div className="flex items-center gap-4 lg:gap-6 ml-4 lg:ml-8">
            <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="flex items-center gap-3 pl-4 lg:pl-6 border-l border-slate-200">
              <div className="text-right hidden sm:block leading-tight">
                <p className="text-sm font-bold text-slate-900">
                  Nguyễn Văn An
                </p>
                <p className="text-xs text-slate-500">Khách hàng thân thiết</p>
              </div>
              <div className="w-10 h-10 shrink-0 rounded-full bg-slate-200 overflow-hidden border border-primary/20">
                <img
                  className="w-full h-full object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBFmD0CHExpxe1gXXiiFtu9-PpMON3tMbsti4nR7JGeTwwFJkq14WiJcHycikGTioxitDKtBPu-s5WT9YfcEJPbqKpZwM80lK2a2jF0WJzdqkaKXnQwe4fcYVHMcOTWj2DScDAvpU0ACYx8gAPfGCLv9ZSC2H0qQO1XecofxYjUeESIiEciQaKm1FnKoIfB2hsZLFhnGENaT0z8SEd0E7J_zEjD03QjO4iV5vfRZsh--lYbMYRo2cR05pUCTgUHT0uHEBv6_3Pd3sky"
                  alt="Avatar"
                />
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        {children}
      </div>
    </div>
  );
}
