'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { usePub } from '@/hooks/usePub';
import { DemoOrdersState, isDemoMode } from '@/lib/demo-data';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Order, OrderItem, Table } from '@/types/database';
import { formatDistanceToNow } from 'date-fns';
import { 
  Clock, Check, ChefHat, Bell, Package, X, 
  Volume2, VolumeX, RefreshCw
} from 'lucide-react';

type OrderWithDetails = Order & {
  order_items: OrderItem[];
  tables: Table | null;
};

const statusFilters = [
  { key: 'pending', label: 'Pending', icon: Clock, color: 'bg-gray-700' },
  { key: 'accepted', label: 'Accepted', icon: Check, color: 'bg-blue-500' },
  { key: 'preparing', label: 'Preparing', icon: ChefHat, color: 'bg-purple-500' },
  { key: 'ready', label: 'Ready', icon: Bell, color: 'bg-green-500' },
] as const;

const ACTIVE_STATUSES = ['pending', 'accepted', 'preparing', 'ready'];

export default function DashboardPage() {
  const { pub } = usePub();
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string | null>('pending');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Track active order count across demo subscription firings so we only chime on new orders.
  const lastActiveCountRef = useRef<number>(-1);

  const fetchOrders = useCallback(async () => {
    if (!pub) return;

    // Demo mode - read live demo orders (shared with customer ordering flow)
    if (isDemoMode()) {
      const all = DemoOrdersState.getOrders();
      const active = all.filter((o) => ACTIVE_STATUSES.includes(o.status));
      setOrders(active as unknown as OrderWithDetails[]);
      lastActiveCountRef.current = active.length;
      setLoading(false);
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (*),
        tables (*)
      `)
      .eq('pub_id', pub.id)
      .in('status', ['pending', 'accepted', 'preparing', 'ready'])
      .order('created_at', { ascending: false });

    if (!error && data) {
      setOrders(data as OrderWithDetails[]);
    }
    setLoading(false);
  }, [pub]);

  // Initial fetch
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Demo realtime - subscribe to localStorage events fired by customer ordering
  useEffect(() => {
    if (!pub || !isDemoMode()) return;

    const unsub = DemoOrdersState.subscribe((all) => {
      const active = all.filter((o) => ACTIVE_STATUSES.includes(o.status));

      // Chime only when a new active order appears (not on status updates).
      if (
        lastActiveCountRef.current >= 0 &&
        active.length > lastActiveCountRef.current &&
        soundEnabled &&
        audioRef.current
      ) {
        audioRef.current.play().catch(() => {});
      }
      lastActiveCountRef.current = active.length;

      setOrders(active as unknown as OrderWithDetails[]);
    });

    return unsub;
  }, [pub, soundEnabled]);

  // Real-time subscription (skip in demo mode)
  useEffect(() => {
    if (!pub || isDemoMode()) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;
    const channel = supabase
      .channel('orders-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `pub_id=eq.${pub.id}`,
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (payload: any) => {
          if (payload.eventType === 'INSERT') {
            // Play notification sound
            if (soundEnabled && audioRef.current) {
              audioRef.current.play().catch(() => {});
            }
            fetchOrders();
          } else if (payload.eventType === 'UPDATE') {
            setOrders((prev) =>
              prev.map((order) =>
                order.id === payload.new.id
                  ? { ...order, ...(payload.new as Order) }
                  : order
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setOrders((prev) =>
              prev.filter((order) => order.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [pub, soundEnabled, fetchOrders]);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    // Demo mode - persist via DemoOrdersState so the customer side sees the update.
    // Local orders state will refresh via the demo subscription effect above.
    if (isDemoMode()) {
      DemoOrdersState.updateOrderStatus(orderId, newStatus);
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', orderId);

    if (error) {
      console.error('Failed to update order:', error);
      alert('Failed to update order status');
    }
  };

  const filteredOrders = activeFilter
    ? orders.filter((o) => o.status === activeFilter)
    : orders;

  const statusCounts = statusFilters.reduce((acc, s) => {
    acc[s.key] = orders.filter((o) => o.status === s.key).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Hidden audio element for notification sound */}
      <audio ref={audioRef} preload="auto">
        <source src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleiyC2NugqHpPJCR2y+3d0J6Abzg1RILo7+PWrH89HRxLrt7u7tGykWk+JitZju719urLnGs2GxdNqNr2+O3TtpNlNRsWRaHS8/zz4dCvjmIxFg84ldLu/f7+9ubEoXQ8GA0ticrq////++/RsYZHIQ8gisDm////++/Ts4lJIg8gisDm////////x55xRB0MHYvF6v////////vgwZ1wRh8OH4zJ7f///////fHVrYpNKRUQgMTx////////8+vdroxOKhURgMXz////////9e7hrY1RLBgRfcP1/////////PPhsZBSLhoSfMP2/////////fflupVVMB0TesL4//////////vrvphXMh8VeL/5//////////3zwZ1bNSEWdb35//////////70xaFdNyQXc7z7///////////3yKRgOSYYcbr8////////////+symYjwpGm+5/f////////////7/z61mQCwbbrj+/////////////9GwakIuHGy3/////////////////9SzbEQuHWy3/////////////////9azcEYwH2u2/////////////////9i1ckgxIGq1//////////////////+4dEoyIWm0//////////////////+5d0wzImiz//////////////////+6ek40I2ey//////////////////+8fVA2JGax//////////////////++gFE3JWWw//////////////////+/g1M4J2Sv///////////////////AhVU6KGOu///////////////////BiFc7KWKt///////////////////CilpWWVpa" type="audio/wav" />
      </audio>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex items-center justify-between"
      >
        <div>
          <h1 className="font-serif text-3xl md:text-4xl text-[color:var(--theme-text-primary)]">
            Orders
          </h1>
          <p className="text-[color:var(--theme-text-muted)]">
            {orders.length} active order{orders.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSoundEnabled(!soundEnabled)}
            aria-label={soundEnabled ? 'Mute notifications' : 'Unmute notifications'}
            className={cn(
              soundEnabled
                ? 'text-[color:var(--theme-primary-glow)]'
                : 'text-[color:var(--theme-text-subtle)]'
            )}
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={fetchOrders}
            aria-label="Refresh orders"
            className="text-[color:var(--theme-text-muted)]"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>

      {/* Status Filters — glass chips with active = primary gradient */}
      <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide pb-1">
        <FilterChip
          label="All"
          count={orders.length}
          active={activeFilter === null}
          onClick={() => setActiveFilter(null)}
        />
        {statusFilters.map((filter) => (
          <FilterChip
            key={filter.key}
            label={filter.label}
            count={statusCounts[filter.key]}
            icon={filter.icon}
            active={activeFilter === filter.key}
            onClick={() => setActiveFilter(filter.key)}
          />
        ))}
      </div>

      {/* Orders Grid */}
      {loading ? (
        <div className="text-center py-16 text-[color:var(--theme-text-muted)]">
          Loading orders...
        </div>
      ) : filteredOrders.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20 glass rounded-2xl"
        >
          <Package className="w-12 h-12 text-[color:var(--theme-text-subtle)] mx-auto mb-4" />
          <h3 className="font-serif text-xl mb-2 text-[color:var(--theme-text-primary)]">
            No orders yet
          </h3>
          <p className="text-[color:var(--theme-text-muted)]">
            {activeFilter
              ? `No ${activeFilter} orders at the moment`
              : 'Orders will appear here when customers place them'}
          </p>
        </motion.div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence>
            {filteredOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onUpdateStatus={updateOrderStatus}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

function FilterChip({
  label,
  count,
  icon: Icon,
  active,
  onClick,
}: {
  label: string;
  count: number;
  icon?: React.ComponentType<{ className?: string }>;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 px-4 h-10 rounded-full text-sm font-medium transition-colors whitespace-nowrap shrink-0',
        active
          ? 'bg-primary-gradient text-white glow-primary-sm'
          : 'glass text-[color:var(--theme-text-muted)] hover:text-[color:var(--theme-text-primary)]'
      )}
    >
      {Icon && <Icon className="w-4 h-4" />}
      <span>{label}</span>
      {count > 0 && (
        <span
          className={cn(
            'rounded-full px-2 py-0.5 text-xs',
            active ? 'bg-white/25' : 'bg-[color:var(--theme-surface-card-hover)]'
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function OrderCard({
  order,
  onUpdateStatus,
}: {
  order: OrderWithDetails;
  onUpdateStatus: (orderId: string, status: string) => void;
}) {
  const statusConfig = {
    pending: {
      label: 'Pending',
      dot: '#9CA3AF',
      next: 'accepted',
      nextLabel: 'Accept',
    },
    accepted: {
      label: 'Accepted',
      dot: 'var(--theme-info)',
      next: 'preparing',
      nextLabel: 'Start Preparing',
    },
    preparing: {
      label: 'Preparing',
      dot: '#A78BFA',
      next: 'ready',
      nextLabel: 'Mark Ready',
    },
    ready: {
      label: 'Ready',
      dot: 'var(--theme-success)',
      next: 'collected',
      nextLabel: 'Collected',
    },
  } as const;

  const config = statusConfig[order.status as keyof typeof statusConfig];

  // Tick "now" every 30s so the urgency border + relative time update over
  // time without a page reload. (Date.now() can't be called directly during
  // render — it's impure and would only re-evaluate on unrelated renders.)
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const timeAgo = formatDistanceToNow(new Date(order.created_at), {
    addSuffix: true,
  });

  // Urgency pulse: > 5 min → amber border, > 10 min → red border.
  const ageMs = now - new Date(order.created_at).getTime();
  const urgency =
    ageMs > 10 * 60_000 ? 'danger' : ageMs > 5 * 60_000 ? 'warn' : 'none';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className={cn(
        'relative rounded-2xl border-glass-strong overflow-hidden shadow-pub bg-[color:var(--theme-surface-card)]',
        urgency === 'warn' && 'urgency-warn',
        urgency === 'danger' && 'urgency-danger'
      )}
    >
      {/* Ticket header — confirmation code, status pill, time, table */}
      <div className="flex items-start justify-between p-4 border-b border-glass">
        <div>
          <div className="flex items-baseline gap-3">
            <span className="font-serif text-3xl text-[color:var(--theme-text-primary)] tabular-nums">
              #{order.confirmation_code}
            </span>
            <span className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-[color:var(--theme-text-muted)]">
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: config?.dot }}
              />
              {config?.label}
            </span>
          </div>
          <p className="text-sm text-[color:var(--theme-text-muted)] mt-1">
            Table {order.tables?.number || '?'}
            {order.tables?.name && ` · ${order.tables.name}`}
          </p>
        </div>
        <span className="text-xs text-[color:var(--theme-text-subtle)] tabular-nums">
          {timeAgo}
        </span>
      </div>

      {/* Items — zebra-striped for fast reading */}
      <ul className="divide-y divide-[color:var(--theme-border-glass)]">
        {order.order_items.map((item, i) => (
          <li
            key={item.id}
            className={cn(
              'flex justify-between items-center px-4 py-2.5 text-sm',
              i % 2 === 0
                ? 'bg-transparent'
                : 'bg-[color:var(--theme-surface-card-hover)]/40'
            )}
          >
            <span className="text-[color:var(--theme-text-primary)]">
              <span className="font-semibold text-[color:var(--theme-primary-glow)] mr-2 tabular-nums">
                {item.quantity}×
              </span>
              {item.name}
            </span>
            <span className="text-[color:var(--theme-text-muted)] tabular-nums">
              €{(item.price * item.quantity).toFixed(2)}
            </span>
          </li>
        ))}
      </ul>

      {/* Notes */}
      {order.notes && (
        <div className="px-4 py-3 bg-[color:var(--theme-surface-base)]/60 border-t border-glass">
          <p className="text-xs uppercase tracking-wider text-[color:var(--theme-text-subtle)] mb-1">
            Notes
          </p>
          <p className="text-sm text-[color:var(--theme-text-primary)]">
            {order.notes}
          </p>
        </div>
      )}

      {/* Footer — total + primary action + cancel */}
      <div className="p-4 border-t border-glass">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm uppercase tracking-wider text-[color:var(--theme-text-subtle)]">
            Total
          </span>
          <span className="font-serif text-2xl text-gradient-primary tabular-nums">
            €{order.total.toFixed(2)}
          </span>
        </div>
        <div className="flex gap-2">
          {config?.next && config.next !== 'collected' && (
            <Button
              onClick={() => onUpdateStatus(order.id, config.next)}
              className="flex-1 bg-primary-gradient text-white font-semibold rounded-xl h-11 glow-primary-sm"
            >
              {config.nextLabel}
            </Button>
          )}
          {config?.next === 'collected' && (
            <Button
              onClick={() => onUpdateStatus(order.id, 'collected')}
              className="flex-1 text-white font-semibold rounded-xl h-11"
              style={{ background: 'var(--theme-success)' }}
            >
              <Check className="w-4 h-4 mr-2" />
              {config.nextLabel}
            </Button>
          )}
          {order.status !== 'cancelled' && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onUpdateStatus(order.id, 'cancelled')}
              aria-label={`Cancel order #${order.confirmation_code}`}
              className="rounded-xl h-11 w-11 text-[color:var(--theme-danger)] hover:bg-[color:var(--theme-danger)]/10 border-glass"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
