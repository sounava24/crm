# DM Stack Labs Client Management Dashboard

## Getting Started

Install dependencies and run the development server:

```bash
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Cashfree Billing Setup

Set these server-side environment variables before enabling client checkout:

```bash
CASHFREE_CLIENT_ID=
CASHFREE_CLIENT_SECRET=
CASHFREE_ENVIRONMENT=sandbox
CASHFREE_RETURN_URL=
CASHFREE_WEBHOOK_SECRET=
```

`CASHFREE_CLIENT_SECRET` and `CASHFREE_WEBHOOK_SECRET` must remain server-only. Order creation and verification are handled by backend API routes; the browser only receives the Cashfree payment session ID needed for hosted checkout.

## Database

Apply Prisma migrations before running in a fresh environment:

```bash
npx prisma migrate deploy
npx prisma generate
```

## Build

```bash
npm run build
```
