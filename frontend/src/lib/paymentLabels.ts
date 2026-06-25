import type { PaymentMethod } from "@/types";

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  cod: "Thanh toán khi nhận hàng (COD)",
  bank_transfer: "VNPay (chuyển khoản)",
  vnpay: "VNPay",
  momo: "MoMo (thẻ/ATM - nhập TK)",
};

export function isOnlinePayment(method: PaymentMethod | string): boolean {
  return method === "bank_transfer" || method === "vnpay" || method === "momo";
}

export function onlinePaymentLabel(method: PaymentMethod | string): string {
  if (method === "momo") return "MoMo";
  return "VNPay";
}
