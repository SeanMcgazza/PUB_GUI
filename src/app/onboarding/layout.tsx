import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // If user already completed onboarding (has a slug), skip to dashboard
  const { data: profile } = await supabase
    .from('profiles')
    .select('slug')
    .eq('id', user.id)
    .single() as { data: { slug: string | null } | null };

  if (profile?.slug) {
    redirect('/app');
  }

  return <>{children}</>;
}
