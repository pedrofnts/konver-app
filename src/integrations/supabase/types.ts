export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      bots: {
        Row: {
          conversations: number
          created_at: string
          description: string | null
          id: string
          max_tokens: number | null
          name: string
          performance: number
          persona_name: string | null
          persona_objective: string | null
          persona_personality: string | null
          persona_style: string | null
          persona_target_audience: string | null
          prompt: string | null
          status: string
          temperature: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          conversations?: number
          created_at?: string
          description?: string | null
          id?: string
          max_tokens?: number | null
          name: string
          performance?: number
          persona_name?: string | null
          persona_objective?: string | null
          persona_personality?: string | null
          persona_style?: string | null
          persona_target_audience?: string | null
          prompt?: string | null
          status?: string
          temperature?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          conversations?: number
          created_at?: string
          description?: string | null
          id?: string
          max_tokens?: number | null
          name?: string
          performance?: number
          persona_name?: string | null
          persona_objective?: string | null
          persona_personality?: string | null
          persona_style?: string | null
          persona_target_audience?: string | null
          prompt?: string | null
          status?: string
          temperature?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      knowledge_base_files: {
        Row: {
          bot_id: string
          chunks_count: number
          created_at: string
          file_name: string
          file_size: string
          file_type: string
          id: string
          metadata: Json | null
          status: string
          storage_path: string
          updated_at: string
          user_id: string
        }
        Insert: {
          bot_id: string
          chunks_count?: number
          created_at?: string
          file_name: string
          file_size: string
          file_type: string
          id?: string
          metadata?: Json | null
          status?: string
          storage_path: string
          updated_at?: string
          user_id: string
        }
        Update: {
          bot_id?: string
          chunks_count?: number
          created_at?: string
          file_name?: string
          file_size?: string
          file_type?: string
          id?: string
          metadata?: Json | null
          status?: string
          storage_path?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_base_files_bot_id_fkey"
            columns: ["bot_id"]
            isOneToOne: false
            referencedRelation: "bots"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      prompt_versions: {
        Row: {
          bot_id: string
          content: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          prompt_type: string
          updated_at: string | null
          user_id: string
          version_number: number
        }
        Insert: {
          bot_id: string
          content: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          prompt_type: string
          updated_at?: string | null
          user_id: string
          version_number: number
        }
        Update: {
          bot_id?: string
          content?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          prompt_type?: string
          updated_at?: string | null
          user_id?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "prompt_versions_bot_id_fkey"
            columns: ["bot_id"]
            isOneToOne: false
            referencedRelation: "bots"
            referencedColumns: ["id"]
          },
        ]
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

// Tipos personalizados para o sistema de versionamento de prompts
export type PromptType = 'principal' | 'triagem';

export interface PromptVersion {
  id: string;
  bot_id: string;
  user_id: string;
  prompt_type: PromptType;
  content: string;
  version_number: number;
  is_active: boolean;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface CreatePromptVersionRequest {
  bot_id: string;
  prompt_type: PromptType;
  content: string;
  description?: string;
  is_active?: boolean;
}

export interface PromptVersionSummary {
  principal: {
    active: PromptVersion | null;
    versions: PromptVersion[];
  };
  triagem: {
    active: PromptVersion | null;
    versions: PromptVersion[];
  };
}
