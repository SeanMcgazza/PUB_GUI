'use client';

import { Fragment, useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { usePub } from '@/hooks/usePub';
import { DemoOrdersState, isDemoMode } from '@/lib/demo-data';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Order, OrderItem, Table } from '@/types/database';
import { format } from 'date-fns';
import {
  ClipboardList, Search, Filter, ChevronDown, ChevronUp
} from 'lucide-react';

type OrderWithDetails = Order & {
  order_items: OrderItem[];
  tables: Table | null;
};

export default function OrdersPage() {
  const { pub } = usePub();
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!pub) return;

    // Demo mode: read from the same localStorage source the customer
    // ordering flow writes to. Filter by status client-side.
    if (isDemoMode()) {
      const all = DemoOrdersState.getOrders();
      const filtered =
        statusFilter === 'all'
          ? all
          : all.filter((o) => o.status === statusFilter);
      setOrders(filtered as unknown as OrderWithDetails[]);
      setLoading(false);
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;
    let query = supabase
      .from('orders')
      .select(`
        *,
        order_items (*),
        tables (*)
      `)
      .eq('pub_id', pub.id)
      .order('created_at', { ascending: false })
      .limit(100);

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;

    if (!error && data) {
      setOrders(data as OrderWithDetails[]);
    }
    setLoading(false);
  }, [pub, statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Demo mode: refresh history when DemoOrdersState updates (new orders or
  // status changes from the customer/dashboard pages).
  useEffect(() => {
    if (!pub || !isDemoMode()) return;
    const unsub = DemoOrdersState.subscribe(() => {
      fetchOrders();
    });
    return unsub;
  }, [pub, fetchOrders]);

  // Record the staff ID check made at the table. Stores only the outcome +
  // timestamp on the order — no personal data. Optimistic local update, then
  // persist (owner RLS allows updating own pub's orders).
  const markIdCheck = async (
    order: OrderWithDetails,
    status: 'verified' | 'refused'
  ) => {
    const decidedAt = new Date().toISOString();
    setOrders((prev) =>
      prev.map((o) =>
        o.id === order.id
          ? { ...o, id_check_status: status, id_checked_at: decidedAt }
          : o
      )
    );
    if (isDemoMode()) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;
    await supabase
      .from('orders')
      .update({ id_check_status: status, id_checked_at: decidedAt })
      .eq('id', order.id);
  };

  const filteredOrders = orders.filter((order) => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      order.confirmation_code.toLowerCase().includes(search) ||
      order.tables?.number?.toString().includes(search) ||
      order.order_items.some((item) =>
        item.name.toLowerCase().includes(search)
      )
    );
  });

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-[color:var(--theme-surface-elevated)] text-muted-foreground',
      accepted: 'bg-blue-100 text-blue-700',
      preparing: 'bg-purple-100 text-purple-700',
      ready: 'bg-green-100 text-green-700',
      collected: 'bg-[color:var(--theme-surface-elevated)] text-muted-foreground',
      cancelled: 'bg-red-100 text-red-700',
    } as Record<string, string>;
    return styles[status] || 'bg-[color:var(--theme-surface-elevated)] text-muted-foreground';
  };

  // Calculate stats
  const stats = {
    total: orders.length,
    revenue: orders
      .filter((o) => o.status !== 'cancelled')
      .reduce((sum, o) => sum + o.total, 0),
    completed: orders.filter((o) => o.status === 'collected').length,
    cancelled: orders.filter((o) => o.status === 'cancelled').length,
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Order History</h1>
        <p className="text-muted-foreground">
          View and manage all orders
        </p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-card rounded-xl border p-4">
          <p className="text-sm text-muted-foreground">Total Orders</p>
          <p className="text-2xl font-bold text-foreground">{stats.total}</p>
        </div>
        <div className="bg-card rounded-xl border p-4">
          <p className="text-sm text-muted-foreground">Revenue</p>
          <p className="text-2xl font-bold text-green-600">€{stats.revenue.toFixed(2)}</p>
        </div>
        <div className="bg-card rounded-xl border p-4">
          <p className="text-sm text-muted-foreground">Completed</p>
          <p className="text-2xl font-bold text-foreground">{stats.completed}</p>
        </div>
        <div className="bg-card rounded-xl border p-4">
          <p className="text-sm text-muted-foreground">Cancelled</p>
          <p className="text-2xl font-bold text-red-500">{stats.cancelled}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by code, table, or item..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="preparing">Preparing</option>
            <option value="ready">Ready</option>
            <option value="collected">Collected</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">
          Loading orders...
        </div>
      ) : filteredOrders.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12 bg-card rounded-xl border"
        >
          <ClipboardList className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            No orders found
          </h3>
          <p className="text-muted-foreground">
            {searchQuery || statusFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Orders will appear here once customers place them'}
          </p>
        </motion.div>
      ) : (
        <div className="bg-card rounded-xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[color:var(--theme-surface-card-hover)]/40 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    Order
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    Table
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    Items
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    Total
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    Time
                  </th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredOrders.map((order) => (
                  <Fragment key={order.id}>
                    <tr
                      className="hover:bg-[color:var(--theme-surface-card-hover)]/40 cursor-pointer"
                      onClick={() =>
                        setExpandedOrder(
                          expandedOrder === order.id ? null : order.id
                        )
                      }
                    >
                      <td className="px-4 py-3">
                        <span className="font-mono font-bold text-foreground">
                          #{order.confirmation_code}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {order.tables?.number || '—'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {order.order_items.length} item
                        {order.order_items.length !== 1 ? 's' : ''}
                      </td>
                      <td className="px-4 py-3 font-medium">
                        €{order.total.toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'px-2 py-1 rounded-full text-xs font-medium',
                            getStatusBadge(order.status)
                          )}
                        >
                          {order.status}
                        </span>
                        {order.id_check_status === 'pending' && (
                          <span className="ml-1 inline-block px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                            🔞 Check ID
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {format(new Date(order.created_at), 'MMM d, HH:mm')}
                      </td>
                      <td className="px-4 py-3">
                        <Button variant="ghost" size="icon">
                          {expandedOrder === order.id ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </Button>
                      </td>
                    </tr>
                    {expandedOrder === order.id && (
                      <tr>
                        <td colSpan={7} className="px-4 py-4 bg-[color:var(--theme-surface-card-hover)]/40">
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-foreground">
                              Order Items:
                            </p>
                            {order.order_items.map((item) => (
                              <div
                                key={item.id}
                                className="flex justify-between text-sm"
                              >
                                <span>
                                  {item.quantity}× {item.name}
                                </span>
                                <span className="text-muted-foreground">
                                  €{(item.price * item.quantity).toFixed(2)}
                                </span>
                              </div>
                            ))}
                            {order.id_check_status !== 'not_required' && (
                              <div className="mt-2 pt-2 border-t">
                                <p className="text-sm font-medium text-amber-700">
                                  🔞 Age-restricted order — check ID at the table
                                </p>
                                {order.id_check_status === 'pending' ? (
                                  <div className="flex gap-2 mt-2">
                                    <Button
                                      size="sm"
                                      onClick={() => markIdCheck(order, 'verified')}
                                      className="bg-green-600 hover:bg-green-700 text-white"
                                    >
                                      ID checked — 18+
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => markIdCheck(order, 'refused')}
                                    >
                                      Couldn&apos;t verify
                                    </Button>
                                  </div>
                                ) : (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {order.id_check_status === 'verified'
                                      ? 'ID verified'
                                      : 'ID refused'}
                                    {order.id_checked_at &&
                                      ` · ${format(new Date(order.id_checked_at), 'HH:mm')}`}
                                  </p>
                                )}
                              </div>
                            )}
                            {order.notes && (
                              <div className="mt-2 pt-2 border-t">
                                <p className="text-sm">
                                  <span className="text-muted-foreground">Notes: </span>
                                  {order.notes}
                                </p>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
