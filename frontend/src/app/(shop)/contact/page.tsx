import React from "react";

export default function AboutPage() {
  return (
    <main className="flex-grow container mx-auto px-4 py-12 lg:py-20 max-w-7xl">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
        <div className="flex flex-col gap-10">
          <div className="max-w-lg">
            <h1 className="text-4xl font-extrabold text-[#1c1917] mb-6">
              Liên hệ với chúng tôi
            </h1>
            <p className="text-[#57534e] text-lg leading-relaxed mb-8">
              Chúng tôi luôn lắng nghe những phản hồi và mong muốn được hỗ trợ
              bạn trong hành trình tìm kiếm sự thư giãn và sức khỏe tự nhiên.
            </p>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 size-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined">location_on</span>
                </div>
                <div>
                  <h3 className="font-bold text-[#1c1917]">Địa chỉ</h3>
                  <p className="text-[#57534e]">
                    123 Đường Nam Kỳ Khởi Nghĩa, Quận 1, TP. Hồ Chí Minh
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 size-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined">call</span>
                </div>
                <div>
                  <h3 className="font-bold text-[#1c1917]">Điện thoại</h3>
                  <p className="text-[#57534e]">+84 (028) 3822 1234</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 size-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined">mail</span>
                </div>
                <div>
                  <h3 className="font-bold text-[#1c1917]">Email</h3>
                  <p className="text-[#57534e]">hello@himalayasalt.vn</p>
                </div>
              </div>
            </div>
            <div className="mt-10 pt-8 border-t border-[#e7e5e4]">
              <h4 className="font-bold text-[#1c1917] mb-4">
                Theo dõi chúng tôi
              </h4>
              <div className="flex gap-4">
                <a
                  className="size-10 rounded-full border border-[#d6d3d1] flex items-center justify-center text-[#57534e] hover:bg-primary hover:text-white hover:border-primary transition-all"
                  href="#"
                >
                  <span className="material-symbols-outlined text-xl">
                    social_leaderboard
                  </span>
                </a>
                <a
                  className="size-10 rounded-full border border-[#d6d3d1] flex items-center justify-center text-[#57534e] hover:bg-primary hover:text-white hover:border-primary transition-all"
                  href="#"
                >
                  <span className="material-symbols-outlined text-xl">
                    share
                  </span>
                </a>
              </div>
            </div>
          </div>
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-md border border-[#e7e5e4]">
            <div className="absolute inset-0 bg-[#f5f5f4] flex items-center justify-center">
              <div className="relative flex flex-col items-center">
                <span className="material-symbols-outlined text-primary text-5xl fill-current">
                  location_on
                </span>
                <div className="absolute -bottom-2 w-4 h-1 bg-black/10 rounded-full blur-sm"></div>
              </div>
              <svg
                className="absolute inset-0 w-full h-full opacity-10 pointer-events-none"
                viewBox="0 0 400 300"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M0 100 Q 100 80, 200 120 T 400 100"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                ></path>
                <path
                  d="M0 200 Q 150 220, 250 180 T 400 210"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                ></path>
                <path
                  d="M100 0 Q 120 150, 80 300"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                ></path>
                <path
                  d="M300 0 Q 280 150, 320 300"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                ></path>
              </svg>
              <p className="absolute bottom-4 text-xs text-[#a8a29e] font-medium">
                123 Nam Kỳ Khởi Nghĩa, Quận 1
              </p>
            </div>
            <div className="absolute top-4 right-4 flex flex-col gap-1">
              <div className="size-8 bg-white shadow-md rounded flex items-center justify-center text-[#a8a29e]">
                <span className="material-symbols-outlined text-lg">add</span>
              </div>
              <div className="size-8 bg-white shadow-md rounded flex items-center justify-center text-[#a8a29e]">
                <span className="material-symbols-outlined text-lg">
                  remove
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full">
          <div className="bg-white p-8 lg:p-10 rounded-3xl shadow-xl shadow-[#e7e5e4]/50 border border-[#f5f5f4]">
            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label
                    className="text-sm font-semibold text-[#44403c]"
                    htmlFor="name"
                  >
                    Họ và tên
                  </label>
                  <input
                    className="w-full px-4 py-3 rounded-xl border border-[#e7e5e4] bg-[#fafaf9] focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-[#a8a29e]"
                    id="name"
                    placeholder="Nguyễn Văn A"
                    type="text"
                  />
                </div>
                <div className="space-y-2">
                  <label
                    className="text-sm font-semibold text-[#44403c]"
                    htmlFor="email"
                  >
                    Email
                  </label>
                  <input
                    className="w-full px-4 py-3 rounded-xl border border-[#e7e5e4] bg-[#fafaf9] focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-[#a8a29e]"
                    id="email"
                    placeholder="email@vi-du.com"
                    type="email"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label
                  className="text-sm font-semibold text-[#44403c]"
                  htmlFor="subject"
                >
                  Chủ đề
                </label>
                <input
                  className="w-full px-4 py-3 rounded-xl border border-[#e7e5e4] bg-[#fafaf9] focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-[#a8a29e]"
                  id="subject"
                  placeholder="Vấn đề cần hỗ trợ"
                  type="text"
                />
              </div>
              <div className="space-y-2">
                <label
                  className="text-sm font-semibold text-[#44403c]"
                  htmlFor="message"
                >
                  Lời nhắn
                </label>
                <textarea
                  className="w-full px-4 py-3 rounded-xl border border-[#e7e5e4] bg-[#fafaf9] focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-[#a8a29e] resize-none"
                  id="message"
                  placeholder="Nhập nội dung tin nhắn của bạn..."
                  rows={5}
                ></textarea>
              </div>
              <button
                className="w-full py-4 bg-primary hover:bg-[#ea580c] text-white font-bold rounded-xl shadow-lg shadow-primary/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                type="button"
              >
                <span className="material-symbols-outlined">send</span>
                Gửi lời nhắn
              </button>
            </form>
            <div className="mt-8 flex items-center gap-4 p-4 bg-[#fafaf9] rounded-2xl">
              <span className="material-symbols-outlined text-primary">
                schedule
              </span>
              <p className="text-sm text-[#57534e]">
                <strong>Giờ làm việc:</strong> Thứ Hai - Chủ Nhật, 08:00 - 21:00
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
