"use client";
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import { authService } from "@/services/authService";

import { useThemeStore } from "@/store/themeStore";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const totalItems = useCartStore((s) => s.totalItems());
  const { isLit, toggleLit } = useThemeStore();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);

  // Prevent hydration mismatch for cart badge
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setAccountMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!accountMenuRef.current) return;
      if (!accountMenuRef.current.contains(event.target as Node)) {
        setAccountMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, []);

  const handleLogout = () => {
    authService.logout();
    logout();
    router.push("/login");
  };

  return (
    <header className={`sticky top-0 z-50 px-6 py-4 transition-all duration-1000 border-b ${isLit && pathname === '/landing' ? 'bg-neutral-dark/95 border-white/5 backdrop-blur-sm' : 'bg-background-light/95 border-neutral-light backdrop-blur-sm'}`}>
      <div className="max-w-[1440px] mx-auto flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className={`flex items-center gap-3 group transition-colors duration-1000 ${isLit && pathname === '/landing' ? 'text-white' : 'text-neutral-dark'}`}
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

          <nav className={`hidden md:flex items-center gap-8 pl-8 border-l transition-all duration-1000 ${isLit && pathname === '/landing' ? 'border-white/10' : 'border-neutral-light/50'}`}>
            <Link
              href="/"
              className={`text-sm font-bold transition-all duration-1000 hover:text-primary ${
                pathname === "/" ? "text-primary" : (isLit && pathname === '/landing' ? 'text-white' : 'text-neutral-dark')
              }`}
            >
              Cửa hàng
            </Link>

            <Link
              href="/about"
              className={`text-sm font-bold transition-all duration-1000 hover:text-primary ${
                pathname === "/about"
                  ? "text-primary font-semibold"
                  : (isLit && pathname === '/landing' ? 'text-white' : 'text-neutral-dark')
              }`}
            >
              Về chúng tôi
            </Link>
            <Link
              href="/contact"
              className={`text-sm font-bold transition-all duration-1000 hover:text-primary ${
                pathname === "/contact"
                  ? "text-primary font-semibold"
                  : (isLit && pathname === '/landing' ? 'text-white' : 'text-neutral-dark')
              }`}
            >
              Liên hệ
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {/* Night Mode Toggle - Only shown on Landing page for now or as desired */}
          {pathname === '/landing' && (
            <button 
              onClick={toggleLit}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-500 text-xs font-bold uppercase tracking-widest ${isLit ? 'bg-primary/20 border-primary/50 text-primary glow-primary' : 'bg-neutral-dark/5 border-neutral-dark/10 text-neutral-medium'}`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {isLit ? 'dark_mode' : 'light_mode'}
              </span>
              <span className="hidden sm:inline">{isLit ? 'Đêm' : 'Ngày'}</span>
            </button>
          )}

          <button
            type="button"
            aria-label={mobileMenuOpen ? "Đóng menu" : "Mở menu"}
            onClick={() => {
              setMobileMenuOpen((prev) => !prev);
              setAccountMenuOpen(false);
            }}
            className={`md:hidden p-2 transition-colors duration-1000 rounded-full hover:bg-neutral-light ${isLit && pathname === '/landing' ? 'text-white' : 'text-neutral-dark'}`}
          >
            <span className="material-symbols-outlined">
              {mobileMenuOpen ? "close" : "menu"}
            </span>
          </button>

          {/* Cart button */}
          <Link
            href="/cart"
            className={`relative p-2 transition-colors duration-1000 rounded-full hover:bg-neutral-light ${isLit && pathname === '/landing' ? 'text-white hover:text-primary' : 'text-neutral-dark hover:text-primary'}`}
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
            <div className="relative" ref={accountMenuRef}>
              <button
                type="button"
                aria-expanded={accountMenuOpen}
                aria-label="Mở menu tài khoản"
                onClick={() => {
                  setAccountMenuOpen((prev) => !prev);
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-2 p-1.5 text-neutral-dark hover:text-primary transition-colors rounded-full hover:bg-neutral-light"
              >
                <div className="size-7 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">
                  {(user.name ?? "?").charAt(0).toUpperCase()}
                </div>
              </button>

              {accountMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-lg border border-neutral-light transition-all duration-200 z-50">
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
                        dashboard
                      </span>
                      Bảng điều khiển
                    </Link>
                    <Link
                      href="/account/profile"
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
              )}
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

      {mobileMenuOpen && (
        <div className="md:hidden mt-4 max-w-[1440px] mx-auto bg-white rounded-xl border border-neutral-light shadow-sm p-3">
          <nav className="flex flex-col gap-1">
            <Link
              href="/"
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                pathname === "/"
                  ? "bg-primary/10 text-primary"
                  : "text-neutral-dark hover:bg-neutral-light"
              }`}
            >
              Cửa hàng
            </Link>
            <Link
              href="/about"
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                pathname === "/about"
                  ? "bg-primary/10 text-primary"
                  : "text-neutral-dark hover:bg-neutral-light"
              }`}
            >
              Về chúng tôi
            </Link>
            <Link
              href="/contact"
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                pathname === "/contact"
                  ? "bg-primary/10 text-primary"
                  : "text-neutral-dark hover:bg-neutral-light"
              }`}
            >
              Liên hệ
            </Link>

            {!isAuthenticated && (
              <Link
                href="/login"
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  pathname === "/login"
                    ? "bg-primary/10 text-primary"
                    : "text-neutral-dark hover:bg-neutral-light"
                }`}
              >
                Đăng nhập
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
