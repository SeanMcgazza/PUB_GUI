import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { OrderingClient } from './ordering-client';
import type { Pub, Table, MenuCategory, MenuItem } from '@/types/database';

interface PageProps {
  params: Promise<{
    pubSlug: string;
    tableToken: string;
  }>;
}

export default async function OrderPage({ params }: PageProps) {
  const { pubSlug, tableToken } = await params;
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;

  // Fetch pub by slug
  const { data: pub, error: pubError } = await sb
    .from('pubs')
    .select('*')
    .eq('slug', pubSlug)
    .single() as { data: Pub | null; error: unknown };

  if (pubError || !pub) {
    notFound();
  }

  // Fetch table by qr_token and verify it belongs to this pub
  const { data: table, error: tableError } = await sb
    .from('tables')
    .select('*')
    .eq('qr_token', tableToken)
    .eq('pub_id', pub.id)
    .single() as { data: Table | null; error: unknown };

  if (tableError || !table) {
    notFound();
  }

  // Fetch menu categories and items
  const { data: categories } = await sb
    .from('menu_categories')
    .select('*')
    .eq('pub_id', pub.id)
    .order('order', { ascending: true }) as { data: MenuCategory[] | null };

  const { data: menuItems } = await sb
    .from('menu_items')
    .select('*')
    .eq('pub_id', pub.id)
    .eq('is_available', true)
    .order('name', { ascending: true }) as { data: MenuItem[] | null };

  // Get or create session token
  const cookieStore = await cookies();
  let sessionToken = cookieStore.get('bartab_session')?.value;

  if (!sessionToken) {
    sessionToken = crypto.randomUUID();
  }

  return (
    <OrderingClient
      pub={pub}
      table={table}
      categories={categories || []}
      menuItems={menuItems || []}
      sessionToken={sessionToken}
    />
  );
}
