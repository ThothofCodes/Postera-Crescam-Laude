# Postera Crescam Laude — Site Route Access Map

> **Copyright © 2026 Thoth of Codes. Licensed under the MIT License.**  
> **Platform:** MERN Stack · MongoDB Atlas · M-Pesa Daraja API  
> **Base URL (dev):** `http://localhost:3000`  
> **API Base URL (dev):** `http://localhost:5001/api`

---

## Access Level Legend

| Symbol | Role | Description |
|--------|------|-------------|
| 🌐 | **Public** | No login required — accessible by anyone |
| 🔐 | **Any Auth** | Requires a valid JWT token (any role) |
| 👤 | **Staff** | Requires role: `STAFF`, `DEPT_HEAD_OWNER`, or `SUPER_ADMIN` |
| 👑 | **Dept Head** | Requires role: `DEPT_HEAD_OWNER` or `SUPER_ADMIN` |
| 🔒 | **Super Admin** | Requires role: `SUPER_ADMIN` **AND** email: `codeofthoth@outlook.com` |
| 🏢 | **Dept Scoped** | Requires valid dept role AND matching `departmentSlug` |

---

## 1. Authentication Routes

| Route | Access | Page / Component | Notes |
|-------|--------|-----------------|-------|
| `/login` | 🌐 Public | `Login.js` | Platform admin login |
| `/admin/login` | 🌐 Public | `Login.js` | Alias — same login page |
| `/403` | 🌐 Public | Inline component | Access denied error page |

---

## 2. Public Store & Services

| Route | Access | Page / Component | Description |
|-------|--------|-----------------|-------------|
| `/store` | 🌐 Public | `Store.js` | Product catalogue with search, filters, sort |
| `/store/:slug` | 🌐 Public | `ProductDetail.js` | Single product detail page |
| `/cart` | 🌐 Public | `Cart.js` | Shopping cart — persisted in localStorage |
| `/checkout` | 🌐 Public | `Checkout.js` | Customer form + M-Pesa STK push payment |
| `/order-status` | 🌐 Public | `OrderStatus.js` | Track order by phone number |
| `/services` | 🌐 Public | `PublicServices.js` | All active services with Book Now CTA |
| `/calculator` | 🌐 Public | `Calculator.js` | Smart price estimator (service + hardware) |
| `/consult` | 🌐 Public | `ConsultLanding.js` | Consultation types catalogue |
| `/consult/book` | 🌐 Public | `ConsultBook.js` | Book a consultation session |
| `/contact` | 🌐 Public | `Contact.js` | Contact form, hours, WhatsApp link |

---

## 3. Legacy Platform Admin (General Admin)

> **Login:** `http://localhost:3000/login`  
> **Credentials:** `admin@pclsolutions.co.ke` / `PCL@2026`  
> **Guard:** JWT required — any authenticated user with `admin` or `staff` role

| Route | Access | Page / Component | Description |
|-------|--------|-----------------|-------------|
| `/` | 🔐 Any Auth | `Dashboard.js` | KPI cards + revenue vs expenses chart |
| `/clients` | 👤 Staff | `Clients.js` | Client CRUD — search, filter by type |
| `/services` | 👤 Staff | `Services.js` | Service CRUD + seed defaults |
| `/bookings` | 👤 Staff | `Bookings.js` | Booking CRUD + payment recording |
| `/products` | 👤 Staff | `Products.js` | Product CRUD + image upload + seed |
| `/orders` | 👤 Staff | `Orders.js` | Order queue + status pipeline + payment |
| `/consultations` | 👤 Staff | `Consultations.js` | Consultation queue + notes + complete |
| `/revenue` | 👤 Staff | `Revenue.js` | Income/expense ledger + chart |
| `/settings` | 👤 Staff | `Settings.js` | Pricing rules editor + availability slots |

---

## 4. Super Admin Dashboard

> **Login:** `http://localhost:3000/login`  
> **Credentials:** `codeofthoth@outlook.com` / `ThothSuperAdmin@2026`  
> **Guard:** Dual check — role must be `SUPER_ADMIN` **AND** email must be `codeofthoth@outlook.com`

| Route | Access | Page / Component | Description |
|-------|--------|-----------------|-------------|
| `/admin/super` | 🔒 Super Admin | `SuperDashboard.js` | Command centre — all dept scorecards + consolidated charts |
| `/admin/super/users` | 🔒 Super Admin | `UserManagement.js` | Create/edit/deactivate all users, assign roles & departments |
| `/admin/super/finance` | 🔒 Super Admin | *(coming soon)* | Cross-department financial reports |
| `/admin/super/audit` | 🔒 Super Admin | *(coming soon)* | Unified audit log — all departments |
| `/admin/super/broadcast` | 🔒 Super Admin | *(coming soon)* | Push notifications to all department panels |
| `/admin/super/settings` | 🔒 Super Admin | *(coming soon)* | System-wide configuration — API keys, SMTP, M-Pesa |

---

## 5. Department Admin Panels

> **Guard:** JWT required + role must be `DEPT_HEAD_OWNER` or `STAFF` + `departmentSlug` must match  
> **Super Admin** bypasses the slug scope check and can access all departments

### 5.1 Internet Distribution — `/admin/internet`

| Route | Access | Description |
|-------|--------|-------------|
| `/admin/internet` | 🏢 Dept Scoped | Department overview — KPI cards + income chart |
| `/admin/internet/clients` | 🏢 Dept Scoped | ISP client accounts *(coming soon)* |
| `/admin/internet/transactions` | 🏢 Dept Scoped | Income/expense transactions |
| `/admin/internet/staff` | 👑 Dept Head | Staff management |
| `/admin/internet/expenses` | 🏢 Dept Scoped | Expense logger |
| `/admin/internet/audit` | 🏢 Dept Scoped | Department audit log |
| `/admin/internet/settings` | 👑 Dept Head | Department profile settings |

### 5.2 Web Development — `/admin/webdev`

| Route | Access | Description |
|-------|--------|-------------|
| `/admin/webdev` | 🏢 Dept Scoped | Department overview — KPI cards + income chart |
| `/admin/webdev/projects` | 🏢 Dept Scoped | Project Kanban board — proposal → active → review → delivered |
| `/admin/webdev/transactions` | 🏢 Dept Scoped | Income/expense transactions |
| `/admin/webdev/staff` | 👑 Dept Head | Staff management |
| `/admin/webdev/expenses` | 🏢 Dept Scoped | Expense logger |
| `/admin/webdev/audit` | 🏢 Dept Scoped | Department audit log |
| `/admin/webdev/settings` | 👑 Dept Head | Department profile settings |

### 5.3 PlayStation Arena — `/admin/playstation`

| Route | Access | Description |
|-------|--------|-------------|
| `/admin/playstation` | 🏢 Dept Scoped | Department overview — KPI cards + income chart |
| `/admin/playstation/sessions` | 🏢 Dept Scoped | Live station map + session timers + billing |
| `/admin/playstation/transactions` | 🏢 Dept Scoped | Income/expense transactions |
| `/admin/playstation/staff` | 👑 Dept Head | Staff management |
| `/admin/playstation/expenses` | 🏢 Dept Scoped | Expense logger |
| `/admin/playstation/audit` | 🏢 Dept Scoped | Department audit log |
| `/admin/playstation/settings` | 👑 Dept Head | Department profile settings |

### 5.4 Hardware Repair — `/admin/repair`

| Route | Access | Description |
|-------|--------|-------------|
| `/admin/repair` | 🏢 Dept Scoped | Department overview — KPI cards + income chart |
| `/admin/repair/jobcards` | 🏢 Dept Scoped | Job card CRUD — device intake, status, technician assignment |
| `/admin/repair/transactions` | 🏢 Dept Scoped | Income/expense transactions |
| `/admin/repair/staff` | 👑 Dept Head | Staff management |
| `/admin/repair/expenses` | 🏢 Dept Scoped | Expense logger |
| `/admin/repair/audit` | 🏢 Dept Scoped | Department audit log |
| `/admin/repair/settings` | 👑 Dept Head | Department profile settings |

### 5.5 Cybersecurity — `/admin/cybersecurity`

| Route | Access | Description |
|-------|--------|-------------|
| `/admin/cybersecurity` | 🏢 Dept Scoped | Department overview — KPI cards + income chart |
| `/admin/cybersecurity/contracts` | 🏢 Dept Scoped | Service contracts *(coming soon)* |
| `/admin/cybersecurity/transactions` | 🏢 Dept Scoped | Income/expense transactions |
| `/admin/cybersecurity/staff` | 👑 Dept Head | Staff management |
| `/admin/cybersecurity/expenses` | 🏢 Dept Scoped | Expense logger |
| `/admin/cybersecurity/audit` | 🏢 Dept Scoped | Department audit log |
| `/admin/cybersecurity/settings` | 👑 Dept Head | Department profile settings |

### 5.6 Gov Admin Assistance — `/admin/govadmin`

| Route | Access | Description |
|-------|--------|-------------|
| `/admin/govadmin` | 🏢 Dept Scoped | Department overview — KPI cards + income chart |
| `/admin/govadmin/govdocs` | 🏢 Dept Scoped | Document request tracker *(coming soon)* |
| `/admin/govadmin/transactions` | 🏢 Dept Scoped | Income/expense transactions |
| `/admin/govadmin/staff` | 👑 Dept Head | Staff management |
| `/admin/govadmin/expenses` | 🏢 Dept Scoped | Expense logger |
| `/admin/govadmin/audit` | 🏢 Dept Scoped | Department audit log |
| `/admin/govadmin/settings` | 👑 Dept Head | Department profile settings |

---

## 6. Backend API Endpoints

> **Base:** `http://localhost:5000/api`  
> All protected routes require `Authorization: Bearer <token>` header

### Authentication

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `POST` | `/auth/register` | 🌐 Public | Create new user account |
| `POST` | `/auth/login` | 🌐 Public | Login — returns JWT token + user object |
| `GET` | `/auth/me` | 🔐 Any Auth | Get current authenticated user |

### Health

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/health` | 🌐 Public | Server + MongoDB connection status |

### Clients

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/clients` | 👤 Staff | List clients with search + type filter |
| `POST` | `/clients` | 🌐 Public | Create client (used by ConsultBook) |
| `GET` | `/clients/:id` | 👤 Staff | Single client detail |
| `PUT` | `/clients/:id` | 👤 Staff | Update client |
| `DELETE` | `/clients/:id` | 👤 Staff | Delete client |

### Services

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/services` | 🌐 Public | List all active services |
| `POST` | `/services` | 🔒 Super Admin | Create service |
| `POST` | `/services/seed` | 🔒 Super Admin | Seed default services |
| `PUT` | `/services/:id` | 🔒 Super Admin | Update service |
| `DELETE` | `/services/:id` | 🔒 Super Admin | Delete service |

### Bookings

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/bookings` | 👤 Staff | List bookings with status filter |
| `POST` | `/bookings` | 👤 Staff | Create booking |
| `GET` | `/bookings/:id` | 👤 Staff | Single booking detail |
| `PUT` | `/bookings/:id` | 👤 Staff | Update booking / status |
| `PUT` | `/bookings/:id/payment` | 👤 Staff | Record payment |
| `DELETE` | `/bookings/:id` | 👤 Staff | Delete booking |

### Products

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/products` | 🌐 Public | List products with filters |
| `GET` | `/products/:slug` | 🌐 Public | Single product by slug |
| `POST` | `/products` | 🔒 Super Admin | Create product + image upload |
| `POST` | `/products/seed` | 🔒 Super Admin | Seed sample products |
| `PUT` | `/products/:id` | 🔒 Super Admin | Update product |
| `DELETE` | `/products/:id` | 🔒 Super Admin | Soft-delete (deactivate) |

### Orders

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/orders/my/:phone` | 🌐 Public | Customer order lookup by phone |
| `POST` | `/orders` | 🌐 Public | Place order + trigger M-Pesa STK push |
| `GET` | `/orders` | 👤 Staff | List all orders |
| `GET` | `/orders/:id` | 👤 Staff | Single order detail |
| `PUT` | `/orders/:id/status` | 👤 Staff | Update order status |
| `PUT` | `/orders/:id/payment` | 👤 Staff | Record payment |

### Consultations

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/consultations/types` | 🌐 Public | List consultation types + fees |
| `GET` | `/consultations/availability` | 🌐 Public | Available slots for a date range |
| `POST` | `/consultations/availability` | 🔒 Super Admin | Add availability slot |
| `GET` | `/consultations/stats` | 🔒 Super Admin | Revenue + volume stats |
| `POST` | `/consultations` | 🌐 Public | Book a consultation |
| `GET` | `/consultations` | 👤 Staff | List all consultations |
| `GET` | `/consultations/:id` | 👤 Staff | Single consultation detail |
| `PUT` | `/consultations/:id/confirm` | 👤 Staff | Confirm booking |
| `PUT` | `/consultations/:id/complete` | 👤 Staff | Mark complete + save notes |
| `PUT` | `/consultations/:id/cancel` | 👤 Staff | Cancel consultation |

### Revenue

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/revenue/summary` | 👤 Staff | Monthly income/expense aggregation |
| `GET` | `/revenue` | 👤 Staff | Ledger entries with filters |
| `POST` | `/revenue` | 👤 Staff | Add revenue entry |
| `PUT` | `/revenue/:id` | 👤 Staff | Update entry |
| `DELETE` | `/revenue/:id` | 👤 Staff | Delete entry |

### Calculator

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/calculator/pricing-rules` | 🌐 Public | All active pricing rules |
| `POST` | `/calculator/estimate` | 🌐 Public | Get price estimate for service + tier |
| `POST` | `/calculator/seed` | 🔒 Super Admin | Seed default pricing rules |
| `PUT` | `/calculator/pricing-rules/:id` | 🔒 Super Admin | Update a pricing rule |

### Payments

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `POST` | `/payments/mpesa/callback` | 🌐 Public | Safaricom Daraja callback webhook |

### Departments

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/departments` | 🌐 Public | List all active departments |
| `POST` | `/departments/seed` | 🔒 Super Admin | Seed 6 default departments |
| `GET` | `/departments/:slug` | 🔐 Any Auth | Single department by slug |
| `PUT` | `/departments/:slug` | 👑 Dept Head | Update department profile |
| `POST` | `/departments/:slug/target` | 🔒 Super Admin | Set monthly revenue target |

### Finance (Multi-Dept)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/finance/income` | 👑 Dept Head | Income projection — scoped or consolidated |
| `GET` | `/finance/breakdown` | 🔒 Super Admin | Revenue breakdown by department |
| `GET` | `/finance/transactions` | 👤 Staff | Department transactions |
| `POST` | `/finance/transactions` | 👤 Staff | Add transaction |
| `DELETE` | `/finance/transactions/:id` | 👑 Dept Head | Delete transaction |

### Users (Super Admin Only)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/users` | 🔒 Super Admin | List all users |
| `POST` | `/users` | 🔒 Super Admin | Create user + assign department |
| `PUT` | `/users/:id` | 🔒 Super Admin | Update user role/department |
| `POST` | `/users/:id/reset-password` | 🔒 Super Admin | Reset user password |
| `DELETE` | `/users/:id` | 🔒 Super Admin | Deactivate user |

### Department Modules

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/dept/jobcards` | 🏢 Dept Scoped | Hardware Repair — list job cards |
| `POST` | `/dept/jobcards` | 🏢 Dept Scoped | Create job card |
| `PUT` | `/dept/jobcards/:id` | 🏢 Dept Scoped | Update job card + SMS on complete |
| `GET` | `/dept/sessions` | 🏢 Dept Scoped | PlayStation — list sessions |
| `POST` | `/dept/sessions/start` | 🏢 Dept Scoped | Start gaming session |
| `PUT` | `/dept/sessions/:id/end` | 🏢 Dept Scoped | End session + calculate billing |
| `GET` | `/dept/projects` | 🏢 Dept Scoped | Web Dev — list projects |
| `POST` | `/dept/projects` | 🏢 Dept Scoped | Create project |
| `PUT` | `/dept/projects/:id` | 🏢 Dept Scoped | Update project |
| `GET` | `/dept/govdocs` | 🏢 Dept Scoped | Gov Admin — list documents |
| `POST` | `/dept/govdocs` | 🏢 Dept Scoped | Create document request |
| `PUT` | `/dept/govdocs/:id` | 🏢 Dept Scoped | Update document + SMS on complete |
| `GET` | `/dept/ispclients` | 🏢 Dept Scoped | Internet — list ISP clients |
| `POST` | `/dept/ispclients` | 🏢 Dept Scoped | Create ISP client |
| `PUT` | `/dept/ispclients/:id` | 🏢 Dept Scoped | Update ISP client |

### Admin Utilities

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/admin/notifications` | 👤 Staff | Get my notifications |
| `PUT` | `/admin/notifications/:id/read` | 👤 Staff | Mark notification as read |
| `POST` | `/admin/notifications/broadcast` | 🔒 Super Admin | Broadcast to all panels |
| `GET` | `/admin/audit` | 👤 Staff | Audit log (scoped to own dept) |

---

## 7. Credentials Summary

| Portal | URL | Email | Password | Role |
|--------|-----|-------|----------|------|
| Super Admin | `/admin/super` | `codeofthoth@outlook.com` | `ThothSuperAdmin@2026` | `SUPER_ADMIN` |
| Platform Admin | `/login` | `admin@pclsolutions.co.ke` | `PCL@2026` | `admin` |
| Dept Head (example) | `/admin/{slug}` | Assigned via User Management | Set at creation | `DEPT_HEAD_OWNER` |
| Staff (example) | `/admin/{slug}` | Assigned via User Management | Set at creation | `STAFF` |

---

## 8. Security Notes

- **Super Admin** is identity-locked: role `SUPER_ADMIN` **AND** email `codeofthoth@outlook.com` must both match. Stored in `process.env.SUPER_ADMIN_EMAIL` — never exposed to the frontend bundle.
- **Department scope** is enforced server-side: all queries from dept panels are filtered by `{ department: req.user.department._id }` — a dept head cannot query another department's data.
- **Super Admin account** has `superAdminLocked: true` in the database — it cannot be modified or deactivated via the standard user update endpoint.
- **JWT tokens** expire after `8h` by default (configurable via `JWT_EXPIRE` in `.env`).
- **M-Pesa callback** (`/api/payments/mpesa/callback`) must be publicly accessible via HTTPS. Use `ngrok http 5000` for local development.

---

## 9. Quick Start

```bash
# 1. Start backend
cd backend && npm run dev

# 2. Start frontend (new terminal)
cd frontend && npm start

# 3. Seed database (first time only)
cd backend && node seed.js
```

---

*© 2026 Thoth of Codes — Postera Crescam Laude. All rights reserved. MIT License.*
