import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isDemoMode } from '@/lib/demo-mode';
import { OrderingClient } from './ordering-client';
import type { Pub, Table, MenuCategory, MenuItem } from '@/types/database';

// Demo data for testing
const DEMO_PUB = {
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

const DEMO_TABLES: Record<string, { id: string; pub_id: string; number: number; name: string; qr_token: string; status: string }> = {
  'table1': { id: 't1', pub_id: DEMO_PUB.id, number: 1, name: 'Window Seat', qr_token: 'table1', status: 'available' },
  'table2': { id: 't2', pub_id: DEMO_PUB.id, number: 2, name: 'Corner Booth', qr_token: 'table2', status: 'occupied' },
  'table3': { id: 't3', pub_id: DEMO_PUB.id, number: 3, name: 'Bar Stool 1', qr_token: 'table3', status: 'available' },
  'table4': { id: 't4', pub_id: DEMO_PUB.id, number: 4, name: 'Patio Table', qr_token: 'table4', status: 'available' },
  'table5': { id: 't5', pub_id: DEMO_PUB.id, number: 5, name: 'High Top', qr_token: 'table5', status: 'reserved' },
};

const DEMO_CATEGORIES = [
  { id: 'cat1', pub_id: DEMO_PUB.id, name: 'Draught Beer', order: 1 },
  { id: 'cat2', pub_id: DEMO_PUB.id, name: 'Bottled Beer', order: 2 },
  { id: 'cat3', pub_id: DEMO_PUB.id, name: 'Spirits', order: 3 },
  { id: 'cat4', pub_id: DEMO_PUB.id, name: 'Wine', order: 4 },
  { id: 'cat5', pub_id: DEMO_PUB.id, name: 'Soft Drinks', order: 5 },
  { id: 'cat6', pub_id: DEMO_PUB.id, name: 'Food', order: 6 },
];

const DEMO_MENU_ITEMS = [
  { id: 'm1', pub_id: DEMO_PUB.id, category_id: 'cat1', name: 'Guinness', description: 'The black stuff. 568ml pint.', price: 5.80, is_available: true, image_url: '/demo-menu/guinness.jpg' },
  { id: 'm2', pub_id: DEMO_PUB.id, category_id: 'cat1', name: 'Heineken', description: 'Crisp lager. 568ml pint.', price: 5.50, is_available: true },
  { id: 'm3', pub_id: DEMO_PUB.id, category_id: 'cat1', name: 'Smithwicks', description: 'Irish red ale. 568ml pint.', price: 5.20, is_available: true },
  { id: 'm4', pub_id: DEMO_PUB.id, category_id: 'cat1', name: 'Rockshore', description: 'Refreshing lager. 568ml pint.', price: 5.00, is_available: true },
  { id: 'm5', pub_id: DEMO_PUB.id, category_id: 'cat2', name: 'Corona', description: '330ml bottle', price: 5.00, is_available: true },
  { id: 'm6', pub_id: DEMO_PUB.id, category_id: 'cat2', name: 'Budweiser', description: '330ml bottle', price: 4.80, is_available: true },
  { id: 'm7', pub_id: DEMO_PUB.id, category_id: 'cat2', name: 'Hop House 13', description: '330ml bottle', price: 5.20, is_available: true },
  { id: 'm8', pub_id: DEMO_PUB.id, category_id: 'cat3', name: 'Jameson', description: 'Irish whiskey. Single measure.', price: 5.50, is_available: true },
  { id: 'm9', pub_id: DEMO_PUB.id, category_id: 'cat3', name: 'Jameson Double', description: 'Irish whiskey. Double measure.', price: 9.50, is_available: true },
  { id: 'm10', pub_id: DEMO_PUB.id, category_id: 'cat3', name: 'Vodka & Mixer', description: 'Smirnoff with your choice of mixer', price: 6.50, is_available: true },
  { id: 'm11', pub_id: DEMO_PUB.id, category_id: 'cat3', name: 'Gin & Tonic', description: 'Gordons with Schweppes tonic', price: 7.00, is_available: true },
  { id: 'm12', pub_id: DEMO_PUB.id, category_id: 'cat4', name: 'House Red', description: '175ml glass', price: 6.50, is_available: true },
  { id: 'm13', pub_id: DEMO_PUB.id, category_id: 'cat4', name: 'House White', description: '175ml glass', price: 6.50, is_available: true },
  { id: 'm14', pub_id: DEMO_PUB.id, category_id: 'cat4', name: 'Prosecco', description: '200ml bottle', price: 8.00, is_available: true },
  { id: 'm15', pub_id: DEMO_PUB.id, category_id: 'cat5', name: 'Coca Cola', description: '330ml', price: 3.00, is_available: true },
  { id: 'm16', pub_id: DEMO_PUB.id, category_id: 'cat5', name: 'Diet Coke', description: '330ml', price: 3.00, is_available: true },
  { id: 'm17', pub_id: DEMO_PUB.id, category_id: 'cat5', name: 'Club Orange', description: '330ml', price: 3.00, is_available: true },
  { id: 'm18', pub_id: DEMO_PUB.id, category_id: 'cat5', name: 'Red Bull', description: '250ml can', price: 4.00, is_available: true },
  { id: 'm19', pub_id: DEMO_PUB.id, category_id: 'cat6', name: 'Loaded Fries', description: 'Crispy fries with cheese, bacon & scallions', price: 8.50, is_available: true },
  { id: 'm20', pub_id: DEMO_PUB.id, category_id: 'cat6', name: 'Chicken Wings', description: '8 wings with your choice of sauce', price: 12.00, is_available: true },
  { id: 'm21', pub_id: DEMO_PUB.id, category_id: 'cat6', name: 'Fish & Chips', description: 'Beer-battered cod with chunky chips', price: 15.00, is_available: true },
  { id: 'm22', pub_id: DEMO_PUB.id, category_id: 'cat6', name: 'Beef Burger', description: '6oz patty, bacon, cheese, brioche bun', price: 14.50, is_available: true },
];

interface PageProps {
  params: Promise<{
    pubSlug: string;
    tableToken: string;
  }>;
}

export default async function OrderPage({ params }: PageProps) {
  const { pubSlug, tableToken } = await params;

  // Demo mode - use mock data
  if (isDemoMode()) {
    // Only support "the-local" pub in demo mode
    if (pubSlug !== 'the-local') {
      notFound();
    }
    
    const table = DEMO_TABLES[tableToken];
    if (!table) {
      notFound();
    }

    const sessionToken = crypto.randomUUID();

    return (
      <OrderingClient
        pub={DEMO_PUB as Pub}
        table={table as unknown as Table}
        categories={DEMO_CATEGORIES as unknown as MenuCategory[]}
        menuItems={DEMO_MENU_ITEMS as unknown as MenuItem[]}
        sessionToken={sessionToken}
      />
    );
  }

  // Production mode — resolve the ordering context through the SECURITY DEFINER
  // RPC. This returns the pub (safe columns only), the table, and the menu ONLY
  // when the qr_token matches a table in this pub; a wrong/guessed token returns
  // null (no enumeration). Direct public SELECT on pubs/tables was removed.
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;

  const { data: ctx, error: ctxError } = await sb.rpc('get_ordering_context', {
    p_slug: pubSlug,
    p_qr_token: tableToken,
  });

  if (ctxError || !ctx) {
    notFound();
  }

  const context = ctx as {
    pub: Pub;
    table: Table;
    categories: MenuCategory[];
    menu_items: MenuItem[];
  };

  // Get or create session token
  const cookieStore = await cookies();
  let sessionToken = cookieStore.get('bartab_session')?.value;

  if (!sessionToken) {
    sessionToken = crypto.randomUUID();
  }

  return (
    <OrderingClient
      pub={context.pub}
      table={context.table}
      categories={context.categories || []}
      menuItems={context.menu_items || []}
      sessionToken={sessionToken}
    />
  );
}
