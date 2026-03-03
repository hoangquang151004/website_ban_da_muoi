import httpClient from "@/lib/httpClient";
import type { Product, PaginatedResponse } from "@/types";

interface ProductsQuery {
  page?: number;
  limit?: number;
  category?: string;
  sort?: "price_asc" | "price_desc" | "newest" | "bestseller";
  q?: string;
  minPrice?: number;
  maxPrice?: number;
}

export const productService = {
  /**
   * Lấy danh sách sản phẩm với phân trang và bộ lọc
   */
  async getProducts(
    params?: ProductsQuery,
  ): Promise<PaginatedResponse<Product>> {
    const { data } = await httpClient.get<PaginatedResponse<Product>>(
      "/products",
      { params },
    );
    return data;
  },

  /**
   * Lấy chi tiết sản phẩm theo slug
   */
  async getProductBySlug(slug: string): Promise<Product> {
    const { data } = await httpClient.get<Product>(`/products/${slug}`);
    return data;
  },

  /**
   * Lấy sản phẩm nổi bật (admin)
   */
  async getFeaturedProducts(): Promise<Product[]> {
    const { data } = await httpClient.get<Product[]>("/products/featured");
    return data;
  },

  // --- Admin methods ---

  /**
   * Tạo sản phẩm mới (admin)
   */
  async createProduct(payload: Partial<Product>): Promise<Product> {
    const { data } = await httpClient.post<Product>("/products", payload);
    return data;
  },

  /**
   * Cập nhật sản phẩm (admin)
   */
  async updateProduct(id: number, payload: Partial<Product>): Promise<Product> {
    const { data } = await httpClient.put<Product>(`/products/${id}`, payload);
    return data;
  },

  /**
   * Xóa sản phẩm (admin)
   */
  async deleteProduct(id: number): Promise<void> {
    await httpClient.delete(`/products/${id}`);
  },
};
