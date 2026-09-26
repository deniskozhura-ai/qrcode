# ReviewFlow — Security Audit Report

This audit report documents the vulnerabilities identified during the code audit of the ReviewFlow codebase, the remediation applied to each issue, and the corresponding automated regression tests proving the fixes.

---

## Vulnerability Remediation Matrix

| Vulnerability | Severity | Status | Technical Fix | Automated Test |
| :--- | :---: | :---: | :--- | :---: |
| **Public `businesses` SELECT Dump** | **High** | **Fixed** | Dropped broad `Public can read active business` policy from `schema.sql` and migrations. Restricted SELECT strictly to `auth.uid() = owner_id`. | `tests/security/rls.test.ts` (PASS) |
| **Public `qr_codes` SELECT Dump** | **High** | **Fixed** | Dropped broad `Public can read qr_codes` policy. Restricted SELECT strictly to QR codes belonging to businesses owned by the authenticated user. | `tests/security/rls.test.ts` (PASS) |
| **Analytics BOLA / IDOR Attack** | **High** | **Fixed** | Client-supplied `business_id` is never trusted. Server resolves and derives `business_id` strictly from the active QR code. Mismatched IDs rejected with HTTP 400. | `tests/security/bola.test.ts` (PASS) |
| **Feedback BOLA / Cross-Poisoning** | **High** | **Fixed** | Validates QR code and verifies cross-business ownership. Injects feedback strictly with server-derived IDs. Mismatched IDs rejected with HTTP 400. | `tests/security/bola.test.ts` (PASS) |
| **Webhook Race Condition & Replay** | **High** | **Fixed** | Replaced vulnerable check-then-act pattern with atomic INSERT into `webhook_events` using PostgreSQL `UNIQUE (provider, event_id)` constraint. Concurrent duplicates are safely deduplicated. | `tests/security/webhook.test.ts` (PASS) |
| **Webhook Signature Crash (DoS)** | **High** | **Fixed** | Updated `verifyWebhookSignature` to validate signature buffer length before invoking `crypto.timingSafeEqual`, preventing unhandled `RangeError` 500 crashes. | `tests/security/webhook.test.ts` (PASS) |
| **Subscription `cancelled` Dead Code** | **High** | **Fixed** | Refactored `isSubscriptionActive` with an exhaustive switch-statement covering all 9 subscription states. Cancelled subscriptions with active paid periods now correctly retain access. | `tests/security/subscription.test.ts` (PASS) |
| **Server-Side Subscription Bypass** | **High** | **Fixed** | Added server-side subscription validation across `/dashboard`, `/dashboard/qr`, `/dashboard/feedback`, and `/dashboard/analytics`. Unsubscribed users are redirected to `/dashboard/billing`. | `tests/security/subscription.test.ts` (PASS) |
| **Rate Limiting Header Spoofing** | **Medium** | **Fixed** | Replaced fragile in-memory map with modular rate limiter (`src/lib/rateLimit.ts`) and safe IP resolver (`src/lib/requestIp.ts`) checking trusted edge headers and filtering malformed IPs. | `tests/security/ratelimit.test.ts` (PASS) |
| **Analytics Schema Mismatch Bug** | **Medium** | **Fixed** | Added `metadata JSONB DEFAULT '{}'::jsonb` to `analytics_events` table in `schema.sql` and `migration_add_missing.sql` to align schema with code inserts. | `tests/security/validation.test.ts` (PASS) |
| **Unvalidated Input & Boundaries** | **Medium** | **Fixed** | Added strict Zod schemas (`src/lib/validations.ts`) for feedback, analytics, businesses, and QR creation with strict bounds (ratings 1–5, message ≤1000 chars, hex colors, UUIDs). | `tests/security/validation.test.ts` (PASS) |
| **Dangerous URL Injection (XSS)** | **High** | **Fixed** | Validated `google_review_url` with Zod to enforce `http:` or `https:` protocols, rejecting `javascript:`, `data:`, `vbscript:`, and other dangerous URI schemes. | `tests/security/xss.test.ts` (PASS) |
| **Open Redirect via OAuth Callback** | **Medium** | **Fixed** | Added URL sanitization in `/api/auth/callback` to validate relative redirect paths and reject protocol-relative (`//evil.com`) or backslash-based redirects. | `tests/security/xss.test.ts` (PASS) |
| **OAuth Callback Error Silencing** | **Medium** | **Fixed** | Added explicit error checking for `exchangeCodeForSession(code)` in `/api/auth/callback`. Failed exchanges redirect to `/login?error=...` without establishing a session. | `tests/security/auth.test.ts` (PASS) |
| **Missing HTTP Security Headers** | **Medium** | **Fixed** | Added `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, `Strict-Transport-Security`, and Content Security Policy (`CSP`) in `next.config.ts`. | `tests/security/headers.test.ts` (PASS) |
| **Credential Leakage in Repository** | **High** | **Fixed** | Scanned all tracked files in git. Ensured `.env.local` is gitignored and `.env.example` contains only empty placeholders. Verified zero credentials committed. | `tests/security/secrets.test.ts` (PASS) |

---

## Test Execution Summary

- **Total Test Suites**: 10
- **Total Security Tests**: 80
- **Passed**: 80
- **Failed**: 0
- **Skipped**: 0
- **Test Command**: `npm run test:security`
- **Lint Status**: `npm run lint` (0 errors)
- **Production Build Status**: `npm run build` (Exit code: 0)
