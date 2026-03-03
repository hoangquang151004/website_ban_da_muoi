import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types";

interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: (user, token) => {
        set({ user, token, isAuthenticated: true });
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
      },

      updateUser: (data) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...data } : null,
        }));
      },
    }),
    {
      name: "himalayan-auth",
      version: 1,
      // Migrate old persisted data: backend used full_name, now we use name
      migrate: (persistedState: unknown) => {
        const s = persistedState as AuthStore & {
          user?: User & { full_name?: string };
        };
        if (s?.user && !s.user.name && s.user.full_name) {
          s.user = { ...s.user, name: s.user.full_name };
        }
        return s;
      },
    },
  ),
);
