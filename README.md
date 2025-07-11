# Elegant AI Dashboard

Um dashboard elegante para gerenciar assistentes de IA com versionamento avançado de prompts.

## 🚀 Funcionalidades Principais

- **Dashboard de Assistentes**: Visualização e gerenciamento completo dos bots
- **Sistema de Conversas**: Interface de chat para testar assistentes
- **Base de Conhecimento**: Upload e gerenciamento de arquivos para treinar assistentes
- **Versionamento de Prompts**: Sistema robusto para gerenciar diferentes versões de prompts

## 📝 Sistema de Versionamento de Prompts

### Tipos de Prompt

1. **Prompt Principal**: Comportamento principal do assistente
2. **Prompt de Triagem**: Lógica inicial para classificar e direcionar conversas

### Funcionalidades do Versionamento

- ✅ **Criação de Versões**: Crie novas versões com descrições
- ✅ **Ativação/Desativação**: Apenas uma versão ativa por tipo
- ✅ **Histórico Completo**: Visualize todas as versões anteriores
- ✅ **Restauração**: Restaure qualquer versão anterior
- ✅ **Auto-incremento**: Numeração automática das versões

### Estrutura do Banco de Dados

```sql
-- Tabela principal para versionamento
CREATE TABLE prompt_versions (
  id UUID PRIMARY KEY,
  bot_id UUID REFERENCES bots(id),
  user_id UUID REFERENCES auth.users(id),
  prompt_type TEXT CHECK (prompt_type IN ('principal', 'triagem')),
  content TEXT NOT NULL,
  version_number INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT false,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Garantir apenas uma versão ativa por tipo
  UNIQUE(bot_id, prompt_type, is_active) DEFERRABLE
);
```

### Triggers Automáticos

- **Auto-incremento de versão**: Calcula automaticamente o próximo número
- **Versão única ativa**: Desativa automaticamente versões anteriores

## 🎨 Interface do Usuário

### Configurações do Assistente

- **Cards Visuais**: Interface moderna com gradientes e ícones
- **Histórico Expandível**: Visualize versões anteriores em modal
- **Criação Rápida**: Dialog intuitivo para novas versões
- **Confirmação de Restauração**: Proteção contra alterações acidentais

### Componentes Principais

- `PromptManager.tsx`: Gerenciamento completo do sistema de versionamento
- `AssistantSettingsTab.tsx`: Interface integrada nas configurações
- `AssistantView.tsx`: Página principal do assistente

## 🔧 Como Usar

1. **Criar Nova Versão**:
   - Clique no botão "Nova" no card do tipo de prompt desejado
   - Adicione uma descrição (opcional)
   - Digite o conteúdo do prompt
   - Clique em "Criar e Ativar"

2. **Ver Histórico**:
   - Clique em "Ver Histórico" para expandir versões anteriores
   - Visualize conteúdo completo de cada versão
   - Veja timestamps e descrições

3. **Restaurar Versão**:
   - No histórico, clique em "Restaurar" na versão desejada
   - Confirme a ação no dialog de segurança
   - A versão será ativada automaticamente

## 🛡️ Segurança e Integridade

- **Row Level Security (RLS)**: Usuários só acessam seus próprios dados
- **Validação de Tipos**: Enum restrito para tipos de prompt
- **Constraints de Unicidade**: Previne estados inconsistentes
- **Soft Deletion**: Histórico preservado permanentemente

## 🎯 Benefícios do Sistema

1. **Controle Total**: Gerencie múltiplas versões sem perder histórico
2. **Rollback Seguro**: Volte a qualquer versão anterior rapidamente
3. **Experimentação**: Teste diferentes abordagens sem risco
4. **Auditoria**: Rastreie mudanças com timestamps e descrições
5. **Escalabilidade**: Suporte a novos tipos de prompt facilmente

## 📊 Tecnologias Utilizadas

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Componentes**: shadcn/ui
- **Ícones**: Lucide React
- **Estado**: React Hooks + Context API
