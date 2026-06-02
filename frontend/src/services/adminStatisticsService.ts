import httpClient from "@/lib/httpClient";

// ─── Types ────────────────────────────────────────────────────

export interface StatisticsOverview {
  today_revenue: number;
  today_orders: number;
  pending_orders: number;
  total_customers: number;
  total_products_active: number;
  low_stock_count: number;
}

export interface StatisticsKPI {
  total_revenue: number;
  gross_profit: number;
  total_cost: number;
  avg_order_value: number;
  completed_orders: number;
  new_customers: number;
  growth_pct: number;
}

export interface RevenuePoint {
  label: string;
  revenue: number;
  order_count: number;
}

export interface OrderStatusItem {
  status: string;
  count: number;
  percentage: number;
}

export interface TopProductItem {
  product_id: number;
  product_name: string;
  total_sold: number;
  total_revenue: number;
}

export interface CategoryRevenueItem {
  category_id: number;
  category_name: string;
  qty_sold: number;
  revenue: number;
  cost: number;
  profit: number;
  margin_pct: number;
}

export interface ProductStatsItem {
  product_id: number;
  product_name: string;
  category_name: string;
  qty_sold: number;
  revenue: number;
  cost: number;
  profit: number;
  margin_pct: number;
}

export interface CustomerStatsItem {
  customer_id: number | null;
  customer_name: string;
  customer_email: string | null;
  order_count: number;
  total_revenue: number;
  avg_order_value: number;
}

export type ChartPeriod = "daily" | "weekly" | "monthly";
export type StatsTab = "category" | "product" | "customer";

// ─── Service ────────────────────────────────────────────────

export const adminStatisticsService = {
  async getOverview(): Promise<StatisticsOverview> {
    const res = await httpClient.get("/admin/statistics/overview");
    return res.data.data;
  },

  async getKPI(dateFrom: string, dateTo: string): Promise<StatisticsKPI> {
    const res = await httpClient.get("/admin/statistics/kpi", {
      params: { date_from: dateFrom, date_to: dateTo },
    });
    return res.data.data;
  },

  async getRevenueChart(
    period: ChartPeriod,
    dateFrom: string,
    dateTo: string,
  ): Promise<RevenuePoint[]> {
    const res = await httpClient.get("/admin/statistics/revenue", {
      params: { period, date_from: dateFrom, date_to: dateTo },
    });
    return res.data.data;
  },

  async getOrderStatus(
    dateFrom: string,
    dateTo: string,
  ): Promise<OrderStatusItem[]> {
    const res = await httpClient.get("/admin/statistics/order-status", {
      params: { date_from: dateFrom, date_to: dateTo },
    });
    return res.data.data;
  },

  async getTopProducts(
    dateFrom?: string,
    dateTo?: string,
    limit = 5,
  ): Promise<TopProductItem[]> {
    const res = await httpClient.get("/admin/statistics/top-products", {
      params: { date_from: dateFrom, date_to: dateTo, limit },
    });
    return res.data.data;
  },

  async getCategoryRevenue(
    dateFrom: string,
    dateTo: string,
  ): Promise<CategoryRevenueItem[]> {
    const res = await httpClient.get("/admin/statistics/category-revenue", {
      params: { date_from: dateFrom, date_to: dateTo },
    });
    return res.data.data;
  },

  async getProductStats(
    dateFrom: string,
    dateTo: string,
    limit = 50,
  ): Promise<ProductStatsItem[]> {
    const res = await httpClient.get("/admin/statistics/by-product", {
      params: { date_from: dateFrom, date_to: dateTo, limit },
    });
    return res.data.data;
  },

  async getCustomerStats(
    dateFrom: string,
    dateTo: string,
    limit = 50,
  ): Promise<CustomerStatsItem[]> {
    const res = await httpClient.get("/admin/statistics/by-customer", {
      params: { date_from: dateFrom, date_to: dateTo, limit },
    });
    return res.data.data;
  },
};
