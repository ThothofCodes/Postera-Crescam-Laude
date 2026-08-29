# PCL / Postera Crescam Laude — API Documentation

> **Base URL:** `http://localhost:5001` (development)  
> **Content-Type:** `application/json`  
> **Authentication:** Bearer token via `Authorization` header  
> **Rate Limits:** 100 req / 15 min globally · 10 req / 15 min on auth endpoints · 20 req / 1 hr on chat callback

---

## Table of Contents

1. [Authentication & Authorization](#1-authentication--authorization)
2. [Health Check](#2-health-check)
3. [Auth Routes](#3-auth-routes)
4. [Users](#4-users)
5. [Departments](#5-departments)
6. [Products](#6-products)
7. [Orders](#7-orders)
8. [Services](#8-services)
9. [Bookings](#9-bookings)
10. [Consultations](#10-consultations)
11. [Clients](#11-clients)
12. [CRM](#12-crm)
13. [Revenue](#13-revenue)
14. [Finance](#14-finance)
15. [Billing & Invoices](#15-billing--invoices)
16. [Payments (M-Pesa)](#16-payments-mpesa)
17. [Calculator / Pricing](#17-calculator--pricing)
18. [Tickets](#18-tickets)
19. [Staff Portal (Memos & Assessments)](#19-staff-portal-memos--assessments)
20. [Staff Invitation](#20-staff-invitation)
21. [Inventory](#21-inventory)
22. [Department Modules](#22-department-modules)
23. [Public Tracking](#23-public-tracking)
24. [Notifications & Audit](#24-notifications--audit)
25. [Chat](#25-chat)
26. [Admin Revenue Stats](#26-admin-revenue-stats)
27. [Email Allocation](#27-email-allocation)
28. [USSD](#28-ussd)
29. [Analytics / BI](#29-analytics--bi)
30. [Help Desk](#30-help-desk)
31. [Socket.io Events](#31-socketio-events)
32. [Middleware Reference](#32-middleware-reference)
33. [Data Models](#33-data-models)

---

## 1. Authentication & Authorization

### JWT Token

All protected endpoints require a `Bearer` token in the `Authorization` header:

```
Authorization: Bearer <token>
```

**Token payload:**
```json
{
  "id": "ObjectId",
  "email": "user@example.com",
  "role": "SUPER_ADMIN | DEPT_HEAD_OWNER | STAFF",
  "departmentId": "ObjectId | null",
  "departmentSlug": "string | null",
  "isOwner": false
}
```

**Algorithm:** HS256 (pinned)  
**Expiry:** 8 hours (configurable via `JWT_EXPIRE`)

### Role Hierarchy

| Role | Clearance | Scope |
|------|-----------|-------|
| `SUPER_ADMIN` | Highest — identity-locked to `SUPER_ADMIN_EMAIL` | All departments, all data |
| `DEPT_HEAD_OWNER` | Department-scoped admin | Own department only |
| `STAFF` | Read-only + limited write | Own department, scoped views |
| `CLIENT` | OTP-authenticated customer | Portal access only |

### Auth Middleware Stack

| Middleware | Description |
|------------|-------------|
| `protect` | Verifies JWT, loads user, checks `isActive`, matches email |
| `superAdminGuard` | Role + email identity lock |
| `deptHeadGuard` | `SUPER_ADMIN` or `DEPT_HEAD_OWNER` |
| `staffGuard` | Any authenticated staff role |
| `deptAdminGuard` | `SUPER_ADMIN`, `DEPT_HEAD_OWNER`, or `admin` |
| `staffManagerGuard` | Same as `deptAdminGuard` |
| `staffReadScope` | Admins see all; STAFF get `req.deptFilter` applied |
| `deptScope` | Enforces department isolation (except SUPER_ADMIN) |
| `authorize(...roles)` | Generic role whitelist |
| `auditLog(action, resource)` | Logs successful requests to `AuditLog` collection |

---

## 2. Health Check

```
GET /api/health
```

**No auth required.**

**Response (200):**
```json
{
  "status": "ok",
  "db": "connected"
}
```

**Response (503 — DB down):**
```json
{
  "status": "degraded",
  "db": "disconnected",
  "hint": "Set MONGO_URI in backend/.env and restart the server"
}
```

---

## 3. Auth Routes

Base: `/api/auth`

### POST `/api/auth/login`

**No auth required** (rate-limited: 10 / 15 min).

**Request:**
```json
{
  "email": "user@example.com",
  "password": "string"
}
```

**Response (200):**
```json
{
  "token": "jwt...",
  "user": {
    "id": "ObjectId",
    "name": "John Doe",
    "email": "user@example.com",
    "role": "STAFF",
    "department": { "_id": "...", "name": "Hardware Repair", "slug": "repair" },
    "departmentSlug": "repair",
    "isOwner": false
  }
}
```

**Errors:** `400` missing fields · `401` invalid credentials · `403` deactivated

---

### POST `/api/auth/register`

**Auth:** `protect` → `superAdminGuard`

**Request:**
```json
{
  "name": "string (min 2 chars)",
  "email": "string (valid email)",
  "password": "string (min 8 chars)",
  "role": "DEPT_HEAD_OWNER | STAFF",
  "department": "ObjectId (optional)",
  "departmentSlug": "string (optional)",
  "isOwner": false
}
```

> **Note:** `SUPER_ADMIN` creation via API is blocked.

**Response (201):**
```json
{
  "token": "jwt...",
  "user": { "id", "name", "email", "role", "departmentSlug" }
}
```

---

### GET `/api/auth/me`

**Auth:** `protect`

Returns the authenticated user's full profile (password excluded).

---

### POST `/api/auth/verify-token`

**No auth required.**

**Request:**
```json
{
  "token": "string (invitation token)",
  "userId": "ObjectId"
}
```

**Response (200):**
```json
{
  "valid": true,
  "message": "Token is valid",
  "user": { "id", "name", "email", "role" }
}
```

---

### POST `/api/auth/set-password`

**No auth required.**

**Request:**
```json
{
  "token": "string",
  "userId": "ObjectId",
  "password": "string (min 8 chars)"
}
```

Activates the user account and marks email as verified.

---

## 4. Users

Base: `/api/users`  
**Auth:** `protect` → `staffManagerGuard`

### GET `/api/users`

Returns users scoped by role:
- **SUPER_ADMIN:** All users (optional filters: `role`, `departmentSlug`)
- **DEPT_HEAD_OWNER:** Only own department's users

**Query params:** `role`, `departmentSlug`

**Response (200):**
```json
[
  {
    "_id": "ObjectId",
    "name": "string",
    "email": "string",
    "role": "STAFF",
    "department": { "name": "string", "slug": "string" },
    "departmentSlug": "string",
    "isActive": true,
    "lastLogin": "ISO date"
  }
]
```

---

### POST `/api/users`

**Request:**
```json
{
  "name": "string",
  "email": "string",
  "password": "string",
  "role": "STAFF | DEPT_HEAD_OWNER",
  "departmentSlug": "string",
  "isOwner": false
}
```

**Restrictions:**
- Cannot create `SUPER_ADMIN`
- Dept heads can only create `STAFF` in their own department

**Response (201):**
```json
{ "id", "name", "email", "role", "departmentSlug" }
```

---

### PUT `/api/users/:id`

**Request:** Partial update — `name`, `role`, `departmentSlug`, `isOwner`, `isActive`

**Restrictions:** Dept heads can only update STAFF in their own department; cannot promote above STAFF.

---

### POST `/api/users/:id/reset-password`

**Request:**
```json
{ "password": "new password" }
```

---

### DELETE `/api/users/:id`

Deactivates the user (`isActive = false`). Cannot deactivate SUPER_ADMIN.

---

## 5. Departments

Base: `/api/departments`

### GET `/api/departments`

**No auth required.**

Returns all active departments sorted by name.

**Response (200):**
```json
[
  {
    "_id": "ObjectId",
    "name": "Internet Distribution",
    "slug": "internet",
    "description": "ISP packages, hotspot sessions, network management",
    "isActive": true,
    "monthlyTargets": [{ "month": "2026-01", "target": 100000 }]
  }
]
```

**Departments:**
| Slug | Name |
|------|------|
| `internet` | Internet Distribution |
| `webdev` | Web Development |
| `playstation` | PlayStation Arena |
| `repair` | Hardware Repair |
| `cybersecurity` | Cybersecurity |
| `govadmin` | Gov Admin Assistance |

---

### POST `/api/departments/seed`

**Auth:** `protect` → `superAdminGuard`

Seeds/updates all 6 default departments.

---

### GET `/api/departments/:slug`

**Auth:** `protect`

---

### PUT `/api/departments/:slug`

**Auth:** `protect` → `deptHeadGuard`

Updates department fields.

---

### POST `/api/departments/:slug/target`

**Auth:** `protect` → `superAdminGuard`

**Request:**
```json
{
  "month": "2026-01",
  "target": 100000
}
```

---

## 6. Products

Base: `/api/products`

### GET `/api/products`

**No auth required.**

**Query params:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page (max 100) |
| `sort` | string | `-createdAt` | `-createdAt`, `price`, `-price`, `-soldCount`, `name` |
| `category` | string | — | `electronics`, `accessories`, `software`, `services` |
| `featured` | boolean | — | Filter featured products |
| `search` | string | — | Search name, description, shortDesc, tags |

**Response (200):**
```json
{
  "products": [
    {
      "_id": "ObjectId",
      "name": "Refurbished Laptop Core i5",
      "slug": "refurbished-laptop-core-i5",
      "category": "electronics",
      "description": "...",
      "shortDesc": "...",
      "price": 45000,
      "comparePrice": 55000,
      "images": ["https://res.cloudinary.com/..."],
      "stock": 5,
      "isDigital": false,
      "isActive": true,
      "featured": true,
      "tags": ["laptop", "refurbished"],
      "rating": 0,
      "reviewCount": 0,
      "soldCount": 0,
      "warranty": "3 months",
      "createdAt": "ISO date"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 42,
    "pages": 3
  }
}
```

---

### GET `/api/products/featured`

Returns up to 10 featured active products.

---

### GET `/api/products/search?q=...`

**Query:** `q` (required) — search term.

**Response:** Array of matching products (max 20).

---

### GET `/api/products/:id`

Returns a single active product by ID.

---

### POST `/api/products`

**Auth:** `protect` → `deptAdminGuard`  
**Content-Type:** `multipart/form-data`

**Form fields:**
| Field | Type | Required |
|-------|------|----------|
| `name` | string | Yes (max 120) |
| `category` | string | Yes |
| `description` | string | Yes (max 2000) |
| `shortDesc` | string | No (max 200) |
| `price` | number | Yes (≥ 0) |
| `comparePrice` | number | No |
| `stock` | number | No (≥ 0) |
| `isDigital` | boolean | No |
| `featured` | boolean | No |
| `tags` | string (comma-separated) | No |
| `warranty` | string | No (max 100) |
| `images` | file[] | No (max 5, image types only) |

**Response (201):** Created product object.

---

### PUT `/api/products/:id`

**Auth:** `protect` → `deptAdminGuard`  
**Content-Type:** `multipart/form-data`

Same fields as POST (all optional). If `images` are provided, they replace the existing array.

---

### DELETE `/api/products/:id`

**Auth:** `protect` → `deptAdminGuard`

Soft-deletes (`isActive = false`).

---

## 7. Orders

Base: `/api/orders`

### POST `/api/orders`

**No auth required.** (Public checkout endpoint)

**Request:**
```json
{
  "items": [
    { "product": "ObjectId", "quantity": 2 }
  ],
  "customer": {
    "name": "string",
    "phone": "string (9-15 digits)",
    "email": "string (optional)",
    "deliveryAddress": "string (optional)"
  },
  "deliveryType": "pickup | delivery",
  "deliveryFee": 0,
  "notes": "string (optional)",
  "paymentMethod": "mpesa | cash | bank"
}
```

**Constraints:** 1–50 items per order. Stock is validated for non-digital products.

If `paymentMethod` is `mpesa`, an STK push is triggered automatically.

**Response (201):**
```json
{
  "_id": "ObjectId",
  "orderNumber": "RTS-2026-00001",
  "customer": { "name", "phone", "email", "deliveryAddress" },
  "items": [{ "product", "name", "price", "quantity", "subtotal" }],
  "subtotal": 90000,
  "deliveryFee": 0,
  "total": 90000,
  "status": "pending",
  "paymentStatus": "unpaid",
  "paymentMethod": "mpesa",
  "deliveryType": "pickup",
  "checkoutRequestId": "ws_CO_...",
  "createdAt": "ISO date"
}
```

---

### GET `/api/orders/my/:phone`

**No auth required.**

Returns all orders for a given phone number (sanitized).

**Response:** Array of order summaries.

---

### GET `/api/orders`

**Auth:** `protect` → `staffGuard` → `staffReadScope`

**Query params:** `page`, `limit`, `status`, `paymentStatus`

**Response:**
```json
{
  "orders": [...],
  "total": 42,
  "page": 1,
  "pages": 3
}
```

---

### GET `/api/orders/:id`

**Auth:** `protect` → `staffGuard` → `staffReadScope`

Populates `items.product` with `name` and `images`.

---

### PUT `/api/orders/:id/status`

**Auth:** `protect` → `deptHeadGuard`

**Request:**
```json
{
  "status": "confirmed | processing | shipped | delivered | cancelled"
}
```

Sends SMS notification on status change.

---

### PUT `/api/orders/:id/payment`

**Auth:** `protect` → `staffGuard` → `staffReadScope`

**Request:**
```json
{
  "paymentMethod": "mpesa | cash | bank",
  "mpesaRef": "string (optional)",
  "amount": 90000
}
```

Records payment, creates `Revenue` entry, decrements stock, sends SMS.

---

## 8. Services

Base: `/api/services`

### GET `/api/services`

**No auth required.**

**Query params:** `category`, `isActive`

---

### GET `/api/services/:id`

**No auth required.**

---

### POST `/api/services`

**Auth:** `protect` → `deptAdminGuard`

**Request:**
```json
{
  "name": "string",
  "category": "internet | printing | gaming | web-dev | cybersecurity | hardware | it-support | social-media | other",
  "basePrice": 50,
  "priceUnit": "per hour",
  "description": "string (optional)",
  "isActive": true
}
```

---

### PUT `/api/services/:id`

**Auth:** `protect` → `deptAdminGuard`

---

### DELETE `/api/services/:id`

**Auth:** `protect` → `deptAdminGuard`

Hard delete.

---

### POST `/api/services/seed`

**Auth:** `protect` → `superAdminGuard`

Deletes all services and re-seeds 11 defaults.

---

## 9. Bookings

Base: `/api/bookings`

All routes require `protect` → `staffGuard`.

### GET `/api/bookings`

**Auth:** `staffGuard` → `staffReadScope`

**Query params:** `status`, `paymentStatus`, `page`, `limit`

STAFF only see bookings for services in their department's category.

**Response:**
```json
{
  "bookings": [
    {
      "_id": "ObjectId",
      "client": { "name": "...", "phone": "..." },
      "service": { "name": "...", "category": "..." },
      "status": "pending | confirmed | completed | cancelled",
      "paymentStatus": "unpaid | paid",
      "amountCharged": 5000,
      "scheduledDate": "ISO date",
      "createdAt": "ISO date"
    }
  ],
  "total": 15,
  "page": 1,
  "pages": 1
}
```

---

### GET `/api/bookings/:id`

**Auth:** `staffGuard` → `staffReadScope`

---

### POST `/api/bookings`

**Auth:** `deptHeadGuard`

**Request:**
```json
{
  "client": "ObjectId",
  "service": "ObjectId",
  "scheduledDate": "ISO date",
  "amountCharged": 5000,
  "notes": "string (optional)"
}
```

---

### PUT `/api/bookings/:id`

**Auth:** `deptHeadGuard`

---

### PUT `/api/bookings/:id/payment`

**Auth:** `staffGuard` → `staffReadScope`

**Request:**
```json
{
  "paymentMethod": "mpesa | cash | bank",
  "mpesaRef": "string",
  "amount": 5000
}
```

Creates `Revenue` entry, updates service `totalRevenue` and client `totalSpent`, sends SMS.

---

### DELETE `/api/bookings/:id`

**Auth:** `deptHeadGuard`

Hard delete.

---

## 10. Consultations

Base: `/api/consultations`

### GET `/api/consultations/types`

**No auth required.**

Returns all consultation types with fee tiers:

```json
[
  {
    "type": "web-development",
    "fees": { "60": 1500, "90": 2000 }
  },
  ...
]
```

**Types:** `web-development`, `cybersecurity`, `business-digitisation`, `networking`, `hardware-advisory`, `social-media-strategy`, `data-recovery`, `general-it`

---

### GET `/api/consultations/availability?date=YYYY-MM-DD`

**No auth required.**

Returns available slots for the next 7 days from the given date.

---

### POST `/api/consultations`

**No auth required.**

**Request:**
```json
{
  "client": "ObjectId",
  "consultationType": "web-development",
  "duration": 60,
  "preferredDate": "ISO date",
  "preferredTime": "14:00",
  "payNow": true,
  "notes": "string (optional)"
}
```

If `payNow` is true, triggers M-Pesa STK push. Sends SMS confirmation.

**Response (201):**
```json
{
  "_id": "ObjectId",
  "consultationType": "web-development",
  "duration": 60,
  "fee": 1500,
  "status": "pending",
  "preferredDate": "ISO date",
  "checkoutRequestId": "ws_CO_...",
  ...
}
```

---

### GET `/api/consultations`

**Auth:** `protect` → `staffGuard` → `staffReadScope`

**Query params:** `status`, `consultationType`, `page`, `limit`

---

### GET `/api/consultations/:id`

**Auth:** `protect` → `staffGuard` → `staffReadScope`

---

### PUT `/api/consultations/:id/confirm`

**Auth:** `protect` → `deptHeadGuard`

Sets status to `confirmed`, sends SMS.

---

### PUT `/api/consultations/:id/complete`

**Auth:** `protect` → `deptHeadGuard`

**Request:**
```json
{
  "consultantNotes": "string",
  "clientSummary": "string (emailed to client)",
  "followUpRequired": false
}
```

Creates `Revenue` entry, updates client `totalSpent`, optionally emails summary.

---

### PUT `/api/consultations/:id/cancel`

**Auth:** `protect` → `deptHeadGuard`

Releases availability slot, sends SMS.

---

### POST `/api/consultations/availability`

**Auth:** `protect` → `superAdminGuard`

**Request:** `{ "date": "ISO date", "startTime": "09:00", "endTime": "10:00", "consultant": "ObjectId" }`

---

### GET `/api/consultations/stats`

**Auth:** `protect` → `superAdminGuard`

Returns aggregated stats by type and month.

---

## 11. Clients

Base: `/api/clients`  
**Auth:** `protect` → `staffGuard` (all routes)

### GET `/api/clients`

**Query params:** `page`, `limit`, `search` (name/phone), `clientType`

**Client types:** `individual`, `sme`, `institution`, `ngo`

---

### GET `/api/clients/:id`

---

### POST `/api/clients`

**Request:**
```json
{
  "name": "string (min 2)",
  "phone": "string",
  "email": "string (optional)",
  "clientType": "individual",
  "notes": "string (optional)"
}
```

---

### PUT `/api/clients/:id`

---

### DELETE `/api/clients/:id`

Hard delete.

---

## 12. CRM

Base: `/api/crm`

### Public Routes (no auth)

#### POST `/api/crm/request-otp`

**Request:** `{ "phone": "0712345678" }`

Sends 6-digit OTP via SMS. OTP valid for 10 minutes.

**Response:** `{ "message": "OTP sent" }`

---

#### POST `/api/crm/verify-otp`

**Request:** `{ "phone": "0712345678", "otp": "123456" }`

**Response (200):**
```json
{
  "token": "jwt...",
  "client": {
    "id": "ObjectId",
    "fullName": "string",
    "phone": "string",
    "departmentSlug": "string"
  }
}
```

---

### Staff Routes (auth required)

All routes below require `protect` → `staffGuard`.

#### GET `/api/crm`

**Query params:** `page`, `limit`, `search`, `segment`

**Segments:** `LEAD`, `ACTIVE`, `VIP`, `DORMANT`

---

#### POST `/api/crm`

**Request:**
```json
{
  "fullName": "string",
  "phone": "string",
  "email": "string (optional)",
  "idType": "string (optional)",
  "idNumber": "string (optional)",
  "address": "string (optional)",
  "tags": ["string"],
  "notes": "string (optional)",
  "segment": "LEAD"
}
```

Auto-generates `referralCode`.

---

#### GET `/api/crm/:id`

---

#### PATCH `/api/crm/:id`

---

#### POST `/api/crm/:id/interactions`

**Request:**
```json
{
  "type": "call | visit | email | sms",
  "summary": "string (required, max 1000)",
  "outcome": "string (optional)",
  "followUpDate": "ISO date (optional)"
}
```

---

#### POST `/api/crm/:id/portal-invite`

**Auth:** `deptHeadGuard`

Sends portal access OTP via SMS.

---

#### POST `/api/crm/bulk-sms`

**Auth:** `deptHeadGuard`

**Request:** `{ "segment": "ACTIVE", "message": "string (max 160 chars)" }`

---

#### POST `/api/crm/:id/redeem-points`

**Auth:** `staffGuard`

**Request:** `{ "pointsToRedeem": 200, "invoiceId": "ObjectId (optional)" }`

Rate: 100 pts = KES 50 discount. Minimum 100 pts, must be multiple of 100.

---

#### POST `/api/crm/:id/referral-code`

**Auth:** `staffGuard`

Generates/retrieves referral code.

---

## 13. Revenue

Base: `/api/revenue`  
**Auth:** `protect` → `staffGuard` (all routes)

### GET `/api/revenue/summary?year=2026`

Returns monthly income/expense aggregation for the year.

**Response:**
```json
[
  { "_id": { "month": 1, "type": "income" }, "total": 500000 },
  { "_id": { "month": 1, "type": "expense" }, "total": 120000 }
]
```

---

### GET `/api/revenue`

**Query params:** `page`, `limit`, `type` (`income`|`expense`), `category`, `startDate`, `endDate`

**Categories:** `booking`, `order`, `consultation`, `salary`, `rent`, `utilities`, `stock`, `marketing`, `other`

**Payment methods:** `mpesa`, `cash`, `bank`

---

### POST `/api/revenue`

**Request:**
```json
{
  "type": "income",
  "category": "booking",
  "description": "string",
  "amount": 5000,
  "date": "ISO date (optional)",
  "paymentMethod": "mpesa",
  "reference": "string (optional)"
}
```

Auto-tags to creating user's department.

---

### PUT `/api/revenue/:id`

---

### DELETE `/api/revenue/:id`

---

## 14. Finance

Base: `/api/finance`

### GET `/api/finance/income`

**Auth:** `protect` → `deptHeadGuard` → `deptScope`

**Query params:** `departmentId`, `range` (`monthly`), `year`

Returns 12-month chart data with income, expense, net, targets.

**Response:**
```json
{
  "chartData": [
    { "name": "Jan", "month": 1, "income": 50000, "expense": 12000, "net": 38000, "target": 60000 }
  ],
  "totalIncome": 600000,
  "totalExpense": 144000,
  "netProfit": 456000,
  "growthRate": "12.5",
  "year": 2026
}
```

---

### GET `/api/finance/breakdown`

**Auth:** `protect` → `superAdminGuard`

Returns income by department for the year.

---

### GET `/api/finance/transactions`

**Auth:** `protect` → `staffGuard` → `deptScope`

**Query params:** `type` (`income`|`expense`), `page`, `limit`

---

### POST `/api/finance/transactions`

**Auth:** `protect` → `staffGuard` → `deptScope`

**Request:**
```json
{
  "type": "expense",
  "category": "rent",
  "description": "string",
  "amount": 25000,
  "date": "ISO date (optional)",
  "paymentMethod": "mpesa"
}
```

---

### DELETE `/api/finance/transactions/:id`

**Auth:** `protect` → `deptHeadGuard`

---

## 15. Billing & Invoices

Base: `/api/billing`

### Public Route

#### POST `/api/billing/mpesa-callback`

**No auth required.** Safaricom calls this directly.

Processes M-Pesa STK callback, updates invoice status, accrues loyalty points, generates PDF receipt, pushes real-time payment result via Socket.io.

---

### Authenticated Routes

All require `protect`.

#### GET `/api/billing`

**Auth:** `staffGuard`

**Query params:** `page`, `limit`, `status`, `clientId`

**Invoice statuses:** `DRAFT`, `SENT`, `PAYMENT_SENT`, `PAID`, `PARTIAL`, `OVERDUE`, `CANCELLED`

---

#### POST `/api/billing`

**Auth:** `deptHeadGuard`

**Request:**
```json
{
  "clientId": "ObjectId (CRMClient)",
  "lineItems": [
    { "description": "string", "qty": 1, "unitPrice": 15000 }
  ],
  "dueDate": "ISO date",
  "notes": "string (optional)",
  "taxRate": 0.16
}
```

Auto-generates `invoiceId` (e.g., `RTS-REP-2026-0001`). Applies 16% VAT by default.

---

#### GET `/api/billing/my`

**Auth:** `staffGuard`

Returns invoices for the client's portal account.

---

#### GET `/api/billing/overdue`

**Auth:** `deptHeadGuard`

Returns SENT/PARTIAL invoices past due date.

---

#### GET `/api/billing/consolidated`

**Auth:** `superAdminGuard`

Returns all invoices across departments.

---

#### GET `/api/billing/:id`

**Auth:** `staffGuard`

---

#### PATCH `/api/billing/:id/send`

**Auth:** `deptHeadGuard`

Changes status from `DRAFT` to `SENT`, sends SMS with invoice details.

---

#### POST `/api/billing/:id/pay`

**Auth:** `deptHeadGuard`

Triggers M-Pesa STK push for the invoice balance.

**Response:** `{ "message": "STK push sent", "checkoutRequestId": "ws_CO_..." }`

---

#### PATCH `/api/billing/:id/cancel`

**Auth:** `deptHeadGuard`

Sets status to `CANCELLED`.

---

## 16. Payments (M-Pesa)

Base: `/api/payments`

### POST `/api/payments/mpesa/callback`

**No auth required.** Safaricom callback endpoint.

Always responds `200` immediately (Safaricom requires response within 5 seconds).

Processes:
- Matches `checkoutRequestId` to Order or Consultation
- Updates payment status to `paid`
- Creates `Revenue` entry
- Sends SMS confirmation
- Deducts product stock (for orders)

---

## 17. Calculator / Pricing

Base: `/api/calculator`

### GET `/api/calculator/pricing-rules`

**No auth required.**

Returns all active pricing rules sorted by service and tier.

**Response:**
```json
[
  {
    "_id": "ObjectId",
    "service": "Website Design",
    "tier": "basic",
    "price": 15000,
    "rushMultiplier": 1.30,
    "isActive": true
  }
]
```

---

### POST `/api/calculator/estimate`

**No auth required.**

**Request:**
```json
{
  "service": "Website Design",
  "tier": "basic | standard | premium",
  "isRush": false
}
```

**Response (200):**
```json
{
  "service": "Website Design",
  "tier": "basic",
  "basePrice": 15000,
  "finalPrice": 15000,
  "isRush": false,
  "rushMultiplier": 1.30
}
```

---

### POST `/api/calculator/seed`

**Auth:** `protect` → `superAdminGuard`

Seeds 27 pricing rules across 9 services × 3 tiers.

---

### PUT `/api/calculator/pricing-rules/:id`

**Auth:** `protect` → `superAdminGuard`

**Request:**
```json
{
  "price": 20000,
  "rushMultiplier": 1.35
}
```

---

## 18. Tickets

Base: `/api/tickets`  
**Auth:** `protect` → `staffGuard` (all routes except public tracking)

### GET `/api/tickets`

**Query params:** `page`, `limit`, `status`, `priority`, `slaBreach`

**Ticket statuses:** `OPEN`, `IN_PROGRESS`, `AWAITING_CLIENT`, `ESCALATED`, `RESOLVED`, `CLOSED`, `REOPENED`

**Priorities:** `LOW` (120h SLA), `MEDIUM` (48h), `HIGH` (4h), `CRITICAL` (2h)

---

### POST `/api/tickets`

**Request:**
```json
{
  "title": "string (max 200)",
  "description": "string (max 5000)",
  "category": "General",
  "priority": "MEDIUM"
}
```

Auto-generates `ticketId` (e.g., `RTS-REP-TKT-0001`), sets SLA deadline.

---

### GET `/api/tickets/my`

Returns tickets raised by the authenticated user.

---

### GET `/api/tickets/escalated`

**Auth:** `superAdminGuard`

---

### GET `/api/tickets/:id`

---

### PATCH `/api/tickets/:id/assign`

**Auth:** `deptHeadGuard`

**Request:** `{ "staffId": "ObjectId" }`

---

### POST `/api/tickets/:id/reply`

**Request:** `{ "message": "string (max 5000)" }`

Pushes real-time `ticket:reply` event via Socket.io.

---

### PATCH `/api/tickets/:id/status`

**Auth:** `deptHeadGuard`

**Request:** `{ "status": "IN_PROGRESS" }`

Auto-sends SMS on status change.

---

### POST `/api/tickets/:id/escalate`

**Auth:** `deptHeadGuard`

Escalates to Super Admin.

---

### PATCH `/api/tickets/:id/resolve`

Same as `updateStatus` with status `RESOLVED`.

---

### POST `/api/tickets/:id/rate`

**Request:** `{ "score": 4 }` (1–5)

---

## 19. Staff Portal (Memos & Assessments)

Base: `/api/staff-portal`  
**Auth:** `protect` → `staffGuard`

### Memos

#### GET `/api/staff-portal/memos`

STAFF see only `PUBLISHED` memos targeted at them or `ALL`.

---

#### POST `/api/staff-portal/memos`

**Auth:** `deptHeadGuard`

**Request:**
```json
{
  "title": "string (max 120)",
  "body": "string",
  "priority": "ROUTINE | URGENT | CRITICAL",
  "recipients": "ALL | [userId1, userId2]",
  "requiresAck": false,
  "ackDeadline": "ISO date (optional)",
  "scheduledAt": "ISO date (optional)"
}
```

---

#### PATCH `/api/staff-portal/memos/:id/ack`

Acknowledges the memo (adds to `readBy` array).

---

#### PATCH `/api/staff-portal/memos/:id/archive`

**Auth:** `deptHeadGuard`

---

### Assessments

#### GET `/api/staff-portal/assessments`

**Query params:** `date`, `staffId`

---

#### GET `/api/staff-portal/assessments/today`

Returns today's assessment for the authenticated staff member.

---

#### GET `/api/staff-portal/assessments/history`

STAFF see own history. Others can query by `staffId`.

---

#### POST `/api/staff-portal/assessments/worklog`

**Request:**
```json
{
  "tasks": "string (max 2000)",
  "blockers": "string (optional, max 1000)",
  "hoursWorked": 8,
  "notes": "string (optional, max 1000)"
}
```

---

#### POST `/api/staff-portal/assessments/score`

**Auth:** `deptHeadGuard`

**Request:**
```json
{
  "staffId": "ObjectId",
  "date": "YYYY-MM-DD (optional, defaults to today)",
  "kpiScores": [
    { "name": "Task Completion", "score": 4.5, "weight": 2 }
  ],
  "adminComments": "string (optional)",
  "adminFeedback": "string (optional)"
}
```

---

## 20. Staff Invitation

Base: `/api/staff-invitation`  
**Auth:** `protect` → `deptHeadGuard`

### POST `/api/staff-invitation`

**Request:**
```json
{
  "name": "string (min 2)",
  "email": "string (valid email)",
  "departmentSlug": "string",
  "role": "STAFF"
}
```

Creates inactive user, generates company email suggestion, sends invitation email with password setup link (valid 24h).

**Response (201):**
```json
{
  "message": "Staff invitation sent successfully",
  "user": { "id", "name", "email", "role", "departmentSlug", "invitedAt" },
  "companyEmail": "john.repair@pclsolutions.co.ke"
}
```

---

### GET `/api/staff-invitation/pending`

Returns users with `isActive: false` and `isEmailVerified: false`.

---

### POST `/api/staff-invitation/resend/:userId`

Regenerates token, resends invitation email.

---

### DELETE `/api/staff-invitation/cancel/:userId`

Deletes the user and associated company email record.

---

### GET `/api/staff-invitation/directory`

**Query params:** `departmentSlug`, `role`, `isActive`

Returns staff directory (STAFF and DEPT_HEAD_OWNER roles).

---

## 21. Inventory

Base: `/api/inventory`  
**Auth:** `protect` (all routes)

### GET `/api/inventory`

**Query params:** `search`, `category`, `page`, `limit`

---

### GET `/api/inventory/low-stock`

Returns items where `quantity ≤ reorderLevel`.

---

### GET `/api/inventory/expiring`

Placeholder — returns empty array.

---

### GET `/api/inventory/:id`

---

### POST `/api/inventory`

**Auth:** `authorize(['admin', 'SUPER_ADMIN', 'STAFF'])`  
**Content-Type:** `multipart/form-data`

**Form fields:** All `Inventory` model fields + `attachments` (file[], max 5)

---

### PATCH `/api/inventory/:id`

**Auth:** `authorize(['admin', 'SUPER_ADMIN', 'STAFF'])`

---

### DELETE `/api/inventory/:id`

**Auth:** `authorize(['admin', 'SUPER_ADMIN'])`

---

### POST `/api/inventory/movements`

**Auth:** `authorize(['admin', 'SUPER_ADMIN', 'STAFF'])`

**Request:**
```json
{
  "itemId": "ObjectId",
  "type": "RESTOCK | SALE | RETURN | JOB_USAGE | DAMAGE_LOSS | TRANSFER | ADJUSTMENT",
  "quantity": 10,
  "notes": "string (optional)"
}
```

Validates stock doesn't go negative.

---

## 22. Department Modules

Base: `/api/dept`  
**Auth:** `protect` → `staffGuard` → `deptScope`

### Hardware Repair — Job Cards

#### GET `/api/dept/jobcards?status=&page=&limit=`

#### POST `/api/dept/jobcards`

**Request:**
```json
{
  "clientName": "string",
  "clientPhone": "string",
  "deviceType": "string",
  "deviceBrand": "string (optional)",
  "serialNumber": "string (optional)",
  "faultDescription": "string",
  "estimatedCost": 2000,
  "notifyChannel": "sms | whatsapp | both"
}
```

Auto-generates `jobNumber` (e.g., `JC-2026-0001`).

#### PUT `/api/dept/jobcards/:id`

Updates job card. On status change, sends customer notifications (SMS/WhatsApp) and pushes real-time events.

**Status transitions:** `received` → `diagnosing` → `awaiting-parts` → `in-repair` → `completed` → `collected`

---

### PlayStation Arena — Sessions

#### GET `/api/dept/sessions?status=&page=&limit=`

#### POST `/api/dept/sessions/start`

**Request:**
```json
{
  "stationNumber": 1,
  "hourlyRate": 60,
  "customerName": "string (optional)"
}
```

Sets `startTime` to now, status to `active`. Broadcasts `session:update` via Socket.io.

#### PUT `/api/dept/sessions/:id/end`

Calculates `durationMinutes` and `totalCharged`. Broadcasts update.

---

### Web Development — Projects

#### GET `/api/dept/projects?status=&page=&limit=`

#### POST `/api/dept/projects`

**Request:**
```json
{
  "projectName": "string",
  "clientName": "string",
  "clientEmail": "string (optional)",
  "projectType": "brochure | webapp | ecommerce | custom",
  "budget": 25000,
  "deadline": "ISO date",
  "requirements": "string"
}
```

#### PUT `/api/dept/projects/:id`

---

### Gov Admin — Documents

#### GET `/api/dept/govdocs?status=&page=&limit=`

#### POST `/api/dept/govdocs`

**Request:**
```json
{
  "clientName": "string",
  "clientPhone": "string",
  "documentType": "eCitizen | KRA | NTSA | Passport | ID | other",
  "description": "string",
  "serviceFee": 2000
}
```

Auto-generates `ticketNumber`.

#### PUT `/api/dept/govdocs/:id`

On `completed` status, sends SMS notification.

---

### Internet Distribution — ISP Clients

#### GET `/api/dept/ispclients?status=&page=&limit=`

#### POST `/api/dept/ispclients`

**Request:**
```json
{
  "clientName": "string",
  "clientPhone": "string",
  "packageName": "string",
  "monthlyRate": 2000,
  "connectionDate": "ISO date",
  "ipAddress": "string (optional)"
}
```

#### PUT `/api/dept/ispclients/:id`

---

## 23. Public Tracking

### GET `/api/track/jobcard/:jobNumber`

**No auth required.**

Returns safe subset of job card data for customer-facing tracking:

```json
{
  "job": {
    "jobNumber": "JC-2026-0001",
    "deviceType": "Laptop",
    "deviceBrand": "HP",
    "status": "in-repair",
    "estimatedCost": 2000,
    "finalCost": null,
    "paymentStatus": "unpaid",
    "warrantyExpiry": null,
    "createdAt": "ISO date",
    "completedAt": null,
    "collectedAt": null
  }
}
```

> Deliberately excludes `clientPhone`, internal notes, and cost breakdowns.

---

### POST `/api/tickets/track`

**No auth required.**

**Request:** `{ "referenceNumber": "RTS-REP-TKT-0001" }`

**Response:**
```json
{
  "ticket": {
    "ticketId": "RTS-REP-TKT-0001",
    "title": "string",
    "status": "OPEN",
    "departmentSlug": "repair",
    "priority": "MEDIUM",
    "createdAt": "ISO date",
    "updatedAt": "ISO date",
    "resolvedAt": null,
    "closedAt": null,
    "satisfactionScore": null
  }
}
```

---

## 24. Notifications & Audit

Base: `/api/admin`

### GET `/api/admin/notifications`

**Auth:** `protect` → `staffGuard`

Returns notifications for the user (personal + department + broadcasts), sorted newest first, limit 50.

---

### PUT `/api/admin/notifications/:id/read`

**Auth:** `protect` → `staffGuard`

Marks notification as read.

---

### POST `/api/admin/notifications/broadcast`

**Auth:** `protect` → `superAdminGuard`

**Request:**
```json
{
  "title": "string",
  "message": "string",
  "type": "broadcast",
  "departmentId": "ObjectId (optional)"
}
```

Pushes real-time `notification:broadcast` to all connected clients.

---

### GET `/api/admin/audit`

**Auth:** `protect` → `staffGuard`

**Query params:** `departmentSlug`, `page`, `limit`

SUPER_ADMIN sees all; others see own department only.

**Response:**
```json
{
  "logs": [
    {
      "_id": "ObjectId",
      "user": { "name": "...", "email": "..." },
      "action": "CREATE",
      "resource": "product",
      "resourceId": "ObjectId",
      "details": { "method": "POST", "path": "/api/products", "body": {...} },
      "ip": "127.0.0.1",
      "timestamp": "ISO date"
    }
  ],
  "total": 150,
  "page": 1
}
```

---

## 25. Chat

Base: `/api/chat`

### Public Route

#### POST `/api/chat/callback`

**No auth required** (rate-limited: 20 / 1 hr).

**Request:**
```json
{
  "clientName": "string",
  "message": "string",
  "phone": "string (optional)"
}
```

Creates callback request, broadcasts `new-callback-request` to admin room.

---

### Admin Routes (auth required)

#### GET `/api/chat/conversations`

Returns conversations from the past 30 days, aggregated with unread counts.

---

#### GET `/api/chat/conversation/:conversationId`

Returns all messages in a conversation, sorted chronologically.

---

#### PATCH `/api/chat/conversation/:conversationId/read`

Marks all messages in the conversation as read.

---

#### GET `/api/chat/callbacks`

**Query params:** `status` (`pending`, `contacted`, `resolved`)

---

#### PATCH `/api/chat/callbacks/:id`

**Request:** `{ "status": "contacted", "notes": "string" }`

---

#### GET `/api/chat/admin/status`

Returns the authenticated admin's availability and system-wide admin online status.

---

#### PATCH `/api/chat/admin/status`

**Request:** `{ "status": true }` (boolean)

Toggles admin's willingness to receive chats.

---

## 26. Admin Revenue Stats

Base: `/api/admin`

### GET `/api/admin/stats`

**Auth:** `protect` → `staffGuard`

**Query params:** `range` (`daily`|`weekly`|`monthly`|`yearly`), `year`

SUPER_ADMIN sees all departments; others see own department only.

**Response:**
```json
{
  "success": true,
  "scope": "all-departments | own-department",
  "data": {
    "totalRevenue": 1500000,
    "totalOrders": 42,
    "pendingOrders": 5,
    "activeClients": 30,
    "avgOrderValue": 35714,
    "revenueData": [
      { "date": "Jan", "revenue": 120000 }
    ],
    "ordersByStatus": { "pending": 5, "delivered": 37 },
    "salesByPaymentMethod": {
      "mpesa": { "count": 30, "revenue": 1000000 },
      "cash": { "count": 12, "revenue": 500000 }
    }
  }
}
```

---

### GET `/api/admin/revenue`

**Auth:** `protect` → `staffGuard`

Same as `/stats` but returns only the `revenueData` array for chart rendering.

---

## 27. Email Allocation

Base: `/api/email`  
**Auth:** `protect` (all routes)

### POST `/api/email/request`

**Auth:** `deptHeadGuard`

**Request:** `{ "userId": "ObjectId" }`

Submits email provisioning request for a staff user.

---

### GET `/api/email/queue`

**Auth:** `superAdminGuard`

Returns pending email provisioning requests.

---

### GET `/api/email/directory`

**Auth:** `superAdminGuard`

**Query params:** `slug`, `status`

---

### POST `/api/email/provision/:requestId`

**Auth:** `superAdminGuard`

**Request:** `{ "companyEmail": "string (optional, overrides suggestion)" }`

Approves and provisions the email. Sends welcome email with password setup link.

---

### POST `/api/email/reject/:requestId`

**Auth:** `superAdminGuard`

**Request:** `{ "reason": "string (optional)" }`

---

### PATCH `/api/email/suspend/:emailId`

**Auth:** `superAdminGuard`

---

### DELETE `/api/email/revoke/:emailId`

**Auth:** `superAdminGuard`

Revokes email and locks user account.

---

### POST `/api/email/reset-password/:emailId`

**Auth:** `superAdminGuard`

Sends password reset link to the company email.

---

## 28. USSD

Base: `/api/ussd`

### POST `/api/ussd/callback`

**No auth required.** Called by Africa's Talking.

**Request (from Africa's Talking):**
```json
{
  "sessionId": "string",
  "phoneNumber": "254712345678",
  "text": "1*1"
}
```

**USSD Menu Tree:**

```
Main Menu:
  1. Internet Services
    1. Check data balance
    2. Buy top-up
    3. Report outage
    4. Contact support
  2. Repair Status
    → Enter job card number
  3. Pay Invoice
    → Enter Invoice ID → Confirm → STK push
  4. PlayStation Arena
    1. Book a slot
    2. Check availability
    3. View my bookings
  5. Gov Services
    1. Check document status
    2. Book appointment
    3. Fee inquiry
  6. Support
    1. Raise a ticket
    2. Check ticket status
    3. Request callback
  7. My Account
    1. Check loyalty points
    2. View outstanding balance
    3. Update phone
  0. Exit
```

**Response format:** `CON ` (continue) or `END ` (end session) prefixed text.

---

## 29. Analytics / BI

Base: `/api/analytics`

### GET `/api/analytics`

**Auth:** `protect` → `staffGuard`

**Query params:** `slug`, `metricGroup`, `period`, `from`, `to`, `limit`

**Metric groups:** `REVENUE`, `CLIENTS`, `STAFF`, `TICKETS`, `INVENTORY`, `SESSIONS`, `PAYMENTS`, `OVERALL`

**Periods:** `DAILY`, `WEEKLY`, `MONTHLY`

---

### GET `/api/analytics/summary`

**Auth:** `protect` → `staffGuard`

Returns today's KPI tiles.

---

### GET `/api/analytics/departments`

**Auth:** `protect` → `superAdminGuard`

**Query params:** `period`, `from`, `to`

Company-wide department comparison.

---

### POST `/api/analytics/trigger`

**Auth:** `protect` → `superAdminGuard`

Manually triggers a BI snapshot.

---

## 30. Help Desk

Base: `/api/help`

### Public Routes (no auth)

#### GET `/api/help/faq`

Returns 5 hardcoded FAQs.

---

#### GET `/api/help/faq/:id`

---

#### GET `/api/help/faq/search?q=...`

---

#### GET `/api/help/troubleshooting`

Returns 3 troubleshooting guides (Connection, Login, Payment).

---

#### GET `/api/help/troubleshooting/:id`

---

#### GET `/api/help/knowledge-base`

Returns 3 knowledge base articles.

---

#### GET `/api/help/knowledge-base/:id`

---

### Authenticated Routes

#### POST `/api/help/tickets`

**Auth:** `protect`

**Request:**
```json
{
  "subject": "string",
  "category": "account | billing | technical | orders | returns | general",
  "priority": "low | medium | high",
  "description": "string"
}
```

> Note: These are in-memory mock tickets, separate from the main `Ticket` system.

---

#### GET `/api/help/tickets`

Returns the user's tickets.

---

#### GET `/api/help/tickets/all`

**Auth:** `protect` (admin only)

---

#### GET `/api/help/tickets/:id`

---

#### PATCH `/api/help/tickets/:id`

**Auth:** `protect` (admin only)

---

## 31. Socket.io Events

**Connection URL:** `http://localhost:5001`  
**Transports:** `polling` → `websocket` (upgrade)  
**Auth:** JWT token in `socket.handshake.auth.token` or `Authorization` header

### Client → Server Events

| Event | Payload | Auth | Description |
|-------|---------|------|-------------|
| `chat:request-callback` | `{ clientName, message, phone, departmentSlug }` | Public | Queue callback request |
| `chat-message` | `{ message, guestId }` | Public | Send live chat message |
| `admin-join-conversation` | `conversationId` | Admin | Join conversation room |
| `admin-send-message` | `{ conversationId, message, guestId }` | Admin | Send message as admin |
| `presence:get-beacons` | `deptSlugs[]` | Any | Get department presence beacons |
| `track:job` | `jobNumber` | Public | Join job tracking room |
| `ticket:join` | `ticketId` | Any | Join ticket updates room |
| `ticket:leave` | `ticketId` | Any | Leave ticket room |
| `payment:watch` | `checkoutRequestId` | Any | Watch payment status |
| `payment:unwatch` | `checkoutRequestId` | Any | Stop watching |

### Server → Client Events

| Event | Payload | Room | Description |
|-------|---------|------|-------------|
| `admin:status` | `{ online: boolean }` | `public-chat` | Global admin online status |
| `admin:status:dept` | `{ departmentSlug, online }` | `public-chat:{slug}` | Per-department admin status |
| `admin:now-available` | `{ message }` | Visitor socket | Admin came online while callback pending |
| `new-chat-message` | `{ conversationId, message, guestId }` | `admin-room`, `guest-{id}`, `conversation-{id}` | New message in conversation |
| `message-sent` | `{ messageId, conversationId, message }` | Sender socket | Message delivery confirmation |
| `chat-error` | `{ error }` | Sender socket | Chat error |
| `new-callback-request` | `{ id, clientName, message, phone, createdAt }` | `admin-room` | New callback request |
| `notification:new` | `{ _id, title, message, type, createdAt }` | `user:{id}` or `dept:{slug}` | New notification |
| `notification:broadcast` | `{ title, message, type, createdAt }` | All | System-wide broadcast |
| `jobcard:status` | `{ jobNumber, status }` | `track:{jobNumber}` | Live job card status update |
| `ticket:reply` | `{ author, authorRole, message, createdAt }` | `ticket:{ticketId}` | New ticket thread message |
| `payment:result` | `{ success, invoiceId, amount, mpesaRef }` | `payment:{checkoutRequestId}` | Payment confirmation |
| `session:update` | `session` | `dept:playstation` | PlayStation session state change |
| `system:status` | `{ status, db, uptime }` | `super:global` | System health broadcast |

---

## 32. Middleware Reference

### Rate Limiters

| Limiter | Window | Max | Applied To |
|---------|--------|-----|------------|
| Global | 15 min | 100 | All `/api/*` routes |
| Auth | 15 min | 10 | `/api/auth/login`, `/api/auth/register` |
| Chat | 1 hour | 20 | `/api/chat/callback` |

### Security

- **Helmet** — CSP, HSTS, X-Frame-Options, etc.
- **CORS** — Whitelist via `CLIENT_URL` env var
- **mongo-sanitize** — Strips `$` and `.` from request bodies
- **hpp** — HTTP Parameter Pollution protection
- **Body limit** — 10KB for JSON and URL-encoded

### File Upload (Multer)

- **Storage:** Memory (no disk I/O)
- **Max size:** 5MB per file
- **Allowed types:** JPEG, JPG, PNG, WebP, GIF, BMP, TIFF, HEIF, HEIC
- **Cloudinary:** Buffers uploaded via `upload_stream` API

### M-Pesa (Daraja)

- **Environment:** Controlled by `MPESA_ENV` (`sandbox` | `production`)
- **STK Push:** Phone validation, amount limits (KES 1–150,000), sanitized refs
- **Callback:** Always responds 200 immediately, processes async

### Error Handler

Catches and formats:
- Mongoose validation errors → `400`
- Duplicate key → `400`
- Bad ObjectId → `400`
- JWT errors → `401`
- Multer file too large → `400`
- CORS violations → `403`
- DB buffering timeout → `503`

Stack traces only exposed in development mode.

---

## 33. Data Models

### User
| Field | Type | Notes |
|-------|------|-------|
| `name` | String | Required |
| `email` | String | Required, unique, lowercase |
| `password` | String | bcrypt hashed, select: false |
| `role` | String enum | `SUPER_ADMIN`, `DEPT_HEAD_OWNER`, `STAFF` |
| `department` | ObjectId ref | → Department |
| `departmentSlug` | String | Denormalized for fast queries |
| `isOwner` | Boolean | Default false |
| `superAdminLocked` | Boolean | Prevents modification |
| `isActive` | Boolean | Default true |
| `lastLogin` | Date | |
| `passwordResetToken` | String | SHA-256 hashed token |
| `tokenExpiry` | Date | 24h from creation |

### Product
| Field | Type | Notes |
|-------|------|-------|
| `name` | String | Max 120, auto-slugified |
| `slug` | String | Unique, auto-generated |
| `category` | String enum | `electronics`, `accessories`, `software`, `services` |
| `description` | String | Max 2000 |
| `price` | Number | ≥ 0 |
| `comparePrice` | Number | Optional strikethrough price |
| `images` | [String] | Cloudinary URLs |
| `stock` | Number | ≥ 0 |
| `isDigital` | Boolean | Bypasses stock check |
| `isActive` | Boolean | Soft delete flag |
| `featured` | Boolean | |
| `tags` | [String] | Max 20 tags, 50 chars each |
| `rating` | Number | 0–5 |
| `soldCount` | Number | Auto-incremented on payment |
| `sku` | String | Sparse unique |
| `warranty` | String | Max 100 |

### Order
| Field | Type | Notes |
|-------|------|-------|
| `orderNumber` | String | Auto: `RTS-YYYY-NNNNN` |
| `customer` | Embedded | `name`, `phone`, `email`, `deliveryAddress` |
| `items` | [OrderItem] | `product`, `name`, `price`, `quantity`, `subtotal` |
| `subtotal` | Number | |
| `deliveryFee` | Number | Max 10,000 |
| `total` | Number | |
| `status` | String enum | `pending`, `confirmed`, `processing`, `shipped`, `delivered`, `cancelled` |
| `paymentStatus` | String enum | `unpaid`, `paid`, `refunded` |
| `paymentMethod` | String enum | `mpesa`, `cash`, `bank` |
| `mpesaRef` | String | |
| `checkoutRequestId` | String | M-Pesa STK reference |
| `deliveryType` | String enum | `pickup`, `delivery` |

### Invoice
| Field | Type | Notes |
|-------|------|-------|
| `invoiceId` | String | Auto: `RTS-{DEPT}-YYYY-NNNN` |
| `department` | ObjectId ref | → Department |
| `departmentSlug` | String | |
| `client` | ObjectId ref | → CRMClient |
| `lineItems` | [LineItem] | `description`, `qty`, `unitPrice`, `total` |
| `subtotal` | Number | |
| `taxRate` | Number | Default 0.16 (16% VAT) |
| `taxAmount` | Number | |
| `totalAmount` | Number | |
| `amountPaid` | Number | |
| `balance` | Number | Auto-calculated |
| `currency` | String | Default "KES" |
| `status` | String enum | `DRAFT`, `SENT`, `PAYMENT_SENT`, `PAID`, `PARTIAL`, `OVERDUE`, `CANCELLED` |
| `dueDate` | Date | |
| `receiptUrl` | String | Generated PDF URL |

### Ticket
| Field | Type | Notes |
|-------|------|-------|
| `ticketId` | String | Auto: `RTS-{DEPT}-TKT-NNNN` |
| `department` | ObjectId ref | → Department |
| `raisedBy` | ObjectId | User or Client |
| `raisedByRole` | String enum | `CLIENT`, `STAFF` |
| `assignedTo` | ObjectId ref | → User |
| `title` | String | Max 200 |
| `description` | String | Max 5000 |
| `category` | String | Default "General" |
| `priority` | String enum | `LOW` (120h), `MEDIUM` (48h), `HIGH` (4h), `CRITICAL` (2h) |
| `status` | String enum | `OPEN`, `IN_PROGRESS`, `AWAITING_CLIENT`, `ESCALATED`, `RESOLVED`, `CLOSED`, `REOPENED` |
| `slaDeadline` | Date | Auto-calculated |
| `slaBreach` | Boolean | |
| `thread` | [ThreadEntry] | `author`, `authorRole`, `message`, `attachments` |
| `satisfactionScore` | Number | 1–5 |

### JobCard
| Field | Type | Notes |
|-------|------|-------|
| `jobNumber` | String | Auto: `JC-YYYY-NNNN` |
| `clientName` | String | Required |
| `clientPhone` | String | Required |
| `deviceType` | String | Required |
| `deviceBrand` | String | |
| `serialNumber` | String | |
| `faultDescription` | String | Required |
| `assignedTechnician` | ObjectId ref | → User |
| `status` | String enum | `received`, `diagnosing`, `awaiting-parts`, `in-repair`, `completed`, `collected`, `cancelled` |
| `estimatedCost` | Number | |
| `finalCost` | Number | |
| `partsUsed` | [{name, cost, quantity}] | |
| `warrantyDays` | Number | |
| `warrantyExpiry` | Date | |
| `paymentStatus` | String enum | `unpaid`, `paid` |
| `notifyChannel` | String enum | `sms`, `whatsapp`, `both` |

### CRMClient
| Field | Type | Notes |
|-------|------|-------|
| `fullName` | String | Required |
| `phone` | String | Required |
| `email` | String | |
| `idType` | String | |
| `idNumber` | String | |
| `address` | String | |
| `tags` | [String] | |
| `segment` | String | `LEAD`, `ACTIVE`, `VIP`, `DORMANT` |
| `loyaltyPoints` | Number | 100 pts = KES 50 |
| `referralCode` | String | Auto-generated |
| `portalAccess` | Boolean | |
| `portalOTP` | String | 6-digit, 10 min expiry |
| `outstandingBalance` | Number | |
| `interactions` | [Interaction] | `staffId`, `type`, `summary`, `outcome`, `followUpDate` |

### Revenue
| Field | Type | Notes |
|-------|------|-------|
| `type` | String enum | `income`, `expense` |
| `category` | String enum | `booking`, `order`, `consultation`, `salary`, `rent`, `utilities`, `stock`, `marketing`, `other` |
| `description` | String | Max 500 |
| `amount` | Number | |
| `date` | Date | |
| `paymentMethod` | String enum | `mpesa`, `cash`, `bank` |
| `reference` | String | |
| `department` | ObjectId ref | Auto-tagged to creator's dept |
| `createdBy` | ObjectId ref | → User |

### Other Models

| Model | Description |
|-------|-------------|
| `Department` | 6 departments with monthly targets |
| `Booking` | Service booking with client/service refs |
| `Consultation` | Consultation with type, duration, fee, status |
| `Client` | Basic client (name, phone, email, type) |
| `Service` | Service catalog with category and pricing |
| `PSSession` | PlayStation gaming session |
| `WebProject` | Web development project |
| `GovDocument` | Government document processing |
| `ISPClient` | Internet distribution client |
| `Inventory` | Stock items with SKU, quantity, reorder level |
| `Analytics` | BI snapshots (daily/weekly/monthly) |
| `AuditLog` | Request audit trail |
| `Notification` | In-app notifications |
| `ChatMessage` | Chat message storage |
| `CallbackRequest` | Chat callback queue |
| `CompanyEmail` | Email provisioning records |
| `StaffPortal` | Memos and Assessments |
| `AvailabilitySlot` | Consultation availability |
| `PricingRule` | Calculator pricing tiers |
| `DeptTransaction` | Department-level finance transactions |

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 5001 | Server port |
| `MONGO_URI` | — | MongoDB connection string |
| `JWT_SECRET` | — | HS256 signing key |
| `JWT_EXPIRE` | `8h` | Token expiry |
| `CLIENT_URL` | `http://localhost:3000` | Frontend URL (CORS + email links) |
| `SUPER_ADMIN_EMAIL` | `codeofthoth@outlook.com` | Identity-locked super admin |
| `MPESA_ENV` | `sandbox` | `sandbox` or `production` |
| `MPESA_CONSUMER_KEY` | — | Daraja API key |
| `MPESA_CONSUMER_SECRET` | — | Daraja API secret |
| `MPESA_SHORTCODE` | — | Paybill shortcode |
| `MPESA_PASSKEY` | — | Daraja passkey |
| `MPESA_CALLBACK_URL` | — | M-Pesa callback URL |
| `CLOUDINARY_CLOUD_NAME` | — | Image hosting |
| `CLOUDINARY_API_KEY` | — | |
| `CLOUDINARY_API_SECRET` | — | |
| `AT_API_KEY` | — | Africa's Talking API key |
| `AT_USERNAME` | — | Africa's Talking username |
| `AT_SENDER_ID` | — | SMS sender ID |
| `SMTP_HOST` | — | Email SMTP host |
| `SMTP_PORT` | — | Email SMTP port |
| `SMTP_USER` | — | Email SMTP user |
| `SMTP_PASS` | — | Email SMTP password |
