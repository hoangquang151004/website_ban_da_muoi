import axios from "axios";

const rawApiUrl = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"
).replace(/\/$/, "");

// Accept both forms: http://host and http://host/api/v1
const BASE_URL = /\/api\/v1$/i.test(rawApiUrl)
  ? rawApiUrl
  : `${rawApiUrl}/api/v1`;

const httpClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - attach Authorization token
httpClient.interceptors.request.use(
  (config) => {
    // Read token from localStorage (set by authStore via zustand persist)
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("himalayan-auth");
        if (stored) {
          const parsed = JSON.parse(stored);
          const token = parsed?.state?.token;
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }
      } catch {
        // ignore parse errors
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor - handle 401 Unauthorized
httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Do not trigger global logout for login endpoint 401s
      if (error.config?.url?.includes("/auth/login")) {
        return Promise.reject(error);
      }

      // Clear auth state
      if (typeof window !== "undefined") {
        localStorage.removeItem("himalayan-auth");
        // Remove auth cookies
        document.cookie =
          "auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
        document.cookie =
          "user-role=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

export default httpClient;
