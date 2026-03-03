import React from "react";

export default function ProfilePage() {
  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 max-w-6xl mx-auto w-full">
      {/* Profile Header Card */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 md:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="relative group">
            <div className="size-32 md:size-40 rounded-full border-4 border-primary/10 p-1 shrink-0">
              <img
                alt="Avatar người dùng"
                className="w-full h-full rounded-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDjXPKocqmtyT0lijPUExqX0W-qllEjTxhHm6ES4Ad5rRr4DLwIYCimiINhJwCFev106B5guxYlPtm6Uq5OR3twyMmCt7w6Ema0BiIv87WP0DPGiS_bC3mZUH7E9YI9X9uTmN8NZn0Wa3xED6uqLsLfqdZfN7bBg7GeGruc9PELS-r3OTmu98tg-tpj9SP3vR4mzohU5qrwqQaxQbbZrYoTYyR07e3AGxisnKcR6_tAIk7LBFYCJCsrT-bhYqN7HEbaT7g9Ah7t21uQ"
              />
            </div>
            <button className="absolute bottom-1 right-1 size-10 bg-primary text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[20px]">
                photo_camera
              </span>
            </button>
          </div>
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-1">
              Nguyễn Văn An
            </h2>
            <p className="text-slate-500 flex items-center justify-center md:justify-start gap-2">
              <span className="material-symbols-outlined text-[18px]">
                calendar_today
              </span>
              Thành viên từ: 15/05/2023
            </p>
            <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-2">
              <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full uppercase tracking-wider">
                Premium Account
              </span>
              <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full uppercase tracking-wider">
                Đã xác minh
              </span>
            </div>
          </div>
          <div className="w-full md:w-auto mt-4 md:mt-0">
            <button className="w-full md:w-auto px-6 py-2.5 border border-slate-200 hover:bg-slate-50 font-bold text-sm rounded-lg transition-colors">
              Thay đổi ảnh
            </button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Account Form */}
        <section className="bg-white border border-slate-200 rounded-xl p-6 md:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <span className="material-symbols-outlined text-primary">
              person
            </span>
            <h3 className="text-lg font-bold text-slate-900">
              Thông tin cá nhân
            </h3>
          </div>
          <form className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-600">
                Họ và tên
              </label>
              <input
                className="w-full rounded-lg border-slate-200 focus:border-primary focus:ring-primary/20 text-sm py-2.5 px-3 bg-slate-50"
                type="text"
                defaultValue="Nguyễn Văn An"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-600">
                Email
              </label>
              <input
                className="w-full rounded-lg border-slate-200 focus:border-primary focus:ring-primary/20 text-sm py-2.5 px-3 bg-slate-50"
                type="email"
                defaultValue="an.nguyenvan@example.com"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-600">
                Số điện thoại
              </label>
              <input
                className="w-full rounded-lg border-slate-200 focus:border-primary focus:ring-primary/20 text-sm py-2.5 px-3 bg-slate-50"
                type="tel"
                defaultValue="0901 234 567"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-600">
                  Ngày sinh
                </label>
                <input
                  className="w-full rounded-lg border-slate-200 focus:border-primary focus:ring-primary/20 text-sm py-2.5 px-3 bg-slate-50"
                  type="date"
                  defaultValue="1995-05-15"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-600">
                  Giới tính
                </label>
                <select
                  className="w-full rounded-lg border-slate-200 focus:border-primary focus:ring-primary/20 text-sm py-2.5 px-3 bg-slate-50"
                  defaultValue="male"
                >
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                  <option value="other">Khác</option>
                </select>
              </div>
            </div>
            <div className="pt-4">
              <button
                className="w-full bg-primary text-white font-bold py-2.5 rounded-lg hover:bg-primary/90 transition-shadow shadow-md shadow-primary/20"
                type="button"
              >
                Lưu thay đổi
              </button>
            </div>
          </form>
        </section>

        {/* Security Section */}
        <div className="space-y-8">
          {/* Password Section */}
          <section className="bg-white border border-slate-200 rounded-xl p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-primary">
                lock
              </span>
              <h3 className="text-lg font-bold text-slate-900">Đổi mật khẩu</h3>
            </div>
            <form className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-600">
                  Mật khẩu hiện tại
                </label>
                <div className="relative">
                  <input
                    className="w-full rounded-lg border-slate-200 focus:border-primary focus:ring-primary/20 text-sm py-2.5 pl-3 pr-10 bg-slate-50"
                    placeholder="••••••••"
                    type="password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      visibility
                    </span>
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-600">
                  Mật khẩu mới
                </label>
                <input
                  className="w-full rounded-lg border-slate-200 focus:border-primary focus:ring-primary/20 text-sm py-2.5 pl-3 pr-10 bg-slate-50"
                  placeholder="••••••••"
                  type="password"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-600">
                  Xác nhận mật khẩu
                </label>
                <input
                  className="w-full rounded-lg border-slate-200 focus:border-primary focus:ring-primary/20 text-sm py-2.5 pl-3 pr-10 bg-slate-50"
                  placeholder="••••••••"
                  type="password"
                />
              </div>
              <div className="pt-4">
                <button
                  className="w-full border-2 border-primary/20 text-primary font-bold py-2.5 rounded-lg hover:bg-primary/5 transition-colors"
                  type="button"
                >
                  Cập nhật mật khẩu
                </button>
              </div>
            </form>
          </section>

          {/* 2FA Section */}
          <section className="bg-white border border-slate-200 rounded-xl p-6 md:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">
                  security
                </span>
                <h3 className="text-lg font-bold text-slate-900">
                  Bảo mật 2 lớp (2FA)
                </h3>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  defaultChecked={true}
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed">
              Thêm một lớp bảo mật cho tài khoản của bạn bằng cách yêu cầu mã
              xác thực từ ứng dụng di động khi đăng nhập.
            </p>
            <div className="mt-4 p-3 bg-slate-50 rounded-lg flex items-center gap-3">
              <span className="material-symbols-outlined text-green-500">
                check_circle
              </span>
              <span className="text-xs font-medium text-slate-700">
                Đang hoạt động: Google Authenticator
              </span>
            </div>
          </section>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center text-xs text-slate-400 py-4 gap-4 mt-8 border-t border-slate-100">
        <p>© 2024 Himalayan Salt Lamp Vietnam. Bảo lưu mọi quyền.</p>
        <div className="flex gap-6">
          <a className="hover:text-primary transition-colors" href="#">
            Điều khoản dịch vụ
          </a>
          <a className="hover:text-primary transition-colors" href="#">
            Chính sách bảo mật
          </a>
          <a className="hover:text-primary transition-colors" href="#">
            Hỗ trợ khách hàng
          </a>
        </div>
      </div>
    </main>
  );
}
