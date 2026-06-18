'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { usePub } from '@/hooks/usePub';
import { isDemoMode } from '@/lib/demo-data';
import { Button } from '@/components/ui/button';
import { Check, X, BellRing } from 'lucide-react';

interface PendingCheckin {
  id: string;
  created_at: string;
  tables: { number: number; name: string | null } | null;
}

/**
 * Bar dashboard panel: lists pending table check-ins (only when the pub has
 * require_checkin_approval on) and lets staff approve/reject them. Approving
 * unlocks ordering for that table's customer; rejecting shows them a notice.
 * Renders nothing in demo mode or when there's nothing pending.
 */
export function CheckinApprovals() {
  const { pub } = usePub();
  const [pending, setPending] = useState<PendingCheckin[]>([]);

  const fetchPending = useCallback(async () => {
    if (!pub || isDemoMode()) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;
    const { data } = await supabase
      .from('table_checkins')
      .select('id, created_at, tables(number, name)')
      .eq('pub_id', pub.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });
    if (data) setPending(data as PendingCheckin[]);
  }, [pub]);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  // Realtime + 3s poll fallback (mirrors the orders dashboard; Supabase
  // free-tier realtime UPDATEs are flaky, so the poll is the safety net).
  useEffect(() => {
    if (!pub || isDemoMode()) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;
    const channel = supabase
      .channel('checkins-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'table_checkins',
          filter: `pub_id=eq.${pub.id}`,
        },
        () => fetchPending()
      )
      .subscribe();
    const id = setInterval(fetchPending, 3000);
    return () => {
      supabase.removeChannel(channel);
      clearInterval(id);
    };
  }, [pub, fetchPending]);

  const decide = async (id: string, status: 'approved' | 'rejected') => {
    setPending((prev) => prev.filter((c) => c.id !== id)); // optimistic
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;
    const { error } = await supabase
      .from('table_checkins')
      .update({ status, decided_at: new Date().toISOString() })
      .eq('id', id);
    if (error) fetchPending(); // revert optimistic removal on failure
  };

  if (isDemoMode() || pending.length === 0) return null;

  return (
    <div className="mb-6 space-y-2">
      <AnimatePresence>
        {pending.map((c) => (
          <motion.div
            key={c.id}
            layout
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97 }}
            className="flex items-center justify-between gap-3 rounded-2xl border-glass-strong bg-[color:var(--theme-surface-card)] p-4 urgency-warn"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-400/10">
                <BellRing className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <p className="font-medium text-[color:var(--theme-text-primary)]">
                  Table {c.tables?.number ?? '?'} wants to check in
                </p>
                {c.tables?.name && (
                  <p className="text-sm text-[color:var(--theme-text-muted)]">
                    {c.tables.name}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => decide(c.id, 'approved')}
                className="bg-primary-gradient text-white"
                aria-label={`Approve check-in for table ${c.tables?.number ?? ''}`}
              >
                <Check className="w-4 h-4 mr-1" /> Approve
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => decide(c.id, 'rejected')}
                aria-label={`Reject check-in for table ${c.tables?.number ?? ''}`}
                className="text-[color:var(--theme-danger)] border-glass"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
