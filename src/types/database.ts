export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      pubs: {
        Row: {
          id: string;
          owner_id: string | null;
          name: string;
          slug: string;
          address: string | null;
          phone: string | null;
          logo_url: string | null;
          settings: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id?: string | null;
          name: string;
          slug: string;
          address?: string | null;
          phone?: string | null;
          logo_url?: string | null;
          settings?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string | null;
          name?: string;
          slug?: string;
          address?: string | null;
          phone?: string | null;
          logo_url?: string | null;
          settings?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      tables: {
        Row: {
          id: string;
          pub_id: string;
          number: number;
          name: string | null;
          qr_token: string;
          status: 'available' | 'occupied' | 'reserved';
          created_at: string;
        };
        Insert: {
          id?: string;
          pub_id: string;
          number: number;
          name?: string | null;
          qr_token: string;
          status?: 'available' | 'occupied' | 'reserved';
          created_at?: string;
        };
        Update: {
          id?: string;
          pub_id?: string;
          number?: number;
          name?: string | null;
          qr_token?: string;
          status?: 'available' | 'occupied' | 'reserved';
          created_at?: string;
        };
      };
      menu_categories: {
        Row: {
          id: string;
          pub_id: string;
          name: string;
          order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          pub_id: string;
          name: string;
          order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          pub_id?: string;
          name?: string;
          order?: number;
          created_at?: string;
        };
      };
      menu_items: {
        Row: {
          id: string;
          pub_id: string;
          category_id: string | null;
          name: string;
          description: string | null;
          price: number;
          image_url: string | null;
          is_available: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          pub_id: string;
          category_id?: string | null;
          name: string;
          description?: string | null;
          price: number;
          image_url?: string | null;
          is_available?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          pub_id?: string;
          category_id?: string | null;
          name?: string;
          description?: string | null;
          price?: number;
          image_url?: string | null;
          is_available?: boolean;
          created_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          pub_id: string;
          table_id: string | null;
          session_token: string;
          status: 'pending' | 'accepted' | 'preparing' | 'ready' | 'collected' | 'cancelled';
          confirmation_code: string;
          total: number;
          notes: string | null;
          cancel_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          pub_id: string;
          table_id?: string | null;
          session_token: string;
          status?: 'pending' | 'accepted' | 'preparing' | 'ready' | 'collected' | 'cancelled';
          confirmation_code: string;
          total?: number;
          notes?: string | null;
          cancel_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          pub_id?: string;
          table_id?: string | null;
          session_token?: string;
          status?: 'pending' | 'accepted' | 'preparing' | 'ready' | 'collected' | 'cancelled';
          confirmation_code?: string;
          total?: number;
          notes?: string | null;
          cancel_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          menu_item_id: string | null;
          name: string;
          price: number;
          quantity: number;
          notes: string | null;
        };
        Insert: {
          id?: string;
          order_id: string;
          menu_item_id?: string | null;
          name: string;
          price: number;
          quantity?: number;
          notes?: string | null;
        };
        Update: {
          id?: string;
          order_id?: string;
          menu_item_id?: string | null;
          name?: string;
          price?: number;
          quantity?: number;
          notes?: string | null;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

// Convenience types
export type Pub = Database['public']['Tables']['pubs']['Row'];
export type Table = Database['public']['Tables']['tables']['Row'];
export type MenuCategory = Database['public']['Tables']['menu_categories']['Row'];
export type MenuItem = Database['public']['Tables']['menu_items']['Row'];
export type Order = Database['public']['Tables']['orders']['Row'];
export type OrderItem = Database['public']['Tables']['order_items']['Row'];

export type OrderWithItems = Order & {
  order_items: OrderItem[];
  tables: Table | null;
};
