'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { isDemoMode } from '@/lib/demo-data';
import type { User } from '@supabase/supabase-js';

const DEMO_USER = {
  id: 'demo-owner-id',
  email: 'demo@bartab.app',
  user_metadata: { business_name: 'The Local' },
  app_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString(),
} as unknown as User;

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Demo mode - use fake user
    if (isDemoMode()) {
      setUser(DEMO_USER);
      setLoading(false);
      return;
    }

    const supabase = createClient();

    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    if (!isDemoMode()) {
      const supabase = createClient();
      await supabase.auth.signOut();
    }
    router.push('/login');
  };

  return { user, loading, signOut };
}
