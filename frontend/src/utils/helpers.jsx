// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
export const formatKES = (amount) =>
  new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 0 }).format(amount);

export const formatDate = (date) =>
  new Date(date).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' });

export const formatPhone = (phone) => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) return `254${cleaned.slice(1)}`;
  return cleaned;
};

export const statusColor = {
  pending: '#f59e0b',
  confirmed: '#3b82f6',
  processing: '#8b5cf6',
  shipped: '#06b6d4',
  delivered: '#10b981',
  completed: '#10b981',
  cancelled: '#ef4444',
  paid: '#10b981',
  unpaid: '#ef4444',
  refunded: '#6b7280',
};

// FIX (image display investigation): every "no image" fallback in the product
// pages pointed at via.placeholder.com, a service that shut down in 2023 —
// so any product without an admin-uploaded image showed a broken image icon
// instead of a placeholder. This generates an inline SVG data URI instead:
// zero network requests, can never 404, and uses the real theme tokens
// (--bg-surface, --color-primary/--color-secondary) instead of a generic gray box.
export const noImagePlaceholder = (width = 400, height = 300) => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#1a1f2e" />
          <stop offset="100%" stop-color="#081916" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#g)" />
      <g stroke="#4a6a8a" stroke-width="2" fill="none" opacity="0.6">
        <rect x="${width * 0.3}" y="${height * 0.32}" width="${width * 0.4}" height="${height * 0.36}" rx="4" />
        <circle cx="${width * 0.41}" cy="${height * 0.44}" r="${Math.min(width, height) * 0.035}" />
        <path d="M${width * 0.32} ${height * 0.62} L${width * 0.45} ${height * 0.48} L${width * 0.55} ${height * 0.58} L${width * 0.62} ${height * 0.5} L${width * 0.68} ${height * 0.62} Z" />
      </g>
      <text x="50%" y="${height * 0.82}" font-family="Inter, sans-serif" font-size="${Math.max(11, width * 0.032)}" fill="#4a6a8a" text-anchor="middle">No image yet</text>
    </svg>`.trim();
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
};
