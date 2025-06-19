# Wizard de Modificação de Prompts

## Visão Geral

O Wizard de Modificação de Prompts é uma interface intuitiva que permite aos usuários solicitar modificações nos prompts de seus assistentes de IA de forma guiada e estruturada. O wizard coleta informações específicas sobre as modificações desejadas e, em uma implementação completa, enviaria essas informações para um assistente especializado em criação e otimização de prompts.

## Características

### 🎯 Interface Guiada em 4 Etapas
1. **Objetivo da Modificação** - Define o objetivo principal das mudanças
2. **Mudanças Específicas** - Detalha as modificações específicas desejadas
3. **Tom e Público-alvo** - Define estilo de comunicação e audiência
4. **Revisão Final** - Confirma e ajusta a solicitação

### 🎨 Design Elegante
- Interface moderna com gradientes e animações suaves
- Barra de progresso visual com ícones contextuais
- Validação em tempo real dos campos obrigatórios
- Feedback visual claro para cada etapa

### 💡 Experiência do Usuário
- Sugestões rápidas com badges clicáveis
- Dicas contextuais em cada etapa
- Validação de formulário inteligente
- Estados de carregamento e feedback

## Como Usar

### 1. Integração Básica

```tsx
import PromptWizard, { PromptModificationRequest } from './components/PromptWizard';

function YourComponent() {
  const handlePromptModificationRequest = (request: PromptModificationRequest) => {
    // Processar a solicitação
    console.log('Solicitação recebida:', request);
  };

  return (
    <PromptWizard 
      currentPrompt="Seu prompt atual aqui"
      onSubmitRequest={handlePromptModificationRequest}
      isSubmitting={false}
    />
  );
}
```

### 2. Estrutura da Solicitação

```typescript
interface PromptModificationRequest {
  currentPrompt: string;
  modificationGoal: string;         // Objetivo principal
  specificChanges: string;          // Mudanças específicas
  tonestyle: string;                // Tom e estilo
  targetAudience: string;           // Público-alvo
  additionalRequirements: string;   // Requisitos adicionais
  exampleScenario: string;          // Cenário de exemplo
  priority: 'low' | 'medium' | 'high';
}
```

## Fluxo de Uso

### Etapa 1: Objetivo da Modificação
- Usuario define o objetivo principal das mudanças
- Sugestões rápidas disponíveis: "Mais conversacional", "Mais técnico", "Mais criativo"
- Campo obrigatório para prosseguir

### Etapa 2: Mudanças Específicas
- Detalhamento das modificações específicas
- Dicas contextuais sobre como descrever mudanças
- Exemplos de modificações comuns

### Etapa 3: Tom e Público-alvo
- Definição do estilo de comunicação
- Especificação do público-alvo
- Campo opcional para cenário de exemplo

### Etapa 4: Revisão Final
- Resumo de todas as informações coletadas
- Campo para requisitos adicionais
- Seleção de prioridade da solicitação

## Implementação Recomendada

### Backend (API)

```typescript
// Endpoint para processar solicitações
POST /api/prompt-modification

// Payload
{
  assistantId: string;
  request: PromptModificationRequest;
}

// Response
{
  id: string;
  status: 'processing' | 'completed' | 'failed';
  estimatedTime?: number;
}
```

### Processamento com IA

```typescript
// Exemplo de processamento com OpenAI GPT-4
const processPromptModification = async (request: PromptModificationRequest) => {
  const systemPrompt = `
    Você é um especialista em criação e otimização de prompts para assistentes de IA.
    Sua tarefa é modificar o prompt fornecido seguindo as especificações do usuário.
    
    Critérios:
    - Mantenha a estrutura e funcionalidade core
    - Implemente as mudanças solicitadas de forma precisa
    - Adapte o tom e estilo para o público-alvo
    - Forneça uma lista das principais mudanças realizadas
  `;

  const userPrompt = `
    PROMPT ATUAL: ${request.currentPrompt}
    
    OBJETIVO: ${request.modificationGoal}
    MUDANÇAS ESPECÍFICAS: ${request.specificChanges}
    TOM/ESTILO: ${request.tonestyle}
    PÚBLICO-ALVO: ${request.targetAudience}
    CENÁRIO: ${request.exampleScenario}
    REQUISITOS ADICIONAIS: ${request.additionalRequirements}
    
    Por favor, forneça:
    1. O prompt modificado
    2. Lista das principais mudanças realizadas
  `;

  // Chamada para a API da OpenAI
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ]
  });

  return parseResponse(response.choices[0].message.content);
};
```

## Componentes Relacionados

### PromptModificationResult
Componente para exibir os resultados das modificações processadas:

```tsx
import PromptModificationResult from './components/PromptModificationResult';

// Uso
<PromptModificationResult
  results={modificationResults}
  onApplyPrompt={(modifiedPrompt) => {
    // Aplicar o prompt modificado
    setSystemPrompt(modifiedPrompt);
  }}
  onRetryRequest={(resultId) => {
    // Tentar novamente em caso de falha
    retryModification(resultId);
  }}
/>
```

## Personalizações

### Temas e Cores
O wizard utiliza classes Tailwind CSS que podem ser customizadas:

```css
/* Cores principais */
.wizard-primary { @apply bg-gradient-to-r from-purple-500 to-pink-500; }
.wizard-secondary { @apply bg-gradient-to-r from-blue-500 to-indigo-500; }
.wizard-success { @apply bg-gradient-to-r from-green-500 to-emerald-500; }
```

### Validações Customizadas
```typescript
const customValidation = (step: number, formData: any) => {
  switch (step) {
    case 1:
      return formData.modificationGoal.length >= 20; // Mínimo 20 caracteres
    case 2:
      return formData.specificChanges.length >= 30; // Mínimo 30 caracteres
    // ... outras validações
  }
};
```

## Melhores Práticas

### UX/UI
- Sempre forneça feedback visual para ações do usuário
- Use linguagem clara e sem jargões técnicos
- Mantenha o foco em uma tarefa por etapa
- Permita navegação livre entre etapas (exceto validações)

### Implementação
- Sempre valide dados tanto no frontend quanto backend
- Implemente estados de carregamento apropriados
- Forneça opções de fallback em caso de falhas
- Mantenha logs detalhados para debugging

### Acessibilidade
- Use labels apropriados em todos os campos
- Implemente navegação por teclado
- Forneça textos alternativos para ícones
- Mantenha contraste adequado

## Próximos Passos

1. **Integração com Backend** - Implementar API para processamento
2. **Histórico de Modificações** - Salvar e exibir modificações anteriores
3. **Templates de Prompts** - Biblioteca de prompts pré-definidos
4. **Análise de Performance** - Métricas de efetividade dos prompts
5. **Colaboração** - Permitir compartilhamento de prompts entre usuários

## Suporte

Para dúvidas ou sugestões sobre o Wizard de Modificação de Prompts, consulte a documentação técnica ou entre em contato com a equipe de desenvolvimento. 