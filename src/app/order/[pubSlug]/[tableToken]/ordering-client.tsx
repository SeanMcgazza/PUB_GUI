'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { DemoMenuState, DemoOrdersState, isDemoMode } from '@/lib/demo-data';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Pub, Table, MenuCategory, MenuItem, Order } from '@/types/database';
import { 
  Beer, ShoppingCart, Plus, Minus, X, Check, 
  Clock, ChefHat, Bell, Loader2, Sparkles,
  Wine, Coffee, UtensilsCrossed, GlassWater, RefreshCw
} from 'lucide-react';

interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  notes?: string;
}

interface Props {
  pub: Pub;
  table: Table;
  categories: MenuCategory[];
  menuItems: MenuItem[];
  sessionToken: string;
}

// Category icons mapping
const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  'draught beer': Beer,
  'bottled beer': Beer,
  'beer': Beer,
  'wine': Wine,
  'spirits': GlassWater,
  'cocktails': GlassWater,
  'soft drinks': Coffee,
  'food': UtensilsCrossed,
};

function getCategoryIcon(name: string) {
  const key = name.toLowerCase();
  for (const [pattern, Icon] of Object.entries(categoryIcons)) {
    if (key.includes(pattern)) return Icon;
  }
  return Beer;
}

export function OrderingClient({ pub, table, categories, menuItems: initialMenuItems, sessionToken }: Props) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [orderNotes, setOrderNotes] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(initialMenuItems);
  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createClient() as any;

  // Load menu from localStorage in demo mode and subscribe to updates
  useEffect(() => {
    if (isDemoMode()) {
      // Initial load from localStorage
      const storedItems = DemoMenuState.getItems();
      setMenuItems(storedItems as unknown as MenuItem[]);
      
      // Subscribe to updates (cross-tab sync)
      const unsubscribe = DemoMenuState.subscribe((updatedItems) => {
        setMenuItems(updatedItems as unknown as MenuItem[]);
      });
      
      return unsubscribe;
    }
  }, []);

  // Set initial active category
  useEffect(() => {
    if (categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0].id);
    }
  }, [categories, activeCategory]);

  // Refresh menu data
  const refreshMenu = () => {
    if (isDemoMode()) {
      const storedItems = DemoMenuState.getItems();
      setMenuItems(storedItems as unknown as MenuItem[]);
    }
  };

  // Set session cookie
  useEffect(() => {
    document.cookie = `bartab_session=${sessionToken}; path=/; max-age=${2 * 60 * 60}; SameSite=Lax`;
  }, [sessionToken]);

  // Check for existing active order
  useEffect(() => {
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

      if (data) {
        setActiveOrder(data);
      }
    };

    checkExistingOrder();
  }, [sessionToken, pub.id, supabase]);

  // Subscribe to order updates (demo: localStorage events; production: Supabase realtime)
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
    categoryRefs.current[categoryId]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

  const getCartQuantity = (itemId: string) => {
    return cart.find((c) => c.menuItem.id === itemId)?.quantity || 0;
  };

  const cartTotal = cart.reduce(
    (sum, item) => sum + item.menuItem.price * item.quantity,
    0
  );

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const submitOrder = async () => {
    if (cart.length === 0) return;
    
    setSubmitting(true);
    try {
      // Demo mode - use DemoOrdersState
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
        setSubmitting(false);
        return;
      }

      // Production mode - use Supabase
      const confirmationCode = String(Math.floor(1000 + Math.random() * 9000));

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

  // Filter to only available items and group by category
  const availableItems = menuItems.filter((item) => item.is_available);
  
  const itemsByCategory = categories.map((cat) => ({
    category: cat,
    items: availableItems.filter((item) => item.category_id === cat.id),
  }));

  const uncategorizedItems = availableItems.filter((item) => !item.category_id);

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return { icon: Clock, label: 'Waiting for confirmation', color: 'text-amber-400', bg: 'bg-amber-400/20' };
      case 'accepted':
        return { icon: Check, label: 'Order confirmed', color: 'text-blue-400', bg: 'bg-blue-400/20' };
      case 'preparing':
        return { icon: ChefHat, label: 'Being prepared', color: 'text-purple-400', bg: 'bg-purple-400/20' };
      case 'ready':
        return { icon: Bell, label: 'Ready for collection!', color: 'text-green-400', bg: 'bg-green-400/20' };
      default:
        return { icon: Clock, label: status, color: 'text-gray-400', bg: 'bg-gray-400/20' };
    }
  };

  // Show active order status
  if (activeOrder && ['pending', 'accepted', 'preparing', 'ready'].includes(activeOrder.status)) {
    const statusInfo = getStatusInfo(activeOrder.status);
    const StatusIcon = statusInfo.icon;

    return (
      <div className="min-h-screen bg-pub-black">
        {/* Header */}
        <header className="sticky top-0 bg-pub-dark/90 backdrop-blur-xl border-b border-white/5 px-4 py-4 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-gradient rounded-xl glow-amber-sm">
              <Beer className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-cream text-lg">{pub.name}</h1>
              <p className="text-sm text-cream/60">Table {table.number}{table.name ? ` · ${table.name}` : ''}</p>
            </div>
          </div>
        </header>

        <div className="p-4 max-w-md mx-auto pt-8">
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="bg-pub-card rounded-3xl shadow-pub-lg p-8 text-center border border-white/5"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className={cn(
                "w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6",
                statusInfo.bg
              )}
            >
              <StatusIcon className={cn("w-12 h-12", statusInfo.color)} />
            </motion.div>

            <h2 className="text-3xl font-bold text-cream mb-2">
              Order <span className="text-gradient-amber">#{activeOrder.confirmation_code}</span>
            </h2>

            <p className={cn("text-xl font-medium mb-6", statusInfo.color)}>
              {statusInfo.label}
            </p>

            {activeOrder.status === 'ready' && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-green-500/10 border border-green-500/30 rounded-2xl p-5 mb-6"
              >
                <p className="text-green-400 font-medium text-lg">
                  🎉 Your order is ready!<br />Please collect from the bar.
                </p>
              </motion.div>
            )}

            <div className="bg-pub-dark rounded-2xl p-5 mb-6 border border-white/5">
              <p className="text-sm text-cream/60 mb-1">Order Total</p>
              <p className="text-4xl font-bold text-gradient-amber">
                €{activeOrder.total.toFixed(2)}
              </p>
            </div>

            <Button
              onClick={() => setActiveOrder(null)}
              className="w-full bg-pub-card hover:bg-pub-card-hover border border-white/10 text-cream py-6 text-lg rounded-2xl"
            >
              Order More Drinks
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pub-black pb-28">
      {/* Header */}
      <header className="sticky top-0 bg-pub-dark/90 backdrop-blur-xl border-b border-white/5 px-4 py-4 z-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-gradient rounded-xl glow-amber-sm">
              <Beer className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-cream text-lg">{pub.name}</h1>
              <p className="text-sm text-cream/60">Table {table.number}{table.name ? ` · ${table.name}` : ''}</p>
            </div>
          </div>
          {cartCount > 0 && (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCart(true)}
              className="relative p-3 bg-amber-gradient rounded-2xl glow-amber"
            >
              <ShoppingCart className="w-5 h-5 text-white" />
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-white text-pub-black text-xs font-bold rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            </motion.button>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <div className="px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-amber-600/20 to-amber-900/20 rounded-3xl p-6 border border-amber-500/20"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <span className="text-amber-400 font-medium">Order from your table</span>
            </div>
            {isDemoMode() && (
              <button 
                onClick={refreshMenu}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                title="Refresh menu"
              >
                <RefreshCw className="w-4 h-4 text-amber-400" />
              </button>
            )}
          </div>
          <h2 className="text-2xl font-bold text-cream mb-1">
            What are you having?
          </h2>
          <p className="text-cream/60">
            Browse our menu and order directly. No queue, no wait.
          </p>
        </motion.div>
      </div>

      {/* Category Tabs */}
      <div className="sticky top-[73px] z-10 bg-pub-black/95 backdrop-blur-lg border-b border-white/5">
        <div className="flex overflow-x-auto scrollbar-hide px-4 py-3 gap-2">
          {categories.map((cat) => {
            const Icon = getCategoryIcon(cat.name);
            const isActive = activeCategory === cat.id;
            return (
              <motion.button
                key={cat.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => scrollToCategory(cat.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-full whitespace-nowrap transition-all font-medium text-sm",
                  isActive 
                    ? "bg-amber-gradient text-white glow-amber-sm" 
                    : "bg-pub-card text-cream/70 hover:bg-pub-card-hover hover:text-cream border border-white/5"
                )}
              >
                <Icon className="w-4 h-4" />
                {cat.name}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Menu */}
      <div className="px-4 py-4 space-y-8">
        {itemsByCategory.map(({ category, items }) => {
          if (items.length === 0) return null;
          const Icon = getCategoryIcon(category.name);
          return (
            <div 
              key={category.id}
              ref={(el) => { categoryRefs.current[category.id] = el; }}
              className="scroll-mt-36"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-pub-card rounded-xl border border-white/5">
                  <Icon className="w-5 h-5 text-amber-400" />
                </div>
                <h2 className="text-xl font-bold text-cream">
                  {category.name}
                </h2>
                <div className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent" />
              </div>
              <div className="grid gap-3">
                {items.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <MenuItemCard
                      item={item}
                      quantity={getCartQuantity(item.id)}
                      onAdd={() => addToCart(item)}
                      onRemove={() => removeFromCart(item.id)}
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          );
        })}

        {uncategorizedItems.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-pub-card rounded-xl border border-white/5">
                <Beer className="w-5 h-5 text-amber-400" />
              </div>
              <h2 className="text-xl font-bold text-cream">Other</h2>
              <div className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent" />
            </div>
            <div className="grid gap-3">
              {uncategorizedItems.map((item) => (
                <MenuItemCard
                  key={item.id}
                  item={item}
                  quantity={getCartQuantity(item.id)}
                  onAdd={() => addToCart(item)}
                  onRemove={() => removeFromCart(item.id)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Floating Cart Button */}
      <AnimatePresence>
        {cartCount > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-pub-black via-pub-black to-transparent pt-8"
          >
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowCart(true)}
              className="w-full bg-amber-gradient text-white py-5 px-6 rounded-2xl font-bold text-lg flex items-center justify-between glow-amber animate-pulse-glow"
            >
              <div className="flex items-center gap-3">
                <div className="bg-white/20 rounded-xl p-2">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <span>View Order ({cartCount} items)</span>
              </div>
              <span className="text-xl">€{cartTotal.toFixed(2)}</span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart Sheet */}
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
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-pub-dark rounded-t-3xl z-50 max-h-[85vh] overflow-hidden flex flex-col border-t border-white/10"
            >
              {/* Cart Header */}
              <div className="p-5 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-gradient rounded-xl">
                    <ShoppingCart className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-cream">Your Order</h2>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowCart(false)}
                  className="text-cream/60 hover:text-cream hover:bg-white/5"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Cart Items */}
              <div className="flex-1 overflow-auto p-4 space-y-3 scrollbar-dark">
                {cart.map((item) => (
                  <motion.div
                    key={item.menuItem.id}
                    layout
                    className="flex items-center justify-between bg-pub-card rounded-2xl p-4 border border-white/5"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-cream">{item.menuItem.name}</p>
                      <p className="text-sm text-cream/50">
                        €{item.menuItem.price.toFixed(2)} each
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Decrease ${item.menuItem.name} quantity`}
                        className="h-9 w-9 rounded-xl bg-pub-dark hover:bg-pub-black text-cream border border-white/10"
                        onClick={() => removeFromCart(item.menuItem.id)}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="w-6 text-center font-bold text-cream text-lg">
                        {item.quantity}
                      </span>
                      <Button
                        size="icon"
                        aria-label={`Increase ${item.menuItem.name} quantity`}
                        className="h-9 w-9 rounded-xl bg-amber-gradient text-white"
                        onClick={() => addToCart(item.menuItem)}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}

                {/* Notes */}
                <div className="pt-2">
                  <label className="block text-sm font-medium text-cream/70 mb-2">
                    Notes for bar staff (optional)
                  </label>
                  <textarea
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    placeholder="Any special requests..."
                    className="w-full p-4 bg-pub-card border border-white/10 rounded-2xl resize-none h-20 text-cream placeholder:text-cream/30 focus:outline-none focus:border-amber-500/50"
                  />
                </div>
              </div>

              {/* Cart Footer */}
              <div className="p-5 border-t border-white/5 bg-pub-dark">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg text-cream/70">Total</span>
                  <span className="text-3xl font-bold text-gradient-amber">
                    €{cartTotal.toFixed(2)}
                  </span>
                </div>
                <Button
                  onClick={submitOrder}
                  disabled={submitting || cart.length === 0}
                  className="w-full bg-amber-gradient hover:opacity-90 text-white py-6 text-lg font-bold rounded-2xl glow-amber disabled:opacity-50"
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

function MenuItemCard({
  item,
  quantity,
  onAdd,
  onRemove,
}: {
  item: MenuItem;
  quantity: number;
  onAdd: () => void;
  onRemove: () => void;
}) {
  return (
    <motion.div
      layout
      whileTap={{ scale: 0.99 }}
      className={cn(
        "bg-pub-card rounded-2xl p-4 border transition-all",
        quantity > 0 ? "border-amber-500/50 glow-amber-sm" : "border-white/5 hover:border-white/10"
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-cream text-lg">{item.name}</h3>
          {item.description && (
            <p className="text-sm text-cream/50 line-clamp-1 mt-0.5">
              {item.description}
            </p>
          )}
          <p className="text-xl font-bold text-amber-400 mt-2">
            €{item.price.toFixed(2)}
          </p>
        </div>
        
        <div className="flex-shrink-0">
          {quantity === 0 ? (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onAdd}
              aria-label={`Add ${item.name} to cart`}
              className="bg-amber-gradient text-white h-12 w-12 rounded-xl flex items-center justify-center glow-amber-sm"
            >
              <Plus className="w-5 h-5" />
            </motion.button>
          ) : (
            <div className="flex items-center gap-2 bg-pub-dark rounded-xl p-1 border border-white/10">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={onRemove}
                aria-label={`Remove one ${item.name}`}
                className="h-10 w-10 rounded-lg bg-pub-card hover:bg-pub-card-hover text-cream flex items-center justify-center"
              >
                <Minus className="w-4 h-4" />
              </motion.button>
              <span className="w-6 text-center font-bold text-cream">{quantity}</span>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={onAdd}
                aria-label={`Add another ${item.name}`}
                className="h-10 w-10 rounded-lg bg-amber-gradient text-white flex items-center justify-center"
              >
                <Plus className="w-4 h-4" />
              </motion.button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
