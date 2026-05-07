import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// Server-side demo-mode check (cannot import client-only demo-data here).
function isDemoMode() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return !url || url.includes('placeholder');
}

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Demo mode: skip auth so the wizard is reachable for marketing/demo flows.
  if (isDemoMode()) {
    return <>{children}</>;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // If user already completed onboarding (has a pub with a slug), skip to dashboard
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: pub } = await (supabase as any)
    .from('pubs')
    .select('slug')
    .eq('owner_id', user.id)
    .maybeSingle() as { data: { slug: string | null } | null };

  if (pub?.slug) {
    redirect('/app');
  }

  return <>{children}</>;
}
