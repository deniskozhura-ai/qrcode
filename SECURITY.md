# ReviewFlow — Security Architecture & Policy

This document details the security model, authorization boundaries, threat protections, and cryptographic guarantees implemented across the **ReviewFlow** SaaS platform.

---

## 1. Threat Model & Trust Boundaries

```
[ Untrusted Client / Public Internet ]
           │
           │ HTTPS + Security Headers (HSTS, CSP, X-Frame-Options)
           ▼
[ Next.js Edge / Server Layer ]
   ├── Authentication & Middleware (Supabase Auth / Session Cookies)
   ├── Rate Limiting & Abuse Prevention (Safe IP Resolver + Memory/Redis Store)
   ├── Input Validation (Strict Zod Schemas — Whitelist & Boundary Checks)
   └── Server-Side Authorization (Ownership verification & Server-Derived IDs)
           │
           │ Authenticated Client (RLS context) OR Controlled Service Role (Strict queries)
           ▼
[ PostgreSQL / Supabase Engine ]
   ├── Row Level Security (RLS enabled on all tables)
   ├── Tenant Isolation (auth.uid() = owner_id)
   └── Atomic Integrity (UNIQUE constraints, Foreign Keys)
```

---

## 2. Authentication

- **Supabase Auth Engine**: Authentication relies on battle-tested bcrypt/scrypt hashing, secure HttpOnly cookie session management, and JWT tokens.
- **OAuth Callback Hardening (`/api/auth/callback`)**:
  - `exchangeCodeForSession(code)` is strictly verified; any missing code or invalid exchange terminates the session and redirects to `/login?error=...`.
  - **Open Redirect Protection**: The `next` redirect parameter is sanitized against relative-path regex (`/^(?!\/\/)(?!\\\\)\/[a-zA-Z0-9_\-\/]*$/`), neutralizing protocol-relative (`//evil.com`) and backslash (`/\evil.com`) attacks.

---

## 3. Authorization & Multi-Tenant Data Isolation (RLS)

- **PostgreSQL Row Level Security (RLS)** is enabled across all tables: `profiles`, `businesses`, `qr_codes`, `feedback`, `subscriptions`, `analytics_events`, and `webhook_events`.
- **Strict Owner Isolation**:
  - `businesses`: `USING (auth.uid() = owner_id)`
  - `qr_codes`: `USING (EXISTS (SELECT 1 FROM businesses WHERE id = qr_codes.business_id AND owner_id = auth.uid()))`
  - `feedback`: `USING (EXISTS (SELECT 1 FROM businesses WHERE id = feedback.business_id AND owner_id = auth.uid()))`
  - `subscriptions`: `USING (auth.uid() = user_id)`
  - `profiles`: `USING (auth.uid() = id)`
- **Removal of Global Public Policies**: The broad public policies (`Public can read active business` and `Public can read qr_codes`) have been removed. Anonymous database clients can no longer query or enumerate businesses or QR codes.

---

## 4. Public QR Flow Security

- The public feedback page (`/q/[qrSlug]`) is a **Server Component**.
- It queries the database server-side using a parameterized lookup for the specific `qrSlug`.
- Only if the QR code is active **and** its parent business is active does it render the review page.
- At no point does the public client have direct SQL or REST SELECT access to the full `businesses` or `qr_codes` tables.

---

## 5. API Security & BOLA / IDOR Defense

### 5.1 Analytics API (`POST /api/analytics`)
- **No Client Trust for `business_id`**: The client transmits only `{ qr_code_id, event_type }`.
- The server validates the QR code UUID, checks that it exists and is active, and **derives the `business_id` directly from the database record**.
- If a client attempts to pass a mismatched `business_id`, the request is immediately rejected with HTTP 400 (`BOLA violation`).
- `event_type` is validated against a strict Zod whitelist: `['qr_scan', 'rating_submitted', 'feedback_submitted', 'feedback_copied', 'google_review_clicked']`.

### 5.2 Feedback API (`POST /api/feedback`)
- Prevents cross-business poisoning: The server resolves the business through the active QR code.
- Mismatched IDs between QR code and business result in an immediate HTTP 400.
- `rating` is strictly validated as an integer between 1 and 5.
- `message` is capped at 1000 characters; `category` at 50 characters.

---

## 6. Rate Limiting & Abuse Prevention

- **Modular Architecture (`src/lib/rateLimit.ts`)**:
  - Implements sliding window / fixed window token tracking with automatic memory garbage collection.
  - Implements the `RateLimitStore` interface, allowing instant drop-in replacement with Redis/Upstash for multi-region serverless deployments.
- **Feedback Endpoint**: 5 requests per minute per IP.
- **Analytics Endpoint**: 30 requests per minute per IP.
- **Safe IP Resolution (`src/lib/requestIp.ts`)**:
  - Checks trusted edge headers (`x-vercel-forwarded-for`, `cf-connecting-ip`, `x-real-ip`) before falling back to normalized `x-forwarded-for`.
  - Rejects malicious header injection and IP spoofing strings.
  - IP is never treated as a security identity; it is strictly used as an abuse-prevention signal.

---

## 7. Webhook Security (Lemon Squeezy)

- **HMAC-SHA256 Signature Verification**:
  - Validates `x-signature` using `crypto.createHmac('sha256', secret)`.
  - Uses `crypto.timingSafeEqual` with safe buffer length checking to eliminate both timing attacks and `RangeError` application crashes.
- **Atomic Idempotency Constraint**:
  - Eliminates check-then-act race conditions.
  - The webhook event is inserted immediately into `webhook_events` relying on the database `UNIQUE (provider, event_id)` constraint.
  - Concurrent duplicate deliveries are intercepted by Postgres constraint violation (`23505`) and safely acknowledged with `{ received: true }` without redundant processing.
- **Payload Schema Validation**:
  - Validates event payload structure via Zod schema (`LemonSqueezyWebhookPayloadSchema`).
  - Verifies that `custom_data.user_id` corresponds to a genuine registered profile before writing subscriptions.

---

## 8. Subscription Access Control

- **State Machine (`isSubscriptionActive`)**:
  - Explicitly handles all subscription states without dead code:
    - `active` → `true`
    - `past_due` → `true` (grace period)
    - `trialing` → `true` (if `trial_ends_at > NOW()`)
    - `cancelled` → `true` (if `current_period_end > NOW()`), `false` once expired
    - `paused`, `expired`, `inactive` → `false`
- **Server-Side Dashboard Enforcement**:
  - Protected dashboard routes (`/dashboard`, `/dashboard/qr`, `/dashboard/feedback`, `/dashboard/analytics`) verify subscription status server-side.
  - Users without an active subscription/trial are redirected to `/dashboard/billing?notice=subscription_required`.
  - The billing page (`/dashboard/billing`) and logout action remain accessible to allow upgrade or exit.

---

## 9. XSS, URL Injection & Header Security

- **Strict URL Validation**:
  - Google Review URLs and external links are strictly validated against `http:` and `https:` schemes.
  - Dangerous protocols (`javascript:`, `data:`, `vbscript:`, `file:`) are rejected.
- **Zero `dangerouslySetInnerHTML`**: All user-generated text is rendered as React text nodes, eliminating DOM-based XSS.
- **HTTP Security Headers in `next.config.ts`**:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
  - `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
  - `Content-Security-Policy`: Tailored CSP whitelisting only authorized origins for Supabase, Google OAuth, and Lemon Squeezy.

---

## 10. Automated Security Test Suite

The test suite in `tests/security/` includes 80 comprehensive automated tests modeling real-world attacks:
- `tests/security/rls.test.ts` (7 tests): Cross-tenant isolation & anonymous dump prevention.
- `tests/security/bola.test.ts` (6 tests): Cross-business IDOR & forged relation detection.
- `tests/security/webhook.test.ts` (8 tests): HMAC signature verification, timing attack safety, atomic concurrent idempotency.
- `tests/security/subscription.test.ts` (12 tests): Subscription state machine & regression testing.
- `tests/security/validation.test.ts` (21 tests): Boundary testing, rating limits, length overflows, UUID validation.
- `tests/security/ratelimit.test.ts` (7 tests): Quota enforcement, IP isolation, header spoofing resistance.
- `tests/security/xss.test.ts` (8 tests): Dangerous scheme rejection, codebase DOM audit, open redirect prevention.
- `tests/security/auth.test.ts` (7 tests): Protected routes, unauthenticated blocking, OAuth callback error handling.
- `tests/security/headers.test.ts` (1 test): HTTP security headers and CSP verification.
- `tests/security/secrets.test.ts` (3 tests): Static git repository audit ensuring zero leaked credentials.

To run the security test suite:
```bash
npm run test:security
```
