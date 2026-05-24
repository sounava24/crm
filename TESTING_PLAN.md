# DM Stack Labs CRM Testing Plan

Audit date: 2026-05-24

This checklist covers manual and automated testing for authentication, authorization, payments, invoices, database integrity, security headers, and deployment readiness.

## A. Authentication Tests

- [ ] Super Admin can log in with valid credentials.
- [ ] Client admin can log in with valid credentials.
- [ ] Wrong password is rejected with a generic error.
- [ ] Unknown email is rejected with the same generic error as wrong password.
- [ ] Refresh after login preserves the session.
- [ ] Expired session redirects to `/login`.
- [ ] Logout clears the Auth.js session cookie and redirects to `/login`.
- [ ] Direct `/dashboard` access without login redirects to login.
- [ ] Direct `/portal` access without login redirects to login.
- [ ] Client trying `/dashboard` is redirected to `/portal`.
- [ ] Super Admin trying `/portal` is redirected to `/dashboard`.
- [ ] Session cookie is `HttpOnly`.
- [ ] Session cookie is `Secure` in HTTPS production.
- [ ] Session cookie has acceptable `SameSite` behavior.

## B. Password Tests

- [ ] Weak password under 8 characters is rejected.
- [ ] Password without uppercase letter is rejected.
- [ ] Password without lowercase letter is rejected.
- [ ] Password without number is rejected.
- [ ] Password without special character is rejected.
- [ ] Strong password is accepted.
- [ ] Password mismatch is rejected.
- [ ] Super Admin password update rejects wrong current password.
- [ ] Super Admin password update accepts correct current password and strong new password.
- [ ] Add Client rejects weak admin password.
- [ ] Add Client accepts strong admin password.
- [ ] Client password update requires OTP.
- [ ] Used OTP is rejected.
- [ ] Expired OTP is rejected.
- [ ] Wrong OTP is rejected.
- [ ] Too many OTP attempts are blocked.
- [ ] Password values never appear in logs.

## C. Resend OTP Tests

- [ ] Missing `RESEND_API_KEY` returns a safe server error.
- [ ] Missing `RESEND_FROM_EMAIL` returns a safe server error.
- [ ] `onboarding@resend.dev` can send only to allowed Resend test/owner recipients.
- [ ] Verified domain sender such as `DM Stack Labs <noreply@dmstacklabs.in>` sends to real client emails.
- [ ] OTP is sent only to the logged-in client email.
- [ ] Frontend cannot submit a different OTP recipient email.
- [ ] Resend cooldown blocks repeated sends for 30 seconds.
- [ ] Max 5 sends per 15 minutes per client/email is enforced.
- [ ] OTP expires after 10 minutes.
- [ ] OTP is stored hashed in the database.
- [ ] OTP is not logged in server logs.
- [ ] `/api/test-resend` returns 404 in production.

## D. Payment Tests

- [ ] Super Admin can set billing amount, billing cycle, renewal date, and billing status.
- [ ] Client sees the correct billing amount in INR.
- [ ] Client cannot modify amount from the browser request.
- [ ] Client creates Cashfree order for own account only.
- [ ] Super Admin creates Cashfree order for selected client only.
- [ ] Cashfree order amount comes from database.
- [ ] Cashfree success marks payment `PAID`.
- [ ] Cashfree success activates service.
- [ ] Cashfree pending remains pending and does not activate service.
- [ ] Cashfree failed does not activate service.
- [ ] Cashfree cancelled does not activate service.
- [ ] Invalid Cashfree webhook signature is rejected.
- [ ] Duplicate Cashfree webhook does not duplicate payment or crash endpoint.
- [ ] Cashfree webhook updates are idempotent.
- [ ] Manual cash payment by Super Admin marks payment `PAID`.
- [ ] Manual cash payment activates service.
- [ ] Client cannot call cash payment API.
- [ ] Cash payment amount must be greater than zero.
- [ ] Cash payment creates an auditable record.

## E. Invoice Tests

- [ ] Client sees all own paid, pending, failed, and cancelled payment records.
- [ ] Client sees both Cash and Cashfree methods.
- [ ] Client cannot access another client receipt by URL.
- [ ] Super Admin sees all client payment records.
- [ ] Super Admin can open any paid payment invoice.
- [ ] Invoice includes DM Stack Labs logo.
- [ ] Cash payment invoice renders correctly.
- [ ] Cashfree payment invoice renders correctly.
- [ ] Pending/failed/cancelled records do not show final invoice actions.
- [ ] INR formatting is correct.
- [ ] Invoice print layout is readable on A4.
- [ ] Invoice does not expose internal database ids beyond intended receipt/reference fields.

## F. Authorization Tests

- [ ] Every `/api/admin/*` route rejects anonymous requests.
- [ ] Every `/api/admin/*` route rejects client users.
- [ ] Every `/api/client/*` route rejects anonymous requests.
- [ ] Client ownership is enforced for payment creation.
- [ ] Client ownership is enforced for payment verification.
- [ ] Client ownership is enforced for invoice pages.
- [ ] Super Admin invoice access works for all clients.
- [ ] `/api/cron/suspend` rejects missing secret.
- [ ] `/api/cron/suspend` rejects wrong secret.
- [ ] `/api/cron/suspend` accepts correct header secret.
- [ ] `/api/status` requires API key after domain fallback is removed.
- [ ] Production-style `/api/status?domain=...` without headers returns 401.
- [ ] `/api/status` with client `X-API-KEY` returns only minimal status fields.
- [ ] `/api/status` with `X-Status-Api-Key` can perform controlled domain lookup.

## G. Database Tests

- [ ] `npx prisma validate` passes.
- [ ] `npx prisma generate` passes.
- [ ] `npx prisma migrate status` is clean.
- [ ] Fresh database migration deploy succeeds.
- [ ] No missing columns at runtime.
- [ ] Payment records are created with correct provider/method/status.
- [ ] Billing status updates correctly after paid Cashfree payment.
- [ ] Billing status updates correctly after manual cash payment.
- [ ] Pending/failed/cancelled payment statuses do not incorrectly set active service.
- [ ] Unique Cashfree order id constraints work.
- [ ] Duplicate webhook event ids are handled safely.

## H. Security Header Tests

- [ ] `X-Content-Type-Options: nosniff` is present.
- [ ] `Referrer-Policy: strict-origin-when-cross-origin` is present.
- [ ] `Permissions-Policy` blocks camera, microphone, and geolocation.
- [ ] `X-Frame-Options: DENY` or CSP `frame-ancestors` is present.
- [ ] HSTS is enabled only after HTTPS is confirmed.
- [ ] CSP report-only header is present in production.
- [ ] CSP report-only browser console violations are reviewed.
- [ ] CSP is tested with Cashfree checkout script and frames before enforcement.
- [ ] CSP does not break dashboard styles/scripts.
- [ ] No wildcard CORS is present in production APIs.

## I. Build And Deployment Tests

- [ ] `npm ci` completes.
- [ ] `npm run build` passes.
- [ ] `npm run lint` passes or known lint debt is documented.
- [ ] `npm audit` is reviewed and advisories triaged.
- [ ] `STATUS_API_KEY` is present if operational domain status lookups are needed.
- [ ] `SEED_ADMIN_PASSWORD` is strong before any production seed.
- [ ] Production `DATABASE_URL` is present and server-only.
- [ ] Production `AUTH_SECRET` is 32+ random bytes.
- [ ] Production Cashfree variables are present.
- [ ] Production Resend sender domain is verified.
- [ ] `CRON_SECRET` is present.
- [ ] `.env` is not committed.
- [ ] `.env.example` has placeholders only.
- [ ] Deployment smoke test passes on target host.

## J. Browser And Device Tests

- [ ] Login page works on desktop.
- [ ] Login page works on mobile.
- [ ] Super Admin dashboard works on desktop.
- [ ] Super Admin dashboard works on mobile.
- [ ] Client portal works on desktop.
- [ ] Client portal works on mobile.
- [ ] Sidebar hover/collapse works on desktop.
- [ ] Sidebar drawer works on mobile.
- [ ] Client profile OTP form works on desktop and mobile.
- [ ] Payment success page handles success, pending, and failure.
- [ ] Cashfree redirect returns to the correct page.
- [ ] Invoice print view is usable on desktop and mobile.

## Automated Test Suggestions

- Add Playwright tests for login, route redirects, dashboard/portal role separation, sidebar behavior, invoice access, and payment success page states.
- Add API integration tests for admin route authorization, client route ownership, OTP lifecycle, Cashfree webhook signature rejection, and cron secret enforcement.
- Add unit tests for `validateStrongPassword`, billing date/status helpers, Cashfree status mapping, and invoice reference formatting.
- Add a staging Cashfree sandbox suite using test credentials and webhook replay.
- Add a CI job running `npm ci`, `npm run lint`, `npm run build`, `npx prisma validate`, and `npm audit --audit-level=high`.
