"use client";

import React, { useState } from "react";

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Chatbot Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 bg-primary text-white rounded-full shadow-lg hover:scale-105 transition-transform flex items-center justify-center animate-bounce-slow"
        >
          <span className="material-symbols-outlined text-3xl">smart_toy</span>
        </button>
      )}

      {/* Chatbot Window */}
      {isOpen && (
        <div className="w-[350px] sm:w-[400px] h-[600px] max-h-[85vh] flex flex-col bg-white shadow-2xl rounded-2xl overflow-hidden border border-slate-100 relative animate-fade-in-up origin-bottom-right">
          {/* Header */}
          <header className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-primary/10 to-primary/5 border-b border-primary/10">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm border border-primary/10">
                  <span className="material-symbols-outlined text-primary text-2xl">
                    smart_toy
                  </span>
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></span>
              </div>
              <div>
                <h3 className="text-slate-900 text-base font-bold leading-tight">
                  Trợ lý Đá Muối
                </h3>
                <span className="text-primary/70 text-xs font-medium flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-primary inline-block"></span>
                  Đang hoạt động
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-900 transition-colors p-1 rounded-full hover:bg-black/5"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </header>

          {/* Chat Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 scrollbar-hide">
            {/* Date Separator */}
            <div className="flex justify-center">
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider bg-black/5 px-3 py-1 rounded-full">
                Hôm nay
              </span>
            </div>

            {/* AI Message (Welcome) */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0 text-primary">
                <span className="material-symbols-outlined text-lg">
                  smart_toy
                </span>
              </div>
              <div className="flex flex-col gap-1 max-w-[85%]">
                <span className="text-[11px] text-slate-500 ml-1">
                  Trợ lý AI
                </span>
                <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm text-slate-800 text-sm leading-relaxed border border-slate-100">
                  Chào bạn! Tôi có thể giúp gì cho sức khỏe và không gian sống
                  của bạn hôm nay?
                </div>
              </div>
            </div>

            {/* User Message */}
            <div className="flex items-end gap-3 justify-end">
              <div className="flex flex-col gap-1 items-end max-w-[85%]">
                <div className="bg-primary text-white p-3 rounded-2xl rounded-tr-none shadow-md text-sm leading-relaxed">
                  Tôi bị mất ngủ, bạn có gợi ý gì không?
                </div>
                <span className="text-[10px] text-slate-500 mr-1">Đã xem</span>
              </div>
            </div>

            {/* AI Response + Product Card */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0 text-primary">
                <span className="material-symbols-outlined text-lg">
                  smart_toy
                </span>
              </div>
              <div className="flex flex-col gap-2 max-w-[85%]">
                <span className="text-[11px] text-slate-500 ml-1">
                  Trợ lý AI
                </span>
                {/* Text Response */}
                <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm text-slate-800 text-sm leading-relaxed border border-slate-100">
                  Đối với chứng mất ngủ, ánh sáng dịu nhẹ màu cam từ đá muối
                  Himalaya tự nhiên giúp thư giãn thần kinh rất tốt. Đây là mẫu
                  đèn phù hợp nhất dành cho bạn:
                </div>
                {/* Mini Product Card */}
                <div className="bg-white p-2.5 rounded-xl shadow-sm border border-slate-100 w-full overflow-hidden hover:shadow-md transition-shadow">
                  <div className="flex gap-3">
                    <div className="w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-slate-100">
                      <img
                        alt="Himalayan Salt Lamp Sphere"
                        className="w-full h-full object-cover"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuA-kWzavB2atFaC36ImUKSODsg_GAYjCjNxTvuJuYxhptyoRNkbEkQO72IEe_LDLdHglVabDyPLRjE9JZZ8ZmM5u9tohSojlwMnprIabJop70b8V7FNzJXnONWbROEMSkdhN0khAkuzLK6gbjqiHNI0DLWC39B3BW5iLXl9Uv6RHH4t5jsNGmBQIoL0suZhbgDm-_kKnV-01JTAHKu1p0b7p3Bmo6Lch0L8P4-JpGxxWkP0NLcyk22Gn25FCghhQgpBS61Aii2UPcEq"
                      />
                    </div>
                    <div className="flex flex-col justify-between flex-1 py-0.5">
                      <div>
                        <h4 className="text-slate-900 font-bold text-sm line-clamp-1">
                          Đèn đá muối cầu
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                          Thư giãn, lọc không khí.
                        </p>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-primary font-bold text-xs">
                          450.000đ
                        </span>
                        <button
                          className="text-primary hover:bg-primary/10 p-1 rounded transition-colors"
                          title="Thêm vào giỏ hàng"
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            add_shopping_cart
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white border-t border-slate-100">
            {/* Quick Suggestions */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide shrink-0">
              <button className="shrink-0 px-3 py-1.5 rounded-full border border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary text-xs font-medium transition-colors">
                Đèn cho phòng khách
              </button>
              <button className="shrink-0 px-3 py-1.5 rounded-full border border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary text-xs font-medium transition-colors">
                Công dụng đá muối?
              </button>
            </div>

            {/* Input Form */}
            <div className="flex items-end gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all shadow-inner">
              <button className="p-1.5 text-slate-400 hover:text-primary transition-colors rounded-lg">
                <span className="material-symbols-outlined text-[20px]">
                  attach_file
                </span>
              </button>
              <textarea
                className="w-full bg-transparent border-0 focus:ring-0 p-1.5 text-sm text-slate-900 outline-none placeholder-slate-400 resize-none max-h-20 overflow-y-auto"
                placeholder="Hỏi tôi bất cứ điều gì..."
                rows={1}
                style={{ minHeight: "36px" }}
              ></textarea>
              <button className="p-2 bg-primary hover:bg-orange-600 text-white rounded-lg shadow-sm transition-all active:scale-95 flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">
                  send
                </span>
              </button>
            </div>
            <div className="text-center mt-2">
              <span className="text-[10px] text-slate-400">
                Được hỗ trợ bởi AI Chatbot
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
