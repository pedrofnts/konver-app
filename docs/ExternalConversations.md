# Sistema de Conversas Externas (WhatsApp)

## 📱 Visão Geral

Sistema para armazenar e gerenciar conversas de usuários externos que interagem com os assistentes via WhatsApp ou outras plataformas externas.

## 🏗️ Estrutura do Banco de Dados

### Tabela: `external_conversations`

Armazena informações principais das conversas:

```sql
CREATE TABLE external_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id UUID NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  external_id TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'blocked')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_phone_bot UNIQUE(phone_number, bot_id),
  CONSTRAINT unique_external_id_bot UNIQUE(external_id, bot_id)
);
```

**Campos principais:**
- `bot_id`: Referência ao assistente que está conversando
- `user_name`: Nome do usuário externo
- `phone_number`: Número de telefone (formato internacional)
- `external_id`: ID da conversa no sistema externo (WhatsApp, Telegram, etc.)
- `status`: Status da conversa (`active`, `archived`, `blocked`)
- `metadata`: Dados adicionais (tags, notas, configurações específicas)
- `last_message_at`: Timestamp da última mensagem para ordenação

### Tabela: `conversation_messages`

Armazena as mensagens individuais:

```sql
CREATE TABLE conversation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES external_conversations(id) ON DELETE CASCADE,
  message_type TEXT NOT NULL CHECK (message_type IN ('user', 'bot')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Campos principais:**
- `conversation_id`: Referência à conversa
- `message_type`: Tipo da mensagem (`user` ou `bot`)
- `content`: Conteúdo da mensagem
- `metadata`: Dados adicionais (timestamps WhatsApp, arquivos de mídia, etc.)

## 🔒 Segurança (RLS)

- **Row Level Security** habilitado em ambas as tabelas
- Usuários só podem acessar conversas de seus próprios bots
- Políticas automáticas baseadas na relação `bots.user_id`

## 🚀 Funcionalidades Automáticas

### Triggers Implementados

1. **Auto-update de `updated_at`**: Atualiza automaticamente o timestamp quando a conversa é modificada
2. **Auto-update de `last_message_at`**: Atualiza o timestamp da última mensagem quando uma nova mensagem é adicionada

### Índices para Performance

- Busca por bot: `idx_external_conversations_bot_id`
- Busca por telefone: `idx_external_conversations_phone`
- Busca por ID externo: `idx_external_conversations_external_id`
- Filtro por status: `idx_external_conversations_status`
- Ordenação por última mensagem: `idx_external_conversations_last_message`
- Busca de mensagens: `idx_conversation_messages_conversation_id`
- Ordenação temporal: `idx_conversation_messages_created_at`

## 💻 Tipos TypeScript

```typescript
// Status possíveis da conversa
export type ConversationStatus = 'active' | 'archived' | 'blocked';

// Tipos de mensagem
export type MessageType = 'user' | 'bot';

// Interface da conversa
export interface ExternalConversation {
  id: string;
  bot_id: string;
  user_name: string;
  phone_number: string;
  external_id?: string;
  status: ConversationStatus;
  metadata?: Json;
  created_at: string;
  updated_at: string;
  last_message_at?: string;
}

// Interface da mensagem
export interface ConversationMessage {
  id: string;
  conversation_id: string;
  message_type: MessageType;
  content: string;
  metadata?: Json;
  created_at: string;
}

// Interface completa com mensagens
export interface ConversationWithMessages extends ExternalConversation {
  messages: ConversationMessage[];
  bot?: {
    id: string;
    name: string;
  };
}
```

## 📋 Exemplos de Uso

### 1. Criar uma nova conversa

```typescript
const { data: conversation } = await supabase
  .from('external_conversations')
  .insert({
    bot_id: 'uuid-do-bot',
    user_name: 'João Silva',
    phone_number: '+5511999999999',
    external_id: 'whatsapp_conversation_123456', // ID do sistema externo
    status: 'active'
  })
  .select()
  .single();
```

### 2. Adicionar mensagem à conversa

```typescript
const { data: message } = await supabase
  .from('conversation_messages')
  .insert({
    conversation_id: conversation.id,
    message_type: 'user',
    content: 'Olá, preciso de ajuda!',
    metadata: {
      whatsapp_id: 'wamid.xxx',
      received_at: new Date().toISOString()
    }
  });
```

### 3. Buscar conversas de um bot

```typescript
const { data: conversations } = await supabase
  .from('external_conversations')
  .select(`
    *,
    conversation_messages (
      id,
      message_type,
      content,
      created_at
    )
  `)
  .eq('bot_id', 'uuid-do-bot')
  .eq('status', 'active')
  .order('last_message_at', { ascending: false });
```

### 4. Marcar conversa como arquivada

```typescript
const { data } = await supabase
  .from('external_conversations')
  .update({ status: 'archived' })
  .eq('id', 'uuid-da-conversa');
```

### 5. Buscar conversa por ID externo

```typescript
const { data: conversation } = await supabase
  .from('external_conversations')
  .select('*')
  .eq('external_id', 'whatsapp_conversation_123456')
  .eq('bot_id', 'uuid-do-bot')
  .single();
```

### 6. Criar ou atualizar conversa (upsert) com base no external_id

```typescript
const { data: conversation } = await supabase
  .from('external_conversations')
  .upsert({
    bot_id: 'uuid-do-bot',
    user_name: 'João Silva',
    phone_number: '+5511999999999',
    external_id: 'whatsapp_conversation_123456',
    status: 'active'
  }, {
    onConflict: 'external_id,bot_id', // Usar constraint unique_external_id_bot
    ignoreDuplicates: false
  })
  .select()
  .single();
```

## 🔧 Integração com WhatsApp

### Estrutura recomendada de metadata

```json
{
  "whatsapp": {
    "contact_id": "string",
    "profile_name": "string",
    "last_seen": "timestamp"
  },
  "tags": ["suporte", "vendas"],
  "notes": "Cliente interessado em produto X",
  "priority": "high"
}
```

### Fluxo recomendado

1. **Receber mensagem do WhatsApp** com `conversation_id` externo
2. **Verificar se existe conversa** usando `external_id` + `bot_id`
3. **Criar/atualizar conversa** usando upsert com base no `external_id`
4. **Adicionar mensagem** à conversa
5. **Processar com o assistente** usando o histórico
6. **Adicionar resposta do bot** como nova mensagem

### Exemplo de implementação com external_id

```typescript
// Webhook do WhatsApp
app.post('/webhook/whatsapp', async (req) => {
  const { from, text, conversation_id } = req.body; // Dados do WhatsApp
  
  // 1. Buscar/criar conversa usando external_id
  const { data: conversation } = await supabase
    .from('external_conversations')
    .upsert({
      bot_id: 'seu-bot-id',
      user_name: from.name,
      phone_number: from.phone,
      external_id: conversation_id, // ID da conversa do WhatsApp
      status: 'active'
    }, {
      onConflict: 'external_id,bot_id'
    })
    .select()
    .single();
  
  // 2. Adicionar mensagem do usuário
  await supabase
    .from('conversation_messages')
    .insert({
      conversation_id: conversation.id,
      message_type: 'user',
      content: text,
      metadata: { whatsapp_message_id: req.body.id }
    });
  
  // 3. Processar com assistente e responder...
});
```

## 📊 Consultas Úteis

### Conversas mais ativas

```sql
SELECT 
  ec.*,
  COUNT(cm.id) as message_count,
  MAX(cm.created_at) as last_message
FROM external_conversations ec
JOIN conversation_messages cm ON ec.id = cm.conversation_id
WHERE ec.status = 'active'
GROUP BY ec.id
ORDER BY last_message DESC;
```

### Estatísticas por bot

```sql
SELECT 
  b.name as bot_name,
  COUNT(DISTINCT ec.id) as total_conversations,
  COUNT(cm.id) as total_messages,
  COUNT(CASE WHEN cm.message_type = 'user' THEN 1 END) as user_messages,
  COUNT(CASE WHEN cm.message_type = 'bot' THEN 1 END) as bot_messages
FROM bots b
LEFT JOIN external_conversations ec ON b.id = ec.bot_id
LEFT JOIN conversation_messages cm ON ec.id = cm.conversation_id
GROUP BY b.id, b.name;
```

## 🎯 Próximos Passos

1. **Interface de Administração**: Criar componentes para visualizar e gerenciar conversas
2. **Webhook Handler**: Implementar endpoint para receber mensagens do WhatsApp
3. **Analytics**: Dashboard com métricas das conversas
4. **Notificações**: Sistema de alertas para novas mensagens
5. **Automação**: Regras automáticas para arquivamento e categorização

## 📝 Considerações

- **Formato do telefone**: Recomenda-se usar formato internacional (+5511999999999)
- **Limpeza de dados**: Implementar rotinas para arquivar conversas antigas
- **Backup**: As conversas contêm dados importantes dos clientes
- **LGPD**: Considerar políticas de retenção e exclusão de dados pessoais 