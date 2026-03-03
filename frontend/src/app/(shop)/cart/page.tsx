import React from "react";
import Link from "next/link";

export default function CartPage() {
  return (
    <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-[1440px]">
      <h1 className="text-3xl md:text-4xl font-extrabold text-neutral-dark mb-8">
        Giỏ hàng của bạn
      </h1>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Column: Cart Items (65%) */}
        <div className="w-full lg:w-[65%] space-y-8">
          <section className="bg-white rounded-xl shadow-sm border border-neutral-light p-6">
            <div className="space-y-6">
              {/* Item 1 */}
              <div className="flex flex-col sm:flex-row gap-4 py-4 border-b border-neutral-light last:border-0 last:pb-0">
                <div className="shrink-0">
                  <img
                    alt="Warm glowing salt lamp on wooden table"
                    className="size-24 rounded-lg object-cover bg-neutral-light"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAfC5BsiCu1mJXwkdVp0fUHOjxxdzSbsQ3wnOR4vM49oHYGPEwvWxTS0qno-rFGkO77aEJGKoSov_xzH91Jrw_ea_Uckb7hJCnYamMcsVPeruETtFCKx1IqJJ6utVF4mjfKAcRb4Tq63N0rfbz79ViNKsRST3t0bIQaeOxuXgon-fncesByD9CJLUNexL-gKrn3doN-yP_1pFy-Kpu7_OHZ_K86I5vMW1xrdxHGcr5DhHwKrIi9DB8yeIXh0gDLm8zy8WtrnhM8HLH_"
                  />
                </div>
                <div className="flex flex-1 flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold text-neutral-dark">
                        Đèn đá muối tự nhiên
                      </h3>
                      <p className="text-sm text-neutral-medium mt-1">
                        Size L • Kèm dây nguồn
                      </p>
                    </div>
                    <button
                      className="text-red-500 hover:text-red-600 transition-colors p-1 rounded-md hover:bg-red-50"
                      title="Xóa"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        delete
                      </span>
                    </button>
                  </div>
                  <div className="flex justify-between items-end mt-4 sm:mt-0">
                    <div className="flex items-center border border-neutral-light rounded-lg">
                      <button className="px-3 py-1 hover:bg-neutral-light text-neutral-dark rounded-l-lg transition-colors">
                        -
                      </button>
                      <span className="px-2 py-1 text-sm font-medium text-neutral-dark w-8 text-center">
                        1
                      </span>
                      <button className="px-3 py-1 hover:bg-neutral-light text-neutral-dark rounded-r-lg transition-colors">
                        +
                      </button>
                    </div>
                    <p className="font-bold text-lg text-primary">450.000đ</p>
                  </div>
                </div>
              </div>

              {/* Item 2 */}
              <div className="flex flex-col sm:flex-row gap-4 py-4 border-b border-neutral-light last:border-0 last:pb-0">
                <div className="shrink-0">
                  <img
                    alt="Round shaped salt lamp glowing softly"
                    className="size-24 rounded-lg object-cover bg-neutral-light"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDVgSEq0JKipndvWR8XouAlQB9uaPrtC9aBpo2V68k8DKtSL05RjU-9g47jXZTc2tBDnHM7hw2Pmpl8r6GbfXqeb8Zvjhl-iS0ooc5wiopsn9qAYfPyeOiEbWO2ZLcqAyxZq0XHlAPKN_3feiu7W3NOgZZ77O1wYy4UoPNhPvokEUYRjOMx1FvsHWt4A3wEGJaC3fN4PRVP1PI52PCNecDZaR0qYBVoPEgQYdNc2PuJEGsvEmPeUtch1sVnszmObmSofFmq4zYGo1wt"
                  />
                </div>
                <div className="flex flex-1 flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold text-neutral-dark">
                        Đèn đá muối hình cầu
                      </h3>
                      <p className="text-sm text-neutral-medium mt-1">
                        Size M • Đế gỗ
                      </p>
                    </div>
                    <button
                      className="text-red-500 hover:text-red-600 transition-colors p-1 rounded-md hover:bg-red-50"
                      title="Xóa"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        delete
                      </span>
                    </button>
                  </div>
                  <div className="flex justify-between items-end mt-4 sm:mt-0">
                    <div className="flex items-center border border-neutral-light rounded-lg">
                      <button className="px-3 py-1 hover:bg-neutral-light text-neutral-dark rounded-l-lg transition-colors">
                        -
                      </button>
                      <span className="px-2 py-1 text-sm font-medium text-neutral-dark w-8 text-center">
                        2
                      </span>
                      <button className="px-3 py-1 hover:bg-neutral-light text-neutral-dark rounded-r-lg transition-colors">
                        +
                      </button>
                    </div>
                    <p className="font-bold text-lg text-primary">350.000đ</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <Link
                href="/"
                className="text-primary font-medium hover:underline flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">
                  arrow_back
                </span>
                Tiếp tục mua sắm
              </Link>
            </div>
          </section>
        </div>

        {/* Right Column: Order Summary (35%) */}
        <div className="w-full lg:w-[35%]">
          <div className="sticky top-24 bg-white rounded-xl shadow-sm border border-neutral-light p-6">
            <h2 className="text-xl font-bold text-neutral-dark mb-6">
              Tóm tắt đơn hàng
            </h2>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-neutral-medium">
                <span>Tạm tính</span>
                <span className="font-medium text-neutral-dark">800.000đ</span>
              </div>
            </div>

            <div className="border-t border-neutral-light pt-4 mb-6">
              <div className="flex justify-between items-end">
                <span className="text-lg font-bold text-neutral-dark">
                  Tổng cộng
                </span>
                <span className="text-2xl font-extrabold text-primary">
                  800.000đ
                </span>
              </div>
              <p className="text-xs text-neutral-medium text-right mt-1">
                (Chưa bao gồm phí vận chuyển)
              </p>
            </div>

            <Link
              href="/checkout"
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/30 transition-all transform active:scale-[0.98] flex justify-center items-center gap-2 group"
            >
              Chuyển đến thanh toán
              <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">
                arrow_forward
              </span>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
