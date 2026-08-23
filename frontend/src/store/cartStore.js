// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
// Zustand cart store — replaces CartContext with selector-based re-renders.

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Backward-compatible hook that matches old CartContext API
export const useCart = () => {
  const { items, addItem, removeItem, updateQty, clearCart } = useCartStore();
  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const count = items.reduce((sum, i) => sum + i.quantity, 0);
  return { items, addItem, removeItem, updateQty, clearCart, total, count };
};

export const useCartStore = create(
  persist(
    (set, get) => ({
      // State
      items: [],

      // Computed (re-derived on each access — Zustand doesn't cache computed values)
      get total() {
        return get().items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      },
      get count() {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },

      // Actions
      addItem: (product, quantity = 1) => {
        set((state) => {
          const existing = state.items.find((i) => i._id === product._id);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i._id === product._id
                  ? { ...i, quantity: i.quantity + quantity }
                  : i
              ),
            };
          }
          return { items: [...state.items, { ...product, quantity }] };
        });
      },

      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((i) => i._id !== id),
        }));
      },

      updateQty: (id, quantity) => {
        if (quantity < 1) {
          get().removeItem(id);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            i._id === id ? { ...i, quantity } : i
          ),
        }));
      },

      clearCart: () => set({ items: [] }),

      // Selectors (for convenience)
      getTotal: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
      getCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    {
      name: 'pcl-cart',
    }
  )
);
