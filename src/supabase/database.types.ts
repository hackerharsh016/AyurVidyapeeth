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
      course_sections: {
        Row: {
          course_id: string | null
          id: string
          sort_order: number | null
          title: string | null
        }
        Insert: {
          course_id?: string | null
          id?: string
          sort_order?: number | null
          title?: string | null
        }
        Update: {
          course_id?: string | null
          id?: string
          sort_order?: number | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_sections_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          category: string | null
          created_at: string | null
          creator_id: string | null
          description: string | null
          id: string
          language: string | null
          level: string | null
          price: number | null
          rating: number | null
          status: string | null
          students_count: number | null
          subject: string | null
          subtitle: string | null
          thumbnail_url: string | null
          title: string
          total_lessons: number | null
          what_you_learn: string[] | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          creator_id?: string | null
          description?: string | null
          id?: string
          language?: string | null
          level?: string | null
          price?: number | null
          rating?: number | null
          status?: string | null
          students_count?: number | null
          subject?: string | null
          subtitle?: string | null
          thumbnail_url?: string | null
          title: string
          total_lessons?: number | null
          what_you_learn?: string[] | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          creator_id?: string | null
          description?: string | null
          id?: string
          language?: string | null
          level?: string | null
          price?: number | null
          rating?: number | null
          status?: string | null
          students_count?: number | null
          subject?: string | null
          subtitle?: string | null
          thumbnail_url?: string | null
          title?: string
          total_lessons?: number | null
          what_you_learn?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "courses_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      directory_entries: {
        Row: {
          characteristics: string[] | null
          content: Json | null
          created_at: string | null
          definition: string | null
          disorders: string[] | null
          dushti: string | null
          english_name: string | null
          etiology: string | null
          functions: string[] | null
          id: string
          introduction: string | null
          meaning: string | null
          moolasthana: string | null
          origin: string | null
          panchabhautikatva: string | null
          prakar_charak: string | null
          prakar_sushruta: string | null
          related_course_ids: string[] | null
          sankhya: string | null
          sanskrit_name: string | null
          slug: string | null
          summary: string | null
          swaroop: string | null
          synonyms: string[] | null
          title: string | null
          treatment_principles: string[] | null
          type: string | null
          types_description: string | null
          viddha_lakshan: string | null
        }
        Insert: {
          characteristics?: string[] | null
          content?: Json | null
          created_at?: string | null
          definition?: string | null
          disorders?: string[] | null
          dushti?: string | null
          english_name?: string | null
          etiology?: string | null
          functions?: string[] | null
          id?: string
          introduction?: string | null
          meaning?: string | null
          moolasthana?: string | null
          origin?: string | null
          panchabhautikatva?: string | null
          prakar_charak?: string | null
          prakar_sushruta?: string | null
          related_course_ids?: string[] | null
          sankhya?: string | null
          sanskrit_name?: string | null
          slug?: string | null
          summary?: string | null
          swaroop?: string | null
          synonyms?: string[] | null
          title?: string | null
          treatment_principles?: string[] | null
          type?: string | null
          types_description?: string | null
          viddha_lakshan?: string | null
        }
        Update: {
          characteristics?: string[] | null
          content?: Json | null
          created_at?: string | null
          definition?: string | null
          disorders?: string[] | null
          dushti?: string | null
          english_name?: string | null
          etiology?: string | null
          functions?: string[] | null
          id?: string
          introduction?: string | null
          meaning?: string | null
          moolasthana?: string | null
          origin?: string | null
          panchabhautikatva?: string | null
          prakar_charak?: string | null
          prakar_sushruta?: string | null
          related_course_ids?: string[] | null
          sankhya?: string | null
          sanskrit_name?: string | null
          slug?: string | null
          summary?: string | null
          swaroop?: string | null
          synonyms?: string[] | null
          title?: string | null
          treatment_principles?: string[] | null
          type?: string | null
          types_description?: string | null
          viddha_lakshan?: string | null
        }
        Relationships: []
      }
      enrollments: {
        Row: {
          course_id: string | null
          enrolled_at: string | null
          id: string
          payment_status: string | null
          user_id: string | null
        }
        Insert: {
          course_id?: string | null
          enrolled_at?: string | null
          id?: string
          payment_status?: string | null
          user_id?: string | null
        }
        Update: {
          course_id?: string | null
          enrolled_at?: string | null
          id?: string
          payment_status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      homepage_topics: {
        Row: {
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          label: string
          slug: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          label: string
          slug: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          label?: string
          slug?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      lessons: {
        Row: {
          duration: number | null
          id: string
          is_preview: boolean | null
          section_id: string | null
          sort_order: number | null
          title: string | null
          video_url: string | null
        }
        Insert: {
          duration?: number | null
          id?: string
          is_preview?: boolean | null
          section_id?: string | null
          sort_order?: number | null
          title?: string | null
          video_url?: string | null
        }
        Update: {
          duration?: number | null
          id?: string
          is_preview?: boolean | null
          section_id?: string | null
          sort_order?: number | null
          title?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "course_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          college: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          role: string | null
          year: string | null
        }
        Insert: {
          avatar_url?: string | null
          college?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          role?: string | null
          year?: string | null
        }
        Update: {
          avatar_url?: string | null
          college?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          role?: string | null
          year?: string | null
        }
        Relationships: []
      }
      progress: {
        Row: {
          completed: boolean | null
          id: string
          lesson_id: string | null
          updated_at: string | null
          user_id: string | null
          watched_seconds: number | null
        }
        Insert: {
          completed?: boolean | null
          id?: string
          lesson_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          watched_seconds?: number | null
        }
        Update: {
          completed?: boolean | null
          id?: string
          lesson_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          watched_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          comment: string | null
          course_id: string | null
          created_at: string | null
          id: string
          rating: number | null
          user_id: string | null
        }
        Insert: {
          comment?: string | null
          course_id?: string | null
          created_at?: string | null
          id?: string
          rating?: number | null
          user_id?: string | null
        }
        Update: {
          comment?: string | null
          course_id?: string | null
          created_at?: string | null
          id?: string
          rating?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wishlists: {
        Row: {
          course_id: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          course_id?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          course_id?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wishlists_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: never; Returns: boolean }
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
    Enums: {},
  },
} as const
