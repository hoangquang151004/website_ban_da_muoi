import httpClient from "@/lib/httpClient";
import type { User } from "@/types";

interface LoginPayload {
  email: string;
  password: string;
}

interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

interface AuthResponse {
  user: User;
  token: string;
}

// Actual user shape returned by backend (uses full_name, snake_case)
interface BackendUser {
  id: number;
  full_name: string;
  email: string;
  phone?: string;
  date_of_birth?: string | null;
  gender?: "male" | "female" | "other" | null;
  avatar_url?: string | null;
  address?: string;
  ward?: string | null;
  district?: string | null;
  city?: string | null;
  postal_code?: string | null;
  address_note?: string | null;
  role: "customer" | "admin";
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** Map backend snake_case user → frontend User */
function normalizeUser(u: BackendUser): User {
  return {
    id: u.id,
    name: u.full_name,
    email: u.email,
    phone: u.phone,
    date_of_birth: u.date_of_birth,
    gender: u.gender,
    avatar_url: u.avatar_url,
    address: u.address,
    ward: u.ward,
    district: u.district,
    city: u.city,
    postal_code: u.postal_code,
    address_note: u.address_note,
    role: u.role,
    createdAt: u.created_at,
  };
}

// Shape of BaseResponse<TokenResponse> returned by backend
interface BackendTokenResponse {
  status: string;
  message: string;
  data: {
    access_token: string;
    token_type: string;
    user: BackendUser;
  };
}

// Shape of BaseResponse<UserResponse> returned by /auth/me
interface BackendUserResponse {
  status: string;
  message: string;
  data: BackendUser;
}

export const authService = {
  /**
   * Đăng nhập người dùng
   */
  async login(payload: LoginPayload): Promise<AuthResponse> {
    const { data } = await httpClient.post<BackendTokenResponse>(
      "/auth/login",
      payload,
    );
    const token = data.data.access_token;
    const user = normalizeUser(data.data.user);
    // Lưu token vào cookie để middleware có thể đọc
    if (typeof document !== "undefined") {
      document.cookie = `auth-token=${token}; path=/; max-age=${60 * 60 * 24 * 7}`;
      document.cookie = `user-role=${user.role}; path=/; max-age=${60 * 60 * 24 * 7}`;
    }
    return { token, user };
  },

  /**
   * Đăng ký tài khoản mới
   */
  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const { data } = await httpClient.post<BackendTokenResponse>(
      "/auth/register",
      // Backend expects full_name, not name
      {
        full_name: payload.name,
        email: payload.email,
        password: payload.password,
        phone: payload.phone,
      },
    );
    const token = data.data.access_token;
    const user = normalizeUser(data.data.user);
    if (typeof document !== "undefined") {
      document.cookie = `auth-token=${token}; path=/; max-age=${60 * 60 * 24 * 7}`;
      document.cookie = `user-role=${user.role}; path=/; max-age=${60 * 60 * 24 * 7}`;
    }
    return { token, user };
  },

  /**
   * Đăng xuất
   */
  logout(): void {
    if (typeof document !== "undefined") {
      document.cookie =
        "auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
      document.cookie =
        "user-role=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
    }
  },

  /**
   * Lấy thông tin người dùng hiện tại
   */
  async getMe(): Promise<User> {
    const { data } = await httpClient.get<BackendUserResponse>("/auth/me");
    return normalizeUser(data.data);
  },

  /**
   * Cập nhật thông tin cá nhân
   */
  async updateProfile(payload: {
    full_name?: string;
    phone?: string;
    date_of_birth?: string | null;
    gender?: "male" | "female" | "other" | null;
    address?: string;
    ward?: string;
    district?: string;
    city?: string;
    postal_code?: string;
    address_note?: string;
  }): Promise<User> {
    const { data } = await httpClient.put<BackendUserResponse>(
      "/auth/me",
      payload,
    );
    return normalizeUser(data.data);
  },

  /**
   * Đổi mật khẩu
   */
  async changePassword(payload: {
    current_password: string;
    new_password: string;
  }): Promise<User> {
    const { data } = await httpClient.put<BackendUserResponse>(
      "/auth/me",
      payload,
    );
    return normalizeUser(data.data);
  },
};
