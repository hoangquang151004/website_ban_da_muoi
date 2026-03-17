import httpClient from "@/lib/httpClient";

// ─── Types ────────────────────────────────────────────────────

export interface StockReportItem {
  product_id: number;
  product_name: string;
  category_name: string;
  image_url: string | null;
  current_stock: number;
  min_stock: number;
  price: number;
  cost_price: number | null;
  stock_value: number;
  low_stock: boolean;
}

export interface StockSummary {
  total_products: number;
  total_stock: number;
  low_stock_count: number;
  out_of_stock_count: number;
  total_stock_value: number;
  new_imported: number;
}

export interface StockLogItem {
  id: number;
  product_id: number;
  product_name: string;
  change_amount: number;
  reason: "purchase" | "restock" | "adjustment";
  reference_id: number | null;
  note: string | null;
  created_at: string;
}

export interface PaginatedStockLogs {
  items: StockLogItem[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface GetStockParams {
  sort_asc?: boolean;
  category_id?: number;
  status?: "in_stock" | "low_stock" | "out_of_stock";
}

export interface RestockPayload {
  product_id: number;
  quantity: number;
  note?: string;
  unit_cost?: number;
}

export type WriteOffReason = "damaged" | "expired" | "lost" | "other";

export interface WriteOffPayload {
  product_id: number;
  quantity: number;
  write_off_reason: WriteOffReason;
  note?: string;
}

export interface GetStockLogsParams {
  page?: number;
  limit?: number;
  product_id?: number;
  reason?: "purchase" | "restock" | "adjustment";
  date_from?: string;
  date_to?: string;
}

// ─── Service ────────────────────────────────────────────────

export const adminStockService = {
  async getSummary(): Promise<StockSummary> {
    const { data } = await httpClient.get<{ data: StockSummary }>(
      "/admin/stock/summary",
    );
    return data.data;
  },

  async getStockReport(params?: GetStockParams): Promise<StockReportItem[]> {
    const { data } = await httpClient.get<{ data: StockReportItem[] }>(
      "/admin/stock",
      { params },
    );
    return data.data;
  },

  async restock(payload: RestockPayload): Promise<StockReportItem> {
    const { data } = await httpClient.post<{ data: StockReportItem }>(
      "/admin/stock/restock",
      payload,
    );
    return data.data;
  },

  async updateMinStock(
    productId: number,
    minStock: number,
  ): Promise<StockReportItem> {
    const { data } = await httpClient.patch<{ data: StockReportItem }>(
      `/admin/stock/${productId}/min-stock`,
      { min_stock: minStock },
    );
    return data.data;
  },

  async updateCostPrice(
    productId: number,
    costPrice: number | null,
  ): Promise<StockReportItem> {
    const { data } = await httpClient.patch<{ data: StockReportItem }>(
      `/admin/stock/${productId}/cost-price`,
      { cost_price: costPrice },
    );
    return data.data;
  },

  async writeOff(payload: WriteOffPayload): Promise<StockReportItem> {
    const { data } = await httpClient.post<{ data: StockReportItem }>(
      "/admin/stock/write-off",
      payload,
    );
    return data.data;
  },

  async getStockLogs(params?: GetStockLogsParams): Promise<PaginatedStockLogs> {
    const { data } = await httpClient.get<{ data: PaginatedStockLogs }>(
      "/admin/stock/logs",
      { params },
    );
    return data.data;
  },
};
