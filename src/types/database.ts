// Generado desde el esquema real de Supabase (mcp__Supabase__generate_typescript_types).
// Regenerar cada vez que cambie el esquema (no editar a mano).
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
      activities: {
        Row: {
          config: Json
          created_at: string
          game_template_id: string
          id: string
          lesson_id: string
          lesson_section_id: string | null
          max_score: number
          position: number
          title: string
          updated_at: string
        }
        Insert: {
          config: Json
          created_at?: string
          game_template_id: string
          id?: string
          lesson_id: string
          lesson_section_id?: string | null
          max_score?: number
          position: number
          title: string
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          game_template_id?: string
          id?: string
          lesson_id?: string
          lesson_section_id?: string | null
          max_score?: number
          position?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_game_template_id_fkey"
            columns: ["game_template_id"]
            isOneToOne: false
            referencedRelation: "game_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_lesson_section_id_fkey"
            columns: ["lesson_section_id"]
            isOneToOne: false
            referencedRelation: "lesson_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      course_members: {
        Row: {
          course_id: string
          id: string
          joined_at: string
          student_id: string
        }
        Insert: {
          course_id: string
          id?: string
          joined_at?: string
          student_id: string
        }
        Update: {
          course_id?: string
          id?: string
          joined_at?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_members_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_members_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          archived: boolean
          created_at: string
          description: string | null
          id: string
          name: string
          school_year: string | null
          subject: string | null
          teacher_id: string
          updated_at: string
        }
        Insert: {
          archived?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name: string
          school_year?: string | null
          subject?: string | null
          teacher_id: string
          updated_at?: string
        }
        Update: {
          archived?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          school_year?: string | null
          subject?: string | null
          teacher_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      game_templates: {
        Row: {
          active: boolean
          category: string
          compatible_subjects: Json
          config_schema: Json
          created_at: string
          default_config: Json
          description: string | null
          id: string
          name: string
          recommended_difficulty: string | null
        }
        Insert: {
          active?: boolean
          category: string
          compatible_subjects?: Json
          config_schema: Json
          created_at?: string
          default_config?: Json
          description?: string | null
          id: string
          name: string
          recommended_difficulty?: string | null
        }
        Update: {
          active?: boolean
          category?: string
          compatible_subjects?: Json
          config_schema?: Json
          created_at?: string
          default_config?: Json
          description?: string | null
          id?: string
          name?: string
          recommended_difficulty?: string | null
        }
        Relationships: []
      }
      lesson_sections: {
        Row: {
          content: Json
          created_at: string
          id: string
          lesson_id: string
          position: number
          section_type: string
          title: string
          updated_at: string
        }
        Insert: {
          content?: Json
          created_at?: string
          id?: string
          lesson_id: string
          position: number
          section_type: string
          title: string
          updated_at?: string
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          lesson_id?: string
          position?: number
          section_type?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_sections_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          access_code: string | null
          course_id: string | null
          created_at: string
          difficulty: string | null
          generation_error: string | null
          id: string
          learning_objectives: Json
          material_id: string | null
          published_at: string | null
          school_year: string | null
          status: string
          subject: string | null
          summary: string | null
          teacher_id: string
          title: string
          topic: string | null
          updated_at: string
        }
        Insert: {
          access_code?: string | null
          course_id?: string | null
          created_at?: string
          difficulty?: string | null
          generation_error?: string | null
          id?: string
          learning_objectives?: Json
          material_id?: string | null
          published_at?: string | null
          school_year?: string | null
          status?: string
          subject?: string | null
          summary?: string | null
          teacher_id: string
          title: string
          topic?: string | null
          updated_at?: string
        }
        Update: {
          access_code?: string | null
          course_id?: string | null
          created_at?: string
          difficulty?: string | null
          generation_error?: string | null
          id?: string
          learning_objectives?: Json
          material_id?: string | null
          published_at?: string | null
          school_year?: string | null
          status?: string
          subject?: string | null
          summary?: string | null
          teacher_id?: string
          title?: string
          topic?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      materials: {
        Row: {
          course_id: string | null
          created_at: string
          extraction_error: string | null
          extraction_status: string
          id: string
          original_filename: string | null
          raw_text: string | null
          source_type: string
          storage_path: string | null
          teacher_id: string
        }
        Insert: {
          course_id?: string | null
          created_at?: string
          extraction_error?: string | null
          extraction_status?: string
          id?: string
          original_filename?: string | null
          raw_text?: string | null
          source_type: string
          storage_path?: string | null
          teacher_id: string
        }
        Update: {
          course_id?: string | null
          created_at?: string
          extraction_error?: string | null
          extraction_status?: string
          id?: string
          original_filename?: string | null
          raw_text?: string | null
          source_type?: string
          storage_path?: string | null
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "materials_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "materials_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          role: string
          school_name: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name: string
          id: string
          role?: string
          school_name?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          role?: string
          school_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      sessions: {
        Row: {
          completed_at: string | null
          id: string
          lesson_id: string
          started_at: string
          status: string
          student_id: string
          total_score: number
        }
        Insert: {
          completed_at?: string | null
          id?: string
          lesson_id: string
          started_at?: string
          status?: string
          student_id: string
          total_score?: number
        }
        Update: {
          completed_at?: string | null
          id?: string
          lesson_id?: string
          started_at?: string
          status?: string
          student_id?: string
          total_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "sessions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_progress: {
        Row: {
          badges: Json
          course_id: string
          id: string
          lessons_completed: number
          student_id: string
          total_points: number
          updated_at: string
        }
        Insert: {
          badges?: Json
          course_id: string
          id?: string
          lessons_completed?: number
          student_id: string
          total_points?: number
          updated_at?: string
        }
        Update: {
          badges?: Json
          course_id?: string
          id?: string
          lessons_completed?: number
          student_id?: string
          total_points?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_progress_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_responses: {
        Row: {
          activity_id: string
          id: string
          is_correct: boolean | null
          responded_at: string
          response: Json
          score: number
          session_id: string
        }
        Insert: {
          activity_id: string
          id?: string
          is_correct?: boolean | null
          responded_at?: string
          response: Json
          score?: number
          session_id: string
        }
        Update: {
          activity_id?: string
          id?: string
          is_correct?: boolean | null
          responded_at?: string
          response?: Json
          score?: number
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_responses_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_responses_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          access_code: string
          created_at: string
          display_name: string
          id: string
        }
        Insert: {
          access_code: string
          created_at?: string
          display_name: string
          id?: string
        }
        Update: {
          access_code?: string
          created_at?: string
          display_name?: string
          id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
