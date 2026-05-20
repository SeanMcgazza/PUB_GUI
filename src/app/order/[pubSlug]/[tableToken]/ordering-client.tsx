'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { DemoMenuState, DemoOrdersState, isDemoMode } from '@/lib/demo-data';
import { themeStyleFromConfig } from '@/lib/theme';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type {
  Pub,
  Table,
  MenuCategory,
  MenuItem,
  Order,
} from '@/types/database';
import {
  Beer,
  ShoppingCart,
  Plus,
  Minus,
  X,
  Check,
  Clock,
  ChefHat,
  Bell,
  Loader2,
  Wine,
  Coffee,
  UtensilsCrossed,
  GlassWater,
  RefreshCw,
} from 'lucide-react';

// ============================================================================
// Types & helpers
// ============================================================================

interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  notes?: string;
}

// Minimum order value to send to the bar. Below this, the Place Order button
// is disabled and a hint is shown in the cart sheet. Per Q1.3 sign-off.
const MIN_ORDER_VALUE = 5;

interface Props {
  pub: Pub;
  table: Table;
  categories: MenuCategory[];
  menuItems: MenuItem[];
  sessionToken: string;
}

const categoryIcons: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  'draught beer': Beer,
  'bottled beer': Beer,
  beer: Beer,
  wine: Wine,
  spirits: GlassWater,
  cocktails: GlassWater,
  'soft drinks': Coffee,
  food: UtensilsCrossed,
};

function getCategoryIcon(name: string) {
  const key = name.toLowerCase();
  for (const [pattern, Icon] of Object.entries(categoryIcons)) {
    if (key.includes(pattern)) return Icon;
  }
  return Beer;
}

// Per-category background gradient for menu-card image areas. Gives each
// category a distinct mood even before real photos are uploaded.
function getCategoryGradient(name: string): string {
  const key = name.toLowerCase();
  if (key.includes('draught') || key.includes('beer'))
    return 'radial-gradient(ellipse at 30% 20%, #6B3A0E 0%, #1C1F26 70%)';
  if (key.includes('wine'))
    return 'radial-gradient(ellipse at 30% 20%, #5B1A2C 0%, #1C1F26 70%)';
  if (key.includes('spirit') || key.includes('whisk'))
    return 'radial-gradient(ellipse at 30% 20%, #7A4F1E 0%, #1C1F26 70%)';
  if (
    key.includes('soft') ||
    key.includes('cola') ||
    key.includes('water') ||
    key.includes('coffee')
  )
    return 'radial-gradient(ellipse at 30% 20%, #1E3A5F 0%, #1C1F26 70%)';
  if (
    key.includes('food') ||
    key.includes('snack') ||
    key.includes('fries') ||
    key.includes('burger') ||
    key.includes('chicken')
  )
    return 'radial-gradient(ellipse at 30% 20%, #6B2810 0%, #1C1F26 70%)';
  return 'radial-gradient(ellipse at 30% 20%, var(--theme-primary-deep) 0%, var(--theme-surface-card) 70%)';
}

// Reads a per-pub theme override stored in pub.settings.theme. Falls back to
// the default tokens defined in globals.css.
function getPubTheme(pub: Pub) {
  const settings = (pub.settings ?? {}) as Record<string, unknown>;
  return themeStyleFromConfig(
    (settings.theme ?? null) as Parameters<typeof themeStyleFromConfig>[0]
  );
}

// ============================================================================
// Top-level component
// ============================================================================

export function OrderingClient({
  pub,
  table,
  categories,
  menuItems: initialMenuItems,
  sessionToken,
}: Props) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [orderNotes, setOrderNotes] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(initialMenuItems);
  const categoryRefs = useRef<Record<string, HTMLElement | null>>({});
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createClient() as any;

  const themeStyle = getPubTheme(pub);

  // Demo: load menu from localStorage and subscribe to cross-tab updates.
  useEffect(() => {
    if (isDemoMode()) {
      setMenuItems(DemoMenuState.getItems() as unknown as MenuItem[]);
      const unsubscribe = DemoMenuState.subscribe((updatedItems) => {
        setMenuItems(updatedItems as unknown as MenuItem[]);
      });
      return unsubscribe;
    }
  }, []);

  // Initial active category.
  useEffect(() => {
    if (categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0].id);
    }
  }, [categories, activeCategory]);

  const refreshMenu = () => {
    if (isDemoMode()) {
      setMenuItems(DemoMenuState.getItems() as unknown as MenuItem[]);
    }
  };

  // Persist a session cookie so the customer can be matched to their order
  // on the bar's side. 2-hour TTL.
  useEffect(() => {
    document.cookie = `bartab_session=${sessionToken}; path=/; max-age=${2 * 60 * 60}; SameSite=Lax`;
  }, [sessionToken]);

  // Restore an in-flight order if the user reloads. Real-Supabase only —
  // demo mode regenerates session_token per server render, so we'd find
  // nothing useful.
  useEffect(() => {
    if (isDemoMode()) return;
    const checkExistingOrder = async () => {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('session_token', sessionToken)
        .eq('pub_id', pub.id)
        .in('status', ['pending', 'accepted', 'preparing', 'ready'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      if (data) setActiveOrder(data);
    };
    checkExistingOrder();
  }, [sessionToken, pub.id, supabase]);

  // Order status realtime — demo via localStorage events, prod via Supabase
  // postgres_changes channel.
  useEffect(() => {
    if (!activeOrder) return;

    if (isDemoMode()) {
      const unsub = DemoOrdersState.subscribe((all) => {
        const updated = all.find((o) => o.id === activeOrder.id);
        if (updated) setActiveOrder(updated as unknown as Order);
      });
      return unsub;
    }

    const channel = supabase
      .channel(`order-${activeOrder.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${activeOrder.id}`,
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (payload: any) => {
          setActiveOrder(payload.new as Order);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeOrder, supabase]);

  const scrollToCategory = (categoryId: string) => {
    setActiveCategory(categoryId);
    categoryRefs.current[categoryId]?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItem.id === item.id);
      if (existing) {
        return prev.map((c) =>
          c.menuItem.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [...prev, { menuItem: item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItem.id === itemId);
      if (existing && existing.quantity > 1) {
        return prev.map((c) =>
          c.menuItem.id === itemId ? { ...c, quantity: c.quantity - 1 } : c
        );
      }
      return prev.filter((c) => c.menuItem.id !== itemId);
    });
  };

  const getCartQuantity = (itemId: string) =>
    cart.find((c) => c.menuItem.id === itemId)?.quantity || 0;

  const cartTotal = cart.reduce(
    (sum, item) => sum + item.menuItem.price * item.quantity,
    0
  );
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const belowMinimum = cartTotal < MIN_ORDER_VALUE;

  const submitOrder = async () => {
    if (cart.length === 0 || belowMinimum) return;
    setSubmitting(true);
    try {
      if (isDemoMode()) {
        const order = DemoOrdersState.addOrder({
          table_id: table.id,
          table_number: table.number,
          table_name: table.name || undefined,
          items: cart.map((item) => ({
            id: item.menuItem.id,
            name: item.menuItem.name,
            price: item.menuItem.price,
            quantity: item.quantity,
            notes: item.notes,
          })),
          total: cartTotal,
          notes: orderNotes || undefined,
        });
        setActiveOrder(order as unknown as Order);
        setCart([]);
        setOrderNotes('');
        setShowCart(false);
        return;
      }

      const confirmationCode = String(
        Math.floor(1000 + Math.random() * 9000)
      );
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          pub_id: pub.id,
          table_id: table.id,
          session_token: sessionToken,
          confirmation_code: confirmationCode,
          total: cartTotal,
          notes: orderNotes || null,
        })
        .select()
        .single();
      if (orderError) throw orderError;

      const orderItems = cart.map((item) => ({
        order_id: order.id,
        menu_item_id: item.menuItem.id,
        name: item.menuItem.name,
        price: item.menuItem.price,
        quantity: item.quantity,
        notes: item.notes || null,
      }));
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);
      if (itemsError) throw itemsError;

      setActiveOrder(order);
      setCart([]);
      setOrderNotes('');
      setShowCart(false);
    } catch (err) {
      console.error('Order submission error:', err);
      alert('Failed to submit order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const availableItems = menuItems.filter((item) => item.is_available);
  const itemsByCategory = categories.map((cat) => ({
    category: cat,
    items: availableItems.filter((item) => item.category_id === cat.id),
  }));
  const uncategorizedItems = availableItems.filter((item) => !item.category_id);

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          icon: Clock,
          label: 'Waiting for confirmation',
          color: 'text-amber-300',
          bg: 'bg-amber-400/10',
        };
      case 'accepted':
        return {
          icon: Check,
          label: 'Order confirmed',
          color: 'text-blue-300',
          bg: 'bg-blue-400/10',
        };
      case 'preparing':
        return {
          icon: ChefHat,
          label: 'Being prepared',
          color: 'text-purple-300',
          bg: 'bg-purple-400/10',
        };
      case 'ready':
        return {
          icon: Bell,
          label: 'Ready for collection!',
          color: 'text-emerald-300',
          bg: 'bg-emerald-400/10',
        };
      case 'cancelled':
        return {
          icon: X,
          label: 'Order cancelled',
          color: 'text-red-300',
          bg: 'bg-red-400/10',
        };
      default:
        return {
          icon: Clock,
          label: status,
          color: 'text-gray-300',
          bg: 'bg-gray-400/10',
        };
    }
  };

  // ==========================================================================
  // STATUS SCREEN — shown when there's an active order
  // ==========================================================================
  if (
    activeOrder &&
    ['pending', 'accepted', 'preparing', 'ready', 'cancelled'].includes(
      activeOrder.status
    )
  ) {
    const statusInfo = getStatusInfo(activeOrder.status);
    const StatusIcon = statusInfo.icon;

    return (
      <div
        className="min-h-screen bg-atmosphere"
        style={themeStyle}
      >
        <header className="sticky top-0 glass z-10 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-gradient rounded-xl glow-primary-sm">
              <Beer className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-serif text-lg text-[color:var(--theme-text-primary)]">
                {pub.name}
              </h1>
              <p className="text-sm text-[color:var(--theme-text-muted)]">
                Table {table.number}
                {table.name ? ` · ${table.name}` : ''}
              </p>
            </div>
          </div>
        </header>

        <div className="p-4 max-w-md mx-auto pt-12">
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="glass-strong rounded-3xl p-8 text-center shadow-pub-lg"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className={cn(
                'w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 border-glass-strong',
                statusInfo.bg
              )}
            >
              <StatusIcon className={cn('w-12 h-12', statusInfo.color)} />
            </motion.div>

            <h2 className="font-serif text-3xl mb-2 text-[color:var(--theme-text-primary)]">
              Order{' '}
              <span className="text-gradient-primary">
                #{activeOrder.confirmation_code}
              </span>
            </h2>

            <p className={cn('text-xl mb-6', statusInfo.color)}>
              {statusInfo.label}
            </p>

            {activeOrder.status === 'ready' && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="rounded-2xl p-5 mb-6 border-glass-strong"
                style={{
                  background:
                    'color-mix(in oklab, var(--theme-success) 15%, transparent)',
                }}
              >
                <p className="text-emerald-300 font-medium text-lg">
                  🎉 Your order is ready!
                  <br />
                  Please collect from the bar.
                </p>
              </motion.div>
            )}

            {activeOrder.status === 'cancelled' && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="rounded-2xl p-5 mb-6 border-glass-strong"
                style={{
                  background:
                    'color-mix(in oklab, var(--theme-danger) 12%, transparent)',
                }}
              >
                <p className="text-red-300 font-medium text-lg mb-2">
                  Sorry — your order was cancelled by the bar.
                </p>
                {activeOrder.cancel_reason && (
                  <p className="text-sm text-[color:var(--theme-text-primary)] opacity-90">
                    <span className="opacity-70">Reason:</span>{' '}
                    {activeOrder.cancel_reason}
                  </p>
                )}
                <p className="text-xs text-[color:var(--theme-text-muted)] mt-3">
                  No charge — you can order again or speak to staff.
                </p>
              </motion.div>
            )}

            <div className="rounded-2xl p-5 mb-6 border-glass bg-[color:var(--theme-surface-card)]/60">
              <p className="text-sm text-[color:var(--theme-text-muted)] mb-1">
                Order Total
              </p>
              <p className="font-serif text-4xl text-gradient-primary">
                €{activeOrder.total.toFixed(2)}
              </p>
            </div>

            <Button
              onClick={() => setActiveOrder(null)}
              className="w-full border-glass-strong text-[color:var(--theme-text-primary)] py-6 text-lg rounded-2xl bg-[color:var(--theme-surface-card)]/60 hover:bg-[color:var(--theme-surface-card-hover)]"
            >
              {activeOrder.status === 'cancelled'
                ? 'Try Again'
                : 'Order More Drinks'}
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // MENU SCREEN
  // ==========================================================================
  return (
    <div
      className="min-h-screen bg-atmosphere pb-32"
      style={themeStyle}
    >
      {/* Hero header — atmospheric pub backdrop with serif pub name.
          Constrained to phone width on desktop. */}
      <header className="relative h-64 overflow-hidden max-w-md mx-auto">
        {/* Background image — uses pub.logo_url if available, otherwise the
            atmospheric gradient defined in globals.css */}
        <div
          className="absolute inset-0 bg-atmosphere"
          style={
            pub.logo_url
              ? {
                  backgroundImage: `linear-gradient(180deg, rgba(15,17,21,0.4) 0%, rgba(15,17,21,0.95) 100%), url(${pub.logo_url})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }
              : undefined
          }
          aria-hidden
        />
        {/* Floating gold table-number pill (top-right) */}
        <div className="absolute top-5 right-4 z-10">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass border-glass-strong rounded-full px-4 py-2 flex items-center gap-2 shadow-pub"
            aria-label={`Table ${table.number}`}
          >
            <span className="text-xs uppercase tracking-widest text-[color:var(--theme-text-muted)]">
              Table{' '}
            </span>
            <span className="font-serif text-lg text-gradient-primary">
              {table.number}
            </span>
          </motion.div>
        </div>

        {/* Refresh button — only useful in demo mode */}
        {isDemoMode() && (
          <button
            onClick={refreshMenu}
            aria-label="Refresh menu"
            className="absolute top-5 left-4 z-10 glass border-glass rounded-full p-2.5 hover:bg-[color:var(--theme-surface-card-hover)]/60 transition"
          >
            <RefreshCw className="w-4 h-4 text-[color:var(--theme-text-muted)]" />
          </button>
        )}

        {/* Pub name centered, serif, big */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="absolute inset-0 flex flex-col items-center justify-end pb-8 px-4 z-[1]"
        >
          <h1 className="font-serif text-4xl md:text-5xl text-center text-white drop-shadow-lg">
            {pub.name}
          </h1>
          <h2 className="mt-2 text-sm tracking-widest uppercase font-normal text-[color:var(--theme-text-muted)]">
            What are you having?
          </h2>
        </motion.div>
      </header>

      {/* Menu — 2-column grid with image area + price pill.
          Constrained to phone width on desktop so the design stays mobile-first. */}
      <div className="px-3 pt-5 max-w-md mx-auto">
        {itemsByCategory.map(({ category, items }) => {
          if (items.length === 0) return null;
          const Icon = getCategoryIcon(category.name);
          const gradient = getCategoryGradient(category.name);
          return (
            <section
              key={category.id}
              ref={(el) => {
                categoryRefs.current[category.id] = el;
              }}
              className="scroll-mt-24 mb-8"
            >
              <div className="flex items-center gap-3 mb-3 px-1">
                <div className="p-1.5 rounded-lg border-glass bg-[color:var(--theme-surface-card)]/60">
                  <Icon className="w-4 h-4 text-[color:var(--theme-primary-glow)]" />
                </div>
                <h2 className="font-serif text-xl text-[color:var(--theme-text-primary)]">
                  {category.name}
                </h2>
                <div className="flex-1 h-px bg-gradient-to-r from-[color:var(--theme-border-glass)] to-transparent" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {items.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    // Stagger only the first 4 cards in a category, capped
                    // so the whole menu is visible within ~250ms.
                    transition={{
                      duration: 0.18,
                      delay: Math.min(index, 4) * 0.03,
                    }}
                  >
                    <MenuItemCard
                      item={item}
                      Icon={Icon}
                      gradient={gradient}
                      quantity={getCartQuantity(item.id)}
                      onAdd={() => addToCart(item)}
                      onRemove={() => removeFromCart(item.id)}
                    />
                  </motion.div>
                ))}
              </div>
            </section>
          );
        })}

        {uncategorizedItems.length > 0 && (
          <section>
            <h2 className="font-serif text-xl mb-3 px-1 text-[color:var(--theme-text-primary)]">
              Other
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {uncategorizedItems.map((item) => (
                <MenuItemCard
                  key={item.id}
                  item={item}
                  Icon={Beer}
                  gradient={getCategoryGradient('other')}
                  quantity={getCartQuantity(item.id)}
                  onAdd={() => addToCart(item)}
                  onRemove={() => removeFromCart(item.id)}
                />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Bottom-floating category dock */}
      <CategoryDock
        categories={categories}
        activeCategory={activeCategory}
        onSelect={scrollToCategory}
        cartCount={cartCount}
        cartTotal={cartTotal}
        onOpenCart={() => setShowCart(true)}
      />

      {/* Cart sheet */}
      <AnimatePresence>
        {showCart && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
              onClick={() => setShowCart(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="fixed bottom-0 left-0 right-0 glass-strong rounded-t-3xl z-50 max-h-[85vh] overflow-hidden flex flex-col"
              style={themeStyle}
            >
              <div className="p-5 border-b border-glass flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary-gradient rounded-xl">
                    <ShoppingCart className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="font-serif text-xl text-[color:var(--theme-text-primary)]">
                    Your Order
                  </h2>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowCart(false)}
                  className="text-[color:var(--theme-text-muted)] hover:bg-[color:var(--theme-surface-card-hover)]"
                  aria-label="Close cart"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="flex-1 overflow-auto p-4 space-y-3 scrollbar-dark">
                {cart.map((item) => (
                  <motion.div
                    key={item.menuItem.id}
                    layout
                    className="flex items-center justify-between rounded-2xl p-4 border-glass bg-[color:var(--theme-surface-card)]"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-[color:var(--theme-text-primary)]">
                        {item.menuItem.name}
                      </p>
                      <p className="text-sm text-[color:var(--theme-text-muted)]">
                        €{item.menuItem.price.toFixed(2)} each
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Decrease ${item.menuItem.name} quantity`}
                        className="h-9 w-9 rounded-xl border-glass bg-[color:var(--theme-surface-base)]"
                        onClick={() => removeFromCart(item.menuItem.id)}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="w-6 text-center font-bold text-lg text-[color:var(--theme-text-primary)]">
                        {item.quantity}
                      </span>
                      <Button
                        size="icon"
                        aria-label={`Increase ${item.menuItem.name} quantity`}
                        className="h-9 w-9 rounded-xl bg-primary-gradient text-white"
                        onClick={() => addToCart(item.menuItem)}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}

                <div className="pt-2">
                  <label className="block text-sm font-medium text-[color:var(--theme-text-muted)] mb-2">
                    Notes for bar staff (optional)
                  </label>
                  <textarea
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    placeholder="Any special requests..."
                    className="w-full p-4 rounded-2xl resize-none h-20 border-glass bg-[color:var(--theme-surface-card)] text-[color:var(--theme-text-primary)] placeholder:text-[color:var(--theme-text-subtle)] focus:outline-none focus:border-[color:var(--theme-primary)]/50"
                  />
                </div>
              </div>

              <div className="p-5 border-t border-glass">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-lg text-[color:var(--theme-text-muted)]">
                    Total
                  </span>
                  <span className="font-serif text-3xl text-gradient-primary">
                    €{cartTotal.toFixed(2)}
                  </span>
                </div>
                {belowMinimum && cart.length > 0 && (
                  <p className="text-sm text-[color:var(--theme-warn)] mb-3 text-center">
                    Minimum order €{MIN_ORDER_VALUE.toFixed(2)} — add €
                    {(MIN_ORDER_VALUE - cartTotal).toFixed(2)} more to place order
                  </p>
                )}
                <Button
                  onClick={submitOrder}
                  disabled={submitting || cart.length === 0 || belowMinimum}
                  className="w-full bg-primary-gradient hover:opacity-90 text-white py-6 text-lg font-semibold rounded-2xl glow-primary disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Placing Order...
                    </>
                  ) : (
                    'Place Order'
                  )}
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// MenuItemCard — 2-column grid card with image area, gold price pill, and a
// floating + button that morphs into a -1+ counter.
// ============================================================================
function MenuItemCard({
  item,
  Icon,
  gradient,
  quantity,
  onAdd,
  onRemove,
}: {
  item: MenuItem;
  Icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  quantity: number;
  onAdd: () => void;
  onRemove: () => void;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const showImage = item.image_url && !imgFailed;

  return (
    <motion.div
      layout
      className={cn(
        'relative overflow-hidden rounded-2xl border-glass transition-all',
        'bg-[color:var(--theme-surface-card)]',
        quantity > 0 && 'glow-primary-sm'
      )}
      style={
        quantity > 0
          ? {
              borderColor:
                'color-mix(in oklab, var(--theme-primary) 60%, transparent)',
            }
          : undefined
      }
    >
      {/* Image area — uses item.image_url if set, otherwise a per-category
          gradient with the item name in serif and a large watermark icon.
          Top 60% of card. */}
      <div className="relative aspect-[4/3] overflow-hidden">
        {showImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.image_url ?? ''}
            alt={item.name}
            onError={() => setImgFailed(true)}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div
            className="absolute inset-0 flex flex-col"
            style={{ background: gradient }}
          >
            {/* Item name overlay — serif, top-left, treated like a label */}
            <div className="px-3 pt-3 pb-1 z-10">
              <p className="font-serif text-[color:var(--theme-text-primary)] text-sm leading-tight line-clamp-2 drop-shadow">
                {item.name}
              </p>
            </div>
            {/* Big watermark icon centered, low opacity */}
            <div className="flex-1 flex items-center justify-center">
              <Icon className="w-16 h-16 text-[color:var(--theme-primary-glow)]/35" />
            </div>
            {/* Subtle bottom shimmer for depth */}
            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/40 to-transparent" />
          </div>
        )}

        {/* Bottom gradient under the price pill — only for image cards */}
        {showImage && (
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/70 to-transparent" />
        )}

        {/* Gold price pill (bottom-left) */}
        <div className="absolute bottom-2 left-2 bg-primary-gradient text-white px-3 py-1 rounded-full text-sm font-semibold shadow-pub">
          €{item.price.toFixed(2)}
        </div>

        {/* Floating add control (bottom-right) — morphs to counter */}
        <div className="absolute bottom-2 right-2">
          <AnimatePresence mode="wait" initial={false}>
            {quantity === 0 ? (
              <motion.button
                key="add"
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.6, opacity: 0 }}
                whileTap={{ scale: 0.9 }}
                onClick={onAdd}
                aria-label={`Add ${item.name} to cart`}
                className="bg-primary-gradient text-white h-10 w-10 rounded-full flex items-center justify-center glow-primary-sm shadow-pub"
              >
                <Plus className="w-5 h-5" />
              </motion.button>
            ) : (
              <motion.div
                key="counter"
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.6, opacity: 0 }}
                className="flex items-center gap-1 glass-strong rounded-full p-1 shadow-pub"
              >
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={onRemove}
                  aria-label={`Remove one ${item.name}`}
                  className="h-8 w-8 rounded-full flex items-center justify-center bg-[color:var(--theme-surface-card)] text-[color:var(--theme-text-primary)]"
                >
                  <Minus className="w-3.5 h-3.5" />
                </motion.button>
                <span className="min-w-[20px] text-center text-sm font-bold text-[color:var(--theme-text-primary)]">
                  {quantity}
                </span>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={onAdd}
                  aria-label={`Add another ${item.name}`}
                  className="h-8 w-8 rounded-full flex items-center justify-center bg-primary-gradient text-white"
                >
                  <Plus className="w-3.5 h-3.5" />
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Content area — name + truncated description */}
      <div className="p-3">
        <h3 className="font-medium text-[color:var(--theme-text-primary)] leading-tight line-clamp-1">
          {item.name}
        </h3>
        {item.description && (
          <p className="text-xs text-[color:var(--theme-text-muted)] line-clamp-2 mt-1">
            {item.description}
          </p>
        )}
      </div>
    </motion.div>
  );
}

// ============================================================================
// CategoryDock — bottom-floating iOS-style dock for category navigation.
// When the cart has items it grows a "View Order" CTA on the right side.
// ============================================================================
function CategoryDock({
  categories,
  activeCategory,
  onSelect,
  cartCount,
  cartTotal,
  onOpenCart,
}: {
  categories: MenuCategory[];
  activeCategory: string | null;
  onSelect: (categoryId: string) => void;
  cartCount: number;
  cartTotal: number;
  onOpenCart: () => void;
}) {
  // When the cart has items, the cart pill takes priority. Hide the inactive
  // category icons on narrow screens so the cart label can fit; on wider
  // screens we can show both. The active category chip stays put either way.
  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 px-3 pb-3 pt-6 bg-gradient-to-t from-black/90 via-black/60 to-transparent pointer-events-none">
      <div className="max-w-md mx-auto pointer-events-auto">
        <div className="glass-strong rounded-full p-1.5 flex items-center gap-1 shadow-pub-lg">
          {/* Category chips. Inactive ones collapse on small screens
              when cart is open to make room for the cart pill. */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide flex-1 min-w-0">
            {categories.map((cat) => {
              const Icon = getCategoryIcon(cat.name);
              const isActive = activeCategory === cat.id;
              const hideOnNarrowWithCart = !isActive && cartCount > 0;
              return (
                <motion.button
                  key={cat.id}
                  layout
                  onClick={() => onSelect(cat.id)}
                  whileTap={{ scale: 0.94 }}
                  aria-label={`Jump to ${cat.name}`}
                  className={cn(
                    'flex items-center gap-2 rounded-full whitespace-nowrap transition-colors shrink-0',
                    isActive
                      ? 'bg-primary-gradient text-white px-3 py-2 glow-primary-sm'
                      : 'p-2.5 text-[color:var(--theme-text-muted)] hover:bg-[color:var(--theme-surface-card-hover)]/40',
                    hideOnNarrowWithCart && 'hidden sm:flex'
                  )}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <AnimatePresence>
                    {isActive && (
                      <motion.span
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 'auto', opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        className="text-sm font-medium overflow-hidden whitespace-nowrap max-w-[6.5rem] truncate"
                      >
                        {cat.name}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              );
            })}
          </div>

          {/* Cart pill — compact label on narrow screens, full text on wider. */}
          <AnimatePresence>
            {cartCount > 0 && (
              <motion.button
                initial={{ scale: 0.6, opacity: 0, width: 0 }}
                animate={{ scale: 1, opacity: 1, width: 'auto' }}
                exit={{ scale: 0.6, opacity: 0, width: 0 }}
                whileTap={{ scale: 0.96 }}
                onClick={onOpenCart}
                aria-label={`View order, ${cartCount} items, €${cartTotal.toFixed(2)}`}
                className="flex items-center gap-2 bg-primary-gradient text-white rounded-full px-3 sm:px-4 py-2.5 ml-1 glow-primary shrink-0"
              >
                <ShoppingCart className="w-4 h-4 shrink-0" />
                <span className="text-sm font-semibold whitespace-nowrap">
                  <span className="sm:hidden tabular-nums">
                    {cartCount} · €{cartTotal.toFixed(2)}
                  </span>
                  <span className="hidden sm:inline tabular-nums">
                    View Order ({cartCount}) €{cartTotal.toFixed(2)}
                  </span>
                </span>
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
