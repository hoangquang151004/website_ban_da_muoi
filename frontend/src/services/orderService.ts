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
    const { data } = await httpClient.get<PaginatedResponse<Order>>("/orders", {
      params,
    });
    return data;
  },

  /**
   * Cập nhật trạng thái đơn hàng (admin)
   */
  async updateOrderStatus(id: number, status: Order["status"]): Promise<Order> {
    const { data } = await httpClient.patch<Order>(`/orders/${id}/status`, {
      status,
    });
    return data;
  },
};
