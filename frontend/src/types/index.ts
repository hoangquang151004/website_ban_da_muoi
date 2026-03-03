// Product types
export interface Product {
  id: number;
  name: string;
  slug: string;
  price: number;
  originalPrice?: number;
  images: string[];
  category: string;
  description: string;
  rating: number;
  reviewCount: number;
  stock: number;
  sku: string;
  isActive: boolean;
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
  | "processing"
  | "shipping"
  | "delivered"
  | "cancelled";

export interface OrderItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface Order {
  id: number;
  code: string;
  userId: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  note?: string;
  createdAt: string;
  updatedAt: string;
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
