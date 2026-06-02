import { create } from "zustand";

interface ThemeState {
  isLit: boolean;
  toggleLit: () => void;
  setLit: (val: boolean) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  isLit: true, // Mặc định chế độ đêm cho Landing
  toggleLit: () => set((state) => ({ isLit: !state.isLit })),
  setLit: (val: boolean) => set({ isLit: val }),
}));
