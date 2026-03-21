"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCartStore } from "@/store/cartStore";
import { getAbsoluteImageUrl } from "@/lib/imageUrl";

export default function CartPage() {
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const cartTotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items],
  );

  if (!mounted) {
    return null; // Prevent hydration mismatch
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

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
              {items.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-neutral-medium mb-4">
                    Giỏ hàng của bạn đang trống.
                  </p>
                </div>
              ) : (
                items.map((item) => (
                  <div
                    key={item.productId}
                    className="flex flex-col sm:flex-row gap-4 py-4 border-b border-neutral-light last:border-0 last:pb-0"
                  >
                    <div className="shrink-0 relative size-24">
                      <Image
                        alt={item.name}
                        className="rounded-lg object-cover bg-neutral-light"
                        src={getAbsoluteImageUrl(item.image)}
                        fill
                        sizes="96px"
                        unoptimized
                        onError={(e) => {
                          console.error(
                            `Failed to load image for ${item.name}:`,
                            getAbsoluteImageUrl(item.image),
                          );
                          // Fallback to placeholder
                          (e.target as HTMLImageElement).src =
                            "/placeholder-product.svg";
                        }}
                      />
                    </div>
                    <div className="flex flex-1 flex-col justify-between">
                      <div className="flex justify-between items-start">
                        <div>
                          <Link href={`/product/${item.slug}`}>
                            <h3 className="text-lg hover:text-primary transition-colors font-semibold text-neutral-dark">
                              {item.name}
                            </h3>
                          </Link>
                        </div>
                        <button
                          onClick={() => removeItem(item.productId)}
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
                          <button
                            onClick={() =>
                              updateQuantity(item.productId, item.quantity - 1)
                            }
                            className="px-3 py-1 hover:bg-neutral-light text-neutral-dark rounded-l-lg transition-colors"
                          >
                            -
                          </button>
                          <span className="px-2 py-1 text-sm font-medium text-neutral-dark w-8 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(item.productId, item.quantity + 1)
                            }
                            className="px-3 py-1 hover:bg-neutral-light text-neutral-dark rounded-r-lg transition-colors"
                          >
                            +
                          </button>
                        </div>
                        <p className="font-bold text-lg text-primary">
                          {formatPrice(item.price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
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
                <span className="font-medium text-neutral-dark">
                  {formatPrice(cartTotal)}
                </span>
              </div>
            </div>

            <div className="border-t border-neutral-light pt-4 mb-6">
              <div className="flex justify-between items-end">
                <span className="text-lg font-bold text-neutral-dark">
                  Tổng cộng
                </span>
                <span className="text-2xl font-extrabold text-primary">
                  {formatPrice(cartTotal)}
                </span>
              </div>
              <p className="text-xs text-neutral-medium text-right mt-1">
                (Chưa bao gồm phí vận chuyển)
              </p>
            </div>

            <Link
              href="/checkout"
              className={`w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/30 transition-all flex justify-center items-center gap-2 group ${items.length === 0 ? "opacity-50 pointer-events-none" : "transform active:scale-[0.98]"}`}
              onClick={(e) => {
                if (items.length === 0) e.preventDefault();
              }}
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
