"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import toast from "react-hot-toast";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import { getAbsoluteImageUrl } from "@/lib/imageUrl";
import {
  PAYMENT_METHOD_LABEL,
  isOnlinePayment,
  onlinePaymentLabel,
} from "@/lib/paymentLabels";
import { saveOrderForInvoice } from "@/lib/invoiceOrderStorage";
import {
  CHAT_STREAM_ENABLED,
  chatService,
} from "@/services/chatService";
import { orderService } from "@/services/orderService";
import CheckoutPanel from "@/components/shop/CheckoutPanel";
import type {
  ChatApiResponse,
  ChatCheckoutItem,
  ChatOrderDetail,
  ChatMessage,
  ChatOrderSummary,
  ChatProductCard,
  ChatStatsData,
  ChatStatsMeta,
  CheckoutSubmitPayload,
} from "@/types";

const QUICK_SUGGESTIONS = [
  "Đèn cho phòng khách",
  "Công dụng đá muối?",
  "Gợi ý đèn cho người mất ngủ",
  "Chính sách bảo hành thế nào?",
];

const ADMIN_STATS_SUGGESTIONS = [
  "Doanh thu tháng này",
  "Top sản phẩm bán chạy",
  "Tỷ lệ trạng thái đơn",
  "Báo cáo doanh thu theo danh mục",
  "Còn tuần trước thì sao?",
  "Top 10 sản phẩm",
];

const CART_VIEW_KEYWORDS = [
  "xem giỏ hàng",
  "mở giỏ hàng",
  "giỏ hàng của tôi",
  "xem cart",
  "mo gio hang",
  "xem gio hang",
];

const CART_REMOVE_KEYWORDS = [
  "xóa khỏi giỏ",
  "xóa khỏi giỏ hàng",
  "xóa sản phẩm",
  "bo khoi gio",
  "bỏ khỏi giỏ",
  "remove from cart",
  "remove khỏi giỏ",
];

const CHAT_SESSION_ID_KEY = "himalayan-chat-session-id";
const CHAT_MESSAGES_KEY = "himalayan-chat-messages";

const CHAT_WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "bot",
  content:
    "Chào ban! Tôi có thể giúp gì cho sức khỏe và không gian sống của bạn hôm nay?",
  response_type: "text",
  timestamp: Date.now(),
};

function loadChatSessionId(): string {
  if (typeof window === "undefined") return crypto.randomUUID();
  const stored = sessionStorage.getItem(CHAT_SESSION_ID_KEY);
  if (stored) return stored;
  const id = crypto.randomUUID();
  sessionStorage.setItem(CHAT_SESSION_ID_KEY, id);
  return id;
}

function loadChatMessages(): ChatMessage[] {
  if (typeof window === "undefined") return [CHAT_WELCOME_MESSAGE];
  try {
    const raw = sessionStorage.getItem(CHAT_MESSAGES_KEY);
    if (!raw) return [CHAT_WELCOME_MESSAGE];
    const parsed = JSON.parse(raw) as ChatMessage[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return [CHAT_WELCOME_MESSAGE];
    }
    return parsed;
  } catch {
    return [CHAT_WELCOME_MESSAGE];
  }
}

function persistChatSession(sessionId: string, messages: ChatMessage[]) {
  if (typeof window === "undefined") return;
  const toSave = messages.filter((m) => !m.isLoading);
  sessionStorage.setItem(CHAT_SESSION_ID_KEY, sessionId);
  sessionStorage.setItem(CHAT_MESSAGES_KEY, JSON.stringify(toSave));
}

function formatVnd(value: number) {
  return Number(value).toLocaleString("vi-VN") + "đ";
}

function formatDate(dateString?: string) {
  if (!dateString) return "--/--/----";
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return "--/--/----";
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

function formatCurrency(amount: number | string) {
  return new Intl.NumberFormat("vi-VN").format(Number(amount)) + "₫";
}

const ORDER_STATUS_META: Record<string, { label: string; className: string }> =
  {
    pending: {
      label: "Chờ xác nhận",
      className: "bg-amber-100 text-amber-700 border-amber-200",
    },
    confirmed: {
      label: "Đã xác nhận",
      className: "bg-sky-100 text-sky-700 border-sky-200",
    },
    packing: {
      label: "Đang chuẩn bị",
      className: "bg-indigo-100 text-indigo-700 border-indigo-200",
    },
    shipping: {
      label: "Đang giao",
      className: "bg-blue-100 text-blue-700 border-blue-200",
    },
    delivered: {
      label: "Đã giao",
      className: "bg-emerald-100 text-emerald-700 border-emerald-200",
    },
    cancelled: {
      label: "Đã hủy",
      className: "bg-rose-100 text-rose-700 border-rose-200",
    },
  };

const ORDER_FILTERS: Array<{
  key: "all" | "pending" | "shipping" | "delivered";
  label: string;
}> = [
  {
    key: "all",
    label: "Tất cả",
  },
  {
    key: "pending",
    label: "Chờ xác nhận",
  },
  {
    key: "shipping",
    label: "Đang giao",
  },
  {
    key: "delivered",
    label: "Đã giao",
  },
];

function OrderListPanel({
  orders,
  onOpenOrder,
}: {
  orders?: ChatOrderSummary[];
  onOpenOrder: (orderId: number) => void;
}) {
  const PAGE_SIZE = 3;
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState<number>(1);

  const filteredOrders = useMemo(() => {
    const source = Array.isArray(orders) ? orders : [];
    if (activeFilter === "all") return source;
    return source.filter(
      (order) => String(order.status || "").toLowerCase() === activeFilter,
    );
  }, [orders, activeFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));
  const effectivePage = Math.min(currentPage, totalPages);

  const paginatedOrders = useMemo(() => {
    const start = (effectivePage - 1) * PAGE_SIZE;
    return filteredOrders.slice(start, start + PAGE_SIZE);
  }, [effectivePage, filteredOrders]);

  const handleFilterClick = useCallback((filterKey: string) => {
    setActiveFilter(filterKey);
    setCurrentPage(1);
  }, []);

  const handlePageMove = useCallback(
    (delta: -1 | 1) => {
      const nextPage = Math.min(totalPages, Math.max(1, effectivePage + delta));
      if (nextPage === effectivePage) return;
      setCurrentPage(nextPage);
    },
    [effectivePage, totalPages],
  );

  return (
    <div className="mt-1 space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {ORDER_FILTERS.map((filter) => {
          const isActive = activeFilter === filter.key;
          return (
            <button
              key={filter.key}
              onClick={() => handleFilterClick(filter.key)}
              className={`rounded-full border px-2 py-1 text-[11px] font-medium ${
                isActive
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-slate-200 text-slate-600 hover:border-primary/40"
              }`}
            >
              {filter.label}
            </button>
          );
        })}
      </div>

      <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
        {paginatedOrders.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-500">
            {activeFilter === "all"
              ? "Bạn chưa có đơn hàng nào."
              : "Không có đơn hàng phù hợp với bộ lọc này."}
          </div>
        ) : (
          paginatedOrders.map((order) => {
            const statusKey = String(order.status || "").toLowerCase();
            const statusMeta = ORDER_STATUS_META[statusKey] ?? {
              label: order.status,
              className: "bg-slate-100 text-slate-700 border-slate-200",
            };
            const headline =
              order.first_item_name ||
              (order.items_count && order.items_count > 1
                ? `${order.items_count} sản phẩm`
                : `Đơn hàng #${order.id}`);

            return (
              <div
                key={order.id}
                className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900">
                      #ORD-{String(order.id).padStart(4, "0")}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {formatDate(order.created_at)}
                    </p>
                  </div>
                  <span
                    className={`inline-flex shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusMeta.className}`}
                  >
                    {statusMeta.label}
                  </span>
                </div>

                <div className="mb-3 flex items-center gap-2">
                  {order.first_item_image_url ? (
                    <img
                      src={getAbsoluteImageUrl(order.first_item_image_url)}
                      alt={headline}
                      className="h-9 w-9 shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-300">
                      <span className="material-symbols-outlined text-[16px]">
                        inventory_2
                      </span>
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-slate-700">
                      {headline}
                    </p>
                    {order.items_count && order.items_count > 1 ? (
                      <p className="text-[11px] text-slate-500">
                        +{order.items_count - 1} sản phẩm khác
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-2">
                  <p className="text-sm font-extrabold text-primary">
                    {formatCurrency(order.total_amount)}
                  </p>
                  <button
                    onClick={() => onOpenOrder(order.id)}
                    className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:border-primary hover:text-primary"
                  >
                    Xem chi tiết
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="flex items-center justify-between gap-2 pt-1">
        <button
          onClick={() => handlePageMove(-1)}
          disabled={effectivePage <= 1}
          className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          Trang trước
        </button>
        <span className="text-[11px] text-slate-500">
          Trang {effectivePage}/{totalPages}
        </span>
        <button
          onClick={() => handlePageMove(1)}
          disabled={effectivePage >= totalPages}
          className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          Trang sau
        </button>
      </div>

      <p className="text-[10px] text-slate-400">
        Filter và phân trang hiện đang chạy cục bộ trong panel, không gửi thêm
        request về backend.
      </p>
    </div>
  );
}

function OrderDetailPanel({
  order,
  onReorder,
  onViewOrderPage,
  onRetryPayment,
}: {
  order?: ChatOrderDetail;
  onReorder: (order: ChatOrderDetail) => void;
  onViewOrderPage: (orderId: number) => void;
  onRetryPayment: (order: ChatOrderDetail) => void;
}) {
  if (!order) {
    return (
      <div className="mt-1 rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-500">
        Không tìm thấy chi tiết đơn hàng. Bạn thử lại với mã đơn khác nhé.
      </div>
    );
  }

  const statusKey = String(order.status || "").toLowerCase();
  const statusMeta = ORDER_STATUS_META[statusKey] ?? {
    label: order.status,
    className: "bg-slate-100 text-slate-700 border-slate-200",
  };

  const paymentMethodLabel =
    PAYMENT_METHOD_LABEL[
      order.payment_method as keyof typeof PAYMENT_METHOD_LABEL
    ] ?? order.payment_method;

  const canRetryPayment =
    isOnlinePayment(order.payment_method) &&
    String(order.status).toLowerCase() === "pending";

  return (
    <div className="mt-1 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-slate-900">
            Đơn #ORD-{String(order.id).padStart(4, "0")}
          </p>
          <p className="text-[11px] text-slate-500">
            Ngày tạo: {formatDate(order.created_at)}
          </p>
        </div>
        <span
          className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusMeta.className}`}
        >
          {statusMeta.label}
        </span>
      </div>

      <section className="mb-3 rounded-lg border border-slate-100 bg-slate-50/70 p-2.5">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          Thông tin giao hàng
        </p>
        <div className="space-y-1 text-xs text-slate-700">
          <p>
            <span className="font-semibold">Người nhận:</span>{" "}
            {order.receiver_name}
          </p>
          <p>
            <span className="font-semibold">SĐT:</span> {order.receiver_phone}
          </p>
          <p>
            <span className="font-semibold">Địa chỉ:</span>{" "}
            {order.receiver_address}
          </p>
          <p>
            <span className="font-semibold">Thanh toán:</span>{" "}
            {paymentMethodLabel}
          </p>
          {order.note ? (
            <p>
              <span className="font-semibold">Ghi chú:</span> {order.note}
            </p>
          ) : null}
        </div>
      </section>

      <section className="mb-3">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          Sản phẩm
        </p>
        <div className="max-h-52 divide-y divide-slate-100 overflow-y-auto rounded-lg border border-slate-100 bg-white">
          {order.items.map((item, index) => {
            const itemName = item.product_name ?? `Sản phẩm #${index + 1}`;
            return (
              <div key={`${itemName}-${index}`} className="flex gap-2.5 p-2.5">
                {item.image_url ? (
                  <img
                    src={getAbsoluteImageUrl(item.image_url)}
                    alt={itemName}
                    className="h-10 w-10 shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-300">
                    <span className="material-symbols-outlined text-[16px]">
                      inventory_2
                    </span>
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-slate-800">
                    {itemName}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {item.quantity} x {formatCurrency(item.unit_price)}
                  </p>
                </div>

                <p className="text-xs font-bold text-slate-800">
                  {formatCurrency(item.subtotal)}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mb-3 rounded-lg border border-slate-100 bg-slate-50/70 p-2.5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-slate-600">Tổng cộng</p>
          <p className="text-base font-extrabold text-primary">
            {formatCurrency(order.total_amount)}
          </p>
        </div>
      </section>

      <div className="flex gap-2">
        <button
          onClick={() => onReorder(order)}
          className="flex-1 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-orange-600"
        >
          Mua lại
        </button>
        {canRetryPayment && (
          <button
            onClick={() => onRetryPayment(order)}
            className="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
          >
            Thanh toán lại
          </button>
        )}
        <button
          onClick={() => onViewOrderPage(order.id)}
          className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-primary hover:text-primary"
        >
          Xem trên trang đơn hàng
        </button>
      </div>
    </div>
  );
}

function sanitizeCheckoutItems(items: ChatCheckoutItem[]): ChatCheckoutItem[] {
  return (Array.isArray(items) ? items : [])
    .map((item) => {
      const productId = Number(item.product_id);
      const quantity = Number(item.quantity);
      const unitPrice = Number(item.unit_price);
      const subtotal =
        Number(item.subtotal) || Math.max(0, unitPrice) * Math.max(0, quantity);

      return {
        product_id: productId,
        product_name:
          typeof item.product_name === "string" && item.product_name.trim()
            ? item.product_name
            : `Sản phẩm #${productId}`,
        product_slug:
          typeof item.product_slug === "string" && item.product_slug.trim()
            ? item.product_slug
            : `product-${productId}`,
        image_url: typeof item.image_url === "string" ? item.image_url : "",
        unit_price: unitPrice,
        quantity,
        subtotal,
      };
    })
    .filter(
      (item) =>
        item.product_id > 0 &&
        item.quantity > 0 &&
        Number.isFinite(item.unit_price),
    );
}

type CheckoutErrorMeta = {
  message: string;
  retryable: boolean;
};

function extractErrorStatus(error: unknown): number | undefined {
  if (!error || typeof error !== "object") return undefined;
  const maybeError = error as { response?: { status?: number } };
  return maybeError.response?.status;
}

function extractErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== "object") return undefined;
  const maybeError = error as { code?: string };
  return maybeError.code;
}

function extractErrorMessage(error: unknown): string {
  if (!error || typeof error !== "object") return "";
  const maybeError = error as { message?: string };
  return typeof maybeError.message === "string" ? maybeError.message : "";
}

function extractBackendErrorMessage(error: unknown): string {
  if (!error || typeof error !== "object") return "";
  const maybeError = error as {
    response?: {
      data?: {
        message?: string;
        detail?: string;
      };
    };
  };
  return (
    maybeError.response?.data?.message ||
    maybeError.response?.data?.detail ||
    ""
  );
}

function mapCheckoutError(error: unknown): CheckoutErrorMeta {
  const status = extractErrorStatus(error);
  const code = extractErrorCode(error);
  const rawMessage = extractErrorMessage(error).toLowerCase();
  const backendMessage = extractBackendErrorMessage(error);

  if (status === 401 || status === 403) {
    return {
      message:
        "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để tiếp tục đặt hàng.",
      retryable: false,
    };
  }

  if (status === 409 || status === 422) {
    return {
      message:
        backendMessage ||
        "Một số sản phẩm không đủ tồn kho. Vui lòng kiểm tra lại giỏ hàng.",
      retryable: false,
    };
  }

  if (status === 400 || status === 404) {
    return {
      message:
        backendMessage ||
        "Không thể tạo đơn hàng với giỏ hiện tại. Vui lòng kiểm tra lại sản phẩm trong giỏ.",
      retryable: false,
    };
  }

  if (
    code === "ECONNABORTED" ||
    rawMessage.includes("timeout") ||
    rawMessage.includes("timed out")
  ) {
    return {
      message: "Kết nối đang chậm hoặc bị timeout. Vui lòng thử lại.",
      retryable: true,
    };
  }

  if (status === undefined || code === "ERR_NETWORK") {
    return {
      message:
        "Không thể kết nối tới máy chủ. Vui lòng kiểm tra mạng và thử lại.",
      retryable: true,
    };
  }

  if (typeof status === "number" && status >= 500) {
    return {
      message: "Hệ thống đang bận. Vui lòng thử lại sau ít phút.",
      retryable: true,
    };
  }

  return {
    message:
      "Mình chưa thể tạo đơn hàng lúc này. Vui lòng kiểm tra lại thông tin rồi thử lại.",
    retryable: false,
  };
}

function TextBubble({
  content,
  role,
}: {
  content: string;
  role: "user" | "bot";
}) {
  if (role === "user") {
    return (
      <div className="bg-primary text-white p-3 rounded-2xl rounded-tr-none shadow-md text-sm leading-relaxed">
        {content}
      </div>
    );
  }

  return (
    <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm text-slate-800 text-sm leading-relaxed border border-slate-100">
      {content}
    </div>
  );
}

function normalizeMarkdownContent(content: string): string {
  const text = (content || "").trim();
  if (!text) return "";

  let normalized = text;

  // Provider hay trả row theo kiểu "|| ... ||" thay vì xuống dòng.
  normalized = normalized.replace(/\s*\|\|\s*/g, "\n");

  // Chuẩn hóa table separator để remark-gfm nhận diện tốt hơn.
  normalized = normalized.replace(/\|\s*[-]{3,}\s*/g, "| --- ");

  return normalized;
}

function shouldRenderMarkdownContent(content: string): boolean {
  const text = content || "";
  if (!text.trim()) return false;

  return (
    text.includes("\n") ||
    text.includes("**") ||
    text.includes("#") ||
    text.includes("- ") ||
    /\|.+\|/.test(text) ||
    /^\d+\.\s/m.test(text)
  );
}

function MarkdownBubble({ content }: { content: string }) {
  const normalizedContent = normalizeMarkdownContent(content);

  return (
    <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm text-slate-800 text-sm leading-relaxed border border-slate-100 prose prose-sm max-w-none prose-p:my-1 prose-ul:my-2 prose-li:my-0">
      <div className="overflow-x-auto">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            table: ({ ...props }) => (
              <table
                {...props}
                className="w-full min-w-[560px] border-separate border-spacing-0 overflow-hidden rounded-lg border border-slate-200 text-xs"
              />
            ),
            thead: ({ ...props }) => (
              <thead {...props} className="bg-slate-100 text-slate-700" />
            ),
            tr: ({ ...props }) => (
              <tr
                {...props}
                className="odd:bg-white even:bg-slate-50/60 hover:bg-orange-50/50"
              />
            ),
            th: ({ ...props }) => (
              <th
                {...props}
                className="border-b border-slate-200 px-3 py-2 text-left font-semibold whitespace-nowrap"
              />
            ),
            td: ({ ...props }) => (
              <td
                {...props}
                className="border-b border-slate-100 px-3 py-2 align-top text-slate-700"
              />
            ),
          }}
        >
          {normalizedContent}
        </ReactMarkdown>
      </div>
    </div>
  );
}

function formatSearchFiltersHint(meta?: ChatStatsMeta): string | null {
  const sf = meta?.search_filters as Record<string, unknown> | undefined;
  if (!sf || Object.keys(sf).length === 0) return null;

  const parts: string[] = [];
  if (sf.min_price != null) {
    parts.push(`từ ${Number(sf.min_price).toLocaleString("vi-VN")}đ`);
  }
  if (sf.max_price != null) {
    parts.push(`≤ ${Number(sf.max_price).toLocaleString("vi-VN")}đ`);
  }
  const useLabels = sf.use_labels as string[] | undefined;
  if (useLabels?.length) {
    const joiner = sf.use_match === "all" ? " và " : " hoặc ";
    parts.push(`công dụng: ${useLabels.join(joiner)}`);
  }
  const keywords = sf.keywords as string[] | undefined;
  if (keywords?.length) {
    const joiner = sf.keyword_match === "all" ? " + " : " | ";
    parts.push(`từ khóa: ${keywords.join(joiner)}`);
  }
  if (sf.category_label) {
    parts.push(`danh mục: ${String(sf.category_label)}`);
  }
  if (!parts.length) return null;
  return `Đã lọc: ${parts.join(" · ")}`;
}

function TypingIndicator() {
  return (
    <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm border border-slate-100 flex gap-1 items-center w-16">
      <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce [animation-delay:0ms]" />
      <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce [animation-delay:150ms]" />
      <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce [animation-delay:300ms]" />
    </div>
  );
}

function ProductCardList({
  products,
  onAddToCart,
  onViewDetail,
  onBuyNow,
  mounted,
}: {
  products: ChatProductCard[];
  onAddToCart: (product: ChatProductCard) => void;
  onViewDetail: (product: ChatProductCard) => void;
  onBuyNow: (product: ChatProductCard) => void;
  mounted: boolean;
}) {
  return (
    <div className="space-y-2 mt-1">
      {products.map((product) => (
        <div
          key={product.id}
          className="bg-white p-2.5 rounded-xl shadow-sm border border-slate-100 w-full overflow-hidden hover:shadow-md transition-shadow"
        >
          <div className="flex gap-3">
            <div className="w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-slate-100">
              {product.image_url ? (
                <img
                  alt={product.name}
                  className="w-full h-full object-cover"
                  src={getAbsoluteImageUrl(product.image_url)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300 text-[10px]">
                  No image
                </div>
              )}
            </div>
            <div className="flex flex-col justify-between flex-1 py-0.5 min-w-0">
              <div>
                <h4 className="text-slate-900 font-bold text-sm line-clamp-1">
                  {product.name}
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                  {product.short_description?.trim() ||
                    "Đèn đá muối Himalaya — xem chi tiết để biết thêm."}
                </p>
              </div>
              <div className="flex items-center justify-between mt-1 gap-2 min-w-0">
                <span className="text-primary font-bold text-xs whitespace-nowrap">
                  {Number(product.price).toLocaleString("vi-VN")}đ
                </span>
                <span className="text-[10px] text-slate-400 whitespace-nowrap">
                  Còn: {product.stock}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-2 flex gap-2">
            <button
              onClick={() => onViewDetail(product)}
              className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Xem chi tiết
            </button>
            <button
              onClick={() => onAddToCart(product)}
              disabled={!mounted || product.stock <= 0}
              className="rounded-lg border border-primary/20 px-3 py-2 text-xs font-medium text-primary hover:bg-primary/5 disabled:text-slate-300 disabled:border-slate-200 disabled:cursor-not-allowed"
            >
              Thêm vào giỏ
            </button>
            <button
              onClick={() => onBuyNow(product)}
              disabled={!mounted || product.stock <= 0}
              className="rounded-lg bg-primary px-3 py-2 text-xs font-medium text-white hover:bg-orange-600 disabled:bg-slate-300 disabled:cursor-not-allowed"
            >
              Mua ngay
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function CartPreviewPanel({ cartItems }: { cartItems: ChatCheckoutItem[] }) {
  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    return (
      <div className="mt-1 rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-500">
        Giỏ hàng của bạn đang trống.
      </div>
    );
  }

  const total = cartItems.reduce((sum, item) => sum + Number(item.subtotal), 0);

  return (
    <div className="mt-1 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        Giỏ hàng hiện tại
      </p>
      <div className="max-h-56 divide-y divide-slate-100 overflow-y-auto rounded-lg border border-slate-100 bg-white">
        {cartItems.map((item) => (
          <div
            key={`${item.product_id}-${item.product_slug}`}
            className="flex items-center justify-between gap-2 p-2.5"
          >
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-slate-800">
                {item.product_name}
              </p>
              <p className="text-[11px] text-slate-500">
                {item.quantity} x {formatCurrency(item.unit_price)}
              </p>
            </div>
            <p className="text-xs font-bold text-slate-800">
              {formatCurrency(item.subtotal)}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-2 flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/70 px-2.5 py-2">
        <p className="text-xs font-semibold text-slate-600">Tạm tính</p>
        <p className="text-sm font-extrabold text-primary">
          {formatCurrency(total)}
        </p>
      </div>

      <p className="mt-2 text-[11px] text-slate-500">
        Nhắn "thanh toán" để mở form thanh toán ngay trong chat.
      </p>
    </div>
  );
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function toNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function toStringValue(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function inferWidgetType(statsData?: ChatStatsData): string {
  if (!statsData) return "";
  return statsData.widget_type;
}

function StatsSourceBadge({ meta }: { meta?: ChatStatsMeta }) {
  const isSql = meta?.source === "text_to_sql";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
        isSql
          ? "border-indigo-200 bg-indigo-50 text-indigo-700"
          : "border-emerald-200 bg-emerald-50 text-emerald-700"
      }`}
    >
      {isSql ? "Truy vấn linh hoạt" : "Dữ liệu chuẩn"}
    </span>
  );
}

function KpiCardGrid({ items }: { items: unknown[] }) {
  const normalized = items
    .map((item) => asRecord(item))
    .filter((item): item is Record<string, unknown> => Boolean(item))
    .map((item) => ({
      label: toStringValue(item.label, toStringValue(item.key, "Chỉ số")),
      value: item.value,
      key: toStringValue(item.key, "metric"),
    }));

  const displayItems = normalized.slice(0, 6);

  if (displayItems.length === 0) {
    return (
      <p className="text-xs text-slate-500">
        Không có dữ liệu KPI để hiển thị.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {displayItems.map((item, idx) => {
        const key = `${item.key}-${idx}`;
        const value = toNumber(item.value);
        const isPercent = String(item.key).includes("pct");
        const displayValue = isPercent
          ? `${value.toFixed(1)}%`
          : value >= 1000
            ? formatCurrency(value)
            : new Intl.NumberFormat("vi-VN").format(value);
        return (
          <div
            key={key}
            className="rounded-lg border border-slate-200 bg-white p-2.5"
          >
            <p className="text-[11px] text-slate-500 line-clamp-1">
              {item.label}
            </p>
            <p className="mt-1 text-sm font-bold text-slate-800">
              {displayValue}
            </p>
          </div>
        );
      })}
    </div>
  );
}

function MiniRevenueChart({ items }: { items: unknown[] }) {
  const points = items
    .map((item) => asRecord(item))
    .filter((item): item is Record<string, unknown> => Boolean(item))
    .map((item, idx) => ({
      label: toStringValue(item.label, `Mốc ${idx + 1}`),
      revenue: toNumber(item.revenue),
      orders: toNumber(item.order_count),
    }));

  if (points.length === 0) {
    return (
      <p className="text-xs text-slate-500">Không có dữ liệu doanh thu.</p>
    );
  }

  const maxRevenue = Math.max(...points.map((p) => p.revenue), 1);
  const maxOrders = Math.max(...points.map((p) => p.orders), 1);
  const showEvery = Math.max(1, Math.ceil(points.length / 6));
  const totalRevenue = points.reduce((sum, p) => sum + p.revenue, 0);
  const totalOrders = points.reduce((sum, p) => sum + p.orders, 0);
  const avgRevenue = points.length > 0 ? totalRevenue / points.length : 0;
  const topPoint = points.reduce(
    (best, p) => (p.revenue > best.revenue ? p : best),
    points[0],
  );

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-2.5">
      <div className="mb-2 grid grid-cols-2 gap-1.5 text-[10px]">
        <div className="rounded-md border border-orange-100 bg-orange-50 px-2 py-1.5">
          <p className="text-orange-700">Tổng doanh thu</p>
          <p className="mt-0.5 font-semibold text-orange-800">
            {formatCurrency(totalRevenue)}
          </p>
        </div>
        <div className="rounded-md border border-sky-100 bg-sky-50 px-2 py-1.5">
          <p className="text-sky-700">Tổng đơn</p>
          <p className="mt-0.5 font-semibold text-sky-800">
            {new Intl.NumberFormat("vi-VN").format(totalOrders)}
          </p>
        </div>
        <div className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5">
          <p className="text-slate-600">TB doanh thu/mốc</p>
          <p className="mt-0.5 font-semibold text-slate-800">
            {formatCurrency(avgRevenue)}
          </p>
        </div>
        <div className="rounded-md border border-emerald-100 bg-emerald-50 px-2 py-1.5">
          <p className="text-emerald-700">Mốc cao nhất</p>
          <p className="mt-0.5 truncate font-semibold text-emerald-800">
            {topPoint.label}
          </p>
        </div>
      </div>

      <div className="h-28">
        <div className="flex h-full items-end gap-1">
          {points.map((p, idx) => (
            <div
              key={`${p.label}-${idx}`}
              className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1"
            >
              <div className="flex h-20 w-full items-end justify-center gap-0.5">
                <div
                  className="w-1/2 rounded-t bg-orange-400"
                  style={{ height: `${(p.revenue / maxRevenue) * 100}%` }}
                />
                <div
                  className="w-1/2 rounded-t bg-sky-400"
                  style={{ height: `${(p.orders / maxOrders) * 100}%` }}
                />
              </div>
              {idx % showEvery === 0 ? (
                <span className="max-w-full truncate text-[10px] text-slate-500">
                  {p.label}
                </span>
              ) : (
                <span className="text-[10px] text-transparent">.</span>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-2 flex items-center gap-3 text-[10px] text-slate-500">
        <span className="inline-flex items-center gap-1">
          <span className="size-2 rounded-full bg-orange-400" />
          Doanh thu
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="size-2 rounded-full bg-sky-400" />
          Số đơn
        </span>
      </div>
    </div>
  );
}

function TopProductsList({ items }: { items: unknown[] }) {
  const products = items
    .map((item) => asRecord(item))
    .filter((item): item is Record<string, unknown> => Boolean(item))
    .map((item, idx) => ({
      product_name: toStringValue(item.product_name, `Sản phẩm ${idx + 1}`),
      total_sold: toNumber(item.total_sold),
      total_revenue: toNumber(item.total_revenue),
    }));

  if (products.length === 0) {
    return (
      <p className="text-xs text-slate-500">
        Không có dữ liệu sản phẩm bán chạy.
      </p>
    );
  }

  return (
    <div className="space-y-1.5">
      {products.slice(0, 5).map((p, idx) => (
        <div
          key={`${p.product_name}-${idx}`}
          className="rounded-lg border border-slate-200 bg-white px-2.5 py-2"
        >
          <p className="truncate text-xs font-semibold text-slate-800">
            #{idx + 1} {p.product_name}
          </p>
          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-600">
            <span>
              {new Intl.NumberFormat("vi-VN").format(p.total_sold)} đã bán
            </span>
            <span className="font-semibold text-slate-800">
              {formatCurrency(p.total_revenue)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function OrderStatusMiniDonut({ items }: { items: unknown[] }) {
  const rows = items
    .map((item) => asRecord(item))
    .filter((item): item is Record<string, unknown> => Boolean(item))
    .map((item) => ({
      status: toStringValue(item.status, "other"),
      count: toNumber(item.count),
      percentage: toNumber(item.percentage),
    }))
    .filter((item) => item.count > 0);

  if (rows.length === 0) {
    return (
      <p className="text-xs text-slate-500">Không có dữ liệu trạng thái đơn.</p>
    );
  }

  const colorMap: Record<string, string> = {
    delivered: "#10b981",
    shipping: "#3b82f6",
    packing: "#6366f1",
    confirmed: "#8b5cf6",
    pending: "#f59e0b",
    cancelled: "#ef4444",
  };
  const labelMap: Record<string, string> = {
    delivered: "Đã giao",
    shipping: "Đang giao",
    packing: "Đang chuẩn bị",
    confirmed: "Đã xác nhận",
    pending: "Chờ xác nhận",
    cancelled: "Đã hủy",
  };

  const total = rows.reduce((sum, item) => sum + item.count, 0);
  const gradient = rows.reduce(
    (acc, item) => {
      const start = acc.current;
      const pct =
        item.percentage > 0
          ? item.percentage
          : (item.count / Math.max(total, 1)) * 100;
      const end = Math.min(100, start + pct);
      const color = colorMap[item.status] ?? "#94a3b8";
      acc.segments.push(`${color} ${start}% ${end}%`);
      acc.current = end;
      return acc;
    },
    { current: 0, segments: [] as string[] },
  ).segments;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-2.5">
      <div className="mb-2 flex items-center gap-3">
        <div
          className="relative size-14 shrink-0 rounded-full"
          style={{ background: `conic-gradient(${gradient.join(", ")})` }}
        >
          <div className="absolute inset-2 rounded-full bg-white" />
        </div>
        <div>
          <p className="text-[11px] text-slate-500">Tổng đơn</p>
          <p className="text-base font-bold text-slate-800">
            {new Intl.NumberFormat("vi-VN").format(total)}
          </p>
        </div>
      </div>
      <div className="space-y-1">
        {rows.map((item, idx) => (
          <div
            key={`${item.status}-${idx}`}
            className="flex items-center justify-between text-[11px]"
          >
            <span className="inline-flex items-center gap-1.5 text-slate-600">
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: colorMap[item.status] ?? "#94a3b8" }}
              />
              {labelMap[item.status] ?? item.status}
            </span>
            <span className="font-semibold text-slate-800">
              {item.percentage.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SqlResultTable({
  rows,
  sqlQuery,
}: {
  rows: Record<string, unknown>[];
  sqlQuery?: string | null;
}) {
  const [showSql, setShowSql] = useState(false);
  const [showTable, setShowTable] = useState(false);

  if (!rows.length) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-2.5 text-xs text-slate-500">
        Không có dòng dữ liệu trả về.
      </div>
    );
  }

  if (!showTable) {
    return (
      <div className="mt-1">
        <button
          onClick={() => setShowTable(true)}
          className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 hover:border-primary/40 hover:text-primary"
        >
          Xem bảng dữ liệu ({rows.length} dòng)
        </button>
      </div>
    );
  }

  const columns = Object.keys(rows[0] || {});
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-2.5">
      <div className="mb-2 flex items-center justify-between text-[10px] text-slate-500">
        <span>{rows.length} dòng dữ liệu • Hiển thị tối đa 20 dòng</span>
        <button
          onClick={() => setShowTable(false)}
          className="rounded-md border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:border-primary/40 hover:text-primary"
        >
          Ẩn bảng dữ liệu
        </button>
      </div>

      {sqlQuery ? (
        <div className="mb-2">
          <button
            onClick={() => setShowSql((v) => !v)}
            className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700"
          >
            {showSql ? "Ẩn SQL" : "Xem SQL"}
          </button>
          {showSql ? (
            <pre className="mt-1 max-h-28 overflow-auto rounded-md bg-slate-900 p-2 text-[10px] text-slate-100">
              {sqlQuery}
            </pre>
          ) : null}
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="min-w-full text-left text-[11px] border-separate border-spacing-0">
          <thead className="sticky top-0 z-10 bg-slate-100">
            <tr className="text-slate-700">
              {columns.map((col) => (
                <th
                  key={col}
                  className="whitespace-nowrap border-b border-slate-200 px-2.5 py-2 font-semibold"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 20).map((row, idx) => (
              <tr
                key={idx}
                className="odd:bg-white even:bg-slate-50/70 hover:bg-orange-50/60"
              >
                {columns.map((col) => (
                  <td
                    key={`${idx}-${col}`}
                    className="whitespace-nowrap border-b border-slate-100 px-2.5 py-2 text-slate-700"
                  >
                    {String(row[col] ?? "-")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatsWidgetRenderer({
  statsData,
  meta,
}: {
  statsData?: ChatStatsData;
  meta?: ChatStatsMeta;
}) {
  const widgetType = inferWidgetType(statsData);
  const items = Array.isArray(statsData?.items) ? statsData.items : [];
  const rows = Array.isArray(statsData?.rows) ? statsData.rows : [];

  return (
    <div className="mt-1 rounded-xl border border-slate-200 bg-slate-50 p-2.5">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold text-slate-600">
          Bảng điều khiển thống kê
        </p>
        <StatsSourceBadge meta={meta} />
      </div>

      {widgetType === "kpi" ? <KpiCardGrid items={items} /> : null}
      {widgetType === "revenue_chart" ? (
        <MiniRevenueChart items={items} />
      ) : null}
      {widgetType === "top_products" ? <TopProductsList items={items} /> : null}
      {widgetType === "order_status" ? (
        <OrderStatusMiniDonut items={items} />
      ) : null}
      {widgetType === "table" ? (
        <SqlResultTable rows={rows} sqlQuery={statsData?.sql_query} />
      ) : null}

      {!widgetType ? (
        <p className="text-xs text-slate-500">
          Không có dữ liệu thống kê để hiển thị.
        </p>
      ) : null}

      {(statsData?.date_from || statsData?.date_to) && (
        <p className="mt-2 text-[10px] text-slate-500">
          Kỳ dữ liệu: {statsData?.date_from ?? "--"} đến{" "}
          {statsData?.date_to ?? "--"}
        </p>
      )}
    </div>
  );
}

function MessageRenderer({
  message,
  onAddToCart,
  onViewDetail,
  onBuyNow,
  onOpenOrder,
  onReorderFromChat,
  onRetryPaymentFromChat,
  onViewOrderPage,
  onCheckoutSubmit,
  checkoutSubmitting,
  fallbackCartItems,
  onBackToShopping,
  defaultName,
  defaultPhone,
  defaultAddress,
  mounted,
}: {
  message: ChatMessage;
  onAddToCart: (product: ChatProductCard) => void;
  onViewDetail: (product: ChatProductCard) => void;
  onBuyNow: (product: ChatProductCard) => void;
  onOpenOrder: (orderId: number) => void;
  onReorderFromChat: (order: ChatOrderDetail) => void;
  onRetryPaymentFromChat: (order: ChatOrderDetail) => void;
  onViewOrderPage: (orderId: number) => void;
  onCheckoutSubmit: (payload: CheckoutSubmitPayload) => Promise<void>;
  checkoutSubmitting: boolean;
  fallbackCartItems: ChatCheckoutItem[];
  onBackToShopping: () => void;
  defaultName?: string;
  defaultPhone?: string;
  defaultAddress?: string;
  mounted: boolean;
}) {
  const showTypingDots =
    message.isLoading ||
    (message.isStreaming && !(message.content || "").trim());

  if (showTypingDots) {
    return (
      <>
        <TypingIndicator />
        {message.streamStatus ? (
          <p className="text-[10px] text-slate-400 ml-1 mt-1">
            {message.streamStatus}
            {message.intent ? ` (Intent: ${message.intent})` : ""}
          </p>
        ) : null}
      </>
    );
  }

  if (message.isStreaming) {
    return (
      <>
        <TextBubble content={message.content} role={message.role} />
        {message.streamStatus ? (
          <p className="text-[10px] text-slate-400 ml-1 mt-1">
            {message.streamStatus}
            {message.intent ? ` (Intent: ${message.intent})` : ""}
          </p>
        ) : null}
      </>
    );
  }

  switch (message.response_type) {
    case "product_cards":
      return (
        <>
          {shouldRenderMarkdownContent(message.content) ? (
            <MarkdownBubble content={message.content} />
          ) : (
            <TextBubble content={message.content} role={message.role} />
          )}
          {formatSearchFiltersHint(message.data?.meta) ? (
            <p className="text-[10px] text-slate-500 ml-1 mt-0.5">
              {formatSearchFiltersHint(message.data?.meta)}
            </p>
          ) : null}
          {message.data?.products && message.data.products.length > 0 ? (
            <ProductCardList
              products={message.data.products}
              onAddToCart={onAddToCart}
              onViewDetail={onViewDetail}
              onBuyNow={onBuyNow}
              mounted={mounted}
            />
          ) : (
            <div className="text-xs text-slate-400 ml-1 mt-1">
              [Khong co san pham phu hop de hien thi]
            </div>
          )}
        </>
      );

    case "checkout_form": {
      // Prefer backend checkout payload; fallback to local cart to avoid empty panel.
      const checkoutItems = sanitizeCheckoutItems(
        message.data?.cart_items && message.data.cart_items.length > 0
          ? message.data.cart_items
          : fallbackCartItems,
      );

      return (
        <>
          <TextBubble content={message.content} role={message.role} />
          <CheckoutPanel
            cartItems={checkoutItems}
            isSubmitting={checkoutSubmitting}
            onSubmit={onCheckoutSubmit}
            onBackToShopping={onBackToShopping}
            defaultName={defaultName}
            defaultPhone={defaultPhone}
            defaultAddress={defaultAddress}
          />
        </>
      );
    }

    case "cart_view": {
      const cartItems = sanitizeCheckoutItems(
        message.data?.cart_items && message.data.cart_items.length > 0
          ? message.data.cart_items
          : fallbackCartItems,
      );

      return (
        <>
          <TextBubble content={message.content} role={message.role} />
          <CartPreviewPanel cartItems={cartItems} />
        </>
      );
    }

    case "order_list":
      return (
        <>
          <TextBubble content={message.content} role={message.role} />
          <OrderListPanel
            orders={message.data?.orders}
            onOpenOrder={onOpenOrder}
          />
        </>
      );

    case "order_detail":
      return (
        <>
          <TextBubble content={message.content} role={message.role} />
          <OrderDetailPanel
            order={message.data?.order_detail}
            onReorder={onReorderFromChat}
            onRetryPayment={onRetryPaymentFromChat}
            onViewOrderPage={onViewOrderPage}
          />
        </>
      );

    case "stats":
      return (
        <>
          {shouldRenderMarkdownContent(message.content) ? (
            <MarkdownBubble content={message.content} />
          ) : (
            <TextBubble content={message.content} role={message.role} />
          )}
          <StatsWidgetRenderer
            statsData={message.data?.stats_data}
            meta={message.data?.meta}
          />
        </>
      );

    case "text":
    default: {
      const shouldRenderMarkdown =
        message.role === "bot" && shouldRenderMarkdownContent(message.content);

      return (
        <>
          {shouldRenderMarkdown ? (
            <MarkdownBubble content={message.content} />
          ) : (
            <TextBubble content={message.content} role={message.role} />
          )}

          {message.role === "bot" && isAdminOnlyMessage(message.content) ? (
            <div className="mt-1 ml-1 inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
              <span className="material-symbols-outlined text-[12px]">
                lock
              </span>
              Admin only
            </div>
          ) : null}

          {message.role === "bot" &&
            message.data?.sources &&
            message.data.sources.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {message.data.sources.map((source, index) => (
                  <span
                    key={`${source.title}-${index}`}
                    className="rounded-full bg-slate-100 px-2 py-1 text-[10px] text-slate-500"
                    title={source.snippet}
                  >
                    {source.title}
                  </span>
                ))}
              </div>
            )}
        </>
      );
    }
  }
}

function normalizeCheckoutItems(apiRes: ChatApiResponse): ChatCheckoutItem[] {
  const fromData = apiRes.data?.cart_items;
  if (Array.isArray(fromData) && fromData.length > 0) {
    return fromData
      .filter((item) => item.product_id > 0 && item.quantity > 0)
      .map((item) => ({
        product_id: Number(item.product_id),
        product_name: item.product_name,
        product_slug: item.product_slug,
        image_url: item.image_url,
        unit_price: Number(item.unit_price),
        quantity: Number(item.quantity),
        subtotal: Number(item.subtotal),
      }));
  }

  const fallbackCartItem = apiRes.cart_item as
    | (ChatApiResponse["cart_item"] & {
        product_name?: string;
        product_slug?: string;
        image_url?: string;
        price?: number;
      })
    | null
    | undefined;

  if (fallbackCartItem?.product_id && Number(fallbackCartItem.quantity) > 0) {
    const unitPrice = Number(
      fallbackCartItem.unit_price ?? fallbackCartItem.price ?? 0,
    );
    const quantity = Number(fallbackCartItem.quantity);

    return [
      {
        product_id: Number(fallbackCartItem.product_id),
        product_name: fallbackCartItem.product_name || "Sản phẩm",
        product_slug:
          fallbackCartItem.product_slug ||
          `product-${fallbackCartItem.product_id}`,
        image_url: fallbackCartItem.image_url || "",
        unit_price: unitPrice,
        quantity,
        subtotal: unitPrice * quantity,
      },
    ];
  }

  return [];
}

function isCartViewMessage(text: string): boolean {
  const normalized = text.trim().toLowerCase();
  return CART_VIEW_KEYWORDS.some((kw) => normalized.includes(kw));
}

function isCheckoutViewMessage(text: string): boolean {
  const normalized = text.trim().toLowerCase();
  return (
    normalized.includes("thanh toán") ||
    normalized.includes("thanh toan") ||
    normalized.includes("checkout")
  );
}

function normalizeTextForCartMatch(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isRemoveFromCartMessage(text: string): boolean {
  const normalized = normalizeTextForCartMatch(text);
  return CART_REMOVE_KEYWORDS.some((kw) =>
    normalized.includes(normalizeTextForCartMatch(kw)),
  );
}

function extractRemoveProductName(text: string): string {
  const normalized = text.trim();
  const patterns = [
    /x[oó]a\s+(.+?)\s+kh[oỏ]i\s+gi[oỏ]\s*h[aà]ng/i,
    /x[oó]a\s+(.+?)\s+kh[oỏ]i\s+gi[oỏ]/i,
    /b[oỏ]\s+(.+?)\s+kh[oỏ]i\s+gi[oỏ]\s*h[aà]ng/i,
    /b[oỏ]\s+(.+?)\s+kh[oỏ]i\s+gi[oỏ]/i,
    /remove\s+(.+?)\s+from\s+cart/i,
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (!match) continue;
    return match[1].trim();
  }

  return "";
}

function isAdminOnlyMessage(text: string): boolean {
  const normalized = text.trim().toLowerCase();
  return (
    normalized.includes("chỉ dành cho quản trị") ||
    normalized.includes("chi danh cho quan tri") ||
    normalized.includes("admin only") ||
    (normalized.includes("admin") && normalized.includes("thống kê")) ||
    (normalized.includes("admin") && normalized.includes("thong ke"))
  );
}

export default function Chatbot() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [sessionId, setSessionId] = useState(() => loadChatSessionId());
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadChatMessages());
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [checkoutSubmitting, setCheckoutSubmitting] = useState(false);
  const [retryCheckoutPayload, setRetryCheckoutPayload] =
    useState<CheckoutSubmitPayload | null>(null);
  const [llmInfo, setLlmInfo] = useState<{
    llm_provider: string;
    llm_model: string;
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const checkoutSubmitLockRef = useRef(false);
  const chatStreamAbortRef = useRef<AbortController | null>(null);
  const addItem = useCartStore((s) => s.addItem);
  const removeItem = useCartStore((s) => s.removeItem);
  const clearCart = useCartStore((s) => s.clearCart);
  const cartStoreItems = useCartStore((s) => s.items);
  const { user } = useAuthStore();

  const quickSuggestions = useMemo(
    () =>
      user?.role === "admin" ? ADMIN_STATS_SUGGESTIONS : QUICK_SUGGESTIONS,
    [user?.role],
  );

  const fallbackCheckoutItems = useMemo<ChatCheckoutItem[]>(
    () =>
      cartStoreItems
        .map((item) => {
          const resolvedProductId = Number(item.productId ?? item.id);
          return {
            ...item,
            productId: resolvedProductId,
          };
        })
        .filter(
          (item) => Number(item.productId) > 0 && Number(item.quantity) > 0,
        )
        .map((item) => ({
          product_id: item.productId,
          product_name: item.name,
          product_slug: item.slug,
          image_url: item.image ?? "",
          unit_price: Number(item.price),
          quantity: Number(item.quantity),
          subtotal: Number(item.price) * Number(item.quantity),
        })),
    [cartStoreItems],
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    persistChatSession(sessionId, messages);
  }, [mounted, sessionId, messages]);

  const handleNewConversation = useCallback(async () => {
    try {
      await chatService.clearSession(sessionId);
    } catch {
      /* backend clear optional */
    }
    const newId = crypto.randomUUID();
    setSessionId(newId);
    setMessages([{ ...CHAT_WELCOME_MESSAGE, timestamp: Date.now() }]);
    setInputValue("");
    setIsLoading(false);
  }, [sessionId]);

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    void chatService
      .getLlmInfo()
      .then((info) => {
        if (!cancelled && info?.llm_model) {
          setLlmInfo({
            llm_provider: info.llm_provider,
            llm_model: info.llm_model,
          });
        }
      })
      .catch(() => {
        /* giữ label cũ nếu API lỗi */
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  const createCartItemFromProduct = useCallback((product: ChatProductCard) => {
    return {
      id: product.id,
      productId: product.id,
      name: product.name,
      price: Number(product.price),
      image: product.image_url ?? "",
      slug: product.slug,
      quantity: 1,
    };
  }, []);

  const createCheckoutItemFromProduct = useCallback(
    (product: ChatProductCard): ChatCheckoutItem => ({
      product_id: product.id,
      product_name: product.name,
      product_slug: product.slug,
      image_url: product.image_url ?? "",
      unit_price: Number(product.price),
      quantity: 1,
      subtotal: Number(product.price),
    }),
    [],
  );

  const handleAddProductToCart = useCallback(
    (product: ChatProductCard) => {
      if (!mounted) return;

      if (product.stock <= 0) {
        toast.error("Sản phẩm đã hết hàng");
        return;
      }

      addItem(createCartItemFromProduct(product));
      toast.success(`Đã thêm "${product.name}" vào giỏ hàng!`);
    },
    [addItem, createCartItemFromProduct, mounted],
  );

  const handleViewProductDetail = useCallback(
    (product: ChatProductCard) => {
      if (!product.slug) {
        toast.error("Không tìm thấy dường dân sản phẩm");
        return;
      }
      router.push(`/product/${product.slug}`);
    },
    [router],
  );

  const handleSend = useCallback(
    async (presetText?: string) => {
      const text = (presetText ?? inputValue).trim();
      if (!text || isLoading) return;

      const openCheckoutFromStore = () => {
        const userMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: "user",
          content: text,
          timestamp: Date.now(),
        };

        const cartItems = sanitizeCheckoutItems(fallbackCheckoutItems);
        const botMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: "bot",
          content:
            cartItems.length > 0
              ? "Mình mở form thanh toán cho bạn ngay trong chat."
              : "Giỏ hàng của bạn đang trống. Hãy thêm sản phẩm rồi quay lại nhé.",
          response_type: cartItems.length > 0 ? "checkout_form" : "text",
          data: cartItems.length > 0 ? { cart_items: cartItems } : undefined,
          timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, userMsg, botMsg]);
        setInputValue("");
      };

      const removeCartItemFromStore = () => {
        const userMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: "user",
          content: text,
          timestamp: Date.now(),
        };

        const normalizedCartItems = fallbackCheckoutItems;
        if (normalizedCartItems.length === 0) {
          const botMsg: ChatMessage = {
            id: crypto.randomUUID(),
            role: "bot",
            content: "Giỏ hàng của bạn đang trống nên chưa có sản phẩm để xóa.",
            response_type: "text",
            timestamp: Date.now(),
          };
          setMessages((prev) => [...prev, userMsg, botMsg]);
          setInputValue("");
          return;
        }

        const requestedName = extractRemoveProductName(text);
        if (!requestedName) {
          const botMsg: ChatMessage = {
            id: crypto.randomUUID(),
            role: "bot",
            content:
              "Bạn muốn xóa sản phẩm nào khỏi giỏ? Ví dụ: xóa Đá muối hình bình khỏi giỏ hàng.",
            response_type: "text",
            timestamp: Date.now(),
          };
          setMessages((prev) => [...prev, userMsg, botMsg]);
          setInputValue("");
          return;
        }

        const requestedNorm = normalizeTextForCartMatch(requestedName);
        const target = normalizedCartItems.find((item) => {
          const itemNorm = normalizeTextForCartMatch(item.product_name);
          return (
            itemNorm.includes(requestedNorm) || requestedNorm.includes(itemNorm)
          );
        });

        if (!target) {
          const botMsg: ChatMessage = {
            id: crypto.randomUUID(),
            role: "bot",
            content:
              "Mình chưa thấy sản phẩm đó trong giỏ hàng của bạn. Bạn kiểm tra lại tên sản phẩm giúp mình nhé.",
            response_type: "text",
            timestamp: Date.now(),
          };
          setMessages((prev) => [...prev, userMsg, botMsg]);
          setInputValue("");
          return;
        }

        removeItem(target.product_id);

        const botMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: "bot",
          content: `Đã xóa "${target.product_name}" khỏi giỏ hàng.`,
          response_type: "text",
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, userMsg, botMsg]);
        setInputValue("");
      };

      const openCartViewFromStore = () => {
        const userMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: "user",
          content: text,
          timestamp: Date.now(),
        };

        const cartItems = sanitizeCheckoutItems(fallbackCheckoutItems);
        const botMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: "bot",
          content:
            cartItems.length > 0
              ? "Đây là giỏ hàng hiện tại của bạn."
              : "Giỏ hàng của bạn đang trống.",
          response_type: "cart_view",
          data: { cart_items: cartItems },
          timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, userMsg, botMsg]);
        setInputValue("");
      };

      if (isCartViewMessage(text)) {
        openCartViewFromStore();
        return;
      }

      if (isRemoveFromCartMessage(text)) {
        removeCartItemFromStore();
        return;
      }

      if (isCheckoutViewMessage(text)) {
        openCheckoutFromStore();
        return;
      }

      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: text,
        timestamp: Date.now(),
      };

      const loadingMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "bot",
        content: "",
        isLoading: true,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMsg, loadingMsg]);
      setInputValue("");
      setIsLoading(true);

      chatStreamAbortRef.current?.abort();
      const streamAbort = new AbortController();
      chatStreamAbortRef.current = streamAbort;

      const applyChatResponse = (apiRes: ChatApiResponse) => {
        if (apiRes.meta?.llm_model) {
          setLlmInfo({
            llm_provider: apiRes.meta.llm_provider ?? "unknown",
            llm_model: apiRes.meta.llm_model,
          });
        }

        const mergedMeta = { ...(apiRes.meta ?? {}) };
        const normalizedCheckoutItems = normalizeCheckoutItems(apiRes);

        if (
          mounted &&
          apiRes.cart_updated &&
          normalizedCheckoutItems.length > 0
        ) {
          normalizedCheckoutItems.forEach((item) => {
            addItem({
              id: item.product_id,
              productId: item.product_id,
              name: item.product_name,
              price: Number(item.unit_price),
              image: item.image_url,
              slug: item.product_slug,
              quantity: Number(item.quantity),
            });
          });
        }

        if (mounted && apiRes.cart_removed && apiRes.cart_item?.product_id) {
          removeItem(Number(apiRes.cart_item.product_id));
        }

        const botMsg: ChatMessage = {
          id: loadingMsg.id,
          role: "bot",
          content: apiRes.answer ?? "",
          response_type: apiRes.response_type,
          data: {
            products: apiRes.products ?? undefined,
            cart_item: apiRes.cart_item ?? undefined,
            cart_items: normalizedCheckoutItems,
            orders: apiRes.orders ?? undefined,
            order_detail: apiRes.order_detail ?? undefined,
            stats_data: apiRes.stats_data ?? undefined,
            meta: Object.keys(mergedMeta).length ? mergedMeta : undefined,
            sources: apiRes.sources ?? undefined,
          },
          timestamp: Date.now(),
          intent: apiRes.intent ?? undefined,
          isLoading: false,
          isStreaming: false,
          streamStatus: undefined,
        };

        setMessages((prev) =>
          prev.map((m) => (m.id === loadingMsg.id ? botMsg : m)),
        );
      };

      const fetchWithStream = async (): Promise<ChatApiResponse> => {
        let streamedContent = "";
        return chatService.streamMessage(
          { message: text, session_id: sessionId },
          {
            onStatus: (status) => {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === loadingMsg.id
                    ? {
                        ...m,
                        isStreaming: true,
                        streamStatus: status.message,
                        intent: status.intent || m.intent,
                      }
                    : m,
                ),
              );
            },
            onToken: (chunk) => {
              streamedContent += chunk;
              const snapshot = streamedContent;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === loadingMsg.id
                    ? {
                        ...m,
                        isLoading: false,
                        isStreaming: true,
                        content: snapshot,
                      }
                    : m,
                ),
              );
            },
            onDone: (payload) => {
              applyChatResponse(payload);
            },
            onError: (msg) => {
              console.warn("[Chatbot] stream error:", msg);
            },
          },
          streamAbort.signal,
        );
      };

      const fetchWithPost = () =>
        chatService.sendMessage({
          message: text,
          session_id: sessionId,
        });

      try {
        let apiRes: ChatApiResponse;
        if (CHAT_STREAM_ENABLED) {
          try {
            apiRes = await fetchWithStream();
          } catch (streamErr) {
            if (streamAbort.signal.aborted) {
              throw streamErr;
            }
            console.error("[Chatbot] stream failed, fallback POST /chat. Details:", streamErr);
            apiRes = await fetchWithPost();
            applyChatResponse(apiRes);
          }
        } else {
          apiRes = await fetchWithPost();
          applyChatResponse(apiRes);
        }
      } catch (error: unknown) {
        console.error("[Chatbot] sendMessage failed:", error);

        let content =
          "Không kết nối được máy chủ chat. Vui lòng kiểm tra mạng hoặc thử lại sau.";

        const axiosError = error as {
          code?: string;
          response?: { data?: { data?: ChatApiResponse; message?: string } };
        };

        if (axiosError.code === "ECONNABORTED") {
          content =
            "Phản hồi quá lâu (AI đang xử lý). Bạn thử lại hoặc hỏi ngắn hơn, ví dụ: \"gợi ý đèn dưới 500k\".";
        } else if (axiosError.response?.data?.data?.answer) {
          content = axiosError.response.data.data.answer;
        } else if (axiosError.response?.data?.message) {
          content = axiosError.response.data.message;
        }

        setMessages((prev) =>
          prev.map((m) =>
            m.id === loadingMsg.id
              ? {
                  ...m,
                  isLoading: false,
                  content,
                  response_type: "text",
                }
              : m,
          ),
        );
      } finally {
        setIsLoading(false);
      }
    },
    [
      addItem,
      fallbackCheckoutItems,
      inputValue,
      isLoading,
      mounted,
      removeItem,
      sessionId,
    ],
  );

  const handleBuyNow = useCallback(
    (product: ChatProductCard) => {
      if (!mounted) return;

      if (product.stock <= 0) {
        toast.error("Sản phầm đã hết hàng");
        return;
      }

      addItem(createCartItemFromProduct(product));
      toast.success(`Đã thêm "${product.name}". Mở thanh toán...`);

      const checkoutItem = createCheckoutItemFromProduct(product);
      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: `Mua ngay: ${product.name}`,
        timestamp: Date.now(),
      };

      const botMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "bot",
        content: "Mình đã chuẩn bị thanh toán cho sản phẩm bạn vừa chọn.",
        response_type: "checkout_form",
        data: {
          cart_items: [checkoutItem],
        },
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMsg, botMsg]);
    },
    [
      addItem,
      createCartItemFromProduct,
      createCheckoutItemFromProduct,
      mounted,
    ],
  );

  const handleCheckoutSubmit = useCallback(
    async (payload: CheckoutSubmitPayload) => {
      if (checkoutSubmitLockRef.current || checkoutSubmitting) {
        return;
      }

      checkoutSubmitLockRef.current = true;
      setCheckoutSubmitting(true);

      try {
        const order = await orderService.createOrder(payload);

        // Thanh toán trực tuyến: chuyển sang cổng VNPay / MoMo.
        if (isOnlinePayment(order.payment_method)) {
          if (!order.payment_url) {
            throw new Error(
              `Không thể khởi tạo phiên thanh toán ${onlinePaymentLabel(order.payment_method)}. Vui lòng thử lại.`,
            );
          }

          saveOrderForInvoice(order);
          setRetryCheckoutPayload(null);
          toast.success(
            `Đang chuyển sang cổng thanh toán ${onlinePaymentLabel(order.payment_method)}...`,
          );
          if (typeof window !== "undefined") {
            window.location.href = order.payment_url;
          }
          return;
        }

        toast.success(`Đặt hàng thành công! Mã đơn #${order.id}`);

        // COD: tạo đơn xong là hoàn tất, có thể xóa giỏ.
        clearCart();
        setRetryCheckoutPayload(null);

        const paymentMethodLabel =
          PAYMENT_METHOD_LABEL[order.payment_method] ?? order.payment_method;

        const successMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: "bot",
          content: [
            `Đặt hàng thành công! Mã đơn của bạn là #${order.id}.`,
            `Tổng tiền: ${formatVnd(order.total_amount)}.`,
            `Phương thức thanh toán: ${paymentMethodLabel}.`,
            "Bạn có thể theo dõi tại mục Đơn hàng của tôi.",
          ].join("\n"),
          response_type: "text",
          timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, successMessage]);
      } catch (error) {
        const mappedError = mapCheckoutError(error);
        toast.error(mappedError.message);

        if (mappedError.retryable) {
          setRetryCheckoutPayload(payload);
        } else {
          setRetryCheckoutPayload(null);
        }

        const errorMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: "bot",
          content: mappedError.retryable
            ? `${mappedError.message}\nBạn có thể bấm "Thử lại đặt hàng" để gửi lại nhanh.`
            : mappedError.message,
          response_type: "text",
          timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        checkoutSubmitLockRef.current = false;
        setCheckoutSubmitting(false);
      }
    },
    [checkoutSubmitting, clearCart],
  );

  const handleBackToShopping = useCallback(() => {
    void handleSend("Gợi ý sản phẩm phù hợp cho tôi");
  }, [handleSend]);

  const handleQuickSuggestion = useCallback(
    async (text: string) => {
      if (isLoading) return;
      setInputValue(text);
      await handleSend(text);
    },
    [handleSend, isLoading],
  );

  const handleCheckoutQuickAction = useCallback(
    async (action: "buy_now" | "checkout") => {
      if (isLoading) return;

      if (action === "checkout") {
        await handleSend("Thanh toán giỏ hàng");
        return;
      }

      await handleSend("Mua ngay sản phẩm trong giỏ hàng");
    },
    [handleSend, isLoading],
  );

  const handleOpenOrder = useCallback(
    (orderId: number) => {
      if (!Number.isFinite(orderId) || orderId <= 0) {
        toast.error("Mã đơn hàng không hợp lệ");
        return;
      }

      void handleSend(`Chi tiết đơn #${orderId}`);
    },
    [handleSend],
  );

  const handleReorderFromChat = useCallback(
    (order: ChatOrderDetail) => {
      if (!mounted) {
        toast.error("Vui lòng thử lại sau khi trang tải xong.");
        return;
      }

      const items = Array.isArray(order.items) ? order.items : [];
      let addedCount = 0;

      items.forEach((item) => {
        const productId = Number(item.product_id);
        const quantity = Number(item.quantity);
        const unitPrice = Number(item.unit_price);

        if (
          !Number.isFinite(productId) ||
          productId <= 0 ||
          !Number.isFinite(quantity) ||
          quantity <= 0 ||
          !Number.isFinite(unitPrice) ||
          unitPrice < 0
        ) {
          return;
        }

        addItem({
          id: productId,
          productId,
          name: item.product_name ?? `Sản phẩm #${productId}`,
          price: unitPrice,
          image: getAbsoluteImageUrl(item.image_url),
          slug: item.product_slug ?? `product-${productId}`,
          quantity,
        });
        addedCount += 1;
      });

      if (addedCount === 0) {
        const failText =
          "Không thể mua lại vì đơn hàng không có sản phẩm hợp lệ.";
        toast.error(failText);
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "bot",
            content: failText,
            response_type: "text",
            timestamp: Date.now(),
          },
        ]);
        return;
      }

      const successText = `Đã thêm ${addedCount} sản phẩm vào giỏ hàng.`;
      toast.success(successText);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "bot",
          content: `${successText} Bạn có thể kiểm tra lại trước khi thanh toán nhé.`,
          response_type: "text",
          timestamp: Date.now(),
        },
      ]);

      router.push("/cart");
    },
    [addItem, mounted, router],
  );

  const handleViewOrderPage = useCallback(
    (orderId: number) => {
      if (!Number.isFinite(orderId) || orderId <= 0) {
        toast.error("Mã đơn hàng không hợp lệ, chuyển về danh sách đơn hàng.");
        router.push("/account/orders");
        return;
      }

      router.push(`/account/orders/${orderId}`);
    },
    [router],
  );

  const handleRetryPaymentFromChat = useCallback(
    async (order: ChatOrderDetail) => {
      if (!order || !isOnlinePayment(order.payment_method)) return;
      if (String(order.status).toLowerCase() !== "pending") {
        toast.error("Đơn hàng này không còn ở trạng thái chờ thanh toán lại.");
        return;
      }

      try {
        const result = await orderService.retryPayment(order.id);
        toast.success(
          `Đang chuyển đến cổng thanh toán ${onlinePaymentLabel(order.payment_method)}...`,
        );
        if (typeof window !== "undefined") {
          window.location.href = result.payment_url;
        }
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : "Không thể tạo lại link thanh toán cho đơn hàng.";
        toast.error(message);
      }
    },
    [],
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
        <div
          className={`flex flex-col bg-white shadow-2xl rounded-2xl overflow-hidden border border-slate-100 relative animate-fade-in-up origin-bottom-right transition-all duration-200 ${
            isExpanded
              ? "w-[92vw] sm:w-[760px] h-[88vh] max-h-[92vh]"
              : "w-[350px] sm:w-[400px] h-[600px] max-h-[85vh]"
          }`}
        >
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
                  Đá muối trợ lý AI
                </h3>
                <span className="text-primary/70 text-xs font-medium flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-primary inline-block"></span>
                  Đang hoạt động
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => void handleNewConversation()}
                className="text-slate-400 hover:text-slate-900 transition-colors p-1 rounded-full hover:bg-black/5"
                title="Cuộc trò chuyện mới"
                aria-label="Cuộc trò chuyện mới"
              >
                <span className="material-symbols-outlined text-[20px]">
                  restart_alt
                </span>
              </button>
              <button
                onClick={() => setIsExpanded((v) => !v)}
                className="text-slate-400 hover:text-slate-900 transition-colors p-1 rounded-full hover:bg-black/5"
                title={
                  isExpanded ? "Thu nhỏ khung chat" : "Phóng to khung chat"
                }
                aria-label={
                  isExpanded ? "Thu nhỏ khung chat" : "Phóng to khung chat"
                }
              >
                <span className="material-symbols-outlined">
                  {isExpanded ? "close_fullscreen" : "open_in_full"}
                </span>
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-900 transition-colors p-1 rounded-full hover:bg-black/5"
                title="Đóng khung chat"
                aria-label="Đóng khung chat"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
          </header>

          {/* Chat Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 scrollbar-hide">
            {/* Date Separator */}
            <div className="flex justify-center">
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider bg-black/5 px-3 py-1 rounded-full">
                Hôm nay
              </span>
            </div>

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${msg.role === "user" ? "justify-end" : ""}`}
              >
                {msg.role === "bot" && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0 text-primary">
                    <span className="material-symbols-outlined text-lg">
                      smart_toy
                    </span>
                  </div>
                )}

                <div
                  className={`flex flex-col gap-1 max-w-[85%] ${msg.role === "user" ? "items-end" : ""}`}
                >
                  {msg.role === "bot" && (
                    <span className="text-[11px] text-slate-500 ml-1">
                      Trợ lý AI
                    </span>
                  )}
                  <MessageRenderer
                    message={msg}
                    onAddToCart={handleAddProductToCart}
                    onViewDetail={handleViewProductDetail}
                    onBuyNow={handleBuyNow}
                    onOpenOrder={handleOpenOrder}
                    onReorderFromChat={handleReorderFromChat}
                    onRetryPaymentFromChat={handleRetryPaymentFromChat}
                    onViewOrderPage={handleViewOrderPage}
                    onCheckoutSubmit={handleCheckoutSubmit}
                    checkoutSubmitting={checkoutSubmitting}
                    fallbackCartItems={fallbackCheckoutItems}
                    onBackToShopping={handleBackToShopping}
                    defaultName={user?.name ?? ""}
                    defaultPhone={user?.phone ?? ""}
                    defaultAddress={user?.address ?? ""}
                    mounted={mounted}
                  />
                  {msg.role === "user" && (
                    <span className="text-[10px] text-slate-500 mr-1">
                      {new Date(msg.timestamp).toLocaleTimeString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  )}
                </div>
              </div>
            ))}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white border-t border-slate-100">
            {/* Quick Suggestions */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide shrink-0">
              {quickSuggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => void handleQuickSuggestion(suggestion)}
                  disabled={isLoading}
                  className="shrink-0 px-3 py-1.5 rounded-full border border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary text-xs font-medium transition-colors disabled:opacity-50"
                >
                  {suggestion}
                </button>
              ))}

              <button
                onClick={() => void handleCheckoutQuickAction("checkout")}
                disabled={isLoading}
                className="shrink-0 px-3 py-1.5 rounded-full border border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary text-xs font-medium transition-colors disabled:opacity-50"
              >
                Thanh toán
              </button>
              <button
                onClick={() => void handleQuickSuggestion("Xem giỏ hàng")}
                disabled={isLoading}
                className="shrink-0 px-3 py-1.5 rounded-full border border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary text-xs font-medium transition-colors disabled:opacity-50"
              >
                Xem giỏ hàng
              </button>
            </div>

            {retryCheckoutPayload && (
              <div className="pb-2">
                <button
                  onClick={() =>
                    void handleCheckoutSubmit(retryCheckoutPayload)
                  }
                  disabled={checkoutSubmitting}
                  className="w-full px-3 py-2 rounded-lg border border-orange-200 bg-orange-50 text-orange-700 text-xs font-semibold hover:bg-orange-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {checkoutSubmitting ? "Đang thử lại..." : "Thử lại đặt hàng"}
                </button>
              </div>
            )}

            {/* Input Form */}
            <div className="flex items-end gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all shadow-inner">
              <button className="p-1.5 text-slate-400 hover:text-primary transition-colors rounded-lg">
                <span className="material-symbols-outlined text-[20px]">
                  attach_file
                </span>
              </button>
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void handleSend();
                  }
                }}
                disabled={isLoading}
                className="w-full bg-transparent border-0 focus:ring-0 p-1.5 text-sm text-slate-900 outline-none placeholder-slate-400 resize-none max-h-20 overflow-y-auto"
                placeholder="Hỏi tôi bất cứ điều gì..."
                rows={1}
                style={{ minHeight: "36px" }}
              />
              <button
                onClick={() => void handleSend()}
                disabled={isLoading || !inputValue.trim()}
                className="p-2 bg-primary hover:bg-orange-600 text-white rounded-lg shadow-sm transition-all active:scale-95 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-[18px]">
                  send
                </span>
              </button>
            </div>
            <div className="text-center mt-2 space-y-0.5">
              {llmInfo && (
                <p
                  className="text-[10px] text-slate-500 font-mono truncate px-2"
                  title={`${llmInfo.llm_model} (${llmInfo.llm_provider})`}
                >
                  Model: {llmInfo.llm_model}
                  <span className="text-slate-400">
                    {" "}
                    · {llmInfo.llm_provider}
                  </span>
                </p>
              )}
              <span className="text-[10px] text-slate-400 block">
                Được hỗ trợ bởi Quang
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
