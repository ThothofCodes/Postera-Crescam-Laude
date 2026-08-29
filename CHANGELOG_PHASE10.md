# PHASE 10 — IMAGE UPLOAD FIX + TIER 1 ROADMAP FEATURES

This phase covers two requests: (1) why product images weren't accepting input or displaying, and (2) implementing the Tier 1 items from `PCL_MARKET_RESEARCH.md`.

---

## Part A — Product image upload & display (three independent bugs, all three needed fixing)

1. **`frontend/src/utils/api.js`** — the axios instance set a blanket `Content-Type: application/json` default. Axios doesn't override an explicit default just because the payload is `FormData`, so every image upload (`pages/Products.js`'s `fd.append('images', f)`) left the browser already mislabeled — Express/multer had no boundary to parse. Fixed with a request interceptor that deletes the header for `FormData` payloads and lets the browser set the correct multipart boundary itself.
2. **`backend/middleware/upload.js`** — `multer-storage-cloudinary@4` was built for `multer@1.x`. `multer@2` (already bumped in Phase 9, for an unrelated DoS fix) changed the file stream from a Node.js `Readable` to a Web API `ReadableStream`; the storage engine's internal `.pipe()` call doesn't exist on that type, so `req.files` arrived empty with no error surfaced. Replaced with `multer.memoryStorage()` + a `streamifier`-based `uploadProductImages()` helper that uploads buffers to Cloudinary directly — the pattern Cloudinary's own docs recommend for multer@2.
3. **Display side** — `via.placeholder.com` (used as the "no image" fallback in `ProductCard.js`, `Products.js`, `ProductDetail.js`, `Cart.js`) shut down in 2023, so every product without an uploaded image showed a broken image icon. Replaced with `noImagePlaceholder()` in `utils/helpers.js` — an inline SVG data URI using the real theme tokens, which can never 404 since it makes no network request at all.

`backend/controllers/productController.js` and `backend/routes/products.js` were updated to match the new `{ upload, uploadProductImages }` export shape. `streamifier` was added to `backend/package.json`.

---

## Part B — Tier 1 market research features

**1. Hardware Repair — public status tracker + stage-change notifications**
- `JobCard.notifyChannel` field added (`sms` | `whatsapp` | `both`, defaults to `sms`).
- `updateJobCard` now notifies the customer on every meaningful stage transition (`diagnosing`, `awaiting-parts`, `in-repair`, `completed`) — previously only `completed` did. Stage keys were matched exactly against JobCard's real status enum to avoid the same string-mismatch bug pattern Phase 9 found and fixed in the revenue controller.
- New `trackJobCard` controller + `GET /api/track/jobcard/:jobNumber` (no auth) — exposes only customer-safe fields (never phone, internal notes, or department-internal data).
- New Socket.IO event `track:job` lets an open tracker page join a per-job room and receive a live push (`jobcard:status`) instead of polling.
- Fixed an unrelated bug found while in this area: `GET /api/dept/ispcliients` had a typo (extra "i") that 404'd the ISP client list at its documented path while POST/PUT were spelled correctly.

**2. PlayStation Arena — real-time countdown + auto-close**
- `PSSession.plannedDurationMinutes` (nullable) and `autoClosed` fields added. Null preserves the existing open-ended walk-in behavior exactly.
- New `backend/cron/psAutoClose.js`, registered in `cron/jobs.js` at 1-minute resolution: closes any session whose prepaid block has elapsed, calculates the final charge, and emits the same `session:update` event `startSession`/`endSession` already use — so the frontend needed no new socket listener, only a new visual state.
- `Sessions.js` gained a `SessionCountdown` component (counts down, turns amber in the last 2 minutes, red at zero) shown instead of the existing count-up `SessionTimer` whenever a session has a planned duration. The start-session form gained a "Prepaid Duration" field.

**3. WhatsApp as a notification channel alongside SMS**
- `backend/config/africastalking.js` gained `sendWhatsApp()` and a unified `notifyCustomer(to, message, channel)`. Verified against the `africastalking` npm package metadata, which lists WhatsApp as a supported product on the same SDK — but the WhatsApp product requires separate activation in the AT dashboard, so this falls back to SMS automatically (logged, not silent) whenever `AT_WHATSAPP_SENDER_ID` isn't configured. Documented in `.env.example`.

**4. Pulse department beacon board — the real frontend**
- New `frontend/src/components/PulseBoard.js` — six department beacons wired to the actual backend events built in Phase 9 (`presence:get-beacons` request/response, `admin:status:dept` push), not a mockup. Reuses `useChat()`'s existing socket connection rather than opening a second one (`useChat` now additionally returns `socket` — purely additive, no existing consumer is affected).
- Mounted in `SuperDashboard.js`, visible across every nested Super Admin page — the first place in the app where six-department coverage is visible at a glance instead of only the old single global "online/offline" flag.

---

## Known follow-ups from this phase

- The PS Arena countdown auto-close runs on a 1-minute cron resolution, not a live server-side tick — a session can run up to ~60 seconds past its planned end before the cron catches it. Acceptable for a Town Centre arena; tighten the cron interval if it ever matters more precisely.
- `PulseBoard` is only mounted in `SuperDashboard.js` for now — the research doc's vision of it on the public-facing site (so customers see which departments have live support before opening the chat widget) is the natural next step, using the same component with `authToken={null}`.
- WhatsApp delivery is unverified end-to-end (no live AT WhatsApp-enabled account was available to test against in this environment) — test in the AT sandbox before relying on it for real customer communication.
