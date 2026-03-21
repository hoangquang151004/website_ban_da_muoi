"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authService } from "@/services/authService";
import { useAuthStore } from "@/store/authStore";

export default function RegisterPage() {
  const router = useRouter();
  const loginStore = useAuthStore((s) => s.login);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await authService.register({ name, email, password });
      loginStore(res.user, res.token);
      router.push("/");
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Đăng ký thất bại. Vui lòng thử lại.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="font-display bg-gray-100 text-[#333333] min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://lh3.googleusercontent.com/aida-public/AB6AXuDQqA8e0F7h8qA9w2L7M_8z6S4q5T6W6V3V0T8L7v5Y3L0Q9z8_4N7_0W8_5Q8z5P8M0_1Q5N6P_9G6Y0L2M3V0_2J0X7V8_6Q5V3H6L0_6W5Y8_4_7_7J2_Z8K6T9Q7K0W8D6P0D0Z1_"></div>
      <div className="absolute inset-0 bg-white/40 backdrop-blur-sm"></div>

      <div className="relative w-full max-w-[1000px] bg-[#FDFBF7] rounded-2xl shadow-2xl flex flex-col md:flex-row-reverse overflow-hidden border border-white/50">
        <div className="hidden md:block w-1/2 relative">
          <div
            className="absolute inset-0 bg-cover bg-center h-full w-full"
            style={{
              backgroundImage:
                "url('https://i.pinimg.com/736x/18/37/ef/1837ef38e37da4ff13051e2dc14b3838.jpg') ",
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
            <div className="absolute bottom-8 left-8 right-8 text-white text-right">
              <h3 className="text-2xl font-bold mb-2">Thành viên mới</h3>
              <p className="text-slate-100 text-sm">
                Trở thành thành viên để nhận ưu đãi và tích điểm khi mua sắm.
              </p>
            </div>
          </div>
        </div>

        <div className="w-full md:w-1/2 p-8 lg:p-12 flex flex-col justify-center bg-[#FDFBF7]">
          <div className="mb-8 text-center md:text-left">
            <h2 className="text-3xl font-bold text-[#333333] mb-2">
              Tạo tài khoản
            </h2>
            <p className="text-gray-500">
              Đăng ký để khám phá các sản phẩm đá muối
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label
                className="block text-sm font-medium text-[#333333] mb-1"
                htmlFor="name"
              >
                Họ và tên
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <span className="material-symbols-outlined text-[20px]">
                    person
                  </span>
                </span>
                <input
                  className="form-input block w-full pl-10 pr-3 py-3 rounded-lg border-[#E5E5E5] bg-white text-[#333333] placeholder-gray-400 focus:border-primary focus:ring-primary sm:text-sm shadow-sm outline-none"
                  id="name"
                  placeholder="Nguyễn Văn A"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label
                className="block text-sm font-medium text-[#333333] mb-1"
                htmlFor="email"
              >
                Email
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <span className="material-symbols-outlined text-[20px]">
                    mail
                  </span>
                </span>
                <input
                  className="form-input block w-full pl-10 pr-3 py-3 rounded-lg border-[#E5E5E5] bg-white text-[#333333] placeholder-gray-400 focus:border-primary focus:ring-primary sm:text-sm shadow-sm outline-none"
                  id="email"
                  placeholder="nhập email của bạn"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label
                className="block text-sm font-medium text-[#333333] mb-1"
                htmlFor="password"
              >
                Mật khẩu
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <span className="material-symbols-outlined text-[20px]">
                    lock
                  </span>
                </span>
                <input
                  className="form-input block w-full pl-10 pr-3 py-3 rounded-lg border-[#E5E5E5] bg-white text-[#333333] placeholder-gray-400 focus:border-primary focus:ring-primary sm:text-sm shadow-sm outline-none"
                  id="password"
                  placeholder="tạo mật khẩu mới"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              className="w-full flex justify-center py-3 px-4 mt-2 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-primary hover:bg-primary/90 transition-all transform hover:scale-[1.01] disabled:opacity-60 disabled:cursor-not-allowed"
              type="submit"
              disabled={loading}
            >
              {loading ? "Đang đăng ký..." : "Đăng ký"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Đã có tài khoản?
              <Link
                className="font-bold text-primary hover:text-primary/80 transition-colors ml-1"
                href="/login"
              >
                Đăng nhập
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
