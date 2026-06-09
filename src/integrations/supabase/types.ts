export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      announcements: {
        Row: {
          author_id: string
          body: string
          category: string
          created_at: string
          id: string
          mosque_id: string
          pinned: boolean
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          body: string
          category?: string
          created_at?: string
          id?: string
          mosque_id: string
          pinned?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          body?: string
          category?: string
          created_at?: string
          id?: string
          mosque_id?: string
          pinned?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosques"
            referencedColumns: ["id"]
          },
        ]
      }
      bookmarks: {
        Row: {
          created_at: string
          id: string
          kind: string
          label: string | null
          note: string | null
          ref_key: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          label?: string | null
          note?: string | null
          ref_key: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          label?: string | null
          note?: string | null
          ref_key?: string
          user_id?: string
        }
        Relationships: []
      }
      event_rsvps: {
        Row: {
          created_at: string
          event_id: string
          id: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_rsvps_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          capacity: number | null
          category: string
          created_at: string
          description: string | null
          ends_at: string | null
          id: string
          location: string | null
          mosque_id: string
          organizer_id: string
          starts_at: string
          title: string
          updated_at: string
        }
        Insert: {
          capacity?: number | null
          category?: string
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          location?: string | null
          mosque_id: string
          organizer_id: string
          starts_at: string
          title: string
          updated_at?: string
        }
        Update: {
          capacity?: number | null
          category?: string
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          location?: string | null
          mosque_id?: string
          organizer_id?: string
          starts_at?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosques"
            referencedColumns: ["id"]
          },
        ]
      }
      mosque_followers: {
        Row: {
          created_at: string
          id: string
          mosque_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          mosque_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          mosque_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mosque_followers_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosques"
            referencedColumns: ["id"]
          },
        ]
      }
      mosques: {
        Row: {
          arabic_name: string | null
          city: string
          country: string
          cover_image_url: string | null
          created_at: string
          followers_count: number
          id: string
          imam_bio: string | null
          imam_name: string | null
          is_live: boolean
          latitude: number | null
          listeners_count: number
          live_room_name: string | null
          live_started_at: string | null
          longitude: number | null
          name: string
          owner_id: string | null
          updated_at: string
          village: string | null
        }
        Insert: {
          arabic_name?: string | null
          city: string
          country?: string
          cover_image_url?: string | null
          created_at?: string
          followers_count?: number
          id?: string
          imam_bio?: string | null
          imam_name?: string | null
          is_live?: boolean
          latitude?: number | null
          listeners_count?: number
          live_room_name?: string | null
          live_started_at?: string | null
          longitude?: number | null
          name: string
          owner_id?: string | null
          updated_at?: string
          village?: string | null
        }
        Update: {
          arabic_name?: string | null
          city?: string
          country?: string
          cover_image_url?: string | null
          created_at?: string
          followers_count?: number
          id?: string
          imam_bio?: string | null
          imam_name?: string | null
          is_live?: boolean
          latitude?: number | null
          listeners_count?: number
          live_room_name?: string | null
          live_started_at?: string | null
          longitude?: number | null
          name?: string
          owner_id?: string | null
          updated_at?: string
          village?: string | null
        }
        Relationships: []
      }
      prayer_alert_log: {
        Row: {
          created_at: string
          fired_for: string
          id: string
          prayer: string
          user_id: string
        }
        Insert: {
          created_at?: string
          fired_for: string
          id?: string
          prayer: string
          user_id: string
        }
        Update: {
          created_at?: string
          fired_for?: string
          id?: string
          prayer?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          alert_lead_minutes: number
          avatar_url: string | null
          azan_sound: string
          azan_volume: number
          city: string | null
          country: string | null
          created_at: string
          custom_azan_url: string | null
          display_name: string | null
          id: string
          prayer_alerts: Json
          prayer_mosques: Json
          preferred_mosque_id: string | null
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          alert_lead_minutes?: number
          avatar_url?: string | null
          azan_sound?: string
          azan_volume?: number
          city?: string | null
          country?: string | null
          created_at?: string
          custom_azan_url?: string | null
          display_name?: string | null
          id?: string
          prayer_alerts?: Json
          prayer_mosques?: Json
          preferred_mosque_id?: string | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          alert_lead_minutes?: number
          avatar_url?: string | null
          azan_sound?: string
          azan_volume?: number
          city?: string | null
          country?: string | null
          created_at?: string
          custom_azan_url?: string | null
          display_name?: string | null
          id?: string
          prayer_alerts?: Json
          prayer_mosques?: Json
          preferred_mosque_id?: string | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          mosque_id: string | null
          p256dh: string
          updated_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          mosque_id?: string | null
          p256dh: string
          updated_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          mosque_id?: string | null
          p256dh?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      tasbih_sessions: {
        Row: {
          count: number
          id: string
          session_date: string
          target: number
          updated_at: string
          user_id: string
          zikr: string
        }
        Insert: {
          count?: number
          id?: string
          session_date?: string
          target?: number
          updated_at?: string
          user_id: string
          zikr: string
        }
        Update: {
          count?: number
          id?: string
          session_date?: string
          target?: number
          updated_at?: string
          user_id?: string
          zikr?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "mosque_admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "mosque_admin", "user"],
    },
  },
} as const
