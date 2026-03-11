"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import { orderService } from "@/services/orderService";
import type { PaymentMethod } from "@/types";

const SHIPPING_FEE = 30000;

function formatPrice(p: number) {
  return p.toLocaleString("vi-VN") + "đ";
}

export default function CheckoutPage() {
  const { items, totalPrice, clearCart, removeItem, updateQuantity } =
    useCartStore();
  const { user } = useAuthStore();

  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [address, setAddress] = useState(user?.address ?? "");
  const [note, setNote] = useState("");
  const [payment, setPayment] = useState<PaymentMethod>("cod");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [orderId, setOrderId] = useState<number | null>(null);

  const subtotal = totalPrice();
  const total = subtotal + SHIPPING_FEE;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;
    setError("");
    setLoading(true);
    try {
      const order = await orderService.createOrder({
        receiver_name: name,
        receiver_phone: phone,
        receiver_address: address,
        note,
        payment_method: payment,
        items: items.map((item) => ({
          product_id: item.productId,
          quantity: item.quantity,
        })),
      });
      clearCart();
      setOrderId(order.id);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Đặt hàng thất bại. Vui lòng thử lại.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // ── Success screen ─────────────────────────────────────────
  if (orderId !== null) {
    return (
      <main className="flex-grow container mx-auto px-4 py-16 max-w-[600px] text-center">
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-light p-12 flex flex-col items-center gap-6">
          <div className="size-20 rounded-full bg-emerald-100 flex items-center justify-center">
            <span className="material-symbols-outlined text-emerald-500 text-5xl">
              check_circle
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-neutral-dark mb-2">
              Đặt hàng thành công!
            </h1>
            <p className="text-neutral-medium text-sm">
              Cảm ơn bạn đã tin tưởng Himalayan Salt. Chúng tôi sẽ xử lý đơn
              hàng sớm nhất.
            </p>
          </div>
          <div className="bg-neutral-light/60 rounded-xl px-6 py-4 w-full">
            <p className="text-sm text-neutral-medium">Mã đơn hàng</p>
            <p className="text-xl font-bold text-primary">#{orderId}</p>
          </div>
          <div className="flex gap-3 w-full">
            <Link
              href="/account/orders"
              className="flex-1 py-3 rounded-xl border border-border-color text-sm font-bold text-neutral-dark hover:bg-neutral-light transition-colors text-center"
            >
              Xem đơn hàng
            </Link>
            <Link
              href="/"
              className="flex-1 py-3 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors text-center"
            >
              Tiếp tục mua sắm
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // ── Empty cart ─────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <main className="flex-grow container mx-auto px-4 py-16 max-w-[600px] text-center">
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-light p-12 flex flex-col items-center gap-6">
          <span className="material-symbols-outlined text-neutral-medium text-6xl">
            shopping_cart
          </span>
          <h1 className="text-2xl font-bold text-neutral-dark">
            Giỏ hàng trống
          </h1>
          <p className="text-neutral-medium text-sm">
            Hãy thêm sản phẩm vào giỏ trước khi thanh toán.
          </p>
          <Link
            href="/"
            className="px-8 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors"
          >
            Khám phá sản phẩm
          </Link>
        </div>
      </main>
    );
  }

  // ── Main checkout ──────────────────────────────────────────
  return (
    <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-[1440px]">
      <h1 className="text-3xl md:text-4xl font-extrabold text-neutral-dark mb-8">
        Giỏ hàng & Thanh toán
      </h1>
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Column: Cart Items & Shipping Form (65%) */}
          <div className="w-full lg:w-[65%] space-y-8">
            {/* Cart Items Section */}
            <section className="bg-white rounded-xl shadow-sm border border-neutral-light p-6">
              <h2 className="text-xl font-bold text-neutral-dark mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">
                  shopping_bag
                </span>
                Sản phẩm trong giỏ
              </h2>
              <div className="space-y-6">
                {items.map((item) => (
                  <div
                    key={item.productId}
                    className="flex flex-col sm:flex-row gap-4 py-4 border-b border-neutral-light last:border-0 last:pb-0"
                  >
                    <div className="shrink-0">
                      <img
                        alt={item.name}
                        className="size-24 rounded-lg object-cover bg-neutral-light"
                        src={item.image}
                      />
                    </div>
                    <div className="flex flex-1 flex-col justify-between">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-semibold text-neutral-dark">
                            {item.name}
                          </h3>
                        </div>
                        <button
                          type="button"
                          className="text-red-500 hover:text-red-600 transition-colors p-1 rounded-md hover:bg-red-50"
                          title="Xóa"
                          onClick={() => removeItem(item.productId)}
                        >
                          <span className="material-symbols-outlined text-[20px]">
                            delete
                          </span>
                        </button>
                      </div>
                      <div className="flex justify-between items-end mt-4 sm:mt-0">
                        <div className="flex items-center border border-neutral-light rounded-lg">
                          <button
                            type="button"
                            className="px-3 py-1 hover:bg-neutral-light text-neutral-dark rounded-l-lg transition-colors"
                            onClick={() =>
                              updateQuantity(item.productId, item.quantity - 1)
                            }
                          >
                            -
                          </button>
                          <span className="px-2 py-1 text-sm font-medium text-neutral-dark w-8 text-center">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            className="px-3 py-1 hover:bg-neutral-light text-neutral-dark rounded-r-lg transition-colors"
                            onClick={() =>
                              updateQuantity(item.productId, item.quantity + 1)
                            }
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
                ))}
              </div>
            </section>

            {/* Shipping Form Section */}
            <section className="bg-white rounded-xl shadow-sm border border-neutral-light p-6">
              <h2 className="text-xl font-bold text-neutral-dark mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">
                  local_shipping
                </span>
                Thông tin giao hàng
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-neutral-medium mb-2">
                    Họ và tên
                  </label>
                  <input
                    required
                    className="w-full rounded-lg border-neutral-light bg-background-light text-neutral-dark focus:border-primary focus:ring-primary placeholder-neutral-medium/50 outline-none p-3"
                    placeholder="Nguyễn Văn A"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-neutral-medium mb-2">
                    Số điện thoại
                  </label>
                  <input
                    required
                    className="w-full rounded-lg border-neutral-light bg-background-light text-neutral-dark focus:border-primary focus:ring-primary placeholder-neutral-medium/50 outline-none p-3"
                    placeholder="0912 xxx xxx"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-neutral-medium mb-2">
                    Địa chỉ chi tiết
                  </label>
                  <textarea
                    required
                    className="w-full rounded-lg border-neutral-light bg-background-light text-neutral-dark focus:border-primary focus:ring-primary placeholder-neutral-medium/50 outline-none p-3"
                    placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố"
                    rows={3}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  ></textarea>
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-neutral-medium mb-2">
                    Ghi chú (tuỳ chọn)
                  </label>
                  <textarea
                    className="w-full rounded-lg border-neutral-light bg-background-light text-neutral-dark focus:border-primary focus:ring-primary placeholder-neutral-medium/50 outline-none p-3"
                    placeholder="Ghi chú thêm cho đơn hàng..."
                    rows={2}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  ></textarea>
                </div>
              </div>
            </section>

            {/* Payment Methods Section */}
            <section className="bg-white rounded-xl shadow-sm border border-neutral-light p-6">
              <h2 className="text-xl font-bold text-neutral-dark mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">
                  payments
                </span>
                Phương thức thanh toán
              </h2>
              <div className="space-y-3">
                <label className="relative flex items-center p-4 rounded-xl border border-neutral-light cursor-pointer hover:bg-neutral-light/30 transition-colors group has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                  <input
                    className="size-5 border-neutral-light text-primary focus:ring-primary cursor-pointer"
                    name="payment"
                    type="radio"
                    value="cod"
                    checked={payment === "cod"}
                    onChange={() => setPayment("cod")}
                  />
                  <span className="ml-3 flex items-center gap-3">
                    <span className="material-symbols-outlined text-neutral-medium group-has-[:checked]:text-primary">
                      local_atm
                    </span>
                    <span className="font-medium text-neutral-dark">
                      Thanh toán khi nhận hàng (COD)
                    </span>
                  </span>
                </label>

                <label className="relative flex items-center p-4 rounded-xl border border-neutral-light cursor-pointer hover:bg-neutral-light/30 transition-colors group has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                  <input
                    className="size-5 border-neutral-light text-primary focus:ring-primary cursor-pointer"
                    name="payment"
                    type="radio"
                    value="bank_transfer"
                    checked={payment === "bank_transfer"}
                    onChange={() => setPayment("bank_transfer")}
                  />
                  <span className="ml-3 flex items-center gap-3">
                    <span className="material-symbols-outlined text-neutral-medium group-has-[:checked]:text-primary">
                      account_balance
                    </span>
                    <span className="font-medium text-neutral-dark">
                      Chuyển khoản ngân hàng
                    </span>
                  </span>
                </label>
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
                    {formatPrice(subtotal)}
                  </span>
                </div>
                <div className="flex justify-between text-neutral-medium">
                  <span>Phí vận chuyển</span>
                  <span className="font-medium text-neutral-dark">
                    {formatPrice(SHIPPING_FEE)}
                  </span>
                </div>
              </div>

              <div className="border-t border-neutral-light pt-4 mb-6">
                <div className="flex justify-between items-end">
                  <span className="text-lg font-bold text-neutral-dark">
                    Tổng cộng
                  </span>
                  <span className="text-2xl font-extrabold text-primary">
                    {formatPrice(total)}
                  </span>
                </div>
                <p className="text-xs text-neutral-medium text-right mt-1">
                  (Đã bao gồm VAT)
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90 disabled:opacity-60 text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/30 transition-all transform active:scale-[0.98] flex justify-center items-center gap-2 group outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                {loading ? "Đang xử lý..." : "Đặt hàng ngay"}
                {!loading && (
                  <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">
                    arrow_forward
                  </span>
                )}
              </button>
              <p className="text-center text-xs text-neutral-medium mt-4 flex items-center justify-center gap-1">
                <span className="material-symbols-outlined text-[14px]">
                  lock
                </span>
                Thanh toán bảo mật SSL 256-bit
              </p>
            </div>
          </div>
        </div>
      </form>
    </main>
  );
}
