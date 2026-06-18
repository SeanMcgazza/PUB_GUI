import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Service-role Supabase client. BYPASSES Row Level Security.
//
// Use ONLY in trusted server contexts that have already done their own
// validation/authorization:
//   * the Stripe webhook (creates orders after payment clears)
//   * the payment-intent route (validates prices/availability/presence first)
//   * the check-in route (validates the qr_token first)
//
// NEVER import this into client code. SUPABASE_SERVICE_ROLE_KEY must only ever
// exist in server env vars.
//
// Intentionally untyped (no <Database> generic) to match the rest of the
// codebase, which accesses supabase via `as any`. The newer supabase-js typegen
// resolves this project's hand-written Database type to `never`, so threading
// the generic here would break every .from()/.rpc() call.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      'createAdminClient needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'
    );
  }
  return createSupabaseClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
