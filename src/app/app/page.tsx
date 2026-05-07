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
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      {/* Hidden audio element for notification sound */}
      <audio ref={audioRef} preload="auto">
        <source src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleiyC2NugqHpPJCR2y+3d0J6Abzg1RILo7+PWrH89HRxLrt7u7tGykWk+JitZju719urLnGs2GxdNqNr2+O3TtpNlNRsWRaHS8/zz4dCvjmIxFg84ldLu/f7+9ubEoXQ8GA0ticrq////++/RsYZHIQ8gisDm////++/Ts4lJIg8gisDm////////x55xRB0MHYvF6v////////vgwZ1wRh8OH4zJ7f///////fHVrYpNKRUQgMTx////////8+vdroxOKhURgMXz////////9e7hrY1RLBgRfcP1/////////PPhsZBSLhoSfMP2/////////fflupVVMB0TesL4//////////vrvphXMh8VeL/5//////////3zwZ1bNSEWdb35//////////70xaFdNyQXc7z7///////////3yKRgOSYYcbr8////////////+symYjwpGm+5/f////////////7/z61mQCwbbrj+/////////////9GwakIuHGy3/////////////////9SzbEQuHWy3/////////////////9azcEYwH2u2/////////////////9i1ckgxIGq1//////////////////+4dEoyIWm0//////////////////+5d0wzImiz//////////////////+6ek40I2ey//////////////////+8fVA2JGax//////////////////++gFE3JWWw//////////////////+/g1M4J2Sv///////////////////AhVU6KGOu///////////////////BiFc7KWKt///////////////////CilpWWVpa" type="audio/wav" />
      </audio>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Orders</h1>
          <p className="text-muted-foreground">
            {orders.length} active order{orders.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={cn(
              soundEnabled ? 'text-gray-900' : 'text-muted-foreground'
            )}
          >
            {soundEnabled ? (
              <Volume2 className="w-5 h-5" />
            ) : (
              <VolumeX className="w-5 h-5" />
            )}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={fetchOrders}
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>

      {/* Status Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <Button
          variant={activeFilter === null ? 'default' : 'outline'}
          onClick={() => setActiveFilter(null)}
          className={cn(
            activeFilter === null && 'bg-gray-900 hover:bg-gray-800'
          )}
        >
          All ({orders.length})
        </Button>
        {statusFilters.map((filter) => {
          const count = statusCounts[filter.key];
          return (
            <Button
              key={filter.key}
              variant={activeFilter === filter.key ? 'default' : 'outline'}
              onClick={() => setActiveFilter(filter.key)}
              className={cn(
                'flex items-center gap-2',
                activeFilter === filter.key && filter.color
              )}
            >
              <filter.icon className="w-4 h-4" />
              {filter.label}
              {count > 0 && (
                <span className="ml-1 bg-white/20 px-1.5 py-0.5 rounded text-xs">
                  {count}
                </span>
              )}
            </Button>
          );
        })}
      </div>

      {/* Orders Grid */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">
          Loading orders...
        </div>
      ) : filteredOrders.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No orders yet
          </h3>
          <p className="text-muted-foreground">
            {activeFilter
              ? `No ${activeFilter} orders at the moment`
              : 'Orders will appear here when customers place them'}
          </p>
        </motion.div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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

function OrderCard({
  order,
  onUpdateStatus,
}: {
  order: OrderWithDetails;
  onUpdateStatus: (orderId: string, status: string) => void;
}) {
  const statusConfig = {
    pending: { bg: 'bg-gray-50 border-gray-200', badge: 'bg-gray-700', next: 'accepted', nextLabel: 'Accept' },
    accepted: { bg: 'bg-blue-50 border-blue-200', badge: 'bg-blue-500', next: 'preparing', nextLabel: 'Start Preparing' },
    preparing: { bg: 'bg-purple-50 border-purple-200', badge: 'bg-purple-500', next: 'ready', nextLabel: 'Mark Ready' },
    ready: { bg: 'bg-green-50 border-green-200', badge: 'bg-green-500', next: 'collected', nextLabel: 'Collected' },
  } as const;

  const config = statusConfig[order.status as keyof typeof statusConfig];
  const timeAgo = formatDistanceToNow(new Date(order.created_at), { addSuffix: true });

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        'rounded-xl border-2 p-4 shadow-sm',
        config?.bg || 'bg-white border-gray-200'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-gray-900">
              #{order.confirmation_code}
            </span>
            <span className={cn(
              'px-2 py-0.5 rounded-full text-xs text-white font-medium',
              config?.badge || 'bg-gray-500'
            )}>
              {order.status}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Table {order.tables?.number || '?'}
            {order.tables?.name && ` - ${order.tables.name}`}
          </p>
        </div>
        <span className="text-xs text-muted-foreground">{timeAgo}</span>
      </div>

      {/* Items */}
      <div className="space-y-1 mb-4">
        {order.order_items.map((item) => (
          <div key={item.id} className="flex justify-between text-sm">
            <span>
              {item.quantity}× {item.name}
            </span>
            <span className="text-muted-foreground">
              €{(item.price * item.quantity).toFixed(2)}
            </span>
          </div>
        ))}
      </div>

      {/* Notes */}
      {order.notes && (
        <div className="bg-white/50 rounded-lg p-2 mb-4 text-sm">
          <span className="text-muted-foreground">Notes: </span>
          {order.notes}
        </div>
      )}

      {/* Total */}
      <div className="flex justify-between items-center pt-3 border-t border-white/50 mb-4">
        <span className="font-medium">Total</span>
        <span className="text-xl font-bold text-gray-900">
          €{order.total.toFixed(2)}
        </span>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {config?.next && config.next !== 'collected' && (
          <Button
            onClick={() => onUpdateStatus(order.id, config.next)}
            className="flex-1 bg-gray-900 hover:bg-gray-800 text-white"
          >
            {config.nextLabel}
          </Button>
        )}
        {config?.next === 'collected' && (
          <Button
            onClick={() => onUpdateStatus(order.id, 'collected')}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
          >
            <Check className="w-4 h-4 mr-2" />
            {config.nextLabel}
          </Button>
        )}
        {order.status !== 'cancelled' && (
          <Button
            variant="outline"
            size="icon"
            onClick={() => onUpdateStatus(order.id, 'cancelled')}
            className="text-red-500 hover:text-red-600 hover:bg-red-50"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
    </motion.div>
  );
}
