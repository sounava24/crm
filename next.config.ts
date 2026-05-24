import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === "production";

const cspReportOnly = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://sdk.cashfree.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self' https://api.cashfree.com https://sandbox.cashfree.com",
  "frame-src 'self' https://api.cashfree.com https://sandbox.cashfree.com https://sdk.cashfree.com",
  "form-action 'self' https://api.cashfree.com https://sandbox.cashfree.com",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  ...(isProduction
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=31536000; includeSubDomains",
        },
        {
          key: "Content-Security-Policy-Report-Only",
          value: cspReportOnly,
        },
      ]
    : []),
];

const noStoreHeaders = [
  {
    key: "Cache-Control",
    value: "private, no-store, no-cache, must-revalidate, max-age=0",
  },
  {
    key: "Pragma",
    value: "no-cache",
  },
  {
    key: "Expires",
    value: "0",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        source: "/dashboard/:path*",
        headers: noStoreHeaders,
      },
      {
        source: "/portal/:path*",
        headers: noStoreHeaders,
      },
      {
        source: "/pay/:path*",
        headers: noStoreHeaders,
      },
      {
        source: "/payment-success",
        headers: noStoreHeaders,
      },
      {
        source: "/api/admin/:path*",
        headers: noStoreHeaders,
      },
      {
        source: "/api/client/:path*",
        headers: noStoreHeaders,
      },
      {
        source: "/api/payments/:path*",
        headers: noStoreHeaders,
      },
      {
        source: "/api/auth/:path*",
        headers: noStoreHeaders,
      },
      {
        source: "/api/cron/:path*",
        headers: noStoreHeaders,
      },
      {
        source: "/api/status",
        headers: noStoreHeaders,
      },
    ];
  },
};

export default nextConfig;
