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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      alerts: {
        Row: {
          accepted_at: string | null
          arrived_at: string | null
          created_at: string
          created_by: string
          duration_min: number
          family_notified: boolean
          id: string
          is_simulated: boolean
          loneliness_score: number | null
          memory_note: string
          mood: string
          need: string
          neighborhood: string
          senior_id: string | null
          senior_name: string
          signals: string[]
          status: string
          summary: string
          transcript: Json
          trend: string
          updated_at: string
          visit_note: string
          visited_at: string | null
          volunteer_id: string | null
          volunteer_name: string
        }
        Insert: {
          accepted_at?: string | null
          arrived_at?: string | null
          created_at?: string
          created_by: string
          duration_min?: number
          family_notified?: boolean
          id?: string
          is_simulated?: boolean
          loneliness_score?: number | null
          memory_note?: string
          mood: string
          need: string
          neighborhood?: string
          senior_id?: string | null
          senior_name: string
          signals?: string[]
          status?: string
          summary?: string
          transcript?: Json
          trend?: string
          updated_at?: string
          visit_note?: string
          visited_at?: string | null
          volunteer_id?: string | null
          volunteer_name?: string
        }
        Update: {
          accepted_at?: string | null
          arrived_at?: string | null
          created_at?: string
          created_by?: string
          duration_min?: number
          family_notified?: boolean
          id?: string
          is_simulated?: boolean
          loneliness_score?: number | null
          memory_note?: string
          mood?: string
          need?: string
          neighborhood?: string
          senior_id?: string | null
          senior_name?: string
          signals?: string[]
          status?: string
          summary?: string
          transcript?: Json
          trend?: string
          updated_at?: string
          visit_note?: string
          visited_at?: string | null
          volunteer_id?: string | null
          volunteer_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "alerts_senior_id_fkey"
            columns: ["senior_id"]
            isOneToOne: false
            referencedRelation: "seniors"
            referencedColumns: ["id"]
          },
        ]
      }
      call_job_state: {
        Row: {
          id: number
          locked_until: string | null
          paused_reason: string
        }
        Insert: {
          id?: number
          locked_until?: string | null
          paused_reason?: string
        }
        Update: {
          id?: number
          locked_until?: string | null
          paused_reason?: string
        }
        Relationships: []
      }
      call_logs: {
        Row: {
          acepta_llamada: boolean | null
          acepta_llamadas_diarias: boolean | null
          activar_protocolo_voy_yo: boolean | null
          call_sid: string | null
          conversation_id: string | null
          created_at: string
          duracion_seg: number | null
          global_pct: number | null
          id: string
          llamada_inicio: string | null
          motivo: string | null
          nivel_alerta: string | null
          nombre: string | null
          person_id: string
          report: Json | null
          status: string
          telefono_usuario: string | null
        }
        Insert: {
          acepta_llamada?: boolean | null
          acepta_llamadas_diarias?: boolean | null
          activar_protocolo_voy_yo?: boolean | null
          call_sid?: string | null
          conversation_id?: string | null
          created_at?: string
          duracion_seg?: number | null
          global_pct?: number | null
          id?: string
          llamada_inicio?: string | null
          motivo?: string | null
          nivel_alerta?: string | null
          nombre?: string | null
          person_id: string
          report?: Json | null
          status?: string
          telefono_usuario?: string | null
        }
        Update: {
          acepta_llamada?: boolean | null
          acepta_llamadas_diarias?: boolean | null
          activar_protocolo_voy_yo?: boolean | null
          call_sid?: string | null
          conversation_id?: string | null
          created_at?: string
          duracion_seg?: number | null
          global_pct?: number | null
          id?: string
          llamada_inicio?: string | null
          motivo?: string | null
          nivel_alerta?: string | null
          nombre?: string | null
          person_id?: string
          report?: Json | null
          status?: string
          telefono_usuario?: string | null
        }
        Relationships: []
      }
      call_schedules: {
        Row: {
          active: boolean
          call_hour: number
          created_at: string
          created_by: string
          days: number[]
          id: string
          last_error: string
          last_run_on: string | null
          senior_id: string | null
          senior_name: string
        }
        Insert: {
          active?: boolean
          call_hour?: number
          created_at?: string
          created_by: string
          days?: number[]
          id?: string
          last_error?: string
          last_run_on?: string | null
          senior_id?: string | null
          senior_name: string
        }
        Update: {
          active?: boolean
          call_hour?: number
          created_at?: string
          created_by?: string
          days?: number[]
          id?: string
          last_error?: string
          last_run_on?: string | null
          senior_id?: string | null
          senior_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "call_schedules_senior_id_fkey"
            columns: ["senior_id"]
            isOneToOne: false
            referencedRelation: "seniors"
            referencedColumns: ["id"]
          },
        ]
      }
      check_ins: {
        Row: {
          created_at: string
          id: string
          mood: string
          senior_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          mood: string
          senior_id: string
        }
        Update: {
          created_at?: string
          id?: string
          mood?: string
          senior_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "check_ins_senior_id_fkey"
            columns: ["senior_id"]
            isOneToOne: false
            referencedRelation: "seniors"
            referencedColumns: ["id"]
          },
        ]
      }
      coordinators: {
        Row: {
          created_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          user_id?: string
        }
        Relationships: []
      }
      demo_members: {
        Row: {
          kind: string
          user_id: string
        }
        Insert: {
          kind: string
          user_id: string
        }
        Update: {
          kind?: string
          user_id?: string
        }
        Relationships: []
      }
      loneliness_scores: {
        Row: {
          created_at: string
          created_by: string
          id: string
          q1: number
          q2: number
          q3: number
          score: number | null
          senior_id: string | null
          senior_name: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          q1: number
          q2: number
          q3: number
          score?: number | null
          senior_id?: string | null
          senior_name: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          q1?: number
          q2?: number
          q3?: number
          score?: number | null
          senior_id?: string | null
          senior_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "loneliness_scores_senior_id_fkey"
            columns: ["senior_id"]
            isOneToOne: false
            referencedRelation: "seniors"
            referencedColumns: ["id"]
          },
        ]
      }
      organization: {
        Row: {
          email: string
          id: number
          name: string
          neighborhood: string
          phone: string
          updated_at: string
        }
        Insert: {
          email?: string
          id?: number
          name?: string
          neighborhood?: string
          phone?: string
          updated_at?: string
        }
        Update: {
          email?: string
          id?: number
          name?: string
          neighborhood?: string
          phone?: string
          updated_at?: string
        }
        Relationships: []
      }
      person_links: {
        Row: {
          created_at: string
          id: string
          relation: string
          requested_age: number | null
          requested_name: string
          requested_phone: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          senior_id: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          relation?: string
          requested_age?: number | null
          requested_name?: string
          requested_phone?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          senior_id?: string | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          relation?: string
          requested_age?: number | null
          requested_name?: string
          requested_phone?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          senior_id?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "person_links_senior_id_fkey"
            columns: ["senior_id"]
            isOneToOne: false
            referencedRelation: "seniors"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          neighborhood: string
          persona: string
          phone: string
          senior_name: string
          senior_relation: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name: string
          id: string
          neighborhood?: string
          persona: string
          phone?: string
          senior_name?: string
          senior_relation?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          neighborhood?: string
          persona?: string
          phone?: string
          senior_name?: string
          senior_relation?: string
          updated_at?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          consent: boolean
          created_at: string
          id: string
          kind: string
          neighborhood: string
          person_age: number | null
          person_name: string
          person_phone: string
          referrer_code: string
          referrer_name: string
          referrer_phone: string
          relation: string
          status: string
          via_code: string
        }
        Insert: {
          consent?: boolean
          created_at?: string
          id?: string
          kind?: string
          neighborhood?: string
          person_age?: number | null
          person_name: string
          person_phone?: string
          referrer_code?: string
          referrer_name?: string
          referrer_phone?: string
          relation?: string
          status?: string
          via_code?: string
        }
        Update: {
          consent?: boolean
          created_at?: string
          id?: string
          kind?: string
          neighborhood?: string
          person_age?: number | null
          person_name?: string
          person_phone?: string
          referrer_code?: string
          referrer_name?: string
          referrer_phone?: string
          relation?: string
          status?: string
          via_code?: string
        }
        Relationships: []
      }
      senior_care: {
        Row: {
          appointments: string
          birthday: string
          created_by: string
          id: string
          key_contact_name: string
          key_contact_phone: string
          meds: string
          senior_id: string | null
          senior_name: string
          updated_at: string
        }
        Insert: {
          appointments?: string
          birthday?: string
          created_by: string
          id?: string
          key_contact_name?: string
          key_contact_phone?: string
          meds?: string
          senior_id?: string | null
          senior_name: string
          updated_at?: string
        }
        Update: {
          appointments?: string
          birthday?: string
          created_by?: string
          id?: string
          key_contact_name?: string
          key_contact_phone?: string
          meds?: string
          senior_id?: string | null
          senior_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "senior_care_senior_id_fkey"
            columns: ["senior_id"]
            isOneToOne: false
            referencedRelation: "seniors"
            referencedColumns: ["id"]
          },
        ]
      }
      seniors: {
        Row: {
          active: boolean
          address: string
          age: number | null
          created_at: string
          family_contact: string
          id: string
          is_demo: boolean
          name: string
          neighborhood: string
          notes: string
          phone: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          address?: string
          age?: number | null
          created_at?: string
          family_contact?: string
          id?: string
          is_demo?: boolean
          name: string
          neighborhood?: string
          notes?: string
          phone?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          address?: string
          age?: number | null
          created_at?: string
          family_contact?: string
          id?: string
          is_demo?: boolean
          name?: string
          neighborhood?: string
          notes?: string
          phone?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      volunteers: {
        Row: {
          available: boolean
          created_at: string
          id: string
          name: string
          neighborhood: string
          phone: string
          updated_at: string
        }
        Insert: {
          available?: boolean
          created_at?: string
          id?: string
          name: string
          neighborhood?: string
          phone?: string
          updated_at?: string
        }
        Update: {
          available?: boolean
          created_at?: string
          id?: string
          name?: string
          neighborhood?: string
          phone?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_alert: { Args: { _id: string }; Returns: boolean }
      add_demo_person: {
        Args: { _age: number; _name: string; _phone: string; _relation: string }
        Returns: string
      }
      arrive_alert: { Args: { _id: string }; Returns: boolean }
      can_care: { Args: { _sid: string; _uid?: string }; Returns: boolean }
      can_manage_person: { Args: { _sid: string }; Returns: boolean }
      complete_alert: {
        Args: { _id: string; _note?: string }
        Returns: boolean
      }
      demo_people: {
        Args: never
        Returns: {
          age: number
          name: string
        }[]
      }
      demo_volunteer: { Args: never; Returns: string }
      eligible_alert: {
        Args: {
          _a: Database["public"]["Tables"]["alerts"]["Row"]
          _uid: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_ong: { Args: { _uid: string }; Returns: boolean }
      manage_person: {
        Args: {
          _age?: number
          _delete: boolean
          _name?: string
          _phone?: string
          _relation?: string
          _sid: string
        }
        Returns: boolean
      }
      person_edit_details: { Args: { _sid: string }; Returns: Json }
      person_options: {
        Args: never
        Returns: {
          id: string
          name: string
          relation: string
        }[]
      }
      referral_count: { Args: { _code: string }; Returns: number }
      release_alert: { Args: { _id: string }; Returns: boolean }
      review_person_link: {
        Args: { _approve: boolean; _id: string; _senior: string }
        Returns: boolean
      }
      visible_alerts: {
        Args: { _offset?: number; _senior?: string }
        Returns: {
          accepted_at: string | null
          arrived_at: string | null
          created_at: string
          created_by: string
          duration_min: number
          family_notified: boolean
          id: string
          is_simulated: boolean
          loneliness_score: number | null
          memory_note: string
          mood: string
          need: string
          neighborhood: string
          senior_id: string | null
          senior_name: string
          signals: string[]
          status: string
          summary: string
          transcript: Json
          trend: string
          updated_at: string
          visit_note: string
          visited_at: string | null
          volunteer_id: string | null
          volunteer_name: string
        }[]
        SetofOptions: {
          from: "*"
          to: "alerts"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      visit_allowed: { Args: { _id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin"],
    },
  },
} as const
