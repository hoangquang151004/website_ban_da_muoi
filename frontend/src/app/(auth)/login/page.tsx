"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { authService } from "@/services/authService";
import { useAuthStore } from "@/store/authStore";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const loginStore = useAuthStore((s) => s.login);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await authService.login({ email, password });
      loginStore(res.user, res.token);
      const redirect = searchParams.get("redirect") || "/";
      router.push(redirect);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Đăng nhập thất bại. Vui lòng thử lại.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <label
            className="block text-sm font-medium text-[#333333] mb-2"
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
              className="form-input block w-full pl-10 pr-3 py-3 rounded-lg border-[#E5E5E5] bg-white text-[#333333] placeholder-gray-400 focus:border-primary focus:ring-primary sm:text-sm shadow-sm transition-colors duration-200 outline-none"
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
          <div className="flex justify-between items-center mb-2">
            <label
              className="block text-sm font-medium text-[#333333]"
              htmlFor="password"
            >
              Mật khẩu
            </label>
            <a
              className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              href="#"
            >
              Quên mật khẩu?
            </a>
          </div>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <span className="material-symbols-outlined text-[20px]">
                lock
              </span>
            </span>
            <input
              className="form-input block w-full pl-10 pr-3 py-3 rounded-lg border-[#E5E5E5] bg-white text-[#333333] placeholder-gray-400 focus:border-primary focus:ring-primary sm:text-sm shadow-sm transition-colors duration-200 outline-none"
              id="password"
              placeholder="nhập mật khẩu của bạn"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </div>

        <button
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200 transform hover:scale-[1.01] disabled:opacity-60 disabled:cursor-not-allowed"
          type="submit"
          disabled={loading}
        >
          {loading ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>
      </form>
    </>
  );
}

export default function LoginPage() {
  return (
    <div className="font-display bg-gray-100 text-[#333333] min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1513506003013-68d27dbe9711?q=80&w=2574&auto=format&fit=crop')] bg-cover bg-center opacity-30 blur-sm"></div>
      <div className="absolute inset-0 bg-white/40 backdrop-blur-sm"></div>

      <div className="relative w-full max-w-[1000px] bg-[#FDFBF7] rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden border border-white/50">
        <div className="hidden md:block w-1/2 relative">
          <div
            className="absolute inset-0 bg-cover bg-center h-full w-full"
            style={{
              backgroundImage:
                "url('https://lh3.googleusercontent.com/aida-public/AB6AXuA5tnmHT7QfJVKumqLXk9EL7nedF5hMboSyNv6zX1vZs3tJIQMJ6dt5RPH0PiSo7DPGOqRkVPCUGvKBymF_jEbwyA0AsWA4c6IMAx6Or6M4H3cQw7XR83xomKxsMv1gRm3RTQ9wEegfcjXp7KeERQOtEca-8mtc13X1MUy4DBTdDE556NNVBfhkuWWAMrGgGvK55sKeAIa0it8hEab9qdvaVHy-gcIvo5BdYzWXMZkou1ltNOCkCa7SqoYCw3SaajFjGmbHNzHvPg9o')",
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
            <div className="absolute bottom-8 left-8 right-8 text-white">
              <h3 className="text-2xl font-bold mb-2">Không gian thư giãn</h3>
              <p className="text-slate-100 text-sm">
                Mang sự ấm áp và bình yên từ thiên nhiên vào ngôi nhà của bạn.
              </p>
            </div>
          </div>
        </div>

        <div className="w-full md:w-1/2 p-8 lg:p-12 flex flex-col justify-center bg-[#FDFBF7]">
          <div className="mb-8 text-center md:text-left">
            <h2 className="text-3xl font-bold text-[#333333] mb-2">
              Chào mừng trở lại
            </h2>
            <p className="text-gray-500">Đăng nhập để tiếp tục mua sắm</p>
          </div>

          <Suspense
            fallback={
              <div className="text-center py-4 text-gray-400">Đang tải...</div>
            }
          >
            <LoginForm />
          </Suspense>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-[#FDFBF7] text-gray-500">
                  Hoặc tiếp tục với
                </span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                className="w-full inline-flex justify-center items-center py-2.5 px-4 border border-gray-200 rounded-lg shadow-sm bg-white text-sm font-medium text-[#333333] hover:bg-gray-50 transition-colors duration-200"
                type="button"
              >
                <svg
                  className="mr-2"
                  height="20"
                  viewBox="0 0 48 48"
                  width="20"
                >
                  <path
                    d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                    fill="#EA4335"
                  ></path>
                  <path
                    d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                    fill="#4285F4"
                  ></path>
                  <path
                    d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                    fill="#FBBC05"
                  ></path>
                  <path
                    d="M24 48c6.48 0 12.23-2.16 16.58-5.88l-7.73-6c-2.15 1.45-4.92 2.3-8.85 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                    fill="#34A853"
                  ></path>
                </svg>
                Google
              </button>
              <button
                className="w-full inline-flex justify-center items-center py-2.5 px-4 border border-gray-200 rounded-lg shadow-sm bg-white text-sm font-medium text-[#333333] hover:bg-gray-50 transition-colors duration-200"
                type="button"
              >
                <svg
                  aria-hidden="true"
                  className="h-5 w-5 mr-2 text-[#1877F2]"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    clipRule="evenodd"
                    d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                    fillRule="evenodd"
                  ></path>
                </svg>
                Facebook
              </button>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              Chưa có tài khoản?
              <Link
                className="font-bold text-primary hover:text-primary/80 transition-colors ml-1"
                href="/register"
              >
                Đăng ký ngay
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
