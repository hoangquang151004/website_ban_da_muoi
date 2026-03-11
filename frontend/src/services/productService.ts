import httpClient from "@/lib/httpClient";
import type { Product, Category, PaginatedResponse } from "@/types";

interface ProductsQuery {
  page?: number;
  limit?: number;
  category?: string;
  category_slug?: string;
  sort?: "price_asc" | "price_desc" | "newest" | "bestseller";
  sort_by?: string;
  q?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  [key: string]: unknown;
}

export const productService = {
  /**
   * Lấy danh sách sản phẩm với phân trang và bộ lọc
   */
  async getProducts(
    params?: ProductsQuery | Record<string, unknown>,
  ): Promise<PaginatedResponse<Product>> {
    const { data } = await httpClient.get<PaginatedResponse<Product>>(
      "/products",
      { params },
    );
    return data;
  },

  /**
   * Lấy danh sách danh mục
   */
  async getCategories(): Promise<Category[]> {
    const { data } = await httpClient.get("/categories");
    return data;
  },

  /**
   * Lấy danh sách công dụng (uses)
   */
  async getUses(): Promise<{ id: number; name: string; icon: string; color: string; description: string }[]> {
    const { data } = await httpClient.get("/uses");
    return data;
  },

  /**
   * Lấy chi tiết sản phẩm theo slug
   * Backend trả BaseResponse<ProductResponse> → unwrap .data
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getProductBySlug(slug: string): Promise<any> {
    const { data } = await httpClient.get(`/products/${slug}`);
    // data là BaseResponse { status, data: ProductResponse, message }
    return data?.data ?? data;
  },

  /**
   * Lấy sản phẩm nổi bật (admin)
   */
  async getFeaturedProducts(): Promise<Product[]> {
    const { data } = await httpClient.get<Product[]>("/products/featured");
    return data;
  },

  /**
   * Submit review for a product
   */
  async submitReview(productId: number, payload: { rating: number; comment: string }) {
    const { data } = await httpClient.post(`/products/${productId}/reviews`, payload);
    return data?.data ?? data;
  },

  /**
   * Cập nhật đánh giá
   */
  async editReview(reviewId: number, payload: { rating: number; comment: string }) {
    const { data } = await httpClient.put(`/reviews/${reviewId}`, payload);
    return data?.data ?? data;
  },

  /**
   * Xóa đánh giá
   */
  async deleteReview(reviewId: number) {
    await httpClient.delete(`/reviews/${reviewId}`);
  },

  // --- Admin methods ---

  /**
   * Lấy danh sách sản phẩm (admin, có phân trang và bộ lọc)
   */
  async listAdminProducts(params?: {
    page?: number;
    limit?: number;
    search?: string;
    category_id?: number;
    is_active?: boolean;
  }) {
    const { data } = await httpClient.get("/admin/products", { params });
    return (data?.data ?? data) as {
      items: AdminProductItem[];
      total: number;
      page: number;
      limit: number;
      total_pages: number;
    };
  },

  /**
   * Tạo sản phẩm mới (admin)
   */
  async createProduct(payload: AdminProductPayload): Promise<AdminProductItem> {
    const { data } = await httpClient.post("/admin/products", payload);
    return (data?.data ?? data) as AdminProductItem;
  },

  /**
   * Cập nhật sản phẩm (admin)
   */
  async updateProduct(
    id: number,
    payload: Partial<AdminProductPayload>,
  ): Promise<AdminProductItem> {
    const { data } = await httpClient.put(`/admin/products/${id}`, payload);
    return (data?.data ?? data) as AdminProductItem;
  },

  /**
   * Xóa sản phẩm (admin)
   */
  async deleteProduct(id: number): Promise<void> {
    await httpClient.delete(`/admin/products/${id}`);
  },

  /**
   * Upload ảnh lên server (admin)
   */
  async uploadImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await httpClient.post("/admin/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return ((data?.data?.url ?? data?.url) as string) ?? "";
  },
};

// --- Admin-specific types ---

export interface AdminProductItem {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  original_price: number | null;
  stock: number;
  image_url: string | null;
  model_3d_url: string | null;
  is_featured: boolean;
  is_active: boolean;
  category_id: number;
  category: { id: number; name: string; slug: string } | null;
  uses: { id: number; name: string; icon: string; color: string }[];
  images: { id: number; image_url: string }[];
}

export interface AdminProductPayload {
  name: string;
  description: string;
  price: number;
  original_price?: number | null;
  stock: number;
  image_url?: string | null;
  model_3d_url?: string | null;
  is_featured?: boolean;
  is_active: boolean;
  category_id: number;
  use_ids?: number[];
  additional_images?: string[];
  sku?: string;
  slug?: string;
}
