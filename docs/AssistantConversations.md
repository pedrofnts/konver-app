# Interface de Conversas do Assistente

## 📱 Visão Geral

A interface de conversas permite visualizar e gerenciar todas as conversas externas que os usuários tiveram com seu assistente através de plataformas como WhatsApp, Telegram ou outras integrações.

## 🎯 Funcionalidades Principais

### 📊 **Dashboard de Estatísticas**
- **Total de conversas**: Número total de conversas
- **Conversas ativas**: Conversas em andamento
- **Conversas arquivadas**: Conversas finalizadas
- **Conversas bloqueadas**: Usuários bloqueados
- **Total de mensagens**: Soma de todas as mensagens

### 🗂️ **Lista de Conversas**
- **Visualização organizada**: Lista ordenada por última mensagem
- **Informações do usuário**: Nome, telefone e avatar
- **Status visual**: Badges coloridos para cada status
- **Prévia da última mensagem**: Snippet da última interação
- **Contadores**: Número de mensagens por conversa
- **Timestamps relativos**: "2h", "1d", etc.

### 💬 **Visualizador de Conversa**
- **Interface de chat**: Similar ao WhatsApp/Telegram
- **Mensagens organizadas**: Usuário à direita, bot à esquerda
- **Avatars e identificação**: Visual claro de quem enviou
- **Timestamps**: Hora de cada mensagem
- **Scroll automático**: Navegação fluida pelo histórico

### 🔍 **Filtros e Busca**
- **Busca por nome**: Encontre usuários pelo nome
- **Busca por telefone**: Busque por número de telefone
- **Filtro por status**: Ativas, arquivadas, bloqueadas
- **Atualização em tempo real**: Botão de refresh

### ⚙️ **Gerenciamento de Conversas**
- **Arquivar conversas**: Mover para arquivo
- **Bloquear usuários**: Impedir novas mensagens
- **Reativar conversas**: Restaurar conversas arquivadas
- **Desbloquear usuários**: Remover bloqueios
- **Visualizar ID externo**: Ver identificador do sistema externo

## 🎨 **Design e Experiência**

### **Layout Responsivo**
- **Desktop**: Duas colunas (lista + visualizador)
- **Mobile**: Navegação adaptativa
- **Estatísticas**: Grid responsivo no topo

### **Códigos de Cores**
- 🟢 **Verde**: Conversas ativas
- 🔴 **Vermelho**: Conversas bloqueadas  
- ⚫ **Cinza**: Conversas arquivadas
- 🔵 **Azul**: Mensagens do usuário
- 🤖 **Cinza claro**: Mensagens do bot

### **Indicadores Visuais**
- **Avatars coloridos**: Gradientes únicos por usuário
- **Badges de status**: Identificação rápida do estado
- **Hover effects**: Feedback visual nas interações
- **Seleção ativa**: Destaque da conversa selecionada

## 🔧 **Como Usar**

### **1. Acessar Conversas**
1. Abra seu assistente
2. Clique na aba **"Conversas"** (ícone 💬)
3. A interface será carregada automaticamente

### **2. Navegar pelas Conversas**
- **Visualizar lista**: Role pela lista de conversas à esquerda
- **Selecionar conversa**: Clique em qualquer conversa para abrir
- **Ver detalhes**: Nome, telefone e status ficam visíveis
- **Contar mensagens**: Número total aparece em cada item

### **3. Visualizar Mensagens**
- **Ler histórico**: Todas as mensagens são exibidas em ordem
- **Identificar remetente**: 👤 usuário, 🤖 bot
- **Ver horários**: Timestamps relativos para cada mensagem
- **Navegar**: Scroll para ver mensagens antigas

### **4. Buscar e Filtrar**
```
🔍 Campo de busca: Digite nome ou telefone
📋 Filtros: [Todas] [Ativas] [Arquivadas] [Bloqueadas]
```

### **5. Gerenciar Conversas**
- **Menu de ações**: Clique nos "⋮" ao lado de cada conversa
- **Arquivar**: Para conversas finalizadas
- **Bloquear**: Para usuários problemáticos
- **Reativar**: Para retomar conversas arquivadas

## 📱 **Integração com Sistemas Externos**

### **WhatsApp Business API**
```typescript
// Exemplo de webhook para receber mensagens
app.post('/webhook/whatsapp', async (req) => {
  const { from, text, conversation_id } = req.body;
  
  // Buscar/criar conversa
  const { data: conversation } = await supabase
    .from('external_conversations')
    .upsert({
      bot_id: 'seu-bot-id',
      user_name: from.name,
      phone_number: from.phone,
      external_id: conversation_id,
      status: 'active'
    }, {
      onConflict: 'external_id,bot_id'
    });
  
  // Adicionar mensagem
  await supabase
    .from('conversation_messages')
    .insert({
      conversation_id: conversation.id,
      message_type: 'user',
      content: text
    });
});
```

### **Telegram Bot**
```typescript
// Exemplo para Telegram
bot.on('message', async (msg) => {
  const conversation = await createOrUpdateConversation({
    bot_id: 'seu-bot-id',
    user_name: msg.from.first_name,
    phone_number: msg.from.phone_number,
    external_id: `telegram_${msg.chat.id}`,
    status: 'active'
  });
  
  await addMessage({
    conversation_id: conversation.id,
    message_type: 'user',
    content: msg.text
  });
});
```

## 📊 **Casos de Uso Práticos**

### **1. Atendimento ao Cliente**
- **Visualizar histórico**: Ver todo o contexto da conversa
- **Identificar padrões**: Problemas recorrentes
- **Medir satisfação**: Avaliar qualidade das respostas
- **Arquivar resolvidos**: Organizar conversas finalizadas

### **2. Análise de Performance**
- **Contagem de mensagens**: Volume de interações
- **Tempo de resposta**: Eficiência do bot
- **Taxa de resolução**: Conversas arquivadas vs ativas
- **Identificar spam**: Conversas bloqueadas

### **3. Gestão de Relacionamento**
- **Histórico do cliente**: Todas as interações
- **Personalização**: Adaptar respostas baseado no histórico
- **Segmentação**: Filtrar por tipo de conversa
- **Follow-up**: Reativar conversas importantes

## 🔒 **Privacidade e Segurança**

### **Dados Protegidos**
- ✅ **RLS habilitado**: Usuários só veem seus próprios dados
- ✅ **Criptografia**: Dados sensíveis protegidos
- ✅ **Auditoria**: Logs de todas as ações
- ✅ **LGPD compliance**: Respeita regulamentações

### **Controles de Acesso**
- **Isolamento por usuário**: Cada usuário vê apenas seus bots
- **Controle de bot**: Apenas conversas do assistente específico
- **Logs de atividade**: Rastreamento de mudanças de status

## 🚀 **Próximas Funcionalidades**

### **Em Desenvolvimento**
- 📈 **Analytics avançados**: Gráficos e métricas detalhadas
- 🏷️ **Tags e categorias**: Organização por temas
- 🔔 **Notificações**: Alertas para novas mensagens
- 📤 **Exportação**: Download de conversas em PDF/CSV
- 🤖 **Auto-resposta**: Configurar respostas automáticas
- 📝 **Notas internas**: Comentários da equipe

### **Integrações Futuras**
- 💬 **Slack**: Conectar com workspace
- 📞 **Discord**: Suporte a servidores
- 📧 **Email**: Conversas por email
- 🌐 **Webchat**: Widget para sites

## 🆘 **Troubleshooting**

### **Problemas Comuns**

**❌ Conversas não aparecem**
- ✅ Verifique se o `bot_id` está correto
- ✅ Confirme se há dados na tabela `external_conversations`
- ✅ Teste filtros (pode estar filtrado por status)

**❌ Mensagens não carregam**
- ✅ Verifique foreign keys na tabela `conversation_messages`
- ✅ Confirme se o `conversation_id` está correto
- ✅ Teste com uma conversa diferente

**❌ Status não atualiza**
- ✅ Verifique permissões RLS
- ✅ Confirme conexão com banco de dados
- ✅ Teste refresh manual da página

**❌ Busca não funciona**
- ✅ Verifique se há caracteres especiais
- ✅ Teste busca por telefone vs nome
- ✅ Limpe filtros de status

### **Logs Úteis**
```javascript
// Debug no console do navegador
console.log('Bot ID:', botId);
console.log('Conversas carregadas:', conversations.length);
console.log('Filtros ativos:', { searchTerm, statusFilter });
```

## 💡 **Dicas de Performance**

### **Otimizações**
- ⚡ **Paginação**: Implementar para muitas conversas
- 🔄 **Cache**: Guardar conversas em memória temporariamente
- 📱 **Lazy loading**: Carregar mensagens sob demanda
- 🎯 **Índices**: Usar índices do banco para buscas rápidas

### **Limites Recomendados**
- **Máximo 100 conversas**: Por carregamento inicial
- **Máximo 50 mensagens**: Por visualização
- **Refresh automático**: A cada 30 segundos
- **Timeout de busca**: 3 segundos

---

**📞 Suporte**: Para dúvidas sobre a interface de conversas, consulte a documentação técnica ou entre em contato com o suporte. 