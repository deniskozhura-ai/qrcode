# ReviewFlow — Customer Feedback & Google Reviews SaaS

ReviewFlow is a production-ready MVP SaaS designed for local businesses (cafes, restaurants, clinics, salons) to collect direct customer feedback, intercept negative reviews before they go public, and drive positive reviews to Google.

---

## 1. System Architecture

```
[ Customer / Business Owner Client ]
                │
                │ HTTPS (TLS 1.3) + Security Headers (CSP, HSTS, X-Frame-Options)
                ▼
[ Next.js 16 (App Router + Turbopack) ]
   ├── Edge Proxy / Middleware: Session validation & Route protection
   ├── Security Layer: Rate Limiting & Safe IP Resolution
   ├── Validation Layer: Strict runtime Zod schema parsing
   └── Business Logic: Server Components & Actions with Server-Side Authorization
                │
                │ Authenticated RLS Context / Controlled Service Role
                ▼
[ Supabase / PostgreSQL Database Engine ]
   ├── Multi-tenant Row Level Security (RLS) on all tables
   ├── Foreign Keys & Database Constraints
   └── Atomic Idempotency Storage (webhook_events)
```

### Public QR Scan & Feedback Workflow:
```
[ Customer Scans QR Code ]
            │
            ▼
[ GET /q/[qrSlug] ] ── (Server Component)
            │
            ├── Queries qr_codes by unique slug
            ├── Validates: QR is active AND Business is active
            │     └─ If inactive: Renders unavailable page (404/503)
            │
            ▼
[ Customer Submits Review / Stars ]
            │
            ├── Rating 4-5 ★ ──► Prompts Google Review link + Copies feedback
            └── Rating 1-3 ★ ──► Submits private improvement feedback
                        │
                        ▼
            [ POST /api/feedback ]
                        ├── Rate Limiter check (5 req/min per IP)
                        ├── Input validation via Zod (1-5 integer, ≤1000 chars)
                        ├── Server derives business_id from verified qr_code_id (BOLA protection)
                        └── Inserts feedback with status 'new'
```

---

## 2. Core Security Highlights

- **Row Level Security (RLS)**: Enforced across all PostgreSQL tables. Overly broad public SELECT policies have been removed; anonymous clients cannot harvest businesses or QR codes.
- **BOLA / IDOR Defense**: The server never trusts client-supplied `business_id` parameters. All relations are verified and derived server-side from active QR code records.
- **Webhook Security**: Lemon Squeezy HMAC-SHA256 signature verification with constant-time comparison (`timingSafeEqual`) and atomic PostgreSQL `UNIQUE (provider, event_id)` idempotency to eliminate replay and race conditions.
- **Server-Side Subscription Access Control**: Strict access gating prevents unpaid access to dashboard analytics, feedback, and QR management, redirecting unsubscribed users to `/dashboard/billing`.
- **Abuse Prevention**: Rate limiting applied to public feedback and analytics endpoints with spoof-resistant client IP extraction.
- **XSS & Open Redirect Prevention**: Zero `dangerouslySetInnerHTML`, strict protocol validation on URLs (blocking `javascript:`, `data:`), and validated relative redirect destinations.
- **HTTP Security Headers**: Automated CSP, HSTS, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and `Referrer-Policy: strict-origin-when-cross-origin`.

---

## 3. Technology Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Language**: TypeScript 5 (Strict Mode)
- **Database & Auth**: Supabase (PostgreSQL, Row Level Security, Auth)
- **Payments**: Lemon Squeezy (Subscriptions, Webhooks, HMAC verification)
- **Styling**: Tailwind CSS, Lucide Icons
- **Validation**: Zod
- **Testing**: Vitest (Automated Security Regression Test Suite)

---

## 4. Setup & Running Locally

### 1. Prerequisites
- Node.js 20+ installed
- A Supabase project

### 2. Configuration
Copy the template environment file:
```bash
cp .env.example .env.local
```
Configure your credentials in `.env.local` according to the variables defined in `.env.example`.

### 3. Database Migration
Open your Supabase Project's **SQL Editor** and execute:
1. `supabase/schema.sql` (base schema and RLS policies)
2. `supabase/migration_add_missing.sql` (column additions and security hardening)

### 4. Install & Run
```bash
npm install
npm run dev -- -p 3005
```
Open [http://localhost:3005](http://localhost:3005) in your browser.

---

## 5. Security & Automated Testing

To run the automated security regression test suite (80 tests covering RLS, BOLA, Webhooks, Subscriptions, Validation, XSS, and Secrets):

```bash
# Run security test suite
npm run test:security

# Run all unit tests
npm test

# Run code linter
npm run lint

# Run production build
npm run build
```

Detailed security findings and remediation records are available in [SECURITY_AUDIT.md](file:///d:/review-flow/SECURITY_AUDIT.md) and [SECURITY.md](file:///d:/review-flow/SECURITY.md).
