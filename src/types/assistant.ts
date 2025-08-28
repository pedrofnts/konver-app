export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

export interface KnowledgeFile {
  id: string;
  name: string;
  type: string;
  size: string;
  path: string;
}

export interface AssistantData {
  id: string;
  name: string;
  description: string | null;
  status: string;
  conversations: number;
  performance: number;
  prompt: string | null;
  temperature: number | null;
  max_tokens: number | null;
  knowledge_base: KnowledgeFile[] | null;
  persona_name: string | null;
  persona_objective: string | null;
  persona_personality: string | null;
  persona_style: string | null;
  persona_target_audience: string | null;
  company_name?: string | null;
  company_address?: string | null;
  company_website?: string | null;
  company_instagram?: string | null;
  company_business_hours?: string | null;
  created_at: string;
  updated_at: string;
}

// Flow System Types
export type FlowActionType = 'whatsapp_message' | 'kommo_field_update' | 'stop_conversation';

export interface FlowActionConfig {
  // WhatsApp Message Config
  message?: string;
  phone_number?: string;
  
  // Kommo Field Update Config
  field_name?: string;
  field_value?: string;
  
  // Stop Conversation Config
  reason?: string;
}

export interface FlowAction {
  id: string;
  flow_id: string;
  action_type: FlowActionType;
  sequence_order: number;
  config: FlowActionConfig;
  created_at: string;
}

export interface Flow {
  id: string;
  bot_id: string;
  user_id: string;
  name: string;
  description: string | null;
  intent_description: string;
  is_active: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
  actions?: FlowAction[];
}

export interface CreateFlowData {
  bot_id: string;
  name: string;
  description?: string;
  intent_description: string;
  is_active?: boolean;
  priority?: number;
}

export interface UpdateFlowData {
  name?: string;
  description?: string;
  intent_description?: string;
  is_active?: boolean;
  priority?: number;
}

export interface CreateFlowActionData {
  flow_id: string;
  action_type: FlowActionType;
  sequence_order: number;
  config: FlowActionConfig;
} 