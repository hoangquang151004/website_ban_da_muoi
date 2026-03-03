import React from "react";

export default function Footer() {
  return (
    <footer className="bg-background-dark text-neutral-light py-12 px-6 mt-auto">
      <div className="max-w-[1440px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 text-primary">
            <span className="material-symbols-outlined text-[32px]">
              landscape
            </span>
            <h2 className="text-xl font-bold text-white">Himalayan Glow</h2>
          </div>
          <p className="text-sm text-neutral-light/70 mt-2 leading-relaxed">
            Chúng tôi cung cấp các sản phẩm đá muối Himalaya chất lượng cao,
            mang lại ánh sáng ấm áp và lợi ích sức khỏe cho không gian của bạn.
          </p>
        </div>

        <div>
          <h3 className="text-lg font-bold text-white mb-4">Sản Phẩm</h3>
          <ul className="flex flex-col gap-3 text-sm text-neutral-light/70">
            <li>
              <a href="#" className="hover:text-primary transition-colors">
                Đèn đá muối tự nhiên
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-primary transition-colors">
                Đèn đá muối chế tác
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-primary transition-colors">
                Đá ngâm chân
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-primary transition-colors">
                Muối hồng ẩm thực
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-bold text-white mb-4">Hỗ Trợ</h3>
          <ul className="flex flex-col gap-3 text-sm text-neutral-light/70">
            <li>
              <a href="#" className="hover:text-primary transition-colors">
                Chính sách bảo hành
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-primary transition-colors">
                Chính sách đổi trả
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-primary transition-colors">
                Giao hàng & Thanh toán
              </a>
            </li>
            <li>
              <a
                href="/contact"
                className="hover:text-primary transition-colors"
              >
                Liên hệ
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-bold text-white mb-4">
            Đăng ký nhận tin
          </h3>
          <p className="text-sm text-neutral-light/70 mb-4">
            Nhận ưu đãi mới nhất và mẹo chăm sóc sức khỏe từ chúng tôi.
          </p>
          <div className="flex">
            <input
              type="email"
              placeholder="Email của bạn"
              className="flex-1 rounded-l-md border-none bg-neutral-dark py-2 px-3 text-sm text-white focus:ring-1 focus:ring-primary outline-none"
            />
            <button className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-r-md text-sm font-medium transition-colors">
              Đăng ký
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto border-t border-neutral-medium/30 mt-12 pt-6 flex flex-col md:flex-row items-center justify-between text-sm text-neutral-light/50">
        <p>
          &copy; {new Date().getFullYear()} Himalayan Glow. All rights reserved.
        </p>
        <div className="flex gap-4 mt-4 md:mt-0">
          <a href="#" className="hover:text-primary">
            Facebook
          </a>
          <a href="#" className="hover:text-primary">
            Instagram
          </a>
          <a href="#" className="hover:text-primary">
            Tiktok
          </a>
        </div>
      </div>
    </footer>
  );
}
