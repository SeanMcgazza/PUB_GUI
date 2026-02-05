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
      profiles: {
        Row: {
          id: string;
          business_name: string;
          email: string;
          phone: string | null;
          address: string | null;
          city: string | null;
          slug: string | null;
          description: string | null;
          currency: string;
          timezone: string;
          booking_notice: number;
          cancellation_policy: string | null;
          logo_url: string | null;
          cover_image_url: string | null;
          role: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          business_name?: string;
          email?: string;
          phone?: string | null;
          address?: string | null;
          city?: string | null;
          slug?: string | null;
          description?: string | null;
          currency?: string;
          timezone?: string;
          booking_notice?: number;
          cancellation_policy?: string | null;
          logo_url?: string | null;
          cover_image_url?: string | null;
          role?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          business_name?: string;
          email?: string;
          phone?: string | null;
          address?: string | null;
          city?: string | null;
          slug?: string | null;
          description?: string | null;
          currency?: string;
          timezone?: string;
          booking_notice?: number;
          cancellation_policy?: string | null;
          logo_url?: string | null;
          cover_image_url?: string | null;
          role?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      staff: {
        Row: {
          id: string;
          business_id: string;
          name: string;
          email: string | null;
          phone: string | null;
          role: string;
          avatar: string | null;
          bio: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          name: string;
          email?: string | null;
          phone?: string | null;
          role?: string;
          avatar?: string | null;
          bio?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          name?: string;
          email?: string | null;
          phone?: string | null;
          role?: string;
          avatar?: string | null;
          bio?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      service_categories: {
        Row: {
          id: string;
          business_id: string;
          name: string;
          description: string | null;
          order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          name: string;
          description?: string | null;
          order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          name?: string;
          description?: string | null;
          order?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      services: {
        Row: {
          id: string;
          business_id: string;
          category_id: string | null;
          name: string;
          description: string | null;
          duration: number;
          price: number;
          is_active: boolean;
          color: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          category_id?: string | null;
          name: string;
          description?: string | null;
          duration?: number;
          price?: number;
          is_active?: boolean;
          color?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          category_id?: string | null;
          name?: string;
          description?: string | null;
          duration?: number;
          price?: number;
          is_active?: boolean;
          color?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      clients: {
        Row: {
          id: string;
          business_id: string;
          first_name: string;
          last_name: string;
          email: string | null;
          phone: string | null;
          notes: string | null;
          tags: string[];
          loyalty_points: number;
          total_visits: number;
          total_spent: number;
          last_visit: string | null;
          preferred_staff_id: string | null;
          no_show_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          first_name: string;
          last_name: string;
          email?: string | null;
          phone?: string | null;
          notes?: string | null;
          tags?: string[];
          loyalty_points?: number;
          total_visits?: number;
          total_spent?: number;
          last_visit?: string | null;
          preferred_staff_id?: string | null;
          no_show_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          first_name?: string;
          last_name?: string;
          email?: string | null;
          phone?: string | null;
          notes?: string | null;
          tags?: string[];
          loyalty_points?: number;
          total_visits?: number;
          total_spent?: number;
          last_visit?: string | null;
          preferred_staff_id?: string | null;
          no_show_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      bookings: {
        Row: {
          id: string;
          business_id: string;
          client_id: string | null;
          service_id: string | null;
          staff_id: string | null;
          date: string;
          start_time: string;
          end_time: string;
          status: string;
          price: number;
          notes: string | null;
          reminder_sent: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          client_id?: string | null;
          service_id?: string | null;
          staff_id?: string | null;
          date: string;
          start_time: string;
          end_time: string;
          status?: string;
          price?: number;
          notes?: string | null;
          reminder_sent?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          client_id?: string | null;
          service_id?: string | null;
          staff_id?: string | null;
          date?: string;
          start_time?: string;
          end_time?: string;
          status?: string;
          price?: number;
          notes?: string | null;
          reminder_sent?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      booking_settings: {
        Row: {
          id: string;
          business_id: string;
          advance_booking_days: number;
          slot_interval: number;
          auto_confirm: boolean;
          require_deposit: boolean;
          deposit_amount: number;
          cancellation_hours: number;
          business_hours: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          advance_booking_days?: number;
          slot_interval?: number;
          auto_confirm?: boolean;
          require_deposit?: boolean;
          deposit_amount?: number;
          cancellation_hours?: number;
          business_hours?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          advance_booking_days?: number;
          slot_interval?: number;
          auto_confirm?: boolean;
          require_deposit?: boolean;
          deposit_amount?: number;
          cancellation_hours?: number;
          business_hours?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      activities: {
        Row: {
          id: string;
          business_id: string;
          type: string;
          message: string;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          type: string;
          message?: string;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          type?: string;
          message?: string;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
