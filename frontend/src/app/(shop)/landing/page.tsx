"use client";

import React from "react";
import Hero from "@/components/landing/Hero";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-black text-white selection:bg-orange-500 selection:text-white">
      {/* Immersive Hero Section */}
      <Hero />

      {/* Additional Sections can be added here later */}
      <section className="py-24 px-6 bg-gradient-to-b from-black to-[#0a0a0a]">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            <div className="p-8 rounded-[40px] bg-white/5 border border-white/10 hover:border-orange-500/30 transition-all group">
              <div className="w-16 h-16 bg-orange-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <span className="text-3xl">✨</span>
              </div>
              <h3 className="text-xl font-bold mb-4 text-white">Năng Lượng Tinh Khiết</h3>
              <p className="text-neutral-400 font-light leading-relaxed">
                Đá muối Himalaya giải phóng ion âm, giúp cân bằng điện từ trường trong không gian sống của bạn.
              </p>
            </div>

            <div className="p-8 rounded-[40px] bg-white/5 border border-white/10 hover:border-orange-500/30 transition-all group">
              <div className="w-16 h-16 bg-orange-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <span className="text-3xl">🌿</span>
              </div>
              <h3 className="text-xl font-bold mb-4 text-white">Thanh Lọc Không Khí</h3>
              <p className="text-neutral-400 font-light leading-relaxed">
                Hấp thụ độ ẩm và các hạt bụi mịn, mang lại bầu không khí trong lành, dễ chịu hơn mỗi ngày.
              </p>
            </div>

            <div className="p-8 rounded-[40px] bg-white/5 border border-white/10 hover:border-orange-500/30 transition-all group">
              <div className="w-16 h-16 bg-orange-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <span className="text-3xl">😴</span>
              </div>
              <h3 className="text-xl font-bold mb-4 text-white">Giấc Ngủ Sâu</h3>
              <p className="text-neutral-400 font-light leading-relaxed">
                Ánh sáng hổ phách ấm áp kích thích sản sinh melatonin, giúp bạn dễ dàng đi vào giấc ngủ ngon.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer-like simple banner */}
      <section className="py-20 border-t border-white/5 text-center">
        <p className="text-neutral-500 text-sm tracking-widest uppercase">
          © 2026 Himalayan Salt Lamp Premium Collection
        </p>
      </section>
    </main>
  );
}
