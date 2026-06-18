// Single source of truth for "demo mode".
//
// Safe to import from BOTH server and client: it only reads NEXT_PUBLIC_* vars
// (inlined at build) plus, server-side, the deployment-environment vars.
//
// Demo mode = no Supabase, no auth, no payments (localStorage only). It MUST be
// an intentional state, never something a production deploy falls into by
// accident — see assertNotAccidentalDemo() (C8 in the security audit).

export function isDemoMode(): boolean {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') return true;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return !url || url.includes('placeholder');
}

/**
 * Fail closed. If we're running in a real production deployment but Supabase
 * is not configured AND demo mode wasn't explicitly requested, that's a
 * misconfiguration (e.g. a missing/typo'd env var). Throwing here is far safer
 * than silently serving the owner dashboard with NO authentication.
 *
 * Call this at the top of authenticated layouts so only the protected area
 * fails closed; public pages can still render an error.
 */
export function assertNotAccidentalDemo(): void {
  const explicitDemo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const configured = !!url && !url.includes('placeholder');
  const isProdDeploy =
    process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production';

  if (isProdDeploy && !configured && !explicitDemo) {
    throw new Error(
      'BarTab is misconfigured: NEXT_PUBLIC_SUPABASE_URL is missing in a ' +
        'production build. Refusing to start in auth-less demo mode. Set the ' +
        'Supabase env vars, or set NEXT_PUBLIC_DEMO_MODE=true to run a demo ' +
        'intentionally.'
    );
  }
}
