// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
import { describe, it, expect, beforeEach } from 'vitest';
import { useCartStore } from '../../store/cartStore';

const mockProduct = {
  _id: 'prod-1',
  name: 'Test Widget',
  price: 1500,
  category: 'electronics',
};

const mockProduct2 = {
  _id: 'prod-2',
  name: 'Another Widget',
  price: 3000,
  category: 'accessories',
};

beforeEach(() => {
  useCartStore.setState({ items: [] });
  localStorage.clear();
});

describe('cartStore', () => {
  test('starts with empty items', () => {
    expect(useCartStore.getState().items).toEqual([]);
  });

  test('addItem adds a new product', () => {
    useCartStore.getState().addItem(mockProduct);
    expect(useCartStore.getState().items.length).toBe(1);
    expect(useCartStore.getState().items[0]._id).toBe('prod-1');
    expect(useCartStore.getState().items[0].quantity).toBe(1);
  });

  test('addItem increments quantity for existing product', () => {
    useCartStore.getState().addItem(mockProduct);
    useCartStore.getState().addItem(mockProduct);
    expect(useCartStore.getState().items.length).toBe(1);
    expect(useCartStore.getState().items[0].quantity).toBe(2);
  });

  test('addItem with custom quantity', () => {
    useCartStore.getState().addItem(mockProduct, 5);
    expect(useCartStore.getState().items[0].quantity).toBe(5);
  });

  test('removeItem removes by id', () => {
    useCartStore.getState().addItem(mockProduct);
    useCartStore.getState().addItem(mockProduct2);
    useCartStore.getState().removeItem('prod-1');
    expect(useCartStore.getState().items.length).toBe(1);
    expect(useCartStore.getState().items[0]._id).toBe('prod-2');
  });

  test('updateQty updates quantity', () => {
    useCartStore.getState().addItem(mockProduct);
    useCartStore.getState().updateQty('prod-1', 10);
    expect(useCartStore.getState().items[0].quantity).toBe(10);
  });

  test('updateQty removes item when quantity < 1', () => {
    useCartStore.getState().addItem(mockProduct);
    useCartStore.getState().updateQty('prod-1', 0);
    expect(useCartStore.getState().items.length).toBe(0);
  });

  test('clearCart empties all items', () => {
    useCartStore.getState().addItem(mockProduct);
    useCartStore.getState().addItem(mockProduct2);
    useCartStore.getState().clearCart();
    expect(useCartStore.getState().items).toEqual([]);
  });

  test('getTotal calculates correctly', () => {
    useCartStore.getState().addItem(mockProduct); // 1500
    useCartStore.getState().addItem(mockProduct, 2); // +3000
    expect(useCartStore.getState().getTotal()).toBe(4500);
  });

  test('getCount calculates correctly', () => {
    useCartStore.getState().addItem(mockProduct); // 1
    useCartStore.getState().addItem(mockProduct, 3); // +3
    useCartStore.getState().addItem(mockProduct2); // +1
    expect(useCartStore.getState().getCount()).toBe(5);
  });

  test('useCart store exposes expected methods and computed values', () => {
    useCartStore.getState().addItem(mockProduct);
    const state = useCartStore.getState();
    expect(typeof state.addItem).toBe('function');
    expect(typeof state.removeItem).toBe('function');
    expect(typeof state.updateQty).toBe('function');
    expect(typeof state.clearCart).toBe('function');
    expect(typeof state.getTotal).toBe('function');
    expect(typeof state.getCount).toBe('function');
    expect(state.getTotal()).toBe(1500);
    expect(state.getCount()).toBe(1);
  });
});
