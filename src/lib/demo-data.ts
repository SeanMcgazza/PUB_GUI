// Demo data for testing UI/UX without Supabase
// Uses localStorage to sync state between bar app and customer app
//
// KNOWN LIMITATION (demo mode only): the read-modify-write pattern in
// addOrder/updateOrderStatus/addItem is not atomic across tabs. Two pages
// writing in true parallel can clobber each other (last-write-wins). Real
// Supabase serializes INSERTs server-side and is not affected. Fix would be
// to refresh from localStorage immediately before setItem, or use a Web Lock
// (navigator.locks) where supported.

export const DEMO_PUB = {
  id: 'demo-pub-id',
  owner_id: 'demo-owner-id',
  name: "The Local",
  slug: 'the-local',
  address: '123 Main Street, Dublin',
  phone: '+353 1 234 5678',
  logo_url: null,
  settings: {},
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const DEMO_TABLES = [
  { id: 't1', pub_id: DEMO_PUB.id, number: 1, name: 'Window Seat', qr_token: 'table1', status: 'available' },
  { id: 't2', pub_id: DEMO_PUB.id, number: 2, name: 'Corner Booth', qr_token: 'table2', status: 'occupied' },
  { id: 't3', pub_id: DEMO_PUB.id, number: 3, name: 'Bar Stool 1', qr_token: 'table3', status: 'available' },
  { id: 't4', pub_id: DEMO_PUB.id, number: 4, name: 'Patio Table', qr_token: 'table4', status: 'available' },
  { id: 't5', pub_id: DEMO_PUB.id, number: 5, name: 'High Top', qr_token: 'table5', status: 'reserved' },
];

export const DEMO_CATEGORIES = [
  { id: 'cat1', pub_id: DEMO_PUB.id, name: 'Draught Beer', order: 1 },
  { id: 'cat2', pub_id: DEMO_PUB.id, name: 'Bottled Beer', order: 2 },
  { id: 'cat3', pub_id: DEMO_PUB.id, name: 'Spirits', order: 3 },
  { id: 'cat4', pub_id: DEMO_PUB.id, name: 'Wine', order: 4 },
  { id: 'cat5', pub_id: DEMO_PUB.id, name: 'Soft Drinks', order: 5 },
  { id: 'cat6', pub_id: DEMO_PUB.id, name: 'Food', order: 6 },
];

const DEFAULT_MENU_ITEMS = [
  // Draught Beer
  { id: 'm1', pub_id: DEMO_PUB.id, category_id: 'cat1', name: 'Guinness', description: 'The black stuff. 568ml pint.', price: 5.80, is_available: true, image_url: null },
  { id: 'm2', pub_id: DEMO_PUB.id, category_id: 'cat1', name: 'Heineken', description: 'Crisp lager. 568ml pint.', price: 5.50, is_available: true, image_url: null },
  { id: 'm3', pub_id: DEMO_PUB.id, category_id: 'cat1', name: 'Smithwicks', description: 'Irish red ale. 568ml pint.', price: 5.20, is_available: true, image_url: null },
  { id: 'm4', pub_id: DEMO_PUB.id, category_id: 'cat1', name: 'Rockshore', description: 'Refreshing lager. 568ml pint.', price: 5.00, is_available: true, image_url: null },
  
  // Bottled Beer
  { id: 'm5', pub_id: DEMO_PUB.id, category_id: 'cat2', name: 'Corona', description: '330ml bottle', price: 5.00, is_available: true, image_url: null },
  { id: 'm6', pub_id: DEMO_PUB.id, category_id: 'cat2', name: 'Budweiser', description: '330ml bottle', price: 4.80, is_available: true, image_url: null },
  { id: 'm7', pub_id: DEMO_PUB.id, category_id: 'cat2', name: 'Hop House 13', description: '330ml bottle', price: 5.20, is_available: true, image_url: null },
  
  // Spirits
  { id: 'm8', pub_id: DEMO_PUB.id, category_id: 'cat3', name: 'Jameson', description: 'Irish whiskey. Single measure.', price: 5.50, is_available: true, image_url: null },
  { id: 'm9', pub_id: DEMO_PUB.id, category_id: 'cat3', name: 'Jameson Double', description: 'Irish whiskey. Double measure.', price: 9.50, is_available: true, image_url: null },
  { id: 'm10', pub_id: DEMO_PUB.id, category_id: 'cat3', name: 'Vodka & Mixer', description: 'Smirnoff with your choice of mixer', price: 6.50, is_available: true, image_url: null },
  { id: 'm11', pub_id: DEMO_PUB.id, category_id: 'cat3', name: 'Gin & Tonic', description: 'Gordons with Schweppes tonic', price: 7.00, is_available: true, image_url: null },
  
  // Wine
  { id: 'm12', pub_id: DEMO_PUB.id, category_id: 'cat4', name: 'House Red', description: '175ml glass', price: 6.50, is_available: true, image_url: null },
  { id: 'm13', pub_id: DEMO_PUB.id, category_id: 'cat4', name: 'House White', description: '175ml glass', price: 6.50, is_available: true, image_url: null },
  { id: 'm14', pub_id: DEMO_PUB.id, category_id: 'cat4', name: 'Prosecco', description: '200ml bottle', price: 8.00, is_available: true, image_url: null },
  
  // Soft Drinks
  { id: 'm15', pub_id: DEMO_PUB.id, category_id: 'cat5', name: 'Coca Cola', description: '330ml', price: 3.00, is_available: true, image_url: null },
  { id: 'm16', pub_id: DEMO_PUB.id, category_id: 'cat5', name: 'Diet Coke', description: '330ml', price: 3.00, is_available: true, image_url: null },
  { id: 'm17', pub_id: DEMO_PUB.id, category_id: 'cat5', name: 'Club Orange', description: '330ml', price: 3.00, is_available: true, image_url: null },
  { id: 'm18', pub_id: DEMO_PUB.id, category_id: 'cat5', name: 'Red Bull', description: '250ml can', price: 4.00, is_available: true, image_url: null },
  
  // Food
  { id: 'm19', pub_id: DEMO_PUB.id, category_id: 'cat6', name: 'Loaded Fries', description: 'Crispy fries with cheese, bacon & scallions', price: 8.50, is_available: true, image_url: null },
  { id: 'm20', pub_id: DEMO_PUB.id, category_id: 'cat6', name: 'Chicken Wings', description: '8 wings with your choice of sauce', price: 12.00, is_available: true, image_url: null },
  { id: 'm21', pub_id: DEMO_PUB.id, category_id: 'cat6', name: 'Fish & Chips', description: 'Beer-battered cod with chunky chips', price: 15.00, is_available: true, image_url: null },
  { id: 'm22', pub_id: DEMO_PUB.id, category_id: 'cat6', name: 'Beef Burger', description: '6oz patty, bacon, cheese, brioche bun', price: 14.50, is_available: true, image_url: null },
];

const STORAGE_KEY = 'bartab_demo_menu';
const ORDERS_STORAGE_KEY = 'bartab_demo_orders';

// Demo Menu State Manager
export const DemoMenuState = {
  // Get menu items from localStorage or default
  getItems: (): typeof DEFAULT_MENU_ITEMS => {
    if (typeof window === 'undefined') return DEFAULT_MENU_ITEMS;
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Error reading demo menu state:', e);
    }
    return DEFAULT_MENU_ITEMS;
  },

  // Save menu items to localStorage
  saveItems: (items: typeof DEFAULT_MENU_ITEMS): void => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      // Dispatch custom event for cross-tab sync
      window.dispatchEvent(new CustomEvent('bartab-menu-update', { detail: items }));
    } catch (e) {
      console.error('Error saving demo menu state:', e);
    }
  },

  // Toggle item availability
  toggleAvailability: (itemId: string): typeof DEFAULT_MENU_ITEMS => {
    const items = DemoMenuState.getItems();
    const updated = items.map(item => 
      item.id === itemId ? { ...item, is_available: !item.is_available } : item
    );
    DemoMenuState.saveItems(updated);
    return updated;
  },

  // Update item
  updateItem: (itemId: string, updates: Partial<typeof DEFAULT_MENU_ITEMS[0]>): typeof DEFAULT_MENU_ITEMS => {
    const items = DemoMenuState.getItems();
    const updated = items.map(item => 
      item.id === itemId ? { ...item, ...updates } : item
    );
    DemoMenuState.saveItems(updated);
    return updated;
  },

  // Add item
  addItem: (item: typeof DEFAULT_MENU_ITEMS[0]): typeof DEFAULT_MENU_ITEMS => {
    const items = DemoMenuState.getItems();
    const newItem = { ...item, id: crypto.randomUUID() };
    const updated = [...items, newItem];
    DemoMenuState.saveItems(updated);
    return updated;
  },

  // Delete item
  deleteItem: (itemId: string): typeof DEFAULT_MENU_ITEMS => {
    const items = DemoMenuState.getItems();
    const updated = items.filter(item => item.id !== itemId);
    DemoMenuState.saveItems(updated);
    return updated;
  },

  // Reset to defaults
  reset: (): typeof DEFAULT_MENU_ITEMS => {
    DemoMenuState.saveItems(DEFAULT_MENU_ITEMS);
    return DEFAULT_MENU_ITEMS;
  },

  // Subscribe to changes (for cross-tab sync)
  subscribe: (callback: (items: typeof DEFAULT_MENU_ITEMS) => void): (() => void) => {
    if (typeof window === 'undefined') return () => {};
    
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent;
      callback(customEvent.detail);
    };
    
    // Listen for custom events from same tab
    window.addEventListener('bartab-menu-update', handler);
    
    // Listen for storage events from other tabs
    const storageHandler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          callback(JSON.parse(e.newValue));
        } catch (err) {
          console.error('Error parsing storage event:', err);
        }
      }
    };
    window.addEventListener('storage', storageHandler);
    
    return () => {
      window.removeEventListener('bartab-menu-update', handler);
      window.removeEventListener('storage', storageHandler);
    };
  }
};

// Order type for demo
interface DemoOrder {
  id: string;
  pub_id: string;
  table_id: string;
  session_token: string;
  status: string;
  confirmation_code: string;
  total: number;
  notes: string;
  created_at: string;
  order_items: Array<{ id: string; name: string; price: number; quantity: number; notes?: string }>;
  tables: { number: number; name: string };
}

// Demo Orders State Manager
function getOrders(): DemoOrder[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(ORDERS_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Error reading demo orders:', e);
  }
  return [];
}

function addOrder(order: {
  table_id: string;
  table_number: number;
  table_name?: string;
  items: Array<{ id: string; name: string; price: number; quantity: number; notes?: string }>;
  total: number;
  notes?: string;
}): DemoOrder {
  const orders = getOrders();
  const newOrder: DemoOrder = {
    id: crypto.randomUUID(),
    pub_id: DEMO_PUB.id,
    table_id: order.table_id,
    session_token: crypto.randomUUID(),
    status: 'pending',
    confirmation_code: String(Math.floor(1000 + Math.random() * 9000)),
    total: order.total,
    notes: order.notes || '',
    created_at: new Date().toISOString(),
    order_items: order.items.map((item) => {
      const { id: _itemId, ...rest } = item;
      return {
        id: crypto.randomUUID(),
        ...rest,
      };
    }),
    tables: { number: order.table_number, name: order.table_name || '' },
  };
  
  const updated = [newOrder, ...orders];
  
  if (typeof window !== 'undefined') {
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('bartab-order-update', { detail: updated }));
  }
  
  return newOrder;
}

function updateOrderStatus(orderId: string, status: string): DemoOrder[] {
  const orders = getOrders();
  const updated = orders.map((o) => 
    o.id === orderId ? { ...o, status } : o
  );
  
  if (typeof window !== 'undefined') {
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('bartab-order-update', { detail: updated }));
  }
  
  return updated;
}

function subscribeToOrders(callback: (orders: DemoOrder[]) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  
  const handler = (e: Event) => {
    const customEvent = e as CustomEvent;
    callback(customEvent.detail);
  };
  
  window.addEventListener('bartab-order-update', handler);
  
  const storageHandler = (e: StorageEvent) => {
    if (e.key === ORDERS_STORAGE_KEY && e.newValue) {
      try {
        callback(JSON.parse(e.newValue));
      } catch (err) {
        console.error('Error parsing orders storage event:', err);
      }
    }
  };
  window.addEventListener('storage', storageHandler);
  
  return () => {
    window.removeEventListener('bartab-order-update', handler);
    window.removeEventListener('storage', storageHandler);
  };
}

export const DemoOrdersState = {
  getOrders,
  addOrder,
  updateOrderStatus,
  subscribe: subscribeToOrders,
};

// Keep the old export for backwards compatibility
export const DEMO_MENU_ITEMS = DEFAULT_MENU_ITEMS;

export const DEMO_ORDERS = [
  {
    id: 'o1',
    pub_id: DEMO_PUB.id,
    table_id: 't2',
    session_token: 'sess1',
    status: 'pending',
    confirmation_code: '4521',
    total: 16.80,
    notes: '',
    created_at: new Date(Date.now() - 2 * 60000).toISOString(),
    order_items: [
      { id: 'oi1', name: 'Guinness', price: 5.80, quantity: 2, notes: '' },
      { id: 'oi2', name: 'Heineken', price: 5.50, quantity: 1, notes: '' },
    ],
    tables: { number: 2, name: 'Corner Booth' },
  },
];

// Demo mode = no real Supabase URL configured.
// NEXT_PUBLIC_* env vars are inlined at build time, so this works identically
// on server and client.
export const isDemoMode = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return !url || url.includes('placeholder');
};
