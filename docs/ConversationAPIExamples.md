# Exemplos de API - Conversas do Assistente

## 🚀 Exemplos Práticos

### 1. Adicionar Conversa e Mensagem (React/TypeScript)

```typescript
import { supabase } from "@/integrations/supabase/client";
import { ExternalConversation, ConversationMessage } from "@/integrations/supabase/types";

// Função para criar ou atualizar uma conversa
export async function createOrUpdateConversation(data: {
  bot_id: string;
  user_name: string;
  phone_number: string;
  external_id?: string;
  status?: 'active' | 'archived' | 'blocked';
  metadata?: any;
}) {
  const { data: conversation, error } = await supabase
    .from('external_conversations')
    .upsert({
      bot_id: data.bot_id,
      user_name: data.user_name,
      phone_number: data.phone_number,
      external_id: data.external_id,
      status: data.status || 'active',
      metadata: data.metadata || {}
    }, {
      onConflict: data.external_id ? 'external_id,bot_id' : 'phone_number,bot_id'
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao criar conversa: ${error.message}`);
  }

  return conversation;
}

// Função para adicionar mensagem à conversa
export async function addMessage(data: {
  conversation_id: string;
  message_type: 'user' | 'bot';
  content: string;
  metadata?: any;
}) {
  const { data: message, error } = await supabase
    .from('conversation_messages')
    .insert({
      conversation_id: data.conversation_id,
      message_type: data.message_type,
      content: data.content,
      metadata: data.metadata || {}
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao adicionar mensagem: ${error.message}`);
  }

  return message;
}

// Exemplo de uso completo
export async function handleIncomingMessage(
  botId: string,
  userName: string,
  phoneNumber: string,
  messageContent: string,
  externalId?: string
) {
  try {
    // 1. Criar/atualizar conversa
    const conversation = await createOrUpdateConversation({
      bot_id: botId,
      user_name: userName,
      phone_number: phoneNumber,
      external_id: externalId,
      status: 'active',
      metadata: {
        platform: 'whatsapp',
        last_interaction: new Date().toISOString()
      }
    });

    // 2. Adicionar mensagem do usuário
    const userMessage = await addMessage({
      conversation_id: conversation.id,
      message_type: 'user',
      content: messageContent,
      metadata: {
        whatsapp_id: externalId,
        received_at: new Date().toISOString()
      }
    });

    // 3. Processar com IA e responder
    const botResponse = await processWithAI(messageContent, conversation.id);
    
    const botMessage = await addMessage({
      conversation_id: conversation.id,
      message_type: 'bot',
      content: botResponse,
      metadata: {
        ai_confidence: 0.95,
        response_time_ms: 1200
      }
    });

    return { conversation, userMessage, botMessage };
  } catch (error) {
    console.error('Erro ao processar mensagem:', error);
    throw error;
  }
}
```

### 2. Webhook do WhatsApp Business API

```typescript
// webhook.ts - Endpoint para receber mensagens do WhatsApp
import express from 'express';
import { createOrUpdateConversation, addMessage } from './conversation-api';

const app = express();
app.use(express.json());

app.post('/webhook/whatsapp', async (req, res) => {
  try {
    const { entry } = req.body;
    
    for (const change of entry) {
      const { messages } = change.changes[0].value;
      
      if (messages) {
        for (const message of messages) {
          await handleWhatsAppMessage(message);
        }
      }
    }
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('Erro no webhook:', error);
    res.status(500).send('Error');
  }
});

async function handleWhatsAppMessage(message: any) {
  const botId = 'seu-bot-id-aqui'; // ID do seu assistente
  
  // Extrair dados da mensagem do WhatsApp
  const phoneNumber = `+${message.from}`;
  const messageContent = message.text?.body || '';
  const whatsappMessageId = message.id;
  
  // Buscar informações do contato (você pode cachear isso)
  const contactName = await getContactName(message.from);
  
  // Processar mensagem
  await handleIncomingMessage(
    botId,
    contactName,
    phoneNumber,
    messageContent,
    whatsappMessageId
  );
}

async function getContactName(phoneNumber: string): Promise<string> {
  // Implementar busca do nome do contato
  // Pode ser via API do WhatsApp, banco de dados local, etc.
  return `Usuário ${phoneNumber.slice(-4)}`;
}
```

### 3. Hook React para Conversas

```typescript
// hooks/useConversations.ts
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { ExternalConversation, ConversationMessage } from "@/integrations/supabase/types";

interface ConversationWithMessages extends ExternalConversation {
  messages: ConversationMessage[];
  messageCount: number;
}

export function useConversations(botId: string) {
  const [conversations, setConversations] = useState<ConversationWithMessages[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('external_conversations')
        .select(`
          *,
          conversation_messages (
            id,
            message_type,
            content,
            created_at,
            metadata
          )
        `)
        .eq('bot_id', botId)
        .order('last_message_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      const conversationsWithData = (data || []).map(conv => ({
        ...conv,
        messages: conv.conversation_messages || [],
        messageCount: conv.conversation_messages?.length || 0
      }));

      setConversations(conversationsWithData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const updateConversationStatus = async (
    conversationId: string, 
    newStatus: 'active' | 'archived' | 'blocked'
  ) => {
    try {
      const { error } = await supabase
        .from('external_conversations')
        .update({ status: newStatus })
        .eq('id', conversationId);

      if (error) throw error;

      // Atualizar estado local
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId 
            ? { ...conv, status: newStatus }
            : conv
        )
      );

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar status');
      return false;
    }
  };

  // Subscrever a mudanças em tempo real
  useEffect(() => {
    const channel = supabase
      .channel('conversations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'external_conversations',
          filter: `bot_id=eq.${botId}`
        },
        () => {
          fetchConversations(); // Recarregar quando houver mudanças
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversation_messages'
        },
        () => {
          fetchConversations(); // Recarregar quando houver novas mensagens
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [botId]);

  useEffect(() => {
    if (botId) {
      fetchConversations();
    }
  }, [botId]);

  return {
    conversations,
    loading,
    error,
    refetch: fetchConversations,
    updateStatus: updateConversationStatus
  };
}
```

### 4. Componente de Conversa Simples

```tsx
// components/SimpleConversationView.tsx
import React from 'react';
import { useConversations } from '@/hooks/useConversations';

interface SimpleConversationViewProps {
  botId: string;
}

export function SimpleConversationView({ botId }: SimpleConversationViewProps) {
  const { conversations, loading, error, updateStatus } = useConversations(botId);

  if (loading) return <div>Carregando conversas...</div>;
  if (error) return <div>Erro: {error}</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Conversas do Assistente</h2>
      
      {conversations.length === 0 ? (
        <p>Nenhuma conversa encontrada.</p>
      ) : (
        <div className="grid gap-4">
          {conversations.map((conversation) => (
            <div 
              key={conversation.id} 
              className="border rounded-lg p-4 bg-white shadow"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold">{conversation.user_name}</h3>
                  <p className="text-sm text-gray-600">{conversation.phone_number}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${
                  conversation.status === 'active' ? 'bg-green-100 text-green-800' :
                  conversation.status === 'archived' ? 'bg-gray-100 text-gray-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {conversation.status}
                </span>
              </div>
              
              <div className="text-sm text-gray-700 mb-2">
                {conversation.messageCount} mensagens
              </div>
              
              {conversation.messages.length > 0 && (
                <div className="border-t pt-2 mt-2">
                  <p className="text-sm">
                    <strong>Última mensagem:</strong> {' '}
                    {conversation.messages[conversation.messages.length - 1].content}
                  </p>
                </div>
              )}
              
              <div className="flex gap-2 mt-3">
                {conversation.status === 'active' && (
                  <button
                    onClick={() => updateStatus(conversation.id, 'archived')}
                    className="px-3 py-1 bg-gray-500 text-white rounded text-xs"
                  >
                    Arquivar
                  </button>
                )}
                
                {conversation.status === 'archived' && (
                  <button
                    onClick={() => updateStatus(conversation.id, 'active')}
                    className="px-3 py-1 bg-green-500 text-white rounded text-xs"
                  >
                    Ativar
                  </button>
                )}
                
                <button
                  onClick={() => updateStatus(
                    conversation.id, 
                    conversation.status === 'blocked' ? 'active' : 'blocked'
                  )}
                  className={`px-3 py-1 rounded text-xs ${
                    conversation.status === 'blocked' 
                      ? 'bg-green-500 text-white' 
                      : 'bg-red-500 text-white'
                  }`}
                >
                  {conversation.status === 'blocked' ? 'Desbloquear' : 'Bloquear'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### 5. Utilitários para Desenvolvimento

```typescript
// utils/conversation-utils.ts

// Função para criar conversas de teste
export async function createTestConversations(botId: string, count: number = 5) {
  const testUsers = [
    { name: 'Ana Silva', phone: '+5511999888777' },
    { name: 'Carlos Oliveira', phone: '+5511988666555' },
    { name: 'Mariana Costa', phone: '+5511987654321' },
    { name: 'João Santos', phone: '+5511976543210' },
    { name: 'Lucia Ferreira', phone: '+5511965432109' }
  ];

  const conversations = [];

  for (let i = 0; i < Math.min(count, testUsers.length); i++) {
    const user = testUsers[i];
    
    const conversation = await createOrUpdateConversation({
      bot_id: botId,
      user_name: user.name,
      phone_number: user.phone,
      external_id: `test_chat_${i + 1}`,
      status: i % 3 === 0 ? 'archived' : 'active',
      metadata: {
        platform: 'test',
        created_by: 'development'
      }
    });

    // Adicionar algumas mensagens de teste
    await addMessage({
      conversation_id: conversation.id,
      message_type: 'user',
      content: `Olá! Esta é uma mensagem de teste do usuário ${user.name}.`
    });

    await addMessage({
      conversation_id: conversation.id,
      message_type: 'bot',
      content: `Olá ${user.name}! Sou seu assistente virtual. Como posso ajudar?`
    });

    conversations.push(conversation);
  }

  return conversations;
}

// Função para limpar conversas de teste
export async function cleanupTestConversations(botId: string) {
  const { error } = await supabase
    .from('external_conversations')
    .delete()
    .eq('bot_id', botId)
    .like('external_id', 'test_chat_%');

  if (error) {
    throw new Error(`Erro ao limpar conversas de teste: ${error.message}`);
  }
}

// Função para exportar conversas
export async function exportConversations(botId: string, format: 'json' | 'csv' = 'json') {
  const { data: conversations } = await supabase
    .from('external_conversations')
    .select(`
      *,
      conversation_messages (*)
    `)
    .eq('bot_id', botId);

  if (format === 'json') {
    return JSON.stringify(conversations, null, 2);
  }

  // Implementar CSV se necessário
  // ...
}
```

## 🧪 Como Testar

### 1. Criar Conversas de Teste
```typescript
// No console do navegador ou em um script
await createTestConversations('seu-bot-id', 3);
```

### 2. Simular Mensagem Incoming
```typescript
await handleIncomingMessage(
  'seu-bot-id',
  'Usuário Teste',
  '+5511999999999',
  'Olá, preciso de ajuda!',
  'whatsapp_msg_123'
);
```

### 3. Verificar Interface
1. Acesse a aba "Conversas" do seu assistente
2. Veja as conversas listadas
3. Clique em uma para ver as mensagens
4. Teste os filtros e busca
5. Teste ações (arquivar, bloquear)

### 4. Limpar Dados de Teste
```typescript
await cleanupTestConversations('seu-bot-id');
```

## 📖 Documentação Relacionada

- [ExternalConversations.md](./ExternalConversations.md) - Estrutura do banco de dados
- [AssistantConversations.md](./AssistantConversations.md) - Interface de usuário
- [Supabase Types](../src/integrations/supabase/types.ts) - Tipos TypeScript 