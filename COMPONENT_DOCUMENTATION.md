# Postera Crescam Laude — Full Component Documentation

> **Project:** Freebuff Desktop · PCL Circuit Canopy  
> **Stack:** React 18 · Vite · React Router v6 · Socket.IO · Axios · Recharts · M-Pesa Integration  
> **Theme:** Dark futuristic "Circuit Canopy" — teal (#2BB6A3), ember (#EE6100), deep void backgrounds  
> **License:** MIT · © 2026 Thoth of Codes

---

## Table of Contents

1. [Application Shell](#1-application-shell)
2. [Context Providers](#2-context-providers)
3. [Custom Hooks](#3-custom-hooks)
4. [Utility Modules](#4-utility-modules)
5. [Layouts](#5-layouts)
6. [Core UI Components](#6-core-ui-components)
7. [Calculator Components](#7-calculator-components)
8. [Public Pages](#8-public-pages)
9. [Admin Components](#9-admin-components)
10. [Admin Context](#10-admin-context)
11. [Admin Pages — Super Admin](#11-admin-pages--super-admin)
12. [Admin Pages — Department Landings](#12-admin-pages--department-landings)
13. [Admin Pages — Shared Modules](#13-admin-pages--shared-modules)
14. [Staff & Client Portals](#14-staff--client-portals)

---

## 1. Application Shell

### `App.jsx`
**Path:** `frontend/src/App.jsx`  
**Purpose:** Root application component — bootstraps routing, providers, and the boot-screen flow.

| Feature | Detail |
|---|---|
| Boot screen | Renders `<BootScreen>` on first visit per session (stored in `sessionStorage('pcl_booted')`). Subsequent visits skip it instantly. |
| Providers | Wraps everything in `AuthProvider → AdminAuthProvider → CartProvider`. |
| Scroll-to-top | `<ScrollToTop>` listens to `useLocation().pathname` and calls `window.scrollTo({ top: 0, behavior: 'smooth' })`. |
| DB status | `<DBStatusBanner />` renders a fixed red banner if `/health` returns degraded. |
| Chat widget | `<ConditionalChatWidget />` conditionally renders the customer-facing `<ChatWidget>` — hidden on `/admin`, `/staff`, `/client`, and `/chat` routes. |
| Toaster | `react-hot-toast` positioned top-right with 4s duration. |

**Route Architecture:**

| Route Group | Layout | Key Routes |
|---|---|---|
| Public store | `PublicLayout` (Navbar + Footer) | `/store`, `/store/:slug`, `/cart`, `/checkout`, `/calculator`, `/consult`, `/services`, `/help`, `/contact`, `/track` |
| Legacy admin | `AdminLayout` (AdminNavbar sidebar) | `/dashboard`, `/clients`, `/services`, `/bookings`, `/products`, `/orders`, `/consultations`, `/revenue`, `/settings`, `/staff-accounts`, `/admin/chat-control`, `/admin/revenue` |
| Super Admin | `SuperAdminLayout` (dedicated sidebar) | `/admin/super` (index), `/admin/super/users`, `/admin/super/email`, `/admin/super/finance`, `/admin/super/tickets`, `/admin/super/inventory`, `/admin/super/audit`, `/admin/super/broadcast`, `/admin/super/settings`, `/admin/super/chat`, `/admin/super/staff-invitation` |
| Departments | `DeptLayout(slug, title)` | `/admin/internet`, `/admin/webdev`, `/admin/playstation`, `/admin/repair`, `/admin/cybersecurity`, `/admin/govadmin` — each with sub-routes for overview, department-specific features, transactions, CRM, billing, inventory, tickets, staff portal, audit, settings, chat |
| Staff portal | None (standalone) | `/staff/:slug/dashboard`, `/staff/set-password` |
| Client portal | None (standalone) | `/client/:slug`, `/client/portal/:projectToken` |
| Auth | None (standalone) | `/login`, `/register`, `/forgot`, `/reset/:token`, `/verify/:token`, `/admin/login` |

**Root `<div>` attributes:** `data-testid="app-container"`

---

## 2. Context Providers

### `AuthContext.jsx`
**Path:** `frontend/src/context/AuthContext.jsx`  
**Exports:** `AuthProvider`, `useAuth`

| Property | Type | Description |
|---|---|---|
| `user` | `Object \| null` | Full user object from `/auth/me` (includes `name`, `email`, `role`, `departmentSlug`). |
| `loading` | `boolean` | `true` while the initial `/auth/me` call is in-flight. |
| `login(email, password)` | `async function` | POSTs to `/auth/login`, stores JWT in `localStorage('token')`, then fetches `/auth/me` for the complete user record. Returns the user. |
| `logout()` | `function` | Removes token from localStorage, sets user to `null`. |

**On mount:** If a token exists in localStorage, calls `GET /auth/me` to hydrate the user. On failure, clears the token.

### `CartContext.jsx`
**Path:** `frontend/src/context/CartContext.jsx`  
**Exports:** `CartProvider`, `useCart`

| Property | Type | Description |
|---|---|---|
| `items` | `Array` | Array of `{ ...product, quantity }` objects. Persisted to `localStorage('cart')`. |
| `addItem(product, quantity=1)` | `function` | Adds a product or increments its quantity if already in cart. |
| `removeItem(id)` | `function` | Removes a product by `_id`. |
| `updateQty(id, quantity)` | `function` | Sets quantity for a product; removes if quantity < 1. |
| `clearCart()` | `function` | Empties the cart. |
| `total` | `number` | Sum of `price * quantity` for all items. |
| `count` | `number` | Sum of all item quantities. |

### `AdminAuthContext.jsx`
**Path:** `frontend/src/admin/context/AdminAuthContext.jsx`  
**Exports:** `AdminAuthProvider`, `useAdminAuth`

Delegates to `AuthContext` and derives role flags:

| Property | Type | Description |
|---|---|---|
| `user` | `Object \| null` | Same user from AuthContext. |
| `loading` | `boolean` | Same loading state. |
| `login` / `logout` | `function` | Delegated from AuthContext. |
| `isSuperAdmin` | `boolean` | `true` if `user.role === 'SUPER_ADMIN'` AND `user.email === 'codeofthoth@outlook.com'`. |
| `isDeptHead` | `boolean` | `true` if `user.role === 'DEPT_HEAD_OWNER'`. |
| `isStaff` | `boolean` | `true` if `user.role === 'STAFF'`. |
| `deptSlug` | `string \| undefined` | `user.departmentSlug`. |

---

## 3. Custom Hooks

### `useChat.js`
**Path:** `frontend/src/hooks/useChat.js`  
**Signature:** `useChat({ authToken }) → { ... }`

A comprehensive Socket.IO chat hook that manages real-time customer ↔ admin communication.

| Return Value | Type | Description |
|---|---|---|
| `socket` | `Socket \| null` | Raw Socket.IO instance. |
| `connected` | `boolean` | Whether the socket is currently connected. |
| `adminOnline` | `boolean` | Whether at least one admin is available. |
| `messages` | `Array` | All messages for the current session. |
| `setMessages` | `function` | Direct state setter for messages. |
| `conversations` | `Array` | List of conversation objects with `{ conversationId, guestId, lastMessage, timestamp, unread }`. |
| `currentConversation` | `string \| null` | ID of the currently active conversation. |
| `setCurrentConversation` | `function` | Switch the active conversation. |
| `joinConversation(conversationId)` | `function` | Admin joins a conversation (emits `admin-join-conversation`). |
| `sendMessageToCustomer(conversationId, message, guestId)` | `function` | Admin sends a message to a customer (emits `admin-send-message`). |
| `sendCustomerMessage(message, guestId, conversationId?)` | `function` | Customer sends a message (emits `chat-message`). Returns the effective conversation ID. |
| `getMessagesForConversation(conversationId)` | `async function` | Fetches messages from server API, merges with local state. |
| `getActiveConversations()` | `function` | Returns conversations sorted by most recent first. |
| `requestCallback(clientName, message, phone, guestId)` | `function` | Emits `chat:request-callback`. |
| `callbackSubmitted` | `boolean` | Whether a callback request was acknowledged. |
| `adminAvailableAlert` | `boolean` | Set to `true` when admin comes online (via `admin:now-available` event). |

**Socket Events Handled:**
- `connect` / `disconnect` / `reconnect` / `reconnect_attempt` / `reconnect_failed` / `connect_error`
- `admin:status` — updates `adminOnline` state
- `new-chat-message` — incoming message from customer
- `message-sent` — confirmation of sent message
- `chat-error` — error from server
- `new-callback-request` — new callback notification
- `admin:now-available` — admin came online
- `admin:status:dept` — per-department status update (for RuaiPulseBoard)

**Connection Options:** WebSocket first, polling fallback; infinite reconnection with 1s–5s backoff; unique `clientId` via UUID; device info attached for admin auth.

### `useSocket.js`
**Path:** `frontend/src/hooks/useSocket.js`  
**Signature:** `useSocket(eventHandlers) → Socket`

A global singleton Socket.IO connection used for non-chat real-time features (DB status, notifications, system events).

| Parameter | Type | Description |
|---|---|---|
| `eventHandlers` | `Object` | Map of `{ eventName: handlerFunction }` to register on the global socket. |

**Key Behavior:**
- Module-level singleton (`let socket`) — only one connection at a time.
- Rebuilds connection when the JWT token changes (handles logout/login identity swap).
- Sends raw token (not `Bearer` prefixed) in `auth.token`.
- Transport: WebSocket preferred, polling fallback.
- 10s timeout.

---

## 4. Utility Modules

### `api.js`
**Path:** `frontend/src/utils/api.js`  
**Exports:** `api`, `publicApi`

Two Axios instances:

| Instance | Auth | Use Case |
|---|---|---|
| `api` | Attaches `Bearer` token from localStorage; auto-redirects to `/login` on 401 | Authenticated admin/staff requests |
| `publicApi` | No auth header | Public store, product listings, help desk FAQ |

Both share:
- Base URL: `/api` (proxied via Vite dev server)
- 30s timeout
- Conditional `Content-Type`: deletes `Content-Type` for `FormData` payloads (lets browser set multipart boundary), defaults to `application/json` otherwise
- Request interceptor validates JWT format (3-part dot-separated) before attaching

### `theme.js`
**Path:** `frontend/src/utils/theme.js`  
**Exports:** `T`, `btn`, `btnSm`, `tabPill`, `badge`

Shared inline style constants for the **PCL Circuit Canopy dark theme** (teal/ember).

| Export | Type | Description |
|---|---|---|
| `T` | Object | Contains `page`, `headerRow`, `h2`, `card`, `table`, `thead`, `th`, `td`, `tdBold`, `input`, `label`, `overlay`, `modal`, `modalWide`, `modalH3` style objects. |
| `btn(variant)` | Function | Returns a button style. Variants: `primary` (ember), `teal`, `green`, `ghost`, `danger`. |
| `btnSm(variant)` | Function | Smaller button variant. |
| `tabPill(active)` | Function | Tab pill toggle style. |
| `badge` | Object | Badge/pill style for status labels. |

### `styles.js`
**Path:** `frontend/src/utils/styles.js`  
**Exports:** `C`, `card`, `input`, `label`, `btnPrimary`, `btnDanger`, `btnSuccess`, `btnGhost`, `table`, `th`, `td`, `overlay`, `modalBox`, `tabBtn`

A separate set of shared inline styles for the **metallic futuristic** admin theme (used primarily in super admin and department pages).

| Export | Type | Description |
|---|---|---|
| `C` | Object | Color tokens — `bgVoid`, `bgDeep`, `bgPanel`, `bgCard`, `bgElevated`, `bgHover`, `cyan`, `cyanDim`, `silver`, `gold`, `green`, `red`, `orange`, `purple`, `textPrimary`, `textSecondary`, `textMuted`. |
| `card` | Object | Card container with gradient background, border, shadow. |
| `input` | Object | Input field style. |
| `label` | Object | Label style (small, uppercase, cyan). |
| `btnPrimary(bg, color, border)` | Function | Button factory with customizable colors. |
| `btnDanger` / `btnSuccess` / `btnGhost` | Object | Pre-configured button variants. |
| `table` / `th` / `td` | Object | Table styles with gradient backgrounds. |
| `overlay` / `modalBox` | Object | Modal overlay and box styles. |
| `tabBtn(active)` | Function | Tab button style. |

### `helpers.jsx`
**Path:** `frontend/src/utils/helpers.jsx`  
**Exports:** `formatKES`, `formatDate`, `formatPhone`, `statusColor`, `noImagePlaceholder`

| Export | Signature | Description |
|---|---|---|
| `formatKES(amount)` | `(number) → string` | Formats as Kenyan Shillings (e.g., "KES 1,500"). |
| `formatDate(date)` | `(string\|Date) → string` | Formats as "1 Jan 2026" (en-KE locale). |
| `formatPhone(phone)` | `(string) → string` | Normalizes Kenyan phone numbers (prepends 254, strips leading 0). |
| `statusColor` | `Object` | Maps status strings to hex colors: `pending` → amber, `completed` → green, `cancelled` → red, etc. |
| `noImagePlaceholder(w, h)` | `(number, number) → string` | Returns an inline SVG data URI placeholder (no network request, no 404). Draws a landscape icon with "No image yet" text using theme colors. |

### `errorHandler.js`
**Path:** `frontend/src/utils/errorHandler.js`  
**Exports:** `getErrorMessage`, `isRetryableError`, `handleApiError`

| Export | Signature | Description |
|---|---|---|
| `getErrorMessage(error)` | `(AxiosError) → string` | Extracts human-readable error message from API response, HTTP status, network error, or generic fallback. |
| `isRetryableError(error)` | `(AxiosError) → boolean` | Returns `true` for 429, 5xx, or network errors. |
| `handleApiError(error, context?)` | `(AxiosError, string?) → string` | Wraps `getErrorMessage` with an optional context prefix. |

---

## 5. Layouts

### `PublicLayout.jsx`
**Path:** `frontend/src/layouts/PublicLayout.jsx`  
**Props:** None (uses `<Outlet />`)

Wraps all public-facing routes with:
- `<Navbar />` — sticky top navigation
- `<main>` — centered container (`maxWidth: 1200px`), `marginTop: 66px` (offset for fixed navbar)
- `<Footer />` — full-width footer

Structure: `flex column`, `minHeight: 100vh`.

---

## 6. Core UI Components

### `BootScreen.jsx`
**Path:** `frontend/src/components/BootScreen.jsx`  
**Props:** `{ onComplete }` — callback fired after the boot animation finishes (4.8s)

**Full-viewport branded loading screen** with four phases:

| Phase | Duration | Visual |
|---|---|---|
| `terminal` | 0–2.8s | Typewriter effect showing boot lines (POSTERA CRESCAM LAUDE v2.0, INITIALIZING PCL_OS..., ROOT SYSTEM VERIFIED, CANOPY ONLINE, WELCOME BACK). Each line fades in with a `>` prompt. Blinking cursor on the last line. |
| `glow` | 2.8–3.4s | Full-bleed radial gradient breathing glow. |
| `wordmark` | 3.4–4.2s | Postera wordmark image fades in and rises from 18px below. Tagline "Empowering Kenya's Digital Future" fades in below. Four teal corner accent L-brackets frame the viewport. |
| `fade` | 4.2–4.8s | Entire overlay fades to `opacity: 0`. `onComplete()` fires. |

**Styling:**
- Root: `position: fixed`, `inset: 0`, `width: 100vw`, `height: 100vh`, `overflow: hidden`, `boxSizing: border-box`, `zIndex: 99999`, `background: #081916`
- Scanline overlay: repeating linear gradient animating vertically
- Breathing glow: `radial-gradient` at 50% 50%, animated with `scale(0.96)→scale(1.02)`
- Wordmark: `height: 100px`, dual drop-shadow (teal + ember)
- Corner accents: 60×60px L-shaped borders at 24px inset from each corner

**Session persistence:** First render sets `sessionStorage('pcl_booted') = '1'`. Subsequent page loads within the same session skip the boot screen instantly.

---

### `PageTransition.jsx`
**Path:** `frontend/src/components/PageTransition.jsx`  
**Props:** `{ children }`

Wraps the entire `<Routes>` tree to animate page transitions on route changes.

| State | Opacity | Transform |
|---|---|---|
| `enter` | 1 | `translateY(0)` |
| `exit` | 0 | `translateY(8px)` |

- Transition: `opacity 0.25s cubic-bezier(0.16,1,0.3,1), transform 0.25s cubic-bezier(0.16,1,0.3,1)`
- Only animates when `location.pathname` actually changes (not on same-path re-renders).
- Uses `useRef` to track previous path.

---

### `PrivateRoute.jsx`
**Path:** `frontend/src/components/PrivateRoute.jsx`  
**Props:** `{ children }`

Route guard for authenticated admin/staff routes:
- If `loading` → renders "Loading..." text
- If `user` exists → renders `children`
- If no user → `<Navigate to="/login" replace />`

---

### `Navbar.jsx`
**Path:** `frontend/src/components/Navbar.jsx`  
**Props:** None

Public-facing sticky navigation bar for the store and public pages.

**Features:**
- **Logo:** `<RuaiTechLogo>` linking to `/store`
- **Desktop nav:** 6 links — Store, Calculator, Consult, Services, Help, Contact — styled as `NavLink` with ember underline on active
- **Cart link:** Shows 🛒 with orange badge count from `useCart().count`
- **Mobile:** Hamburger button toggles a slide-down mobile menu (hidden on >768px, shown on ≤768px)
- **Sticky:** `position: sticky`, `top: 0`, `zIndex: 200`, `backdropFilter: blur(12px)`

**Height:** 66px

---

### `Sidebar.jsx`
**Path:** `frontend/src/components/Sidebar.jsx`  
**Props:** None

Fixed sidebar for the legacy admin panel (used in `AdminLayout`).

**Features:**
- Width: 235px, full viewport height
- Logo section with `<RuaiTechLogo>` and "Admin Panel" / "Staff Portal" subtitle
- User badge showing name, role pill, and department pill
- Role-specific navigation:
  - **Admin/DEPT_HEAD_OWNER:** Dashboard, Bookings, Clients, Services, Products, Orders, Consultations, Revenue, Staff, Settings
  - **STAFF:** Service Requests, Product Orders, Consultations (restricted)
- Logout button at bottom with red hover effect
- Active link: orange left border + gradient background
- Decorative vertical ember accent line on right edge

---

### `CollapsibleSidebar.jsx`
**Path:** `frontend/src/components/CollapsibleSidebar.jsx`  
**Props:** None

Same as `Sidebar.jsx` but with a collapse toggle:
- Collapsed width: 70px (icons only, no labels)
- Expanded width: 235px
- Toggle button (« / ») in the logo area
- User badge, role notice, and logout button hidden when collapsed
- Animated width transition: `width 0.3s ease`

---

### `Logo.jsx`
**Path:** `frontend/src/components/Logo.jsx`  
**Props:** `{ size, showText, textSize }`

| Prop | Type | Default | Description |
|---|---|---|---|
| `size` | `number` | `40` | Height of the logo image in px. |
| `showText` | `boolean` | `true` | Whether to show the wordmark (`postera-wordmark.png`) or just the mark (`postera-mark.png`). |
| `textSize` | `string` | `'15px'` | Font size for any associated text. |

Renders an `<img>` with teal drop-shadow: `drop-shadow(0 0 8px rgba(43,182,163,0.3))`.

---

### `Footer.jsx`
**Path:** `frontend/src/components/Footer.jsx`  
**Props:** `{ variant }` — `'public'` (default) or `'admin'`

| Variant | Content |
|---|---|
| `public` | 4-column grid: Brand description, Quick Links (6 links), Contact (address, email, WhatsApp), Opening Hours. Below: divider + copyright bar. |
| `admin` | Copyright bar only (compact). |

**Decorative:** Gradient circuit-trace line at top (ember → teal → ember gradient, 50% opacity).

**Copyright bar:** © 2026 Postera Crescam Laude · MIT License · MERN · M-Pesa · Made in Kenya 🇰🇪

---

### `DBStatusBanner.jsx`
**Path:** `frontend/src/components/DBStatusBanner.jsx`  
**Props:** None

Fixed top banner that appears when the MongoDB connection is down.

- On mount: `GET /health` — if not `ok`, sets `status = 'degraded'`
- Real-time: listens to `system:status` socket event
- On disconnect: re-checks health after 4s
- Renders: red fixed bar (`position: fixed, top: 0, zIndex: 9999`) with warning icon, "DATABASE NOT CONNECTED" message, setup instructions, and "Get Atlas URI →" link
- Returns `null` when status is `ok` or `null`

---

### `ChatWidget.jsx`
**Path:** `frontend/src/components/ChatWidget.jsx`  
**Props:** `{ isAdmin, authToken }`

Customer-facing floating chat widget (fixed bottom-right).

**Features:**
- **Floating button:** 60×60px circle, color reflects admin status (orange = online, gray = offline, amber = connecting). Status dot with glow-pulse animation.
- **Expanded widget:** 350×500px card with:
  - Header with "PCL Support" title and live status indicator
  - Messages area with customer (ember) vs admin (teal) message bubbles
  - Callback form when admin is offline (name, contact type, contact input)
  - Message input bar with send button
- **States:** `connected`, `adminOnline`, `showCallbackForm`, `adminAvailableAlert`
- Uses `useChat` hook for socket connection
- Auto-scrolls to bottom on new messages

---

### `ChatToggle.jsx`
**Path:** `frontend/src/components/ChatToggle.jsx`  
**Props:** None

Alternative chat toggle widget (appears to be a newer/replacement version of ChatWidget):

- Floating button with gradient background (teal when admin online, pink gradient when offline)
- Expanded panel with callback form or "We're here to help!" message
- Uses `react-hot-toast` for notifications
- Mobile responsive: full-width panel on ≤576px screens
- Online indicator: green dot with glow

---

### `StatusBadge.jsx`
**Path:** `frontend/src/components/StatusBadge.jsx`  
**Props:** `{ status }`

Renders a colored pill badge for order/entity statuses.

| Status | Color | Description |
|---|---|---|
| `pending` | Amber (#f39c12) | Awaiting action |
| `confirmed` | Teal (#2BB6A3) | Confirmed |
| `processing` | Purple (#9b59b6) | In progress |
| `shipped` | Cyan (#1abc9c) | Shipped |
| `delivered` / `completed` | Green (#2ecc71) | Done |
| `cancelled` | Orange (#FF8A3D) | Cancelled |
| `paid` | Green | Payment received |
| `unpaid` | Orange | Payment pending |
| `refunded` | Gray (#95a5a6) | Refunded |
| `active` | Green | Active |
| `inactive` | Orange | Inactive |

**Styling:** Rounded pill (borderRadius: 20), 11px font, uppercase tracking, transparent background tint.

---

### `UI.jsx`
**Path:** `frontend/src/components/UI.jsx`  
**Exports:** `Spinner`, `EmptyState`

| Component | Props | Description |
|---|---|---|
| `Spinner` | None | Centered loading spinner with teal rotating ring, "Loading..." text in monospace. |
| `EmptyState` | `{ icon, message }` | Centered empty state with large emoji icon (default: 📭) and message text. |

---

### `ProductCard.jsx`
**Path:** `frontend/src/components/ProductCard.jsx`  
**Props:** `{ product }`

Product card for the store grid.

| Feature | Detail |
|---|---|
| Image | First image from `product.images[]` or inline SVG placeholder. Hover zoom: `scale(1.04)`. |
| Featured badge | "FEATURED" pill in top-right corner if `product.featured` is true. |
| Category | Small uppercase label above product name. |
| Name | Linked to `/store/${product.slug}`. |
| Short description | Optional `product.shortDesc`. |
| Price | `formatKES(product.price)` in large text; optional strikethrough compare price. |
| Cart button | "+ Add to Cart" — calls `useCart().addItem(product)`. Shows "Out of stock" text if `stock === 0` and not digital. |
| Hover | Card lifts 2px, border glows teal, subtle shadow appears. |

---

### `ConsultationCard.jsx`
**Path:** `frontend/src/components/ConsultationCard.jsx`  
**Props:** `{ type, fees }`

Consultation service card for the `/consult` landing page.

| Prop | Type | Description |
|---|---|---|
| `type` | `string` | Consultation type key (e.g., `'web-development'`, `'cybersecurity'`, `'networking'`). |
| `fees` | `Object` | Map of `{ durationMinutes: priceKES }`. |

**Features:**
- Auto-generates label from type kebab-case (e.g., "Web Development")
- Unique color per type (cyan, pink, green, gold, purple, etc.)
- Icon per type (🌐, 🔒, 📡, 💻, 📊, 📱, 💾, 🛠)
- Fee chips showing duration × price
- "From KES X" minimum fee
- "Book Session →" link to `/consult/book?type=${type}`
- Top accent line, hover lift + glow

**Helper:** `hexToRgb(hex)` — converts hex color to `r,g,b` string for use in `rgba()`.

---

### `PaymentForm.jsx`
**Path:** `frontend/src/components/PaymentForm.jsx`  
**Props:** `{ orderId, amount, onSuccess }`

M-Pesa STK Push payment form.

| State | Description |
|---|---|
| `idle` | Shows "I've Received the M-Pesa Prompt" button. |
| `pushing` | "Initiating payment..." text. |
| `polling` | "Enter your M-Pesa PIN on your phone" + spinner. Polls `GET /orders/:id` every 3 seconds, up to 30 attempts (90s). |
| `success` | "✅ Payment confirmed!" with green text. Calls `onSuccess(orderData)`. |
| `failed` | Error message + "Try Again" button. |

**Cleanup:** Uses `mountedRef` to prevent state updates after unmount; clears poll timeout on unmount.

---

### `RuaiPulseBoard.jsx`
**Path:** `frontend/src/components/RuaiPulseBoard.jsx`  
**Props:** `{ authToken }`

Real-time department availability dashboard (Phase 9 market research feature).

**Departments tracked:**
| Slug | Label | Icon |
|---|---|---|
| `internet` | Internet Distribution | 📡 |
| `webdev` | Web Development | 💻 |
| `playstation` | PlayStation Arena | 🎮 |
| `repair` | Hardware Repair | 🔧 |
| `cybersecurity` | Cybersecurity | 🛡️ |
| `govadmin` | Government Admin | 🏛️ |

**Features:**
- Fetches beacons via `presence:get-beacons` socket event
- Listens to `admin:status:dept` for real-time per-department updates
- Listens to `admin:status` for global status flips (triggers full re-fetch)
- Grid layout with `minmax(150px, 1fr)`
- Each cell: icon (grayscale if offline), label, ONLINE/OFFLINE status text
- Super admin coverage noted: "ONLINE (SUPER ADMIN)"
- Live indicator in header: "● live" or "○ connecting…"

---

### `Calculator/HardwareBundler.jsx`
**Path:** `frontend/src/components/Calculator/HardwareBundler.jsx`  
**Props:** `{ onQuote }`

Hardware bundle builder for the `/calculator` page.

**Hardware catalog:**

| Item | Basic | Mid-Range | Pro |
|---|---|---|---|
| Laptop (Refurb) | KES 25,000 | KES 45,000 | KES 80,000 |
| Desktop (Full set) | KES 30,000 | KES 55,000 | KES 90,000 |
| Smartphone | KES 8,000 | KES 18,000 | KES 40,000 |
| Printer | KES 6,000 | KES 12,000 | KES 25,000 |
| Router / Wi-Fi | KES 3,000 | KES 6,500 | KES 14,000 |
| Accessories Bundle | KES 2,000 | KES 4,500 | KES 8,000 |
| Antivirus Licence (1yr) | KES 1,500 | KES 3,000 | KES 6,000 |
| Setup & Config | KES 1,000 | KES 2,500 | KES 5,000 |

**Interaction:** Click a tier button to select (toggle off by clicking again). Shows running total, itemized list, and "Request This Bundle →" button that calls `onQuote({ type: 'hardware', items, total })`.

---

### `Calculator/ServiceEstimator.jsx`
**Path:** `frontend/src/components/Calculator/ServiceEstimator.jsx`  
**Props:** `{ onQuote }`

Service pricing estimator.

**Services:** Website Design, MERN Web Application, E-Commerce Store, Cybersecurity Audit, Hardware Repair, IT Support Monthly, Social Media Management, Domain + Hosting Annual

**Tiers:** basic, standard, premium

**Features:**
- Service dropdown, tier toggle buttons, rush delivery checkbox
- Calls `POST /calculator/estimate` with `{ service, tier, isRush }`
- Displays final price, base price breakdown for rush orders
- "Book This Service →" button calls `onQuote({ service, tier, isRush, ...result })`

---

## 7. Calculator Pages

### `Calculator.jsx`
**Path:** `frontend/src/pages/Calculator.jsx`  
**Props:** None

Parent page for the Smart Price Calculator.

**Features:**
- Mode toggle: "🛠 Service Estimator" or "💻 Hardware Bundle Builder"
- Wraps selected estimator in a gradient-bordered card
- Stores quote in `sessionStorage('quote')` and navigates to `/consult/book`
- Info tip at bottom: "All prices are estimates in KES. Final pricing confirmed at booking."

---

## 8. Public Pages

### `Login.jsx`
**Path:** `frontend/src/pages/Login.jsx`  
**Props:** None

Admin/staff login page with Circuit Canopy aesthetic.

**Features:**
- Full-viewport centered card on `#081916` background
- Scanline overlay + radial ember glow
- Logo, "Admin Portal" heading, "POSTERA CRESCAM LAUDE" monospace subtitle
- Email + password form → calls `useAuth().login()` → navigates to `/dashboard`
- Error: `react-hot-toast` "Invalid credentials"
- Loading state: button text changes to "INITIALIZING..."

---

### `Store.jsx`
**Path:** `frontend/src/pages/Store.jsx`  
**Props:** None

Public product store page.

**Features:**
- Hero section with product count
- Search input with magnifier icon
- Sort dropdown: Newest, Price Low→High, Price High→Low, Best Selling
- Category filter pills: All, electronics, accessories, software, services
- Product grid: `repeat(auto-fill, minmax(240px, 1fr))`
- Pagination: Previous / Next buttons
- Uses `publicApi.get('/products')` with debounced search, category, sort, page params
- Loading spinner, empty state handling

---

### `HelpDesk.jsx`
**Path:** `frontend/src/pages/HelpDesk.jsx`  
**Props:** None

Full-featured help center with three tabs:

| Tab | Content |
|---|---|
| Self-Help | FAQ search (debounced API call + local fallback), troubleshooting guides, knowledge base articles |
| Support Tickets | Create ticket form (subject, category, priority, description), ticket list with status badges |
| Contact Us | Live Chat (navigates to `/chat`), Email Support, Phone Support, Support Hours, "Chat with Support Now" CTA |

**Data sources:**
- `publicApi.get('/help/faq')` — public FAQ
- `publicApi.get('/help/troubleshooting')` — troubleshooting guides
- `publicApi.get('/help/knowledge-base')` — knowledge base
- `api.get('/help/tickets')` — user's tickets (if authenticated)
- `api.post('/help/tickets')` — submit new ticket

---

### `ConsultLanding.jsx`
**Path:** `frontend/src/pages/ConsultLanding.jsx`  
**Props:** None

Consultation services landing page. Renders a grid of `<ConsultationCard>` components for each service type.

### `ConsultBook.jsx`
**Path:** `frontend/src/pages/ConsultBook.jsx`  
**Props:** None

Consultation booking form. Pre-selects service type from URL query parameter. Collects: name, email, phone, preferred date/time, notes.

### `PublicServices.jsx`
**Path:** `frontend/src/pages/PublicServices.jsx`  
**Props:** None

Public-facing services listing page.

### `Contact.jsx`
**Path:** `frontend/src/pages/Contact.jsx`  
**Props:** None

Contact page with form and contact information.

### `Cart.jsx`
**Path:** `frontend/src/pages/Cart.jsx`  
**Props:** None

Shopping cart page. Shows line items with quantity controls, subtotals, and "Proceed to Checkout" link.

### `Checkout.jsx`
**Path:** `frontend/src/pages/Checkout.jsx`  
**Props:** None

Checkout flow. Collects delivery type (pickup/delivery), delivery address, and payment method. M-Pesa integration via `<PaymentForm>`.

### `OrderStatus.jsx`
**Path:** `frontend/src/pages/OrderStatus.jsx`  
**Props:** None

Order confirmation / tracking page shown after checkout.

### `ProductDetail.jsx`
**Path:** `frontend/src/pages/ProductDetail.jsx`  
**Props:** None

Individual product page. Shows image gallery, description, price, stock status, and "Add to Cart" button.

### `TrackTicket.jsx`
**Path:** `frontend/src/pages/TrackTicket.jsx`  
**Props:** None

Support ticket tracking page.

### `PublicWebPortal.jsx`
**Path:** `frontend/src/pages/PublicWebPortal.jsx`  
**Props:** None

Public client project portal (accessed via project token in URL).

---

## 9. Admin Components

### `AdminLayout.jsx`
**Path:** `frontend/src/admin/components/AdminLayout.jsx`  
**Props:** None (uses `<Outlet />`)

Legacy admin layout wrapping admin pages.

**Structure:**
- Flex container, full viewport height
- `<AdminNavbar>` — collapsible sidebar (280px expanded, 80px collapsed)
- `<main>` — content area with dynamic `marginLeft` based on collapsed state
- Header bar showing "Admin Portal" and user name/email
- Content area with 16px padding, scrollable

---

### `AdminNavbar.jsx`
**Path:** `frontend/src/admin/components/AdminNavbar.jsx`  
**Props:** `{ collapsed, onToggle }`

Fixed left sidebar for admin navigation.

**Navigation sections:**

| Section | Items |
|---|---|
| MAIN | Dashboard, Messages, Orders, Bookings, Callbacks, Clients, Services, Products |
| DEPARTMENTS | Internet (🌐), Web Dev (💻), PlayStation (🎮), Repair (🔧), Cybersecurity (🛡️), Gov Admin (🏛️) |

**Features:**
- Logo area with collapse toggle (← / →)
- Active link: ember background + white left border
- User email display
- Logout button with red border
- Mobile responsive: full-width horizontal nav at ≤768px
- Gradient background: `linear-gradient(180deg, #244A44, #0F2620)`

---

### `AdminPrivateRoute.jsx`
**Path:** `frontend/src/admin/components/AdminPrivateRoute.jsx`  
**Props:** `{ children }`

Route guard for Super Admin only:
- If `loading` → "Loading..."
- If `user` AND `isSuperAdmin` → renders children
- If user but not super admin → `<Navigate to="/403" replace />`
- If no user → `<Navigate to="/admin/login" replace />`

---

### `DeptLayout.jsx`
**Path:** `frontend/src/admin/components/DeptLayout.jsx`  
**Props:** `{ slug, title }`

Department-specific layout with dual sidebar (AdminNavbar + Department sub-sidebar).

**Department Configurations:**

| Slug | Label | Branch | Color | Unique Feature |
|---|---|---|---|---|
| `internet` | Internet Distribution | Signal | #2BB6A3 | ISP Clients |
| `webdev` | Web Development | Forge | #A78BFA | Projects |
| `playstation` | PlayStation Arena | Pulse | #FFB020 | Sessions |
| `repair` | Hardware Repair | Restore | #FF8800 | Job Cards |
| `cybersecurity` | Cybersecurity | Sentinel | #FF3366 | Contracts |
| `govadmin` | Gov Admin Assistance | Civic | #00FF88 | Documents |

**Common sub-navigation (all departments):** Overview, [unique feature], Transactions, CRM, Billing, Inventory, Tickets, Expenses, Staff Portal, Audit Log, Settings, Chat, Staff Invitation

**Features:**
- Department sub-sidebar (220px wide) with breathing color dot, branch name, department label
- Role check: `dept_admin` users can only access their own department
- Collapses when main AdminNavbar collapses (width → 0, opacity → 0)
- Main content area `marginLeft` adjusts to accommodate both sidebars (280 + 220 = 500px when expanded)

---

### `DepartmentLanding.jsx`
**Path:** `frontend/src/admin/components/DepartmentLanding.jsx`  
**Props:** `{ color }`

Generic department landing page with a feature grid.

**Features:** Overview, Orders, Clients, Bookings, Messages, Revenue, Inventory, Tickets — each as a card with icon, label, and description. Cards have hover glow effect using the department color.

---

### `DeptOverview.jsx`
**Path:** `frontend/src/admin/components/DeptOverview.jsx`  
**Props:** `{ slug, title, color, departmentId, extraStats }`

Department financial overview with KPI cards and income chart.

**KPI Cards:** Total Income, Total Expenses, Net Profit, Growth Rate — plus any `extraStats` passed in.

**Data source:** `GET /finance/income?departmentId=&year=`

Renders `<IncomeProjectionChart>` below the KPI cards.

---

### `IncomeProjectionChart.jsx`
**Path:** `frontend/src/admin/components/IncomeProjectionChart.jsx`  
**Props:** `{ departmentId, departmentLabel, range, showDepartmentBreakdown, currency }`

Revenue visualization chart using Recharts.

| Prop | Default | Description |
|---|---|---|
| `departmentId` | `null` | Filter to specific department (null = all). |
| `departmentLabel` | `'All Departments'` | Title prefix. |
| `range` | `'monthly'` | Data aggregation range. |
| `showDepartmentBreakdown` | `false` | Whether to show per-department bars. |
| `currency` | `'KES'` | Display currency. |

**Features:**
- Toggle between Bar and Line chart
- Year selector dropdown (2024–2027)
- KPI row: Income (green), Expenses (red), Net Profit (cyan)
- Custom tooltip with gradient background
- Growth rate indicator (green if ≥0, red if <0)
- Responsive container (height: 220px)

---

### `NotificationBell.jsx`
**Path:** `frontend/src/admin/components/NotificationBell.jsx`  
**Props:** None

Real-time notification dropdown.

**Features:**
- Bell icon with unread count badge (red, "9+" max)
- Dropdown panel: notification list with title, message, timestamp
- Real-time via `useSocket`: listens to `notification:new` and `notification:broadcast`
- Click to mark as read (`PUT /admin/notifications/:id/read`)
- Deduplicates by `_id`
- "● LIVE" indicator when unread notifications exist

---

### `ChatMonitor.jsx`
**Path:** `frontend/src/admin/components/ChatMonitor.jsx`  
**Props:** `{ authToken, onClose }`

Full-featured admin chat monitor (modal overlay).

**Layout:** Two-panel split — conversations list (300px) + chat area (flex 1).

**Features:**
- Conversation search/filter
- Conversation list with guest ID, last message preview, unread badge, timestamp
- Chat area with admin (cyan gradient) vs customer (transparent) message bubbles
- Message input with online/offline warning
- Connection status indicators (Connected/Disconnected, Online/Offline)
- Monitor toggle (ON/OFF)
- Close button

---

### `Soon.jsx`
**Path:** `frontend/src/admin/components/Soon.jsx`  
**Props:** `{ label }` — default: `"Feature"`

Placeholder component for features under development. Shows a clock emoji, "X Coming Soon" heading, and description text. Vertically centered, full available height.

---

## 10. Admin Context

See [AdminAuthContext](#adminauthcontextjsx) in Section 2.

---

## 11. Admin Pages — Super Admin

### `SuperDashboard.jsx`
**Path:** `frontend/src/admin/pages/super/SuperDashboard.jsx`  
**Exports:** `SuperAdminLayout` (named), `SuperDashboard` (default)

#### `SuperAdminLayout`
The top-level layout for the Super Admin section.

**Structure:**
- 230px fixed sidebar with navigation links
- Header bar with "Postera — Command Centre" title, `<NotificationBell>`, user info
- Main content area with `<RuaiPulseBoard>` at top, then `<Outlet />`

**Sidebar links:** Dashboard, All Departments, User Management, Email Allocation, Finance, All Tickets, Inventory Master, Audit Log, Broadcast, Settings

**Department links:** Color-coded dots for each department linking to their admin pages.

#### `SuperDashboard`
The default dashboard view.

**Features:**
- Department scorecards: 6-card grid showing revenue per department + staff count, linking to department pages
- Consolidated `<IncomeProjectionChart>` for all departments
- Revenue by Department pie chart (Recharts PieChart)
- "💬 Support Chat" button toggles `<ChatMonitor>` overlay
- Data sources: `GET /finance/breakdown`, `GET /users`

---

### `UserManagement.jsx`
**Path:** `frontend/src/admin/pages/super/UserManagement.jsx`

User management page for Super Admin. CRUD operations for user accounts.

---

## 12. Admin Pages — Department Landings

Each department has a `Landing.jsx` page that renders department-specific overview content.

### `internet/Landing.jsx`
**Path:** `frontend/src/admin/pages/internet/Landing.jsx`

Internet Distribution department landing. Renders `<DeptOverview>` with ISP-specific stats.

### `internet/Clients.jsx`
**Path:** `frontend/src/admin/pages/internet/Clients.jsx`

ISP client management page.

### `webdev/Landing.jsx`
**Path:** `frontend/src/admin/pages/webdev/Landing.jsx`

Web Development department landing.

### `webdev/Projects.jsx`
**Path:** `frontend/src/admin/pages/webdev/Projects.jsx`

Web development project management.

### `playstation/Landing.jsx`
**Path:** `frontend/src/admin/pages/playstation/Landing.jsx`

PlayStation Arena department landing.

### `playstation/Sessions.jsx`
**Path:** `frontend/src/admin/pages/playstation/Sessions.jsx`

PlayStation session management (also exposed at public route `/order-status`).

### `repair/Landing.jsx`
**Path:** `frontend/src/admin/pages/repair/Landing.jsx`

Hardware Repair department landing.

### `repair/JobCards.jsx`
**Path:** `frontend/src/admin/pages/repair/JobCards.jsx`

Hardware repair job card management — the core workflow for the repair department.

### `cybersecurity/Landing.jsx`
**Path:** `frontend/src/admin/pages/cybersecurity/Landing.jsx`

Cybersecurity department landing.

### `cybersecurity/Contracts.jsx`
**Path:** `frontend/src/admin/pages/cybersecurity/Contracts.jsx`

Security contract management.

### `govadmin/Landing.jsx`
**Path:** `frontend/src/admin/pages/govadmin/Landing.jsx`

Government Admin Assistance department landing.

### `govadmin/GovDocs.jsx`
**Path:** `frontend/src/admin/pages/govadmin/GovDocs.jsx`

Government document processing management.

---

## 13. Admin Pages — Shared Modules

These pages are reused across all department sub-navigations and the super admin panel.

| Page | Path | Description |
|---|---|---|
| `TransactionsPage` | `admin/pages/shared/TransactionsPage.jsx` | Financial transaction history with filters. |
| `CRMPage` | `admin/pages/shared/CRMPage.jsx` | Customer Relationship Management — contact database. Color prop for theming. |
| `BillingPage` | `admin/pages/shared/BillingPage.jsx` | Invoice and billing management. Color prop. |
| `InventoryPage` | `admin/pages/shared/InventoryPage.jsx` | Product/stock inventory management. Color prop. |
| `TicketsPage` | `admin/pages/shared/TicketsPage.jsx` | Support ticket queue. Color prop. |
| `ExpensesPage` | `admin/pages/shared/ExpensesPage.jsx` | Expense tracking and categorization. |
| `StaffPortalAdmin` | `admin/pages/shared/StaffPortalAdmin.jsx` | Admin view of staff portal activity. Color prop. |
| `StaffInvitation` | `admin/pages/shared/StaffInvitation.jsx` | Invite new staff members via email. Color prop. |
| `AuditLogPage` | `admin/pages/shared/AuditLogPage.jsx` | System audit log — who did what and when. |
| `BroadcastPage` | `admin/pages/shared/BroadcastPage.jsx` | Send broadcast notifications to all users. |
| `SettingsPage` | `admin/pages/shared/SettingsPage.jsx` | Department/super admin settings (toggle switches). |
| `MessagesPage` | `admin/pages/shared/MessagesPage.jsx` | Internal messaging system. |
| `FinancePage` | `admin/pages/shared/FinancePage.jsx` | Consolidated finance dashboard (super admin only). |
| `EmailAllocationPage` | `admin/pages/shared/EmailAllocationPage.jsx` | Manage email allocations for staff (super admin only). |

---

## 14. Staff & Client Portals

### `StaffDashboard.jsx`
**Path:** `frontend/src/pages/staff/StaffDashboard.jsx`

Staff-specific dashboard. Route: `/staff/:slug/dashboard`. Provides restricted view of department operations.

### `SetPassword.jsx`
**Path:** `frontend/src/pages/staff/SetPassword.jsx`

Staff password setup page. Route: `/staff/set-password`. Used when staff accept an invitation and need to set their initial password.

### `ClientPortal.jsx`
**Path:** `frontend/src/pages/client/ClientPortal.jsx`

Client-facing portal. Route: `/client/:slug`. Provides clients with project status, invoices, and communication.

### Other Public Pages

| Page | Route | Description |
|---|---|---|
| `Callbacks.jsx` | `/callbacks` | Callback request management. |
| `AdminChatControl.jsx` | `/admin/chat-control` | Admin chat control panel (legacy). |
| `AdminRevenueDashboard.jsx` | `/admin/revenue` | Admin revenue dashboard (legacy). |
| `Clients.jsx` | `/clients` | Client management (legacy admin). |
| `Dashboard.jsx` | `/dashboard` | Legacy admin dashboard. |
| `Bookings.jsx` | `/bookings` | Service booking management. |
| `Services.jsx` | `/services` (legacy) | Service management (legacy admin). |
| `Products.jsx` | `/products` | Product management (legacy admin). |
| `Orders.jsx` | `/orders` | Order management (legacy admin). |
| `Consultations.jsx` | `/consultations` | Consultation management (legacy admin). |
| `Revenue.jsx` | `/revenue` | Revenue tracking (legacy admin). |
| `Settings.jsx` | `/settings` | Admin settings (legacy). |
| `DeptStaff.jsx` | `/staff-accounts` | Staff account management. |

---

## Appendix A: Theme Tokens

### Primary Colors (PCL Circuit Canopy)

| Token | Hex | Usage |
|---|---|---|
| `--pcl-ember` | `#EE6100` | Primary accent, CTAs, active states |
| `--pcl-ember-glow` | `#FF8A3D` | Hover states, ember glow |
| `--pcl-ink` | `#244A44` | Secondary surfaces, borders |
| `--pcl-ink-bright` | `#2BB6A3` | Teal highlights, links, secondary accent |
| `--pcl-void` | `#081916` | Page background |
| `--pcl-void-raised` | `#0F2620` | Card/panel backgrounds |
| `--pcl-text` | `#F4F1EA` | Primary text |
| `--pcl-mist` | `#A9C4BE` | Secondary text |
| `--pcl-green` | `#39FF88` | Success, online status |
| `--pcl-amber` | `#FFB020` | Warning, connecting status |
| `--pcl-red` | `#FF3B3B` | Error, offline status |

### Typography

| Font | Usage |
|---|---|
| `Poppins` | Body text, labels, buttons |
| `Rajdhani` | Headings, hero titles |
| `Share Tech Mono` | Monospace elements, status labels, code-like UI |
| `Inter` | Admin UI, sidebar labels |

---

## Appendix B: Socket Events Reference

### Client → Server

| Event | Payload | Description |
|---|---|---|
| `chat-message` | `{ message, guestId }` | Customer sends a chat message |
| `admin-send-message` | `{ conversationId, message, guestId }` | Admin sends a message to customer |
| `admin-join-conversation` | `conversationId` | Admin joins a conversation room |
| `chat:request-callback` | `{ clientName, message, phone, guestId }` | Request a callback |
| `presence:get-beacons` | `departmentSlugs[]` | Request department online status |

### Server → Client

| Event | Payload | Description |
|---|---|---|
| `admin:status` | `{ online }` | Global admin availability change |
| `admin:status:dept` | `{ departmentSlug, online }` | Per-department status change |
| `admin:now-available` | `{}` | Admin came online notification |
| `new-chat-message` | `{ message, guestId, conversationId }` | Incoming customer message |
| `message-sent` | `{ message, conversationId }` | Confirmation of sent message |
| `chat-error` | `{ error }` | Chat error from server |
| `new-callback-request` | `{}` | New callback request notification |
| `notification:new` | `notification` | New notification |
| `notification:broadcast` | `notification` | Broadcast notification |
| `system:status` | `{ status }` | System health status change |

---

## Appendix C: API Endpoints Reference

### Authentication

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/login` | No | Login with email/password |
| GET | `/api/auth/me` | Yes | Get current user profile |

### Products (Public)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/products` | No | List products (with search, category, sort, pagination) |

### Calculator

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/calculator/estimate` | No | Get service price estimate |

### Help Desk

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/help/faq` | No | Get FAQs |
| GET | `/api/help/faq/search?q=` | No | Search FAQs |
| GET | `/api/help/troubleshooting` | No | Get troubleshooting guides |
| GET | `/api/help/knowledge-base` | No | Get knowledge base articles |
| GET | `/api/help/tickets` | Yes | Get user's support tickets |
| POST | `/api/help/tickets` | Yes | Submit a support ticket |

### Finance

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/finance/income` | Yes | Get income data (filterable by departmentId, year, range) |
| GET | `/api/finance/breakdown` | Yes | Get revenue breakdown by department |

### Chat

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/chat/callback` | No | Submit callback request |
| GET | `/api/chat/conversations/:id` | Yes | Get conversation messages |

### Health

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/health` | No | System health check (returns `{ status }`) |

### Admin

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/admin/notifications` | Yes | Get admin notifications |
| PUT | `/api/admin/notifications/:id/read` | Yes | Mark notification as read |

---

*Documentation generated for the Postera Crescam Laude (PCL) application — Freebuff Desktop.*
