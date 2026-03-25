"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

const NAV_ITEMS = [
  {
    href: "/account",
    icon: "dashboard",
    label: "Bảng điều khiển",
    exact: true,
  },
  {
    href: "/account/orders",
    icon: "shopping_bag",
    label: "Đơn hàng của tôi",
    exact: false,
  },
  {
    href: "/account/profile",
    icon: "person",
    label: "Thông tin tài khoản",
    exact: false,
  },
];

import AuthGuard from "@/components/ui/AuthGuard";

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = () => {
    logout();
    // Clear auth cookies
    document.cookie =
      "auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
    document.cookie =
      "user-role=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
    router.push("/login");
  };

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  // Initials fallback avatar
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((w) => w[0])
        .slice(-2)
        .join("")
        .toUpperCase()
    : "?";

  return (
    <AuthGuard>
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
            {NAV_ITEMS.map(({ href, icon, label, exact }) => {
              const active = mounted && isActive(href, exact);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors group
                    ${
                      active
                        ? "bg-primary/10 text-primary border-r-4 border-primary"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                >
                  <span
                    className={`material-symbols-outlined ${active ? "text-primary" : ""}`}
                  >
                    {icon}
                  </span>
                  <span
                    className={`text-sm ${active ? "font-semibold" : "font-medium"}`}
                  >
                    {label}
                  </span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 mt-auto border-t border-slate-100">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
            >
              <span className="material-symbols-outlined">logout</span>
              <span className="text-sm font-medium">Đăng xuất</span>
            </button>
          </div>
        </aside>

        {/* Main Content Wrapper */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Page Content */}
          {children}
        </div>
      </div>
    </AuthGuard>
  );
}
