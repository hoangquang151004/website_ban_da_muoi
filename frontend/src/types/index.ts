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
  rating: number;
  reviewCount: number;
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
  address?: string;
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

export type PaymentMethod = "cod" | "bank_transfer";

export interface OrderItem {
  id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  subtotal: number;
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
