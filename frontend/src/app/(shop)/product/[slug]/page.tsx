import React from "react";
import Link from "next/link";

export default function ProductDetailPage() {
  return (
    <main className="flex-grow container mx-auto px-4 py-8 max-w-[1440px]">
      {/* Breadcrumbs */}
      <nav className="flex mb-8 text-sm font-medium text-stone-500 dark:text-stone-400">
        <ol className="flex items-center gap-2">
          <li>
            <Link className="hover:text-primary transition-colors" href="/">
              Trang chủ
            </Link>
          </li>
          <li>
            <span className="material-symbols-outlined text-xs mt-1">
              chevron_right
            </span>
          </li>
          <li>
            <Link
              className="hover:text-primary transition-colors"
              href="/?category=den-ngu"
            >
              Đèn ngủ
            </Link>
          </li>
          <li>
            <span className="material-symbols-outlined text-xs mt-1">
              chevron_right
            </span>
          </li>
          <li
            aria-current="page"
            className="text-stone-900 dark:text-stone-100 font-semibold"
          >
            Đèn đá muối hình cầu tự nhiên
          </li>
        </ol>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Column: 3D Viewer & Gallery (60% on desktop) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* 3D Viewer Placeholder */}
          <div className="relative w-full aspect-[4/3] rounded-2xl bg-stone-100 dark:bg-stone-800 shadow-sm border border-stone-200 dark:border-stone-700 flex flex-col items-center justify-center group overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/40 to-transparent pointer-events-none"></div>
            <div className="z-10 flex flex-col items-center gap-4 text-stone-400">
              <span className="material-symbols-outlined text-6xl animate-pulse text-primary/60">
                view_in_ar
              </span>
              <p className="text-lg font-medium text-stone-500 dark:text-stone-400">
                Khu vực hiển thị mô hình 3D (Three.js)
              </p>
              <button className="mt-2 px-6 py-2 bg-white dark:bg-stone-700 rounded-full shadow-sm text-sm font-semibold text-primary hover:scale-105 transition-transform">
                Tương tác để xoay
              </button>
            </div>

            {/* Fake 3D Controls */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 bg-white/90 dark:bg-stone-900/90 backdrop-blur px-4 py-2 rounded-full shadow-lg border border-stone-100 dark:border-stone-700">
              <button
                className="p-1.5 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-full transition-colors"
                title="Zoom In"
              >
                <span className="material-symbols-outlined text-stone-700 dark:text-stone-300 text-xl">
                  add
                </span>
              </button>
              <button
                className="p-1.5 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-full transition-colors"
                title="Zoom Out"
              >
                <span className="material-symbols-outlined text-stone-700 dark:text-stone-300 text-xl">
                  remove
                </span>
              </button>
              <div className="w-px bg-stone-200 dark:bg-stone-700 mx-1"></div>
              <button
                className="p-1.5 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-full transition-colors"
                title="Fullscreen"
              >
                <span className="material-symbols-outlined text-stone-700 dark:text-stone-300 text-xl">
                  fullscreen
                </span>
              </button>
            </div>
          </div>

          {/* Thumbnails */}
          <div className="grid grid-cols-4 gap-4">
            <button className="relative aspect-square rounded-xl overflow-hidden border-2 border-primary ring-2 ring-primary/20 transition-all">
              <img
                alt="Salt lamp close up"
                className="h-full w-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAGfjYO8mStWQ37tewab53RBT0oA0W7NPl_iOQ42fws6KX29go8SEBuD2n5fkaL6an4q5KrTInlaSpNypoy213LyJdIq19FUkNF5A-0Y88uKhL0QuH2YCFSFQnz4A4FDob-OFF9p_dTlc-2QDs801Vodf7FS3cY8Bj9-ktfTsnJKChQ4S5uHkU6ZEc_wZHNZ8Ii8snMl7hgYMCFPT_JaIA-4wiLDRnuhyn9HRBkvoDokTb-QMvnC06yhpvc7dmhAOYScoDPHbndZzbt"
              />
            </button>
            <button className="relative aspect-square rounded-xl overflow-hidden border-2 border-transparent hover:border-primary/50 transition-all">
              <img
                alt="Salt lamp in living room"
                className="h-full w-full object-cover opacity-80 hover:opacity-100 transition-opacity"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDVb5snd4NrfMMvwDZSLOp5mcaVl5dSG4U1CgGsXjpRO8Z5ENzGP4nd9-6LbLqKCSABmu4LavvE8-1q0wJQmotb122D01V8Cmi4zL33vlxAkvG8fu3HBgOdLaLlSqfuMfYk7J0CEVkC4Q8YgtxIg2JcxpT7HDGdAnipNHueYu0tNQ4vOJvV23hiVSck-Mvc8cJsauRzFwdtofqxLtuakNFh0Rp8bPOJQZMDxZrTfQein8bkUFoBbJdI2w66ia4JQP3674WPnIjgIWT9"
              />
            </button>
            <button className="relative aspect-square rounded-xl overflow-hidden border-2 border-transparent hover:border-primary/50 transition-all">
              <img
                alt="Salt lamp turned off"
                className="h-full w-full object-cover opacity-80 hover:opacity-100 transition-opacity"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCQm5UD7eIXnYtE9iMA_J7jRH7hCSl_pe0_uCy2STCFr5MrePeRomb8pUXXS-dyl_pCbhas5FmxWGFvFTpe_yXzLYSIZT0D81BmqZXcHE0YHn1OUz7Gvxwdzo4V46bfeZyg1OTf2Xn9xTTg4298PJLd9eIEKPBOpMhoBQNmz5PfQe2CNPylYtvldJS145ccgX_G_MbOhewhs7VtBnavttrt1ZiomPkJVCI4_4hULjV63WCaoVL5nIqUqwV3WZDIkcboe_vuBMKUEUM1"
              />
            </button>
            <div className="relative aspect-square rounded-xl overflow-hidden bg-stone-100 dark:bg-stone-800 border-2 border-transparent flex items-center justify-center cursor-pointer hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors">
              <span className="material-symbols-outlined text-stone-400 text-3xl">
                play_circle
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Product Details (40% on desktop) */}
        <div className="lg:col-span-5 flex flex-col h-full">
          <div className="sticky top-24">
            <div className="mb-4">
              <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-3">
                Best Seller
              </span>
              <h1 className="text-3xl lg:text-4xl font-bold text-stone-900 dark:text-white leading-tight mb-2">
                Đèn Đá Muối Hình Cầu Tự Nhiên
              </h1>

              {/* Rating */}
              <div className="flex items-center gap-2 mb-4">
                <div className="flex text-primary">
                  <span className="material-symbols-outlined text-[20px] fill-current">
                    star
                  </span>
                  <span className="material-symbols-outlined text-[20px] fill-current">
                    star
                  </span>
                  <span className="material-symbols-outlined text-[20px] fill-current">
                    star
                  </span>
                  <span className="material-symbols-outlined text-[20px] fill-current">
                    star
                  </span>
                  <span className="material-symbols-outlined text-[20px] fill-current">
                    star_half
                  </span>
                </div>
                <span className="text-stone-500 dark:text-stone-400 text-sm font-medium">
                  (128 đánh giá)
                </span>
              </div>

              {/* Price */}
              <div className="flex items-end gap-3 mb-6">
                <span className="text-4xl font-bold text-primary tracking-tight">
                  850.000đ
                </span>
                <span className="text-xl text-stone-400 line-through mb-1">
                  1.250.000đ
                </span>
                <span className="mb-1.5 px-2 py-0.5 bg-red-100 text-red-600 text-xs font-bold rounded">
                  -32%
                </span>
              </div>
            </div>

            <hr className="border-stone-200 dark:border-stone-700 mb-6" />

            {/* Description */}
            <div className="mb-8">
              <p className="text-stone-600 dark:text-stone-300 text-lg leading-relaxed mb-4">
                Đèn đá muối Himalaya hình cầu không chỉ là vật trang trí tinh tế
                mà còn là giải pháp trị liệu tự nhiên.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3 text-stone-700 dark:text-stone-200">
                  <span className="material-symbols-outlined text-primary shrink-0">
                    check_circle
                  </span>
                  <span>Thanh lọc không khí, giảm bụi bẩn và vi khuẩn.</span>
                </li>
                <li className="flex items-start gap-3 text-stone-700 dark:text-stone-200">
                  <span className="material-symbols-outlined text-primary shrink-0">
                    check_circle
                  </span>
                  <span>Giúp giảm căng thẳng, mệt mỏi sau ngày dài.</span>
                </li>
                <li className="flex items-start gap-3 text-stone-700 dark:text-stone-200">
                  <span className="material-symbols-outlined text-primary shrink-0">
                    check_circle
                  </span>
                  <span>Cải thiện chất lượng giấc ngủ sâu hơn.</span>
                </li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4">
                {/* Quantity */}
                <div className="flex items-center border border-stone-300 dark:border-stone-600 rounded-lg h-12 w-32 bg-white dark:bg-stone-800">
                  <button className="flex-1 h-full flex items-center justify-center hover:bg-stone-100 dark:hover:bg-stone-700 rounded-l-lg transition-colors text-stone-500">
                    <span className="material-symbols-outlined text-sm">
                      remove
                    </span>
                  </button>
                  <input
                    className="w-10 text-center bg-transparent border-none p-0 text-stone-900 dark:text-white font-bold focus:ring-0 outline-none"
                    type="text"
                    defaultValue="1"
                  />
                  <button className="flex-1 h-full flex items-center justify-center hover:bg-stone-100 dark:hover:bg-stone-700 rounded-r-lg transition-colors text-stone-500">
                    <span className="material-symbols-outlined text-sm">
                      add
                    </span>
                  </button>
                </div>

                {/* Add to Cart */}
                <button className="flex-1 bg-primary hover:bg-primary/90 text-white h-12 rounded-lg font-bold text-lg shadow-lg shadow-primary/30 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 active:translate-y-0 focus:outline-[3px] focus:outline-primary/40">
                  <span className="material-symbols-outlined">
                    shopping_cart_checkout
                  </span>
                  Thêm vào giỏ hàng
                </button>
              </div>
              <button className="w-full h-12 border-2 border-primary/20 hover:border-primary text-primary font-bold rounded-lg transition-colors flex items-center justify-center gap-2 focus:outline-[3px] focus:outline-primary/40">
                Mua ngay (Thanh toán COD)
              </button>
            </div>

            {/* Trust Badges */}
            <div className="mt-8 grid grid-cols-3 gap-4 text-center">
              <div className="flex flex-col items-center gap-2 p-3 bg-stone-50 dark:bg-stone-800/50 rounded-lg">
                <span className="material-symbols-outlined text-primary">
                  local_shipping
                </span>
                <span className="text-xs font-medium text-stone-600 dark:text-stone-300">
                  Miễn phí vận chuyển
                </span>
              </div>
              <div className="flex flex-col items-center gap-2 p-3 bg-stone-50 dark:bg-stone-800/50 rounded-lg">
                <span className="material-symbols-outlined text-primary">
                  verified_user
                </span>
                <span className="text-xs font-medium text-stone-600 dark:text-stone-300">
                  Bảo hành 12 tháng
                </span>
              </div>
              <div className="flex flex-col items-center gap-2 p-3 bg-stone-50 dark:bg-stone-800/50 rounded-lg">
                <span className="material-symbols-outlined text-primary">
                  recycling
                </span>
                <span className="text-xs font-medium text-stone-600 dark:text-stone-300">
                  Đổi trả 7 ngày
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Suggestions Section */}
      <section className="mt-20 mb-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-primary to-orange-400 rounded-lg shadow-md shrink-0">
              <span className="material-symbols-outlined text-white">
                auto_awesome
              </span>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-stone-900 dark:text-white leading-none mb-1">
                AI Gợi ý cho bạn
              </h3>
              <p className="text-stone-500 dark:text-stone-400 text-sm">
                Dựa trên sở thích và xu hướng hiện tại
              </p>
            </div>
          </div>
          <Link
            href="/?category=ai-suggested"
            className="text-primary font-bold hover:underline flex items-center gap-1 self-start md:self-auto"
          >
            Xem tất cả{" "}
            <span className="material-symbols-outlined text-sm">
              arrow_forward
            </span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Suggestion Card 1 */}
          <Link
            href="/product/de-go-tu-nhien"
            className="group flex flex-col bg-white dark:bg-stone-800 rounded-xl overflow-hidden shadow-sm hover:shadow-xl hover:shadow-primary/10 transition-all border border-stone-100 dark:border-stone-700"
          >
            <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
              <div className="absolute top-3 left-3 z-10 bg-blue-500 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide shadow-sm">
                Mua cùng nhiều nhất
              </div>
              <img
                alt="Wooden base for lamp"
                className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBo0bJSEIAIiYCa6rRkwWdEH2JGPKpt4FhewKXXxjZjD1UVpJLNwDwvac_n7r7JnzvK9-9RrEUJ2EHk7P8D98Sg8EjLQdY0La6haca6eBHP14PcnLGH0o9oyVPS2BCVwCFeOZy0zdoULlXmyBlc5aZIkYVeL_Cn9Sr1wpNMpl4JW5IWARfm5h1fyg-JqYZW1v1FKPOALqiOEwwWArb3y60KraYEPl_1GpFPZAuI94JCqjKPrT5cfCphDC3Ef1pH0dabS4CDFiVlt6Xj"
              />
              <button className="absolute bottom-3 right-3 size-10 rounded-full bg-white dark:bg-stone-700 text-primary shadow-lg translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                <span className="material-symbols-outlined">
                  add_shopping_cart
                </span>
              </button>
            </div>
            <div className="p-4 flex flex-col flex-grow">
              <h4 className="font-bold text-lg text-stone-900 dark:text-white mb-1 group-hover:text-primary transition-colors line-clamp-1">
                Đế Gỗ Tự Nhiên Cao Cấp
              </h4>
              <p className="text-xs text-stone-500 dark:text-stone-400 mb-3 line-clamp-2">
                Tăng vẻ sang trọng và bảo vệ bề mặt bàn.
              </p>
              <div className="mt-auto flex items-center justify-between">
                <span className="font-bold text-stone-900 dark:text-stone-100">
                  150.000đ
                </span>
                <div className="flex items-center gap-1 text-xs text-stone-500">
                  <span className="material-symbols-outlined text-yellow-400 text-sm fill-current">
                    star
                  </span>{" "}
                  4.9
                </div>
              </div>
            </div>
          </Link>

          {/* Suggestion Card 2 */}
          <Link
            href="/product/tinh-dau-oai-huong"
            className="group flex flex-col bg-white dark:bg-stone-800 rounded-xl overflow-hidden shadow-sm hover:shadow-xl hover:shadow-primary/10 transition-all border border-stone-100 dark:border-stone-700"
          >
            <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
              <div className="absolute top-3 left-3 z-10 bg-primary text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide shadow-sm">
                Phù hợp nhất
              </div>
              <img
                alt="Essential oil bottle"
                className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuD6VoagmHqxGtwv7AtWOulMgZbqHyaqHjiowqUTi1DE_N-f_ZH8W6AOFjHibCza4-KGD0UpZvBNcgqXG8LwgJjP9ie2NXRTzgCuwF6z47gb9ySuy4Uw7dEbQpBoJm_arbsjbXTZzYp4fG4-6aba0sAT9vQI5ARWeZpsT4erVqlD2RYPlJp4IXm7X3Y2gJw2vfoBxjFFm5IlH2fCKi6Ld-TjvmZSqSaxw4SspTq5Pn8X6GKzCYqUEMStCAVrIqSGzGDfMq7_Q1asBE6G"
              />
              <button className="absolute bottom-3 right-3 size-10 rounded-full bg-white dark:bg-stone-700 text-primary shadow-lg translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                <span className="material-symbols-outlined">
                  add_shopping_cart
                </span>
              </button>
            </div>
            <div className="p-4 flex flex-col flex-grow">
              <h4 className="font-bold text-lg text-stone-900 dark:text-white mb-1 group-hover:text-primary transition-colors line-clamp-1">
                Tinh Dầu Oải Hương (Lavender)
              </h4>
              <p className="text-xs text-stone-500 dark:text-stone-400 mb-3 line-clamp-2">
                Nhỏ lên đá muối để khuếch tán hương thơm thư giãn.
              </p>
              <div className="mt-auto flex items-center justify-between">
                <span className="font-bold text-stone-900 dark:text-stone-100">
                  220.000đ
                </span>
                <div className="flex items-center gap-1 text-xs text-stone-500">
                  <span className="material-symbols-outlined text-yellow-400 text-sm fill-current">
                    star
                  </span>{" "}
                  4.8
                </div>
              </div>
            </div>
          </Link>

          {/* Suggestion Card 3 */}
          <Link
            href="/product/bo-3-den-mini"
            className="group flex flex-col bg-white dark:bg-stone-800 rounded-xl overflow-hidden shadow-sm hover:shadow-xl hover:shadow-primary/10 transition-all border border-stone-100 dark:border-stone-700"
          >
            <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
              <div className="absolute top-3 left-3 z-10 bg-green-600 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide shadow-sm">
                Combo tiết kiệm
              </div>
              <img
                alt="Set of 3 small salt lamps"
                className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDx242bRF3-KHsXNcWC93ZhkSGVT8F26-cYNEdR8iKMxPBXXwS890vFuIgYMamPlBwPWDJh8w3pknhOwJJCcEzPaaGS6cCydtgzmlfS9AuCyHdQleJWZuXUFGgQBtLluiAVSsTkTGo5fec4Kb5bSEtAaiU1pAfuHXlKy0iCgP5Ha0Mt7SxMYs9zQg37jCA6igiFxyMjI8FDV5USjs_z4YU5ldiEMwvX__UYIsx9PDz5EoMlEz39lbLf11d92MFcC6lTGXKsMZ_s-4vq"
              />
              <button className="absolute bottom-3 right-3 size-10 rounded-full bg-white dark:bg-stone-700 text-primary shadow-lg translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                <span className="material-symbols-outlined">
                  add_shopping_cart
                </span>
              </button>
            </div>
            <div className="p-4 flex flex-col flex-grow">
              <h4 className="font-bold text-lg text-stone-900 dark:text-white mb-1 group-hover:text-primary transition-colors line-clamp-1">
                Bộ 3 Đèn Đá Muối Mini
              </h4>
              <p className="text-xs text-stone-500 dark:text-stone-400 mb-3 line-clamp-2">
                Trang trí đồng bộ cho phòng khách và phòng ngủ.
              </p>
              <div className="mt-auto flex items-center justify-between">
                <span className="font-bold text-stone-900 dark:text-stone-100">
                  1.800.000đ
                </span>
                <div className="flex items-center gap-1 text-xs text-stone-500">
                  <span className="material-symbols-outlined text-yellow-400 text-sm fill-current">
                    star
                  </span>{" "}
                  5.0
                </div>
              </div>
            </div>
          </Link>
        </div>
      </section>
    </main>
  );
}
