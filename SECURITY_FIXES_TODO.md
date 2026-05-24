# DM Stack Labs CRM Security Fixes TODO

Audit date: 2026-05-24

## Immediate Fixes

1. Upgrade vulnerable dependencies in a dedicated branch.
   - `npm audit` reports 7 advisories, including high-severity Next.js advisories.
   - Test patched `next`, `postcss`, `ws`, `brace-expansion`, and Prisma-related dependency updates.
   - Do not use `npm audit fix --force` directly on `main`.
   - Status: Fixed in Phase 3 with safe package upgrades and scoped npm overrides. `npm audit` now reports 0 vulnerabilities.

2. Replace production `AUTH_SECRET`.
   - Use a 32+ byte random secret.
   - Example generation: `openssl rand -base64 32`.
   - Restart app and expect existing sessions to be invalidated.

3. Repair Prisma migration history.
   - Add a baseline migration that creates `Client`, `Admin`, `Payment`, and `OtpToken`.
   - Reconcile the existing `20260522120000_cashfree_billing` migration.
   - Use `migrate resolve` only after confirming the real database state.
   - Do not run `migrate reset` without backup and explicit approval.
   - Status: repository migrations now include an initial schema migration and security index migration. Existing database ledger repair is pending manual backup and approval.

4. Harden `/api/status`.
   - Remove unauthenticated `domain` fallback in production.
   - Require `X-API-KEY` or signed requests.
   - Avoid returning client name/payment dates unless required.
   - Status: Fixed in Phase 1 for production with `X-API-KEY` or `X-Status-Api-Key`.

5. Make Cashfree webhook handling fully idempotent.
   - Catch duplicate `cashfreeWebhookEventId` unique constraint and return success.
   - Add tests for replayed webhook events.
   - Status: Code fix applied in Phase 1; replay test still needed.

## Before Production

0. Configure production secrets in the hosting provider only.
   - Do not commit real secrets to the repository.
   - Generate `AUTH_SECRET` with `openssl rand -base64 32`.
   - Changing `AUTH_SECRET` invalidates all existing sessions.
   - Set `STATUS_API_KEY` for controlled operational status lookups.
   - Set `CRON_SECRET` and call cron jobs with the `X-Cron-Secret` header.
   - Set `CASHFREE_WEBHOOK_SECRET`; production webhook verification will reject requests without it.
   - Use a verified Resend sender such as `DM Stack Labs <noreply@mail.dmstacklabs.in>`.
   - Keep `DATABASE_URL`, Cashfree keys, Resend keys, `CRON_SECRET`, `STATUS_API_KEY`, `SEED_ADMIN_PASSWORD`, and `AUTH_SECRET` only in hosting environment variables or a secret manager.

1. Require `CASHFREE_WEBHOOK_SECRET` in production.
   - Do not silently fall back to `CASHFREE_CLIENT_SECRET`.
   - Status: Fixed in Phase 1.

2. Add production CSP.
   - Include exact allowlist for same-origin assets and Cashfree checkout script/frame/connect endpoints.
   - Test dashboard, login, payment, and invoice pages after CSP.
   - Status: Phase 5 adds production `Content-Security-Policy-Report-Only` first, not enforcing CSP yet.
   - Current report-only policy allows same-origin resources, Cashfree SDK `https://sdk.cashfree.com`, and Cashfree API/frame/form endpoints `https://api.cashfree.com` and `https://sandbox.cashfree.com`.
   - Before enforcing CSP, test login, dashboard, portal, invoice print, Cashfree checkout, payment success, and Resend OTP pages in production/staging browser devtools.

3. Enable HSTS at hosting/CDN layer.
   - Only after HTTPS is confirmed.
   - Suggested header: `Strict-Transport-Security: max-age=31536000; includeSubDomains`.
   - Status: Phase 5 adds production HSTS from Next headers. Confirm HTTPS is always used at the hosting/CDN layer before deployment.

4. Prefer cron secret in header only.
   - Query-string secrets are easy to leak in logs.
   - Use `X-Cron-Secret` or host-native cron identity.
   - Status: Fixed in Phase 1 for production; local development query fallback remains.

5. Add actor audit fields.
   - Record which Super Admin updated billing, recorded cash payment, suspended/reactivated clients, or changed settings.

6. Add IP/platform rate limiting.
   - OTP send/update endpoints.
   - Login route.
   - Payment order creation.
   - Public status endpoint.
   - Status: in-memory app-level rate limiting added. For multi-instance production, add Redis/edge/provider-level rate limiting.

7. Convert status/provider fields to Prisma enums.
   - `Client.status`
   - `Client.billingStatus`
   - `Client.billingCycle`
   - `Payment.status`
   - `Payment.provider`

8. Add database indexes.
   - `Admin.clientId`
   - `Payment.clientId`
   - `Payment.status`
   - `Payment.createdAt`
   - `Payment.paidAt`
   - `OtpToken.email,userId,purpose,usedAt,createdAt`
   - Status: schema annotations and migration added.

9. Replace seed defaults.
   - Block `prisma/seed.ts` in production unless explicitly enabled.
   - Require a strong `SEED_ADMIN_PASSWORD`.
   - Status: Fixed in Phase 1.

10. Verify encryption outside app code.
   - HTTPS/TLS at hosting.
   - TLS to PostgreSQL.
   - Database encryption at rest.
   - Backup encryption.
   - Secret-manager storage for env vars.

## Future Hardening

1. Add automated security regression tests.
   - Authorization on every API route.
   - Invoice ownership.
   - OTP lifecycle.
   - Cashfree webhook signature and duplicate replay.

2. Add centralized safe logging.
   - Redact emails if needed.
   - Never log passwords, OTPs, API keys, database URLs, or provider secrets.

3. Add admin action audit log model.
   - Actor id, action, target id, timestamp, IP/user agent if available.

4. Add account lockout or adaptive throttling for repeated failed login attempts.

5. Add session rotation policy for privilege changes and password changes.

6. Add backup/restore drill documentation.

7. Add incident response checklist.

8. Add SAST/dependency scanning in CI.

9. Add staging environment with real Resend verified domain and Cashfree sandbox webhooks.

10. Add API schema validation tests for all request bodies.
