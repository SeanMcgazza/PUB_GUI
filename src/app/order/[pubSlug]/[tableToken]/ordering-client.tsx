'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Pub, Table, MenuCategory, MenuItem, Order } from '@/types/database';
import { 
  Beer, ShoppingCart, Plus, Minus, X, Check, 
  Clock, ChefHat, Bell, Loader2
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

export function OrderingClient({ pub, table, categories, menuItems, sessionToken }: Props) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [orderNotes, setOrderNotes] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createClient() as any;

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

  // Subscribe to order updates
  useEffect(() => {
    if (!activeOrder) return;

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
      // Generate 4-digit confirmation code
      const confirmationCode = String(Math.floor(1000 + Math.random() * 9000));

      // Create order
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

      // Create order items
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

  // Group menu items by category
  const itemsByCategory = categories.map((cat) => ({
    category: cat,
    items: menuItems.filter((item) => item.category_id === cat.id),
  }));

  // Items without category
  const uncategorizedItems = menuItems.filter((item) => !item.category_id);

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return { icon: Clock, label: 'Waiting for confirmation', color: 'text-amber-500' };
      case 'accepted':
        return { icon: Check, label: 'Order confirmed', color: 'text-blue-500' };
      case 'preparing':
        return { icon: ChefHat, label: 'Being prepared', color: 'text-purple-500' };
      case 'ready':
        return { icon: Bell, label: 'Ready for collection!', color: 'text-green-500' };
      default:
        return { icon: Clock, label: status, color: 'text-gray-500' };
    }
  };

  // Show active order status
  if (activeOrder && ['pending', 'accepted', 'preparing', 'ready'].includes(activeOrder.status)) {
    const statusInfo = getStatusInfo(activeOrder.status);
    const StatusIcon = statusInfo.icon;

    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
        <header className="sticky top-0 bg-white/80 backdrop-blur-lg border-b px-4 py-3 z-10">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-600 rounded-lg">
              <Beer className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-warm-brown">{pub.name}</h1>
              <p className="text-xs text-muted-foreground">Table {table.number}{table.name ? ` - ${table.name}` : ''}</p>
            </div>
          </div>
        </header>

        <div className="p-4 max-w-md mx-auto">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl shadow-lg p-6 text-center"
          >
            <div className={cn(
              "w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4",
              activeOrder.status === 'ready' ? 'bg-green-100' : 'bg-amber-100'
            )}>
              <StatusIcon className={cn("w-10 h-10", statusInfo.color)} />
            </div>

            <h2 className="text-2xl font-bold text-warm-brown mb-2">
              Order #{activeOrder.confirmation_code}
            </h2>

            <p className={cn("text-lg font-medium mb-4", statusInfo.color)}>
              {statusInfo.label}
            </p>

            {activeOrder.status === 'ready' && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4"
              >
                <p className="text-green-700 font-medium">
                  🎉 Your order is ready! Please collect from the bar.
                </p>
              </motion.div>
            )}

            <div className="text-left bg-gray-50 rounded-xl p-4 mb-4">
              <p className="text-sm text-muted-foreground mb-2">Order Total</p>
              <p className="text-2xl font-bold text-warm-brown">
                £{activeOrder.total.toFixed(2)}
              </p>
            </div>

            <Button
              onClick={() => setActiveOrder(null)}
              variant="outline"
              className="w-full"
            >
              Order More
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white pb-24">
      {/* Header */}
      <header className="sticky top-0 bg-white/80 backdrop-blur-lg border-b px-4 py-3 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-600 rounded-lg">
              <Beer className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-warm-brown">{pub.name}</h1>
              <p className="text-xs text-muted-foreground">Table {table.number}{table.name ? ` - ${table.name}` : ''}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Menu */}
      <div className="p-4 space-y-6">
        {itemsByCategory.map(({ category, items }) => {
          if (items.length === 0) return null;
          return (
            <div key={category.id}>
              <h2 className="text-lg font-semibold text-warm-brown mb-3">
                {category.name}
              </h2>
              <div className="space-y-3">
                {items.map((item) => (
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
          );
        })}

        {uncategorizedItems.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-warm-brown mb-3">Other</h2>
            <div className="space-y-3">
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

      {/* Cart Button */}
      {cartCount > 0 && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t"
        >
          <Button
            onClick={() => setShowCart(true)}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white py-6 text-lg"
          >
            <ShoppingCart className="w-5 h-5 mr-2" />
            View Cart ({cartCount}) · £{cartTotal.toFixed(2)}
          </Button>
        </motion.div>
      )}

      {/* Cart Sheet */}
      <AnimatePresence>
        {showCart && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setShowCart(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 max-h-[85vh] overflow-hidden flex flex-col"
            >
              <div className="p-4 border-b flex items-center justify-between">
                <h2 className="text-xl font-bold text-warm-brown">Your Order</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowCart(false)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="flex-1 overflow-auto p-4 space-y-3">
                {cart.map((item) => (
                  <div
                    key={item.menuItem.id}
                    className="flex items-center justify-between bg-gray-50 rounded-xl p-3"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{item.menuItem.name}</p>
                      <p className="text-sm text-muted-foreground">
                        £{item.menuItem.price.toFixed(2)} each
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => removeFromCart(item.menuItem.id)}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="w-8 text-center font-medium">
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => addToCart(item.menuItem)}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                <div className="pt-4">
                  <label className="block text-sm font-medium text-warm-brown mb-2">
                    Notes (optional)
                  </label>
                  <textarea
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    placeholder="Any special requests..."
                    className="w-full p-3 border rounded-xl resize-none h-20"
                  />
                </div>
              </div>

              <div className="p-4 border-t bg-white">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-medium">Total</span>
                  <span className="text-2xl font-bold text-amber-600">
                    £{cartTotal.toFixed(2)}
                  </span>
                </div>
                <Button
                  onClick={submitOrder}
                  disabled={submitting || cart.length === 0}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white py-6 text-lg"
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
      className="bg-white rounded-xl p-4 shadow-sm border flex items-center gap-4"
    >
      {item.image_url && (
        <div className="w-20 h-20 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.image_url}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-warm-brown">{item.name}</h3>
        {item.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {item.description}
          </p>
        )}
        <p className="text-amber-600 font-semibold mt-1">
          £{item.price.toFixed(2)}
        </p>
      </div>
      <div className="flex-shrink-0">
        {quantity === 0 ? (
          <Button
            onClick={onAdd}
            size="icon"
            className="bg-amber-600 hover:bg-amber-700 text-white h-10 w-10 rounded-full"
          >
            <Plus className="w-5 h-5" />
          </Button>
        ) : (
          <div className="flex items-center gap-1">
            <Button
              onClick={onRemove}
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full"
            >
              <Minus className="w-4 h-4" />
            </Button>
            <span className="w-6 text-center font-medium">{quantity}</span>
            <Button
              onClick={onAdd}
              size="icon"
              className="bg-amber-600 hover:bg-amber-700 text-white h-8 w-8 rounded-full"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
