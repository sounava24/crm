# Prisma Migration Repair Plan

Date: 2026-05-24

Scope: DM Stack Labs CRM Prisma/PostgreSQL migration history repair.

## Current Migration State

- `npx prisma migrate status` reports:
  - Database: PostgreSQL `postgres`, schema `public`, host `db.prisma.io:5432`.
  - One migration exists locally:
    - `20260522120000_cashfree_billing`
  - The migration has not been applied according to Prisma migrate.
- The only local migration is an incremental migration that runs `ALTER TABLE "Client"` and `ALTER TABLE "Payment"`.
- There is no local initial migration that creates:
  - `Client`
  - `Admin`
  - `Payment`
  - `OtpToken`

## Current Database State

A read-only `information_schema` inspection of the configured database showed these tables:

- `Admin`
- `Client`
- `Payment`
- `OtpToken`

Observed schema state:

- `Client` already has billing columns such as `billingAmount`, `billingCurrency`, `billingCycle`, `billingStatus`, `nextRenewalDate`, and `billingNote`.
- `Payment` already has Cashfree and timestamp columns such as `currency`, `provider`, `cashfreeOrderId`, `cashfreePaymentId`, `cashfreePaymentSessionId`, `cashfreeReferenceId`, `cashfreeWebhookEventId`, `createdAt`, `updatedAt`, and `rawProviderStatus`.
- `OtpToken` already exists for the Resend OTP password flow.
- `_prisma_migrations` was not present in the inspected table list, so Prisma migrate does not have an applied migration ledger for this schema.

## Why The Migration History Is Broken

The live database appears to have been created or updated through `prisma db push`, manual schema changes, or a previous migration set that is not present in this repository.

The repository now contains only `20260522120000_cashfree_billing`, which assumes `Client` and `Payment` already exist. In a fresh shadow database or new deployment, that migration fails because the base tables are missing.

This is why previous Prisma migration checks produced errors like:

- The `Client.billingAmount` column was expected by Prisma Client but missing in a database.
- Shadow database migration failed because the underlying `Client` table did not exist.

## Goals

1. Preserve existing data.
2. Avoid `prisma migrate reset`.
3. Avoid dropping tables or columns.
4. Create a reliable migration baseline so future migrations can be applied safely.
5. Make fresh environment setup possible with `prisma migrate deploy`.

## What Must Not Be Done Without Explicit Approval

- Do not run `prisma migrate reset`.
- Do not drop any table.
- Do not delete existing rows.
- Do not delete or rewrite production migration records blindly.
- Do not run destructive SQL against production.
- Do not mark migrations as applied until the real database schema has been compared and backed up.

## Backup Requirement

Before any production repair:

1. Take a full database backup from the hosting/database provider.
2. Confirm the backup can be restored.
3. Export a copy of the current schema.
4. Record row counts for critical tables:
   - `Client`
   - `Admin`
   - `Payment`
   - `OtpToken`

Suggested read-only checks:

```bash
npx prisma validate
npx prisma generate
npx prisma migrate status
```

Suggested SQL checks through a trusted database console:

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
order by table_name;

select 'Client' as table_name, count(*) from "Client"
union all select 'Admin', count(*) from "Admin"
union all select 'Payment', count(*) from "Payment"
union all select 'OtpToken', count(*) from "OtpToken";
```

## Safe Option A: Local Development With Disposable Data

Use this only if local data is disposable and the user explicitly approves reset.

1. Confirm `.env` points to a local disposable database, not production.
2. Backup anyway if useful.
3. Create a clean initial migration from the current Prisma schema.
4. Reset only the disposable local database.

Possible commands after approval:

```bash
# Only after explicit approval and only on disposable local DB
npx prisma migrate reset
npx prisma migrate dev --name initial_schema
npx prisma generate
```

Risk: deletes local data.

## Safe Option B: Production Or Any Database With Data

Recommended for this project.

High-level approach:

1. Backup production database.
2. Generate a baseline migration that represents the current full schema.
3. Mark that baseline as applied without executing destructive SQL against the existing database.
4. Reconcile or replace the current incremental Cashfree migration so it does not try to re-add existing columns.
5. Create future migrations normally from this baseline.

Recommended detailed steps:

1. Create a schema-only baseline migration from the current Prisma schema without applying it:

```bash
mkdir -p prisma/migrations/20260524000000_baseline_current_schema
npx prisma migrate diff \
  --from-empty \
  --to-schema-datamodel prisma/schema.prisma \
  --script > prisma/migrations/20260524000000_baseline_current_schema/migration.sql
```

2. Review the generated SQL manually.
   - It should create `Client`, `Admin`, `Payment`, and `OtpToken`.
   - It should include indexes and foreign keys.
   - It must not be run against the existing database if those tables already exist.

3. Create or confirm the Prisma migration ledger safely.
   - If `_prisma_migrations` does not exist, Prisma can create it through migrate tooling.
   - Do not manually insert records unless you know Prisma's exact expected columns and checksums.

4. Mark the baseline migration as applied only after confirming the live DB matches the baseline:

```bash
npx prisma migrate resolve --applied 20260524000000_baseline_current_schema
```

5. Handle `20260522120000_cashfree_billing`.
   - Since the live DB already has the Cashfree/billing columns, this migration should not be executed as-is against production.
   - Preferred path: after baseline is marked applied, either:
     - mark `20260522120000_cashfree_billing` as applied only if its changes are already present, or
     - remove/rework it in a controlled branch before production migration history is finalized.

Possible command only after comparing schema and taking backups:

```bash
npx prisma migrate resolve --applied 20260522120000_cashfree_billing
```

6. Verify:

```bash
npx prisma migrate status
npx prisma validate
npx prisma generate
npm run build
```

Expected result:

- `npx prisma migrate status` reports database schema is up to date.
- Future migrations can be generated with `npx prisma migrate dev --name <name>` in development and deployed with `npx prisma migrate deploy` in production.

## When To Use `prisma db push`

Use `prisma db push` only for local development unblocking when migration history is already broken and data loss is unacceptable or reset is not approved.

Do not use `db push` as the long-term production migration strategy. It updates schema without creating reliable migration history.

## When To Use `prisma migrate resolve`

Use `migrate resolve --applied` only when:

- The migration SQL changes are already present in the target database.
- A backup exists.
- The schema has been compared.
- You are intentionally repairing Prisma's migration ledger, not applying new schema changes.

Do not use it to hide a failed migration that has not actually been applied.

## Risks

- Marking a migration as applied when the schema does not match can cause future runtime errors.
- Running the existing Cashfree migration against a database that already has those columns can fail or corrupt migration state.
- Running reset on any non-disposable database will delete data.
- Keeping no migration baseline will keep fresh deployments and shadow database checks unreliable.

## Recommended Next Step

Do not repair automatically yet.

First decide whether the configured database is production-like and whether its data must be preserved. If yes, follow Safe Option B with a backup-first process and review the generated baseline SQL before running `migrate resolve`.
