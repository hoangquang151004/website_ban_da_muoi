import httpClient from "@/lib/httpClient";

// ─── Types ────────────────────────────────────────────────────

export interface CategoryRow {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  product_count: number;
}

export interface UseRow {
  id: number;
  name: string;
  icon: string;
  color: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export interface CategoryCreatePayload {
  name: string;
  slug?: string;
  description?: string;
  image_url?: string;
  is_active?: boolean;
}

export interface UseCreatePayload {
  name: string;
  icon: string;
  color: string;
  description?: string;
  is_active?: boolean;
}

// ─── Service ────────────────────────────────────────────────

export const catalogService = {
  // --- Categories ---

  async listCategories(params?: {
    page?: number;
    limit?: number;
    search?: string;
    is_active?: boolean;
  }) {
    const { data } = await httpClient.get("/admin/categories", { params });
    // BaseResponse<PaginatedData<CategoryResponse>>
    return (data?.data ?? data) as {
      items: CategoryRow[];
      total: number;
      page: number;
      total_pages: number;
    };
  },

  async createCategory(payload: CategoryCreatePayload): Promise<CategoryRow> {
    const { data } = await httpClient.post("/admin/categories", payload);
    return (data?.data ?? data) as CategoryRow;
  },

  async updateCategory(
    id: number,
    payload: Partial<CategoryCreatePayload>,
  ): Promise<CategoryRow> {
    const { data } = await httpClient.put(`/admin/categories/${id}`, payload);
    return (data?.data ?? data) as CategoryRow;
  },

  async toggleCategoryStatus(
    id: number,
    is_active: boolean,
  ): Promise<CategoryRow> {
    const { data } = await httpClient.patch(`/admin/categories/${id}/status`, {
      is_active,
    });
    return (data?.data ?? data) as CategoryRow;
  },

  async deleteCategory(id: number): Promise<void> {
    await httpClient.delete(`/admin/categories/${id}`);
  },

  // --- Uses ---

  async listUses(params?: {
    page?: number;
    limit?: number;
    search?: string;
    is_active?: boolean;
  }) {
    const { data } = await httpClient.get("/admin/uses", { params });
    // Always return paginated response from backend
    return (data?.data ?? data) as {
      items: UseRow[];
      total: number;
      page: number;
      total_pages: number;
    };
  },

  async createUse(payload: UseCreatePayload): Promise<UseRow> {
    const { data } = await httpClient.post("/admin/uses", payload);
    return (data?.data ?? data) as UseRow;
  },

  async updateUse(
    id: number,
    payload: Partial<UseCreatePayload>,
  ): Promise<UseRow> {
    const { data } = await httpClient.put(`/admin/uses/${id}`, payload);
    return (data?.data ?? data) as UseRow;
  },

  async toggleUseStatus(id: number, is_active: boolean): Promise<UseRow> {
    const { data } = await httpClient.patch(`/admin/uses/${id}/status`, {
      is_active,
    });
    return (data?.data ?? data) as UseRow;
  },

  async deleteUse(id: number): Promise<void> {
    await httpClient.delete(`/admin/uses/${id}`);
  },
};
