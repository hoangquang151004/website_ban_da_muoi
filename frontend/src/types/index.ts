// Category type
export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  is_active?: boolean;
}

// Product types
export interface Product {
  id: number;
  name: string;
  slug: string;
  price: number;
  originalPrice?: number;
  original_price?: number | null;
  images: string[];
  image_url?: string | null;
  category: string;
  category_id?: number;
  description: string;
  rating?: number;
  reviewCount?: number;
  average_rating?: number | null;
  review_count?: number;
  stock: number;
  sku: string;
  isActive: boolean;
  is_active?: boolean;
  is_featured?: boolean;
  badge?: string;
}

// Cart types
export interface CartItem {
  id: number;
  productId: number;
  name: string;
  price: number;
  image: string;
  quantity: number;
  slug: string;
}

// User / Auth types
export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  date_of_birth?: string | null;
  gender?: "male" | "female" | "other" | null;
  avatar_url?: string | null;
  address?: string;
  ward?: string | null;
  district?: string | null;
  city?: string | null;
  postal_code?: string | null;
  address_note?: string | null;
  role: "customer" | "admin";
  avatar?: string;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

// Order types
export type OrderStatus =
  | "pending"
  | "confirmed"
  | "packing"
  | "shipping"
  | "delivered"
  | "cancelled";

export type PaymentMethod = "cod" | "bank_transfer" | "vnpay" | "momo";

export interface CheckoutSubmitPayload {
  receiver_name: string;
  receiver_phone: string;
  receiver_address: string;
  note?: string;
  payment_method: PaymentMethod;
  items: Array<{
    product_id: number;
    quantity: number;
  }>;
}

export interface OrderItem {
  id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  subtotal: number;
  product_name?: string | null;
  image_url?: string | null;
  product_slug?: string | null;
}

export interface Order {
  id: number;
  user_id: number | null;
  receiver_name: string;
  receiver_phone: string;
  receiver_address: string;
  note?: string | null;
  payment_method: PaymentMethod;
  status: OrderStatus;
  total_amount: number;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
}

// Review types
export interface Review {
  id: number;
  productId: number;
  userId: number;
  customerName: string;
  avatar?: string;
  rating: number;
  comment: string;
  isApproved: boolean;
  createdAt: string;
}

// API response wrapper
export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================================
// Chat / Chatbot types
// ============================================================

/** Tuong ung voi ResponseType Literal o Backend */
export type ChatResponseType =
  | "text" // Cau tra loi van ban / RAG
  | "product_cards" // Danh sach san pham
  | "cart_view" // Xem gio hang (chi hien thi danh sach gio)
  | "checkout_form" // Form checkout nhung
  | "order_list" // Danh sach don hang
  | "order_detail" // Chi tiet 1 don hang
  | "stats"; // Widgets thong ke admin

/** Product nho gon dung trong product card cua chat */
export interface ChatProductCard {
  id: number;
  name: string;
  price: number;
  image_url: string | null;
  slug: string;
  stock: number;
  short_description?: string | null;
}

/** Tom tat don hang trong chat (cho order_list) */
export interface ChatOrderSummary {
  id: number;
  status: string;
  total_amount: number;
  created_at: string;
  items_count?: number;
  first_item_name?: string | null;
  first_item_image_url?: string | null;
}

/** Chi tiet don hang trong chat (cho order_detail) */
export interface ChatOrderDetail {
  id: number;
  status: string;
  total_amount: number;
  receiver_name: string;
  receiver_phone: string;
  receiver_address: string;
  payment_method: string;
  note?: string | null;
  created_at: string;
  items: Array<{
    product_id?: number;
    product_name: string | null;
    quantity: number;
    unit_price: number;
    subtotal: number;
    product_slug?: string | null;
    image_url?: string | null;
  }>;
}

export interface ChatCheckoutItem {
  product_id: number;
  product_name: string;
  product_slug: string;
  image_url: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
}

/** Du lieu thong ke (cho stats widget) */
export type ChatStatsWidgetType =
  | "kpi"
  | "revenue_chart"
  | "top_products"
  | "order_status"
  | "table";

export interface ChatResponseMeta {
  source?: "rest" | "text_to_sql";
  rag_status?: "ok" | "no_context" | "error" | "off_topic" | "redirect";
  chat_error?: boolean;
  search_filters?: Record<string, unknown>;
  llm_provider?: string;
  llm_model?: string;
  intent_mode?: string;
  aggregated_confidence?: number;
  intent_votes?: Array<{
    lens?: string | null;
    intent?: string;
    confidence?: number;
    reasoning?: string;
  }>;
}

/** @deprecated Dùng ChatResponseMeta */
export type ChatStatsMeta = ChatResponseMeta;

export interface ChatLlmInfo {
  llm_provider: string;
  llm_model: string;
}

export type ChatStatsItem = Record<string, unknown>;

export interface ChatStatsData {
  widget_type: ChatStatsWidgetType;
  items?: ChatStatsItem[];
  rows?: Record<string, unknown>[];
  summary?: Record<string, unknown> | null;
  sql_query?: string | null;
  date_from?: string;
  date_to?: string;
}

/** Response tra ve tu POST /api/v1/chat */
export interface ChatApiResponse {
  answer: string;
  response_type: ChatResponseType;
  intent?: string | null;
  // product_cards
  products?: ChatProductCard[] | null;
  sources?: Array<{ title: string; snippet: string }> | null;
  // checkout_form
  cart_updated?: boolean | null;
  cart_removed?: boolean | null;
  cart_item?: {
    product_id: number;
    quantity: number;
    unit_price: number;
    product_name?: string;
    product_slug?: string;
    image_url?: string;
    price?: number;
  } | null;
  data?: {
    cart_items?: ChatCheckoutItem[] | null;
  } | null;
  // order_list / order_detail
  orders?: ChatOrderSummary[] | null;
  order_detail?: ChatOrderDetail | null;
  // stats
  stats_data?: ChatStatsData | null;
  meta?: ChatResponseMeta | null;
}

/** 1 tin nhan trong UI chat */
export interface ChatMessage {
  id: string; // uuid hoac timestamp string
  role: "user" | "bot";
  content: string; // Text hien thi
  response_type?: ChatResponseType; // Chi co o tin bot
  data?: {
    // Payload kem theo cho renderer
    products?: ChatProductCard[];
    cart_item?: ChatApiResponse["cart_item"];
    cart_items?: ChatCheckoutItem[];
    orders?: ChatOrderSummary[];
    order_detail?: ChatOrderDetail;
    stats_data?: ChatStatsData;
    meta?: ChatResponseMeta;
    sources?: ChatApiResponse["sources"];
  };
  timestamp: number; // Date.now()
  isLoading?: boolean; // Skeleton state khi cho bot reply
  isStreaming?: boolean; // Dang nhan token SSE
  streamStatus?: string; // Trang thai xu ly (retrieval, tim SP...)
}
