import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // Only allow same-site relative paths for ?next= — anything else (absolute
  // URLs, protocol-relative //host, backslash tricks, userinfo @) could turn
  // this into an open redirect after login.
  const rawNext = searchParams.get('next') ?? '/app';
  const next =
    rawNext.startsWith('/') && !rawNext.startsWith('//') && !rawNext.includes('\\')
      ? rawNext
      : '/app';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Onboarding is complete when the user owns a pub with a slug set.
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: pub } = await (supabase as any)
          .from('pubs')
          .select('slug')
          .eq('owner_id', user.id)
          .maybeSingle() as { data: { slug: string | null } | null };

        if (!pub?.slug) {
          return NextResponse.redirect(`${origin}/onboarding`);
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
