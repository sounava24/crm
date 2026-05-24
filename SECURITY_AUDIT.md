# DM Stack Labs CRM Security Audit

Audit date: 2026-05-24

Scope: Next.js App Router, Auth.js/NextAuth sessions, Prisma/PostgreSQL, Super Admin and Client dashboards, Cashfree payments, Resend OTP password changes, billing, invoices, manual cash payments, cron suspension, and environment/secrets handling.

## Current Status

The project has a reasonable security foundation: Auth.js handles sessions, bcrypt hashes passwords and OTPs, Prisma query APIs are used instead of raw SQL, client/admin route separation exists, Cashfree secrets stay server-side, and invoice access checks are present.

The system is not production-ready yet. The highest-priority items are dependency advisories, weak local `AUTH_SECRET`, incomplete Prisma migration history, public diagnostic/status endpoints, and missing production-grade security headers/CSP tuning.

## Fixes Applied During This Audit

| Severity | Issue | Affected files | Fix status |
| --- | --- | --- | --- |
| Medium | Missing basic browser hardening headers | `next.config.ts` | Applied: added `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `X-Frame-Options`. CSP/HSTS left pending for production testing. |
| Medium | Public Resend test route can send diagnostics in production | `src/app/api/test-resend/route.ts` | Applied: returns 404 in production. |
| Low | Routine auth/OTP logs reveal unnecessary identity details | `src/auth.ts`, `src/app/api/client/profile/password/send-code/route.ts` | Applied: removed invalid-credentials log and OTP client identity log. |
| Low | Cron secret required by code but missing from example env | `.env.example` | Applied: added `CRON_SECRET=` placeholder. |
| Medium | Password policy was previously inconsistent | `src/lib/password-policy.ts`, `src/lib/actions.ts`, `src/app/api/client/profile/password/update/route.ts`, password forms | Already applied before this audit: shared 8+ char uppercase/lowercase/number/special-character policy on client and server paths. |
| Medium | Public status API exposed domain fallback and extra client data | `src/app/api/status/route.ts` | Applied in Phase 1: production requires `X-API-KEY` or `X-Status-Api-Key`; response omits client id, name, and dates. |
| Medium | Cashfree webhook replay could surface unique constraint errors | `src/app/api/payments/cashfree/webhook/route.ts` | Applied in Phase 1: duplicate `cashfreeWebhookEventId` is treated as idempotent success. |
| Medium | Cashfree webhook secret fallback was allowed in production | `src/lib/cashfree.ts` | Applied in Phase 1: production requires `CASHFREE_WEBHOOK_SECRET`; fallback is development-only. |
| Medium | Cron secret could be sent in query string in production | `src/app/api/cron/suspend/route.ts` | Applied in Phase 1: production accepts only `X-Cron-Secret`. |
| Medium | Production seed could use/log weak demo password | `prisma/seed.ts` | Applied in Phase 1: production requires strong `SEED_ADMIN_PASSWORD`; seed password is not logged. |
| Medium | Sensitive route groups lacked explicit cache headers | `next.config.ts` | Applied in Phase 1: added no-store headers for dashboard, portal, payment, and authenticated API route groups. |

## Findings

### Critical

No critical app-code issue was confirmed in this pass. Do not interpret this as a guarantee; payment webhooks, production hosting, and database access must still be tested in a staging environment with real provider credentials.

### High

1. Dependency advisories include Next.js high-severity items.
   - Evidence: `npm audit --audit-level=low` reports 7 vulnerabilities, including high-severity advisories for `next@16.2.3`.
   - Affected files: `package.json`, `package-lock.json`.
   - Recommendation: test upgrade to a patched Next.js version and compatible Prisma/tooling updates in a separate branch. Do not run `npm audit fix --force` blindly.
   - Status: Pending.

2. Prisma migration history is incomplete for production.
   - Evidence: only `20260522120000_cashfree_billing` exists, and it alters `Client`/`Payment` without an initial migration that creates those tables. `npx prisma migrate status` reports this migration is not applied.
   - Affected files: `prisma/migrations/`, `prisma/schema.prisma`.
   - Risk: fresh production deploys and shadow database checks can fail; schema drift can cause runtime column errors.
   - Recommendation: create a proper baseline/initial migration or repair migration history carefully. Do not use `migrate reset` without approval and data backups.
   - Status: Pending.

3. Local `AUTH_SECRET` is too weak for production.
   - Evidence: `.env` has `AUTH_SECRET`, but its length is 17 characters.
   - Affected files: `.env` only; do not commit real secret values.
   - Recommendation: replace with a 32+ byte random value, for example from `openssl rand -base64 32`, then restart the app. Rotate any sessions after changing it.
   - Status: Pending because changing production/local secrets should be deliberate.

### Medium

1. `/api/status` allows unauthenticated domain fallback lookup.
   - Affected file: `src/app/api/status/route.ts`.
   - Risk: domain-based probing can expose client names/status/payment timing. API key lookup is safer.
   - Recommendation: deprecate and remove domain fallback in production; require `X-API-KEY` or a signed request.
   - Status: Fixed in Phase 1 for production. Development domain fallback remains for local testing; production requires `X-API-KEY` or `X-Status-Api-Key`.

2. Security headers are incomplete for production.
   - Affected file: `next.config.ts`.
   - Current: basic non-CSP headers added.
   - Recommendation: add HSTS at the hosting layer after HTTPS is confirmed. Add a tested CSP that allows only required sources, including Cashfree checkout script/frame/connect endpoints and same-origin assets.
   - Status: Partially applied.

3. Cashfree webhook idempotency depends on updating a unique webhook event field.
   - Affected files: `src/app/api/payments/cashfree/webhook/route.ts`, `src/lib/payment-updates.ts`, `prisma/schema.prisma`.
   - Risk: duplicate webhook events are generally controlled by `cashfreeWebhookEventId @unique`, but a duplicate with an existing event id may throw a database error unless handled gracefully.
   - Recommendation: catch unique constraint conflicts and return success for duplicate webhook events.
   - Status: Fixed in Phase 1 for duplicate `cashfreeWebhookEventId` conflicts.

4. Cashfree webhook signature fallback uses client secret if webhook secret is missing.
   - Affected file: `src/lib/cashfree.ts`.
   - Risk: production can accidentally run without a dedicated webhook secret.
   - Recommendation: require `CASHFREE_WEBHOOK_SECRET` in production; allow fallback only in local development if needed.
   - Status: Fixed in Phase 1.

5. Cron route supports secret in query string.
   - Affected file: `src/app/api/cron/suspend/route.ts`.
   - Risk: query secrets can appear in logs and browser history.
   - Recommendation: prefer `X-Cron-Secret` header only in production, or Vercel Cron identity if available.
   - Status: Fixed in Phase 1 for production. Development query fallback remains for manual local testing.

6. Seed credentials use a weak demo password.
   - Affected file: `prisma/seed.ts`.
   - Risk: if seed runs in production, `password123` is dangerous.
   - Recommendation: make seed require an explicit `SEED_ADMIN_PASSWORD` satisfying password policy, or block production seed runs.
   - Status: Fixed in Phase 1.

7. Payment and billing status fields are strings instead of enums.
   - Affected file: `prisma/schema.prisma`.
   - Risk: inconsistent values can break business logic.
   - Recommendation: move `status`, `provider`, `billingCycle`, `billingStatus` to Prisma enums in a planned migration.
   - Status: Pending.

8. Sensitive pages are dynamic but not explicitly no-store everywhere.
   - Affected areas: dashboard, portal, invoices, payment success.
   - Recommendation: use `unstable_noStore`/cache controls where appropriate, and verify hosting CDN does not cache authenticated HTML/API responses.
   - Status: Partially fixed in Phase 1 through route-group `Cache-Control: private, no-store` headers.

### Low

1. Console errors may include provider/database error objects.
   - Affected files: `src/lib/actions.ts`, `src/lib/resend.ts`, `src/app/api/test-resend/route.ts`, `src/app/api/status/route.ts`.
   - Risk: useful in development, noisy in production.
   - Recommendation: centralize safe logging; never log secrets, passwords, OTPs, API keys, or raw database URLs.
   - Status: Pending.

2. No automated security tests currently exist.
   - Recommendation: add integration tests for auth redirects, route authorization, payment ownership, OTP lifecycle, webhook signature rejection, and invoice access.
   - Status: Pending.

## Area Review

### Authentication And Session Security

- Auth.js/NextAuth is used through `src/auth.ts`, `src/auth.config.ts`, and `src/proxy.ts`.
- Session persistence is configured as JWT strategy with an 8-hour `maxAge`.
- Auth.js stores the real session token in cookies; no app code stores session tokens in `localStorage`.
- Route gating exists in the Auth.js `authorized` callback:
  - `/dashboard` requires login and redirects client users to `/portal`.
  - `/portal` requires login and redirects Super Admin users to `/dashboard`.
- Logout uses Auth.js `signOut`, which clears the session cookie.
- Risk: production cookie security depends on HTTPS and Auth.js deployment settings. Verify cookies are `HttpOnly`, `Secure`, and `SameSite=Lax` or stricter in production.

### Password Security

- Passwords are hashed with `bcryptjs`.
- Shared password policy exists in `src/lib/password-policy.ts`.
- Policy: minimum 8 characters, uppercase, lowercase, number, special character.
- Backend validation exists for:
  - Add Client/Register New Client
  - Super Admin password update
  - Client Resend OTP password update
- Frontend validation exists on password forms.
- Login intentionally only checks credentials and does not enforce creation rules.
- Risk: old existing weak passwords remain valid until changed. Plan a forced rotation for seeded/default accounts.

### OTP And Resend Security

- OTPs are 6-digit numeric codes.
- OTPs are bcrypt-hashed before storage.
- OTP purpose is scoped with `CLIENT_PASSWORD_CHANGE`.
- OTP expires after 10 minutes.
- Previous unused OTPs are invalidated.
- Verification attempts are limited.
- Send cooldown and max send count exist.
- OTP is sent only to the logged-in client admin email; email is not accepted from the frontend.
- Risk: rate limiting is database-record based, not IP/device based. Add edge/platform rate limiting before production.

### API Route Security

- `/api/admin/*` routes reviewed use `requireSuperAdmin`.
- `/api/client/*` routes reviewed require a logged-in client or check ownership.
- `/api/payments/cashfree/webhook` verifies Cashfree signature.
- `/api/cron/suspend` requires a secret; production accepts only `X-Cron-Secret`.
- `/api/status` production requests require either client `X-API-KEY` or `X-Status-Api-Key`.
- `/api/test-resend` is now disabled in production.

### Cashfree Payment Security

- Cashfree client secret is server-side only.
- Browser receives only the payment session id, order id, and mode.
- Client order creation uses billing amount from the database, not frontend input.
- Client can create orders only for their own client id.
- Super Admin order creation is restricted.
- Verify endpoint checks local payment ownership before contacting Cashfree.
- Paid activation happens only after Cashfree status maps to `PAID`.
- Pending/failed/cancelled statuses do not activate service.
- Duplicate webhook event id conflicts are handled idempotently.
- `CASHFREE_WEBHOOK_SECRET` is mandatory in production.

### Manual Cash Payment Security

- Cash payment endpoint requires Super Admin.
- Amount and paid date are validated server-side.
- Cash payments create a Payment record with `provider: MANUAL_CASH`, `status: PAID`, and `paidAt`.
- Cash payment activates the client through the shared paid-payment helper.
- Cash payments appear in client receipts and invoices.
- Risk: no explicit audit actor field records which Super Admin entered the payment.

### Database And Prisma Security

- Prisma query builder is used; no `prisma.$queryRaw` usage found.
- Sensitive database URL is not exposed in frontend code.
- Payment has `createdAt`/`updatedAt`; Client has `createdAt`; Admin and OtpToken lack `updatedAt`.
- Recommended indexes:
  - `Admin.email`
  - `Admin.clientId`
  - `Payment.clientId`
  - `Payment.status`
  - `Payment.createdAt`
  - `Payment.paidAt`
  - `OtpToken.email,userId,purpose,usedAt,createdAt`
- Risk: migration history is incomplete and must be fixed before production deploys.

### Encryption Review

- Passwords and OTPs are hashed, not encrypted. This is correct.
- Real session tokens are handled by Auth.js cookies; do not expose them to frontend JavaScript.
- HTTPS/TLS must be enforced by hosting in production.
- PostgreSQL connection TLS depends on database provider and `DATABASE_URL` settings; verify provider requirements.
- Database encryption at rest and backup encryption are provider responsibilities; confirm in hosting/database control panel.
- Cashfree/Resend secrets must remain environment variables or secret-manager entries.
- Application-level encryption is not currently required for payment ids, invoice ids, or billing metadata, but may be considered if storing sensitive notes or PII beyond email/phone.

### Environment And Secret Risks

- `.env` is ignored by Git; `.env.example` contains placeholders only.
- `RESEND_API_KEY`, `CASHFREE_CLIENT_SECRET`, and `CASHFREE_WEBHOOK_SECRET` are server-side only.
- `CRON_SECRET`, `STATUS_API_KEY`, and `SEED_ADMIN_PASSWORD` are now documented in `.env.example`.
- Local `AUTH_SECRET` length is weak; replace before production.
- No `NEXT_PUBLIC_RESEND_API_KEY`, `NEXT_PUBLIC_CASHFREE_CLIENT_SECRET`, or `NEXT_PUBLIC_DATABASE_URL` usage found.

### Frontend Security

- No `dangerouslySetInnerHTML` or direct `innerHTML` usage found.
- Form validation exists but server-side validation is the authority.
- Payment amount and client id are not trusted from client payment buttons.
- Cashfree external script is loaded from `https://sdk.cashfree.com/js/v3/cashfree.js`; CSP must account for it.
- Invoice access is server-rendered and ownership checked.

### Business Logic Security

- Client cannot record cash payments through UI or API reviewed.
- Client can view only own receipts/invoices.
- Super Admin can view all payment invoices.
- Paid Cashfree or manual cash payments activate service.
- Pending/failed Cashfree payments do not activate service.
- Risk: active/suspended state and renewal calculations should be covered with tests before production.

## Command Results

- `npx prisma validate`: passed.
- `npx prisma generate`: passed.
- `npx prisma migrate status`: failed for production readiness; one migration exists and is not applied.
- `npm audit --audit-level=low`: failed with advisories; 7 vulnerabilities reported.
- `npm run lint`: failed on pre-existing lint debt in `src/app/dashboard/page.tsx`, `src/components/countdown-timer.tsx`, and a warning in `src/app/login/page.tsx`. The previous seed warning is fixed.
- `npm run build`: passed.

## Phase 1 Verification

- Branch: `security-hardening-phase-1`.
- `npm run build`: passed.
- `npx prisma validate`: passed.
- `npx prisma generate`: passed.
- `npm audit`: still reports 7 advisories; dependency upgrades are deferred to Phase 3.
- `npm run lint`: still fails on unrelated existing lint debt in `src/app/dashboard/page.tsx` and `src/components/countdown-timer.tsx`, plus a warning in `src/app/login/page.tsx`.
- Sensitive pattern scan found no app-code usage of `localStorage`/`sessionStorage` tokens, `NEXT_PUBLIC_*` secrets, raw Prisma SQL, unsafe HTML rendering, or the old seed password.
