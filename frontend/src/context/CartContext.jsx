// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
// Backward-compatible re-exports from Zustand cart store.

export { useCart, useCartStore } from '../store/cartStore';

// CartProvider is no longer needed, but export a no-op for backward compatibility.
export const CartProvider = ({ children }) => children;
