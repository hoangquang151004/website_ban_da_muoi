"use client";

import React, { useMemo, useState } from "react";
import { getAbsoluteImageUrl } from "@/lib/imageUrl";
import type {
  ChatCheckoutItem,
  CheckoutSubmitPayload,
  PaymentMethod,
} from "@/types";

type CheckoutPanelProps = {
  cartItems: ChatCheckoutItem[];
  isSubmitting?: boolean;
  onSubmit: (payload: CheckoutSubmitPayload) => Promise<void>;
  onBackToShopping?: () => void;
  defaultName?: string | null;
  defaultPhone?: string | null;
  defaultAddress?: string | null;
};

const SHIPPING_FEE = 30000;

function formatPrice(value: number) {
  return Number(value).toLocaleString("vi-VN") + "đ";
}

function isValidPhone(value: string) {
  return /^(\+?84|0)\d{9,10}$/.test(value.trim());
}

function normalizeTextValue(value?: string | null): string {
  return typeof value === "string" ? value : "";
}

export default function CheckoutPanel({
  cartItems,
  isSubmitting = false,
  onSubmit,
  onBackToShopping,
  defaultName,
  defaultPhone,
  defaultAddress,
}: CheckoutPanelProps) {
  const [receiverName, setReceiverName] = useState(
    normalizeTextValue(defaultName),
  );
  const [receiverPhone, setReceiverPhone] = useState(
    normalizeTextValue(defaultPhone),
  );
  const [receiverAddress, setReceiverAddress] = useState(
    normalizeTextValue(defaultAddress),
  );
  const [note, setNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");
  const [error, setError] = useState("");

  const validItems = useMemo(
    () =>
      cartItems.filter(
        (item) =>
          item.product_id > 0 &&
          Number(item.quantity) > 0 &&
          Number(item.unit_price) >= 0,
      ),
    [cartItems],
  );

  const subtotal = useMemo(
    () =>
      validItems.reduce(
        (sum, item) => sum + Number(item.unit_price) * Number(item.quantity),
        0,
      ),
    [validItems],
  );

  const total = subtotal + SHIPPING_FEE;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !receiverName.trim() ||
      !receiverPhone.trim() ||
      !receiverAddress.trim()
    ) {
      setError("Vui lòng điền đầy đủ họ tên, số điện thoại và địa chỉ.");
      return;
    }

    if (!isValidPhone(receiverPhone)) {
      setError("Số điện thoại không hợp lệ.");
      return;
    }

    if (validItems.length === 0) {
      setError("Giỏ hàng không có sản phẩm hợp lệ để thanh toán.");
      return;
    }

    setError("");

    await onSubmit({
      receiver_name: receiverName.trim(),
      receiver_phone: receiverPhone.trim(),
      receiver_address: receiverAddress.trim(),
      note: note.trim() || undefined,
      payment_method: paymentMethod,
      items: validItems.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
      })),
    });
  };

  if (validItems.length === 0) {
    return (
      <div className="mt-2 rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-500 space-y-3">
        <p>
          Chưa có sản phẩm hợp lệ để checkout. Vui lòng thêm sản phẩm trước khi
          thanh toán.
        </p>
        <button
          type="button"
          onClick={onBackToShopping}
          className="w-full rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/10 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!onBackToShopping || isSubmitting}
        >
          Quay lại mua hàng
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-2 w-full max-w-105 rounded-xl border border-slate-200 bg-white shadow-sm"
    >
      <div className="max-h-105 overflow-y-auto p-3 space-y-4">
        <section>
          <h4 className="text-xs font-bold text-slate-700 mb-2">Sản phẩm</h4>
          <div className="space-y-2">
            {validItems.map((item) => (
              <div
                key={`${item.product_id}-${item.product_slug}`}
                className="flex items-center gap-2 rounded-lg border border-slate-100 p-2"
              >
                <div className="size-12 overflow-hidden rounded-md bg-slate-100 shrink-0">
                  {item.image_url ? (
                    <img
                      src={getAbsoluteImageUrl(item.image_url)}
                      alt={item.product_name}
                      className="size-full object-cover"
                    />
                  ) : (
                    <div className="size-full flex items-center justify-center text-[10px] text-slate-400">
                      N/A
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-800 truncate">
                    {item.product_name}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {formatPrice(item.unit_price)} x {item.quantity}
                  </p>
                </div>
                <p className="text-xs font-bold text-primary whitespace-nowrap">
                  {formatPrice(item.subtotal)}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-2">
          <h4 className="text-xs font-bold text-slate-700">
            Thông tin nhận hàng
          </h4>
          <input
            value={receiverName}
            onChange={(e) => setReceiverName(e.target.value)}
            disabled={isSubmitting}
            placeholder="Họ và tên"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-primary"
          />
          <input
            value={receiverPhone}
            onChange={(e) => setReceiverPhone(e.target.value)}
            disabled={isSubmitting}
            placeholder="Số điện thoại"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-primary"
          />
          <textarea
            value={receiverAddress}
            onChange={(e) => setReceiverAddress(e.target.value)}
            disabled={isSubmitting}
            placeholder="Địa chỉ giao hàng"
            rows={2}
            className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-primary"
          />
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            disabled={isSubmitting}
            placeholder="Ghi chú (không bắt buộc)"
            rows={2}
            className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-primary"
          />
        </section>

        <section>
          <h4 className="text-xs font-bold text-slate-700 mb-2">
            Phương thức thanh toán
          </h4>
          <div className="space-y-2 text-xs text-slate-700">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="payment_method"
                value="cod"
                checked={paymentMethod === "cod"}
                onChange={() => setPaymentMethod("cod")}
                disabled={isSubmitting}
              />
              Thanh toán khi nhận hàng (COD)
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="payment_method"
                value="bank_transfer"
                checked={paymentMethod === "bank_transfer"}
                onChange={() => setPaymentMethod("bank_transfer")}
                disabled={isSubmitting}
              />
              Chuyển khoản ngân hàng
            </label>
          </div>
        </section>

        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
            {error}
          </p>
        )}
      </div>

      <div className="sticky bottom-0 border-t border-slate-200 bg-white p-3 space-y-1">
        <div className="flex items-center justify-between text-xs text-slate-600">
          <span>Tạm tính</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        <div className="flex items-center justify-between text-xs text-slate-600">
          <span>Phí vận chuyển</span>
          <span>{formatPrice(SHIPPING_FEE)}</span>
        </div>
        <div className="flex items-center justify-between text-sm font-bold text-slate-900">
          <span>Tổng cộng</span>
          <span className="text-primary">{formatPrice(total)}</span>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 w-full rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isSubmitting ? "Đang xử lý..." : "Xác nhận đặt hàng"}
        </button>
      </div>
    </form>
  );
}
