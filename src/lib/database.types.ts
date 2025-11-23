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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_activity_logs: {
        Row: {
          action: string
          admin_id: string
          created_at: string | null
          details: Json | null
          id: string
          target_id: string
          target_type: string
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string | null
          details?: Json | null
          id?: string
          target_id: string
          target_type: string
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          target_id?: string
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_activity_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "blocked_users_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_activity_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_audit_logs: {
        Row: {
          action: string
          admin_user_id: string | null
          created_at: string | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: unknown
          new_data: Json | null
          old_data: Json | null
          user_agent: string | null
        }
        Insert: {
          action: string
          admin_user_id?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          admin_user_id?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_audit_logs_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_role_cache: {
        Row: {
          cached_at: string
          is_admin: boolean
          user_id: string
        }
        Insert: {
          cached_at?: string
          is_admin?: boolean
          user_id: string
        }
        Update: {
          cached_at?: string
          is_admin?: boolean
          user_id?: string
        }
        Relationships: []
      }
      admin_users: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          full_name: string
          id: string
          is_active: boolean | null
          last_login_at: string | null
          permissions: Json | null
          role: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          full_name: string
          id: string
          is_active?: boolean | null
          last_login_at?: string | null
          permissions?: Json | null
          role?: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          full_name?: string
          id?: string
          is_active?: boolean | null
          last_login_at?: string | null
          permissions?: Json | null
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      contacts: {
        Row: {
          assigned_to: string | null
          company: string | null
          created_at: string | null
          email: string
          id: string
          ip_address: unknown
          message: string
          name: string
          phone: string | null
          priority: string | null
          responded_at: string | null
          responded_by: string | null
          response_text: string | null
          source: string | null
          status: string
          subject: string | null
          updated_at: string | null
          user_agent: string | null
        }
        Insert: {
          assigned_to?: string | null
          company?: string | null
          created_at?: string | null
          email: string
          id?: string
          ip_address?: unknown
          message: string
          name: string
          phone?: string | null
          priority?: string | null
          responded_at?: string | null
          responded_by?: string | null
          response_text?: string | null
          source?: string | null
          status?: string
          subject?: string | null
          updated_at?: string | null
          user_agent?: string | null
        }
        Update: {
          assigned_to?: string | null
          company?: string | null
          created_at?: string | null
          email?: string
          id?: string
          ip_address?: unknown
          message?: string
          name?: string
          phone?: string | null
          priority?: string | null
          responded_at?: string | null
          responded_by?: string | null
          response_text?: string | null
          source?: string | null
          status?: string
          subject?: string | null
          updated_at?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      deleted_users: {
        Row: {
          deleted_at: string
          deleted_by: string | null
          deletion_reason: string | null
          email: string
          full_name: string | null
          id: string
          original_role: string | null
          user_id: string
        }
        Insert: {
          deleted_at?: string
          deleted_by?: string | null
          deletion_reason?: string | null
          email: string
          full_name?: string | null
          id?: string
          original_role?: string | null
          user_id: string
        }
        Update: {
          deleted_at?: string
          deleted_by?: string | null
          deletion_reason?: string | null
          email?: string
          full_name?: string | null
          id?: string
          original_role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deleted_users_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "blocked_users_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deleted_users_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      faq: {
        Row: {
          answer: string
          category: string | null
          created_at: string | null
          display_order: number
          id: string
          is_active: boolean | null
          question: string
          updated_at: string | null
          views_count: number | null
        }
        Insert: {
          answer: string
          category?: string | null
          created_at?: string | null
          display_order?: number
          id?: string
          is_active?: boolean | null
          question: string
          updated_at?: string | null
          views_count?: number | null
        }
        Update: {
          answer?: string
          category?: string | null
          created_at?: string | null
          display_order?: number
          id?: string
          is_active?: boolean | null
          question?: string
          updated_at?: string | null
          views_count?: number | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          budget_range: string
          created_at: string | null
          deadline: string
          email: string
          full_name: string
          id: string
          meeting_date: string
          notes: string | null
          phone: string
          phone_country: string
          phone_country_code: string
          project_description: string
          project_type: string
          project_type_other_description: string | null
          source: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          budget_range: string
          created_at?: string | null
          deadline: string
          email: string
          full_name: string
          id?: string
          meeting_date: string
          notes?: string | null
          phone: string
          phone_country?: string
          phone_country_code?: string
          project_description: string
          project_type: string
          project_type_other_description?: string | null
          source?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          budget_range?: string
          created_at?: string | null
          deadline?: string
          email?: string
          full_name?: string
          id?: string
          meeting_date?: string
          notes?: string | null
          phone?: string
          phone_country?: string
          phone_country_code?: string
          project_description?: string
          project_type?: string
          project_type_other_description?: string | null
          source?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      meetings: {
        Row: {
          admin_notes: string | null
          approved_at: string | null
          approved_by: string | null
          budget: string
          cancelled_at: string | null
          created_at: string | null
          email: string
          full_name: string
          id: string
          meeting_date: string
          meeting_time: string | null
          phone: string
          project_description: string
          project_type: string
          reschedule_count: number | null
          status: string | null
          timeline: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          budget: string
          cancelled_at?: string | null
          created_at?: string | null
          email: string
          full_name: string
          id?: string
          meeting_date: string
          meeting_time?: string | null
          phone: string
          project_description: string
          project_type: string
          reschedule_count?: number | null
          status?: string | null
          timeline: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          budget?: string
          cancelled_at?: string | null
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          meeting_date?: string
          meeting_time?: string | null
          phone?: string
          project_description?: string
          project_type?: string
          reschedule_count?: number | null
          status?: string | null
          timeline?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meetings_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "blocked_users_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          category: string
          client_name: string | null
          completion_date: string | null
          cover_image_url: string | null
          created_at: string | null
          demo_url: string | null
          display_order: number | null
          duration_months: number | null
          full_description: string | null
          gallery_images: string[] | null
          id: string
          is_featured: boolean | null
          is_published: boolean | null
          project_type: string | null
          published_at: string | null
          short_description: string | null
          slug: string
          tags: string[] | null
          team_size: number | null
          technologies: string[] | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          video_url: string | null
          views_count: number | null
        }
        Insert: {
          category: string
          client_name?: string | null
          completion_date?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          demo_url?: string | null
          display_order?: number | null
          duration_months?: number | null
          full_description?: string | null
          gallery_images?: string[] | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          project_type?: string | null
          published_at?: string | null
          short_description?: string | null
          slug: string
          tags?: string[] | null
          team_size?: number | null
          technologies?: string[] | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
          video_url?: string | null
          views_count?: number | null
        }
        Update: {
          category?: string
          client_name?: string | null
          completion_date?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          demo_url?: string | null
          display_order?: number | null
          duration_months?: number | null
          full_description?: string | null
          gallery_images?: string[] | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          project_type?: string | null
          published_at?: string | null
          short_description?: string | null
          slug?: string
          tags?: string[] | null
          team_size?: number | null
          technologies?: string[] | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          video_url?: string | null
          views_count?: number | null
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          client_avatar_url: string | null
          client_company: string | null
          client_name: string
          client_role: string | null
          created_at: string | null
          display_order: number | null
          id: string
          is_featured: boolean | null
          is_published: boolean | null
          project_id: string | null
          published_at: string | null
          rating: number | null
          testimonial_text: string
          updated_at: string | null
        }
        Insert: {
          client_avatar_url?: string | null
          client_company?: string | null
          client_name: string
          client_role?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          project_id?: string | null
          published_at?: string | null
          rating?: number | null
          testimonial_text: string
          updated_at?: string | null
        }
        Update: {
          client_avatar_url?: string | null
          client_company?: string | null
          client_name?: string
          client_role?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          project_id?: string | null
          published_at?: string | null
          rating?: number | null
          testimonial_text?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "testimonials_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_monthly_cancellations: {
        Row: {
          cancellation_count: number | null
          created_at: string | null
          id: string
          month: number
          updated_at: string | null
          user_id: string
          year: number
        }
        Insert: {
          cancellation_count?: number | null
          created_at?: string | null
          id?: string
          month: number
          updated_at?: string | null
          user_id: string
          year: number
        }
        Update: {
          cancellation_count?: number | null
          created_at?: string | null
          id?: string
          month?: number
          updated_at?: string | null
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      users: {
        Row: {
          avatar_url: string | null
          bio: string | null
          blocked_at: string | null
          blocked_by: string | null
          blocked_reason: string | null
          company: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          is_blocked: boolean | null
          language: string | null
          phone: string | null
          position: string | null
          role: string | null
          updated_at: string
          version: number | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          blocked_at?: string | null
          blocked_by?: string | null
          blocked_reason?: string | null
          company?: string | null
          created_at?: string
          email: string
          full_name: string
          id: string
          is_blocked?: boolean | null
          language?: string | null
          phone?: string | null
          position?: string | null
          role?: string | null
          updated_at?: string
          version?: number | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          blocked_at?: string | null
          blocked_by?: string | null
          blocked_reason?: string | null
          company?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_blocked?: boolean | null
          language?: string | null
          phone?: string | null
          position?: string | null
          role?: string | null
          updated_at?: string
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "users_blocked_by_fkey"
            columns: ["blocked_by"]
            isOneToOne: false
            referencedRelation: "blocked_users_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_blocked_by_fkey"
            columns: ["blocked_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      blocked_users_view: {
        Row: {
          blocked_at: string | null
          blocked_by: string | null
          blocked_reason: string | null
          email: string | null
          full_name: string | null
          id: string | null
          is_blocked: boolean | null
        }
        Insert: {
          blocked_at?: string | null
          blocked_by?: string | null
          blocked_reason?: string | null
          email?: string | null
          full_name?: string | null
          id?: string | null
          is_blocked?: boolean | null
        }
        Update: {
          blocked_at?: string | null
          blocked_by?: string | null
          blocked_reason?: string | null
          email?: string | null
          full_name?: string | null
          id?: string | null
          is_blocked?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "users_blocked_by_fkey"
            columns: ["blocked_by"]
            isOneToOne: false
            referencedRelation: "blocked_users_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_blocked_by_fkey"
            columns: ["blocked_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      occupied_time_slots: {
        Row: {
          meeting_date: string | null
          meeting_time: string | null
        }
        Insert: {
          meeting_date?: string | null
          meeting_time?: string | null
        }
        Update: {
          meeting_date?: string | null
          meeting_time?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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

          rating?: number | null
          testimonial_text?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "testimonials_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_monthly_cancellations: {
        Row: {
          cancellation_count: number | null
          created_at: string | null
          id: string
          month: number
          updated_at: string | null
          user_id: string
          year: number
        }
        Insert: {
          cancellation_count?: number | null
          created_at?: string | null
          id?: string
          month: number
          updated_at?: string | null
          user_id: string
          year: number
        }
        Update: {
          cancellation_count?: number | null
          created_at?: string | null
          id?: string
          month?: number
          updated_at?: string | null
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      users: {
        Row: {
          avatar_url: string | null
          bio: string | null
          blocked_at: string | null
          blocked_by: string | null
          blocked_reason: string | null
          company: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          is_blocked: boolean | null
          language: string | null
          phone: string | null
          position: string | null
          role: string | null
          updated_at: string
          version: number | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          blocked_at?: string | null
          blocked_by?: string | null
          blocked_reason?: string | null
          company?: string | null
          created_at?: string
          email: string
          full_name: string
          id: string
          is_blocked?: boolean | null
          language?: string | null
          phone?: string | null
          position?: string | null
          role?: string | null
          updated_at?: string
          version?: number | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          blocked_at?: string | null
          blocked_by?: string | null
          blocked_reason?: string | null
          company?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_blocked?: boolean | null
          language?: string | null
          phone?: string | null
          position?: string | null
          role?: string | null
          updated_at?: string
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "users_blocked_by_fkey"
            columns: ["blocked_by"]
            isOneToOne: false
            referencedRelation: "blocked_users_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_blocked_by_fkey"
            columns: ["blocked_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      blocked_users_view: {
        Row: {
          blocked_at: string | null
          blocked_by: string | null
          blocked_reason: string | null
          email: string | null
          full_name: string | null
          id: string | null
          is_blocked: boolean | null
        }
        Insert: {
          blocked_at?: string | null
          blocked_by?: string | null
          blocked_reason?: string | null
          email?: string | null
          full_name?: string | null
          id?: string | null
          is_blocked?: boolean | null
        }
        Update: {
          blocked_at?: string | null
          blocked_by?: string | null
          blocked_reason?: string | null
          email?: string | null
          full_name?: string | null
          id?: string | null
          is_blocked?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "users_blocked_by_fkey"
            columns: ["blocked_by"]
            isOneToOne: false
            referencedRelation: "blocked_users_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_blocked_by_fkey"
            columns: ["blocked_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      occupied_time_slots: {
        Row: {
          meeting_date: string | null
          meeting_time: string | null
        }
        Insert: {
          meeting_date?: string | null
          meeting_time?: string | null
        }
        Update: {
          meeting_date?: string | null
          meeting_time?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
