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
  created_at: string;
  updated_at: string;
} 