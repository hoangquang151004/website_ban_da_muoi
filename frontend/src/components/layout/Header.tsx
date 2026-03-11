"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import { authService } from "@/services/authService";

export default function Header() {
  const router = useRouter();
  const totalItems = useCartStore((s) => s.totalItems());
  const { user, isAuthenticated, logout } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch for cart badge
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = () => {
    authService.logout();
    logout();
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-50 bg-background-light/95 backdrop-blur-sm border-b border-neutral-light px-6 py-4">
      <div className="max-w-[1440px] mx-auto flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="flex items-center gap-3 text-neutral-dark group"
          >
            <div className="size-8 text-primary transition-transform group-hover:scale-110">
              <span className="material-symbols-outlined text-[32px]">
                landscape
              </span>
            </div>
            <h2 className="text-xl font-bold leading-tight tracking-tight">
              Himalayan Glow
            </h2>
          </Link>

          <nav className="hidden md:flex items-center gap-8 pl-8 border-l border-neutral-light/50">
            <Link
              href="/"
              className="text-neutral-dark hover:text-primary text-sm font-semibold transition-colors"
            >
              Cửa hàng
            </Link>
            <Link
              href="/about"
              className="text-neutral-dark/70 hover:text-primary text-sm font-medium transition-colors"
            >
              Lợi ích
            </Link>
            <Link
              href="/about"
              className="text-neutral-dark/70 hover:text-primary text-sm font-medium transition-colors"
            >
              Về chúng tôi
            </Link>
            <Link
              href="/contact"
              className="text-neutral-dark/70 hover:text-primary text-sm font-medium transition-colors"
            >
              Liên hệ
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:block relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-neutral-medium text-[20px]">
                search
              </span>
            </div>
            <input
              className="block w-full rounded-full border-none bg-neutral-light py-2 pl-10 pr-4 text-sm text-neutral-dark placeholder:text-neutral-medium focus:ring-1 focus:ring-primary outline-none"
              placeholder="Tìm kiếm..."
              type="text"
            />
          </div>

          {/* Cart button with item count badge */}
          <Link
            href="/cart"
            className="relative p-2 text-neutral-dark hover:text-primary transition-colors rounded-full hover:bg-neutral-light"
          >
            <span className="material-symbols-outlined">shopping_cart</span>
            {mounted && totalItems > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center px-1">
                {totalItems > 99 ? "99+" : totalItems}
              </span>
            )}
          </Link>

          {/* Auth button - shows avatar or login icon */}
          {!mounted ? (
            // Render placeholder during SSR to prevent hydration mismatch
            <div className="size-10 rounded-full bg-neutral-light/50 animate-pulse" />
          ) : isAuthenticated && user ? (
            <div className="relative group">
              <button className="flex items-center gap-2 p-1.5 text-neutral-dark hover:text-primary transition-colors rounded-full hover:bg-neutral-light">
                <div className="size-7 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">
                  {(user.name ?? "?").charAt(0).toUpperCase()}
                </div>
              </button>
              {/* Dropdown */}
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-neutral-light opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="p-3 border-b border-neutral-light">
                  <p className="text-sm font-bold text-neutral-dark truncate">
                    {user.name}
                  </p>
                  <p className="text-xs text-neutral-medium truncate">
                    {user.email}
                  </p>
                </div>
                <div className="p-1">
                  <Link
                    href="/account"
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-neutral-dark hover:bg-neutral-light hover:text-primary transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      account_circle
                    </span>
                    Tài khoản
                  </Link>
                  <Link
                    href="/account/orders"
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-neutral-dark hover:bg-neutral-light hover:text-primary transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      receipt_long
                    </span>
                    Đơn hàng
                  </Link>
                  {user.role === "admin" && (
                    <Link
                      href="/admin/dashboard"
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-neutral-dark hover:bg-neutral-light hover:text-primary transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        admin_panel_settings
                      </span>
                      Quản trị
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      logout
                    </span>
                    Đăng xuất
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <Link
              href="/login"
              className="p-2 text-neutral-dark hover:text-primary transition-colors rounded-full hover:bg-neutral-light"
            >
              <span className="material-symbols-outlined">account_circle</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
