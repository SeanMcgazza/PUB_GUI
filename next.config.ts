import type { NextConfig } from "next";

// Build timestamp: 2026-06-11 — force a fresh build so the dashboard
// lambdas pick up the latest NEXT_PUBLIC_SUPABASE_URL/ANON_KEY values
// instead of reusing a cached empty snapshot.
// Security headers applied to every response (C12). The CSP allows the Stripe
// payment iframe + script and Supabase REST/Realtime/Storage, which is all the
// app talks to. Tighten further if you remove any of those integrations.
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Next.js needs inline/eval for its runtime; Stripe.js is loaded from js.stripe.com.
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      // Supabase REST + Realtime (wss) + Stripe API.
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com",
      // Stripe Elements + 3DS challenge render in these frames.
      "frame-src https://js.stripe.com https://hooks.stripe.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  // Allow LAN devices (tablet, phone) to hit the dev server without tripping
  // Next.js' cross-origin block. Set ALLOWED_DEV_ORIGINS in .env.local to a
  // comma-separated list of host IPs (no port). See SUPABASE_SETUP.md.
  allowedDevOrigins: process.env.ALLOWED_DEV_ORIGINS
    ? process.env.ALLOWED_DEV_ORIGINS.split(",").map((s) => s.trim()).filter(Boolean)
    : [],
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
