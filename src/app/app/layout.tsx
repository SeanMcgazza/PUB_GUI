import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AppShell } from '@/components/layout/app-shell';

export const dynamic = 'force-dynamic';

// Check if demo mode (server-side)
function isDemoMode() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return !url || url.includes('placeholder');
}

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Demo mode - skip auth checks
  if (isDemoMode()) {
    return <AppShell>{children}</AppShell>;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Check if onboarding is complete (pub slug is set during onboarding)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: pub } = await (supabase as any)
    .from('pubs')
    .select('slug')
    .eq('owner_id', user.id)
    .single() as { data: { slug: string | null } | null };

  if (!pub?.slug) {
    redirect('/onboarding');
  }

  return <AppShell>{children}</AppShell>;
}
