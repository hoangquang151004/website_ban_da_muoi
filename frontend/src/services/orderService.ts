import httpClient from "@/lib/httpClient";
import type { Order, PaginatedResponse } from "@/types";

interface CreateOrderPayload {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  note?: string;
  items: {
    productId: number;
    quantity: number;
  }[];
}

interface OrdersQuery {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}

interface BackendResponse<T> {
  status: string;
  message: string;
  data: T;
}

interface BackendPaginatedResponse<T> {
  status: string;
  message: string;
  data: {
    items: T[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

export interface OrderStats {
  pending: number;
  confirmed: number;
  packing: number;
  shipping: number;
  delivered: number;
  cancelled: number;
  total: number;
}

export interface OrderAdminDetail {
  id: number;
  status: string;
  payment_method: string;
  receiver_name: string;
  receiver_phone: string;
  receiver_address: string;
  note?: string;
  total_amount: string | number;
  created_at: string;
  user?: { email: string };
  items: {
    id: number;
    product_id: number;
    product_name: string;
    product_image?: string;
    quantity: number;
    unit_price: string | number;
    subtotal: string | number;
  }[];
}

export const orderService = {
  /**
   * Tạo đơn hàng mới từ giỏ hàng
   */
  async createOrder(payload: CreateOrderPayload): Promise<Order> {
    const { data } = await httpClient.post<Order>("/orders", payload);
    return data;
  },

  /**
   * Lấy danh sách đơn hàng của user hiện tại
   */
  async getMyOrders(params?: OrdersQuery): Promise<PaginatedResponse<Order>> {
    const { data } = await httpClient.get<PaginatedResponse<Order>>(
      "/orders/me",
      { params },
    );
    return data;
  },

  /**
   * Lấy chi tiết đơn hàng
   */
  async getOrderById(id: number): Promise<Order> {
    const { data } = await httpClient.get<Order>(`/orders/${id}`);
    return data;
  },

  // --- Admin methods ---

  /**
   * Lấy tất cả đơn hàng (admin)
   */
  async getAllOrders(params?: OrdersQuery): Promise<PaginatedResponse<Order>> {
    const { data } = await httpClient.get<BackendPaginatedResponse<Order>>(
      "/admin/orders",
      {
        params,
      },
    );
    return {
      data: data.data.items,
      total: data.data.total,
      page: data.data.page,
      limit: data.data.limit,
      totalPages: data.data.total_pages,
    };
  },

  /**
   * Lấy chi tiết đơn hàng (admin)
   */
  async getAdminOrderDetail(id: number): Promise<OrderAdminDetail> {
    const { data } = await httpClient.get<BackendResponse<OrderAdminDetail>>(
      `/admin/orders/${id}`,
    );
    return data.data;
  },

  /**
   * Cập nhật trạng thái đơn hàng (admin)
   */
  async updateOrderStatus(id: number, status: Order["status"]): Promise<Order> {
    const { data } = await httpClient.put<BackendResponse<Order>>(
      `/admin/orders/${id}/status`,
      {
        status,
      },
    );
    return data.data;
  },

  /**
   * Lấy thống kê đơn hàng theo trạng thái (admin)
   */
  async getAdminOrderStats(): Promise<OrderStats> {
    const { data } = await httpClient.get<BackendResponse<OrderStats>>(
      "/admin/orders/stats",
    );
    return data.data;
  },
};
