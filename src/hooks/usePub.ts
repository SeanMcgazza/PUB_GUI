'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { DEMO_PUB, isDemoMode } from '@/lib/demo-data';
import type { Pub } from '@/types/database';

export function usePub() {
  const [pub, setPub] = useState<Pub | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPub = async () => {
      // Demo mode - use mock data
      if (isDemoMode()) {
        setPub(DEMO_PUB as Pub);
        setLoading(false);
        return;
      }

      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const supabase = createClient() as any;
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setLoading(false);
          return;
        }

        const { data, error: fetchError } = await supabase
          .from('pubs')
          .select('*')
          .eq('owner_id', user.id)
          .single();

        if (fetchError) {
          if (fetchError.code !== 'PGRST116') { // Not found is ok
            setError(fetchError.message);
          }
        } else {
          setPub(data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch pub');
      } finally {
        setLoading(false);
      }
    };

    fetchPub();
  }, []);

  const updatePub = async (updates: Partial<Pub>) => {
    if (!pub) return;

    // Demo mode: DEMO_PUB is hardcoded and there's no backing store.
    // Reflect the edit locally so the UI feels responsive; persist nothing.
    if (isDemoMode()) {
      const next = {
        ...pub,
        ...updates,
        updated_at: new Date().toISOString(),
      };
      setPub(next);
      return next;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;
    const { data, error: updateError } = await supabase
      .from('pubs')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', pub.id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    setPub(data);
    return data;
  };

  return { pub, loading, error, updatePub, setPub };
}
