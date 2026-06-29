import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "@/types";
import { getAbsoluteImageUrl } from "@/lib/imageUrl";

interface CartStore {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  totalItems: () => number;
  totalPrice: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (newItem) => {
        set((state) => {
          const existing = state.items.find(
            (i) => i.productId === newItem.productId,
          );
          if (existing) {
            const newQty = existing.quantity + (newItem.quantity ?? 1);
            // Giới hạn không vượt quá tồn kho
            const clampedQty = Math.min(newQty, existing.stock);
            return {
              items: state.items.map((i) =>
                i.productId === newItem.productId
                  ? { ...i, quantity: clampedQty }
                  : i,
              ),
            };
          }
          // Sản phẩm mới: giới hạn quantity <= stock
          const clampedQty = Math.min(newItem.quantity ?? 1, newItem.stock);
          return {
            items: [
              ...state.items,
              {
                ...newItem,
                quantity: clampedQty,
                // Ensure image URL is absolute
                image: getAbsoluteImageUrl(newItem.image),
              },
            ],
          };
        });
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        }));
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        set((state) => ({
          items: state.items.map((i) => {
            if (i.productId !== productId) return i;
            // Giới hạn không vượt quá tồn kho
            const clampedQty = Math.min(quantity, i.stock);
            return { ...i, quantity: clampedQty };
          }),
        }));
      },

      clearCart: () => set({ items: [] }),

      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      totalPrice: () =>
        get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    }),
    {
      name: "himalayan-cart",
      // Migrate old items with relative URLs to absolute URLs
      onRehydrateStorage: () => (state) => {
        if (state?.items) {
          state.items = state.items.map((item) => ({
            ...item,
            // Backward compatibility: old persisted shape may miss productId.
            productId: Number(item.productId ?? item.id),
            image: getAbsoluteImageUrl(item.image),
            // Backward compatibility: old items may miss stock field
            stock: item.stock ?? 9999,
          }));
        }
      },
    },
  ),
);
