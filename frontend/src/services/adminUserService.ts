import httpClient from "@/lib/httpClient";

export interface AdminUser {
  id: number;
  full_name: string;
  email: string;
  phone?: string;
  address?: string;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  order_count: number;
  total_spent: number;
}

export interface GetAdminUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  is_active?: boolean;
  sort_by?: string;
  tier?: string;
}

export interface PaginatedAdminUsers {
  items: AdminUser[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface CreateAdminUserPayload {
  full_name: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
}

export const adminUserService = {
  async getUsers(params?: GetAdminUsersParams): Promise<PaginatedAdminUsers> {
    const { data } = await httpClient.get<{ data: PaginatedAdminUsers }>("/admin/users", { params });
    return data.data;
  },

  async toggleStatus(id: number, is_active: boolean): Promise<AdminUser> {
    const { data } = await httpClient.put<{ data: AdminUser }>(`/admin/users/${id}/status`, { is_active });
    return data.data;
  },

  async createUser(payload: CreateAdminUserPayload): Promise<AdminUser> {
    const { data } = await httpClient.post<{ data: AdminUser }>("/admin/users", payload);
    return data.data;
  }
};
