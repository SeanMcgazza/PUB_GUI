import type { NextConfig } from "next";

// Build timestamp: 2026-06-11 — force a fresh build so the dashboard
// lambdas pick up the latest NEXT_PUBLIC_SUPABASE_URL/ANON_KEY values
// instead of reusing a cached empty snapshot.
const nextConfig: NextConfig = {
  // Allow LAN devices (tablet, phone) to hit the dev server without tripping
  // Next.js' cross-origin block. Set ALLOWED_DEV_ORIGINS in .env.local to a
  // comma-separated list of host IPs (no port). See SUPABASE_SETUP.md.
  allowedDevOrigins: process.env.ALLOWED_DEV_ORIGINS
    ? process.env.ALLOWED_DEV_ORIGINS.split(",").map((s) => s.trim()).filter(Boolean)
    : [],
};

export default nextConfig;
