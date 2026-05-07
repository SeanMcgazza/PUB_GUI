import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Refreshes the Supabase session at the edge and gates access to
 * authenticated routes. In demo mode (no real Supabase URL configured)
 * this is a no-op pass-through so the customer ordering flow and the
 * demo-mode bar dashboard remain reachable without auth.
 *
 * Called from src/proxy.ts (Next 16's renamed `middleware` convention).
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Demo mode: skip auth checks. Same logic as src/lib/demo-data.ts:isDemoMode().
  const demo =
    !supabaseUrl ||
    !supabaseAnonKey ||
    supabaseUrl.includes('placeholder');
  if (demo) {
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // IMPORTANT: do not insert any logic between createServerClient and
  // supabase.auth.getUser(). The Supabase SSR client refreshes session
  // cookies as a side effect of getUser(); intervening logic can desync
  // the cookies and randomly log users out.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  const isPublicRoute =
    pathname === '/' ||
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname.startsWith('/auth/') ||
    pathname.startsWith('/order/');

  const isProtectedRoute =
    pathname.startsWith('/app') || pathname.startsWith('/onboarding');

  // Unauthenticated user hitting a protected route → /login.
  if (!user && !isPublicRoute && isProtectedRoute) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    return NextResponse.redirect(redirectUrl);
  }

  // Authenticated user on /login or /signup → /app (let the layouts
  // bounce them to /onboarding if needed).
  if (user && (pathname === '/login' || pathname === '/signup')) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/app';
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}
