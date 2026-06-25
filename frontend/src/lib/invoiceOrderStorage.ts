import type { Order } from "@/types";

const PREFIX = "invoice_order_";

export function invoiceStorageKey(orderId: number): string {
  return `${PREFIX}${orderId}`;
}

export function saveOrderForInvoice(order: Order): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(
      invoiceStorageKey(order.id),
      JSON.stringify(order),
    );
  } catch {
    // sessionStorage full or unavailable
  }
}

export function loadOrderForInvoice(orderId: number): Order | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(invoiceStorageKey(orderId));
    if (!raw) return null;
    return JSON.parse(raw) as Order;
  } catch {
    return null;
  }
}
