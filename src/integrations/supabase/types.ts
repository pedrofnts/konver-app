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
      conversation_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          message_type: string
          metadata: Json | null
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          message_type: string
          metadata?: Json | null
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          message_type?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "conversation_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "external_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      external_conversations: {
        Row: {
          bot_id: string
          created_at: string
          external_id: string | null
          id: string
          last_message_at: string | null
          metadata: Json | null
          phone_number: string
          status: string
          updated_at: string
          user_name: string
        }
        Insert: {
          bot_id: string
          created_at?: string
          external_id?: string | null
          id?: string
          last_message_at?: string | null
          metadata?: Json | null
          phone_number: string
          status?: string
          updated_at?: string
          user_name: string
        }
        Update: {
          bot_id?: string
          created_at?: string
          external_id?: string | null
          id?: string
          last_message_at?: string | null
          metadata?: Json | null
          phone_number?: string
          status?: string
          updated_at?: string
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "external_conversations_bot_id_fkey"
            columns: ["bot_id"]
            isOneToOne: false
            referencedRelation: "bots"
            referencedColumns: ["id"]
          },
        ]
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
      message_feedback: {
        Row: {
          bot_id: string | null
          conversation_context: Json | null
          conversation_message_id: string | null
          created_at: string | null
          created_by_user_id: string | null
          id: string
          improved_response: string
          last_applied_at: string | null
          original_bot_response: string
          similarity_keywords: string[] | null
          status: Database["public"]["Enums"]["feedback_status"]
          times_applied: number | null
          updated_at: string | null
          user_message_context: string
        }
        Insert: {
          bot_id?: string | null
          conversation_context?: Json | null
          conversation_message_id?: string | null
          created_at?: string | null
          created_by_user_id?: string | null
          id?: string
          improved_response: string
          last_applied_at?: string | null
          original_bot_response: string
          similarity_keywords?: string[] | null
          status?: Database["public"]["Enums"]["feedback_status"]
          times_applied?: number | null
          updated_at?: string | null
          user_message_context: string
        }
        Update: {
          bot_id?: string | null
          conversation_context?: Json | null
          conversation_message_id?: string | null
          created_at?: string | null
          created_by_user_id?: string | null
          id?: string
          improved_response?: string
          last_applied_at?: string | null
          original_bot_response?: string
          similarity_keywords?: string[] | null
          status?: Database["public"]["Enums"]["feedback_status"]
          times_applied?: number | null
          updated_at?: string | null
          user_message_context?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_feedback_bot_id_fkey"
            columns: ["bot_id"]
            isOneToOne: false
            referencedRelation: "bots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_feedback_conversation_message_id_fkey"
            columns: ["conversation_message_id"]
            isOneToOne: false
            referencedRelation: "conversation_messages"
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
      message_feedback_with_context: {
        Row: {
          bot_id: string | null
          conversation_context: Json | null
          conversation_created_at: string | null
          conversation_message_id: string | null
          conversation_status: string | null
          created_at: string | null
          created_by_user_id: string | null
          id: string | null
          improved_response: string | null
          last_applied_at: string | null
          message_content: string | null
          message_created_at: string | null
          message_type: string | null
          original_bot_response: string | null
          phone_number: string | null
          similarity_keywords: string[] | null
          status: Database["public"]["Enums"]["feedback_status"] | null
          times_applied: number | null
          updated_at: string | null
          user_message_context: string | null
          user_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "message_feedback_bot_id_fkey"
            columns: ["bot_id"]
            isOneToOne: false
            referencedRelation: "bots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_feedback_conversation_message_id_fkey"
            columns: ["conversation_message_id"]
            isOneToOne: false
            referencedRelation: "conversation_messages"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      extract_keywords_from_text: {
        Args: { input_text: string }
        Returns: string[]
      }
    }
    Enums: {
      feedback_status: "pending" | "applied" | "rejected" | "in_review"
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
      feedback_status: ["pending", "applied", "rejected", "in_review"],
    },
  },
} as const

// Additional types for the application
export type MessageType = 'user' | 'bot';
export type ConversationStatus = 'active' | 'archived' | 'blocked';
export type FeedbackStatus = 'pending' | 'applied' | 'rejected' | 'in_review';

export interface ConversationMessage {
  id: string;
  conversation_id: string;
  message_type: MessageType;
  content: string;
  metadata?: Json;
  created_at: string;
}

export interface ExternalConversation {
  id: string;
  bot_id: string;
  user_name: string;
  phone_number: string;
  status: ConversationStatus;
  external_id?: string;
  metadata?: Json;
  last_message_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ConversationWithMessages extends ExternalConversation {
  messages: ConversationMessage[];
  bot?: {
    id: string;
    name: string;
  };
}

export interface MessageFeedback {
  id: string;
  conversation_message_id?: string;
  bot_id?: string;
  created_by_user_id?: string;
  user_message_context: string;
  original_bot_response: string;
  improved_response: string;
  status: FeedbackStatus;
  similarity_keywords?: string[];
  conversation_context?: Json;
  times_applied?: number;
  last_applied_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface MessageFeedbackWithContext extends MessageFeedback {
  message_content?: string;
  message_created_at?: string;
  user_name?: string;
  phone_number?: string;
  conversation_status?: string;
  conversation_created_at?: string;
  message_type?: string;
}

// Tipos para versionamento de prompts
export type PromptType = 'principal' | 'triagem' | 'think';

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
  updated_at?: string;
}

export interface CreatePromptVersionRequest {
  bot_id: string;
  user_id: string;
  prompt_type: PromptType;
  content: string;
  description?: string;
  is_active?: boolean;
}

export interface PromptVersionsByType {
  active: PromptVersion | null;
  versions: PromptVersion[];
}

export interface PromptVersionSummary {
  principal: PromptVersionsByType;
  triagem: PromptVersionsByType;
  think: PromptVersionsByType;
}
