import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  const supabaseResponse = NextResponse.next({
    request,
  });

  // DEMO MODE: Always allow all routes - no auth checks
  // When ready for production, remove this block
  return supabaseResponse;

  /* Production auth code - uncomment when Supabase is configured
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Demo mode - if env vars are missing or placeholders, skip auth check
  const isDemoMode = !url || !key || url.includes('placeholder');
  if (isDemoMode) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    url,
    key,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Do not write any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Define public routes that don't require authentication
  const isPublicRoute =
    request.nextUrl.pathname === '/' ||
    request.nextUrl.pathname === '/login' ||
    request.nextUrl.pathname === '/signup' ||
    request.nextUrl.pathname.startsWith('/auth/') ||
    request.nextUrl.pathname.startsWith('/book/') ||
    request.nextUrl.pathname.startsWith('/order/');

  // If user is not authenticated and trying to access protected route
  if (
    !user &&
    !isPublicRoute &&
    (request.nextUrl.pathname.startsWith('/app') || request.nextUrl.pathname.startsWith('/onboarding'))
  ) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // If user is authenticated and trying to access login/signup, redirect to app
  if (user && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup')) {
    const url = request.nextUrl.clone();
    url.pathname = '/app';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
  */
}
