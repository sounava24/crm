import type { NextConfig } from "next";

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
