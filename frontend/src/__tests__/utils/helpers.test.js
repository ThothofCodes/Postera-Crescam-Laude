// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
import { formatKES, formatDate, formatPhone, statusColor, noImagePlaceholder } from '../../utils/helpers';

describe('formatKES', () => {
  test('formats zero', () => {
    expect(formatKES(0)).toContain('0');
  });

  test('formats positive amount', () => {
    const result = formatKES(45000);
    expect(result).toContain('45');
    expect(result).toContain('000');
  });

  test('formats decimal amount', () => {
    const result = formatKES(1500.50);
    expect(result).toBeDefined();
  });
});

describe('formatDate', () => {
  test('formats a date string', () => {
    const result = formatDate('2026-01-15');
    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
  });

  test('formats a Date object', () => {
    const result = formatDate(new Date('2026-06-20'));
    expect(result).toBeDefined();
  });
});

describe('formatPhone', () => {
  test('converts 0-prefix to 254', () => {
    expect(formatPhone('0700000000')).toBe('254700000000');
  });

  test('keeps 254 prefix as-is', () => {
    expect(formatPhone('254700000000')).toBe('254700000000');
  });

  test('strips non-digit characters', () => {
    expect(formatPhone('+254 700 000 000')).toBe('254700000000');
  });
});

describe('statusColor', () => {
  test('has colors for all order statuses', () => {
    expect(statusColor.pending).toBeDefined();
    expect(statusColor.confirmed).toBeDefined();
    expect(statusColor.processing).toBeDefined();
    expect(statusColor.shipped).toBeDefined();
    expect(statusColor.delivered).toBeDefined();
    expect(statusColor.cancelled).toBeDefined();
  });

  test('has colors for payment statuses', () => {
    expect(statusColor.paid).toBeDefined();
    expect(statusColor.unpaid).toBeDefined();
    expect(statusColor.refunded).toBeDefined();
  });

  test('colors are valid hex', () => {
    Object.values(statusColor).forEach((color) => {
      expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
    });
  });
});

describe('noImagePlaceholder', () => {
  test('returns a data URI', () => {
    const uri = noImagePlaceholder();
    expect(uri).toMatch(/^data:image\/svg\+xml,/);
  });

  test('respects custom dimensions', () => {
    const uri = noImagePlaceholder(800, 600);
    expect(uri).toContain('800');
    expect(uri).toContain('600');
  });

  test('returns valid encoded SVG', () => {
    const uri = noImagePlaceholder();
    const svg = decodeURIComponent(uri.replace('data:image/svg+xml,', ''));
    expect(svg).toContain('<svg');
    expect(svg).toContain('No image yet');
  });
});
