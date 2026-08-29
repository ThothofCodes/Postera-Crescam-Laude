# PHASE 9 — CONTINUITY AUDIT FIX PASS
**Date:** June 2026 · **Scope:** Implementation of every finding in `PCL_CONTINUITY_AUDIT.md`
**Governing principle for every RBAC change below: SUPER_ADMIN holds the highest clearance level in this system — every fix that touches permissions was implemented to widen or correctly scope access for everyone *else*, never to reduce what SUPER_ADMIN can see or do.**

This phase follows directly from the standalone audit report. Where that document predicted a fix, this one records what was actually changed, file by file, plus three additional bugs that only surfaced once the code was opened up to be fixed.

---

## 1. Chat presence — the four-exhibit fix, implemented as one coordinated patch

**`backend/socket.js`**
- The JWT auth middleware now strips a `Bearer ` prefix defensively (`extractToken()`) instead of only relying on clients to never send one — the old code's `||` short-circuit meant the `.replace('Bearer ', '')` fallback was unreachable whenever `socket.handshake.auth.token` was present, so every prefixed token failed `jwt.verify()` silently.
- Auth failures are now logged (`console.warn`) instead of disappearing into a silent fallback to visitor mode — this was the main reason Exhibit A took real tracing to find the first time.
- `isAdminRole()` no longer does `role.toLowerCase().includes('admin')`. It checks real membership in `['SUPER_ADMIN', 'DEPT_HEAD_OWNER', 'STAFF', 'admin', 'staff']`. `DEPT_HEAD_OWNER` and `STAFF` were previously unrecognized — meaning only the literal Super Admin could ever be "the admin" for chat.
- Added `isSuperAdminRole()` — the one and only check for the highest clearance level. Used to decide whether a connecting socket should be treated as covering every department's beacon at once.
- Admin sockets now carry `departmentSlug` (already present in the JWT payload — no token-shape change needed) and join both `admin-room` and `admin-room:{departmentSlug}`.
- New opt-in events: `admin:status:dept` (department-scoped status push) and `presence:get-beacons` (request/response snapshot for a Pulse–style dashboard). Both are additive — nothing that existed before was removed, so `ChatToggle.js`/`ChatWidget.js` keep working unmodified.

**`backend/socket/presence.manager.js`**
- `adminConnected(adminId, socketId, meta)` takes an optional third argument — old two-argument call sites still work.
- New `adminMeta` map tracks `{ departmentSlug, isSuperAdmin, role, name }` per connected admin, cleared when their last socket disconnects.
- New `isAnyAdminOnlineForDept(slug)`, `getFirstAdminSocketIdForDept(slug)`, `getDepartmentBeacons(slugs)` — SUPER_ADMIN presence satisfies every department slug passed in, by design.
- `isAnyAdminOnline()` (global) is untouched — existing callers are unaffected.

**`frontend/src/hooks/useSocket.js`**
- Sends the raw token instead of `Bearer ${token}` — matches what the server now expects either way, but removing it at the source is the correct fix, not just a server-side patch.
- Fixed a second bug found while in this file: `socket` is a module-level singleton that was created once and never rebuilt, so a token change (logout/login as someone else) had no effect on an already-open connection — a stale identity persisting into a new session is a real clearance bug, not just a staleness one. The socket now disconnects and rebuilds whenever the token it was built with no longer matches the current one.
- This hook is what powers `NotificationBell.js`, `TicketsPage.js`, `playstation/Sessions.js`, and `DBStatusBanner.js` — all four get the fix automatically, not just chat.

**`frontend/src/pages/AdminChatControl.js`**
- Now calls `useChat({ authToken })` — the same hook `ChatMonitor.js`/`MessagesPage.js` already used correctly — so the page holds a real connection instead of only ever calling `POST /chat/admin/status`. The previous version could set the availability flag to `true` while `adminSockets` for that account stayed empty, which is exactly why the badge could say "ONLINE" with no way for a customer to actually reach you.
- "Current Status" is now `connected && available`, not just `available`. A new sub-status line shows whether the realtime connection itself is up, separately from the availability toggle, so a stuck connection is visible instead of invisible.
- The toggle button is disabled until `connected` is true, with a tooltip explaining why.
- Inline styles were hardcoded to colors outside the documented 3-color system (`#00ff88`, `#ffaa00`, `#ff3366`, `#b8a8d8`, `#f0eeff`, and a reference to an undefined `var(--bg-card)` that silently fell back to transparent). All replaced with the real tokens from `theme.css` (`--color-primary`, `--color-accent`, `--color-secondary`, `--text-primary`, `--text-muted`, `--bg-surface`) — same visual language, no redesign, per the brief to maintain the original GUI.

---

## 2. Identity & permissions — closing the cross-department revenue leak

**Three additional bugs found while implementing the scoping fix, fixed alongside it (all in `backend/controllers/adminRevenueController.js`):**
1. `Revenue.find({ type: 'INCOME' })` — the schema enum is lowercase (`'income'`/`'expense'`); this matched zero documents, ever. Every manually-entered ledger line was invisible to the dashboard regardless of department.
2. `booking.total` was summed into `totalRevenue`, but Booking's field is `amountCharged` — `undefined + number` is `NaN`, so `totalRevenue` collapsed to `NaN` the moment any booking existed in the selected date range.
3. "Active clients" was counted via `.clientId` on Order/Booking/Consultation. None of the three have that field — Booking/Consultation use `client`, Order has no client reference at all, only an embedded `customer.phone`. The count was always 0 or 1.
4. (Smaller, same file) `salesByCategory` grouped by `$serviceCategory`, a field that doesn't exist on `Order` — every document silently fell into one `null` bucket. Replaced with a grouping by `paymentMethod`, a field that's actually there.
5. (Smaller, same file) the Order revenue filter checked `status: {$in:['delivered','completed','paid']}` against an enum that only contains `'delivered'` for a finished order — replaced with `paymentStatus: 'paid'`, the field that actually signals money received.

**The scoping fix itself:**
- `Revenue`, `Order`, `Booking`, and `Consultation` models each gained a nullable `department` field (additive, `default: null` — no migration needed, no existing document breaks).
- `revenueController.createRevenue` now auto-tags new entries with `req.user.department`, since that creation path is genuinely staff-authenticated. Order/Booking/Consultation creation are customer-facing flows without a reliable staff department at creation time, so those three are **not yet auto-tagged** — see Known Follow-Ups below. This was a deliberate scope boundary, not an oversight: closing the leak (the security-relevant part) didn't need to wait on a deeper rework of three public-facing creation flows.
- `adminRevenueController.js` now applies `scopeFilter(req)`: returns `{}` (no filter at all) for `role === 'SUPER_ADMIN'` — the highest clearance level sees every department's figures, exactly as before. Every other role gets `{ department: req.user.department }`. An account with no department assigned is scoped to see nothing rather than everything — the safe default.
- The response now includes a `scope: 'all-departments' | 'own-department'` field so the frontend (or anyone reading network logs) can tell at a glance which mode produced the numbers on screen.
- **Known consequence of the scope boundary above:** because Order/Booking/Consultation aren't auto-tagged with department yet, a non-SUPER_ADMIN dashboard will currently show revenue contributions from Revenue entries only — Order/Booking/Consultation totals will read as zero for everyone except SUPER_ADMIN until those three creation flows are updated to set `department` too (straightforward follow-up: derive it from the service/product being booked once those models also carry a department field).

**`backend/routes/admin.js`** — unchanged. It already applied `protect, staffGuard` ahead of the controller, which is sufficient for `req.user` to be available; the scoping logic lives entirely in the controller via `scopeFilter()`.

---

## 3. M-Pesa — the production-readiness blocker

**`backend/middleware/mpesa.js`**
- Added `MPESA_ENV` (defaults to `sandbox`, the safe default — nothing changes for existing setups unless production is explicitly opted into). `MPESA_BASE_URL` now resolves to `https://api.safaricom.co.ke` only when `MPESA_ENV=production`.
- Both `generateToken()` and `stkPush()` use `MPESA_BASE_URL` instead of the hardcoded sandbox string.
- A duplicate `'105.29.'` entry in `SAFARICOM_IP_RANGES` was removed (cosmetic — prefix-matching doesn't break on duplicates, but it's one less thing to wonder about later).
- Left `verifyMpesaSource`'s soft-warn-and-continue behavior on non-Safaricom IPs untouched — hard-blocking on an IP allowlist that isn't fully verified against Safaricom's actual published ranges risks rejecting real production callbacks, which is a worse failure mode than the current log-and-continue. Noted here rather than silently changed.

**`backend/server.js`** — the Helmet CSP `connectSrc` directive now resolves the same way (`MPESA_ENV` → sandbox or production host), so flipping the environment variable doesn't leave the browser-side CSP still pointed at the sandbox host.

**`backend/.env.example`** — documented the new `MPESA_ENV` variable with an explanation of what it gates.

---

## 4. Security cleanup

- **Deleted** `backend/keys/private-key.pem` and `public-key.pem` — a real, valid RSA key pair with zero references anywhere in the codebase (most likely the remnant of an abandoned RS256 JWT migration). Unlike the other fixes in this phase, this one really is a deletion, not a quarantine — an exposed credential with no legitimate use shouldn't be preserved anywhere, including in a "deprecated" folder.
- **`backend/.gitignore`, `frontend/.gitignore`, and a new root `.gitignore`** now exclude `*.pem`, `*.key`, `keys/`, and `.env.*` (with `.env.example` explicitly un-ignored) — so this can't quietly happen again.
- **`backend/package.json`**: removed `csurf` (unmaintained, zero usages anywhere) and `stripe` (zero usages — the platform exclusively integrates M-Pesa). Bumped `multer` from `^2.0.0-rc.4` to `^2.2.0` — the pinned pre-release predates a patched DoS advisory (GHSA-fjgf-rc76-4x9p) covering versions up to `2.0.1`; `routes/products.js` uses `upload.array()` on this version, so this one mattered.
- **`frontend/package.json`**: added the core `eslint` package — `eslint-plugin-react-hooks` was present without it, which means lint couldn't actually run. Added `vitest` + `jsdom` — `@testing-library/react`, `@testing-library/jest-dom`, and `@testing-library/user-event` were all already installed with no test runner able to execute them.

---

## 5. Dead code — quarantined, not deleted

Per the rule used throughout this phase (delete only a credential with zero legitimate use; everything else gets preserved in case it's still wanted):

- `backend/routes/adminRevenue.js` → `backend/_deprecated/routes/adminRevenue.js.deprecated`. Never mounted in `server.js`; `routes/admin.js` already serves the same two endpoints via the same controller functions.
- `frontend/src/admin/pages/shared/AdminChat.js` → `frontend/src/_deprecated/admin/AdminChat.js.deprecated`. Never imported by `App.js`, and independently broken — every REST call read `localStorage.getItem('adminToken')`, a key nothing in the app ever sets.
- `frontend/src/pages/staff/StaffChat.js` → `frontend/src/_deprecated/pages/StaffChat.js.deprecated`. Also never imported or routed.

Each `_deprecated/` folder has its own `README.md` explaining why its contents are there.

---

## 6. Broken scripts

- `backend/package.json`: `"seed"` pointed at `scripts/seedDB.js`, a directory that doesn't exist. Changed to `node seed.js`, the file that's actually there (this matches what `README.md` already told people to run directly).
- `frontend/package.json`: `"test"` was an `echo` statement pointing at `backend/sim_test.js`, which also doesn't exist. Split into `"test": "vitest run"` (the real component-test runner, now that it's installed) and `"test:smoke": "node ../__simulation__.js"` (the actual simulation script, at the actual path).
- Added `"test:coverage"` and `"test:watch"` to `backend/package.json` for convenience.

---

## 7. Tests — the first ones this project has had

`jest` and `supertest` were installed with zero `*.test.js` files anywhere in the repository. Three files were added, all directly targeting logic this phase changed (not retrofitted afterward — written against the actual fix, then run):

- `backend/__tests__/presence.manager.test.js` — department scoping, the SUPER_ADMIN-covers-everything rule, multi-tab handling, and the availability-flag interaction.
- `backend/__tests__/socket.roles.test.js` — pins `isAdminRole()`/`isSuperAdminRole()` against the real role enum so the old substring bug (or its inverse — a role like `administrative_assistant` wrongly matching) can't quietly come back.
- `backend/__tests__/adminRevenue.scope.test.js` — confirms `scopeFilter()` returns no filter at all for `SUPER_ADMIN` and a department filter for everyone else, including the populated-vs-raw-ObjectId case and the no-department-assigned case.

**All 17 tests pass** — verified by actually installing the minimal dependency set (`jest`, `jsonwebtoken`, `socket.io`, `mongoose`) and running `npx jest __tests__/` in this sandbox before writing this changelog, not just asserted. That `node_modules` was removed afterward — run `npm install` in `backend/` to restore it (and to regenerate `package-lock.json`, which will now differ slightly since `csurf`/`stripe` were removed and `multer` was bumped).

---

## 8. CI/CD — new this phase

**`.github/workflows/ci.yml`** — runs on every push/PR to `main`/`develop`:
- Backend job: `npm install`, `npm test` (the new Jest suite), `npm audit --audit-level=high` (reports, doesn't block — see the audit's Part Seven backlog for what's already known and tracked), and a syntax check on `server.js`/`seed.js`.
- Frontend job: `npm install`, lint (non-blocking — no ESLint config is committed yet), `npm test` (vitest, non-blocking while the suite is still thin), production build, dependency audit.
- A third job spins up a real MongoDB service container, boots the actual server, and runs `__simulation__.js` against it end-to-end — non-blocking, since that script silently skips its admin-gated checks unless a matching test admin is seeded first (a pre-existing limitation, not something this phase changed).

**`.github/workflows/cd.yml`** — templated for PythonAnywhere specifically, since `README.md` already documents that as the deployment target, rather than guessing at a generic host. It's a safe no-op until `PYTHONANYWHERE_API_TOKEN` (and the matching username/domain/host secrets) are added under repo settings — verified against PythonAnywhere's real, documented reload endpoint (`POST /api/v0/user/{username}/webapps/{domain}/reload/`) rather than assumed. The "sync new code onto the server" half of deployment is left as a clearly marked manual step, since it depends on whether the account is on a paid plan (SSH available) or free plan (console API required) — written honestly as a TODO rather than papered over with an unverified guess.

---

## Known follow-ups (not done in this phase — listed so they don't get lost)

1. **Order/Booking/Consultation department auto-tagging.** The schema fields exist now; the creation controllers don't set them yet, since those flows are customer-facing and there's no department field on `Service`/`Product` to derive it from. Closing this fully means adding `department` to those two models first.
2. **A one-time backfill** for any Revenue entries created before this phase — they'll have `department: null` and so will only be visible to SUPER_ADMIN until backfilled (the safe default, but worth deliberately backfilling rather than leaving indefinitely).
3. **The 22-file off-palette color drift** documented in the audit's Part Five is fixed only in the one file this phase already had open (`AdminChatControl.js`). The other files were left untouched rather than risk unrelated visual regressions across two dozen files in the same pass as the functional fixes.
4. **ESLint config.** Core `eslint` is now installed, but there's no `.eslintrc`/`eslint.config.js` committed, so the CI lint step has nothing to actually configure itself with yet.
5. Everything else listed under "If I were fixing this in order" in the original audit that isn't checked off above.
