import { useState, useEffect, useMemo } from 'react';
import { useBot, useUpdateBot, useDeleteBot, useCreateBot } from "@/hooks/useBots";
import { AssistantData } from "@/types/assistant";

interface UseAssistantStateOptions {
  assistantId: string;
  isNewBot: boolean;
}

interface UseAssistantStateReturn {
  assistant: AssistantData | null;
  bot: any;
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  refetch: () => Promise<void>;
  createBot: (data: any) => Promise<any>;
  updateBot: (updates: any) => Promise<any>;
  deleteBot: () => Promise<boolean>;
  saveSettings: (localValues?: { 
    name: string; 
    description: string; 
    temperature: number; 
    wait_time?: number 
  }) => Promise<any>;
  saveCompany: (companyInfo: {
    name: string;
    address: string;
    website: string;
    instagram: string;
    businessHours: string;
    professionals?: string;
    procedures?: string;
  }) => Promise<void>;
}

export function useAssistantState({ 
  assistantId, 
  isNewBot 
}: UseAssistantStateOptions): UseAssistantStateReturn {
  
  // Hooks for bot operations
  const { data: bot, isLoading, refetch } = useBot(assistantId && !isNewBot ? assistantId : '');
  const updateBotMutation = useUpdateBot();
  const deleteBotMutation = useDeleteBot();
  const createBotMutation = useCreateBot();

  // Local state for system prompt
  const [systemPrompt, setSystemPrompt] = useState(
    isNewBot ? 'Você é um assistente útil e inteligente.' : ''
  );

  // Initialize system prompt from bot data when available
  useEffect(() => {
    if (bot && !isNewBot) {
      setSystemPrompt(bot.prompt || 'Você é um assistente útil e inteligente.');
    }
  }, [bot, isNewBot]);

  // Transform bot data to AssistantData format
  const assistant: AssistantData | null = useMemo(() => {
    if (isNewBot) {
      return {
        id: 'new',
        name: 'Novo Assistente',
        description: 'Descrição do assistente',
        status: 'active',
        conversations: 0,
        performance: 0,
        prompt: systemPrompt,
        temperature: 0.7,
        max_tokens: null,
        knowledge_base: null,
        persona_name: 'Novo Assistente',
        persona_objective: '',
        persona_personality: '',
        persona_style: '',
        persona_target_audience: '',
        company_name: '',
        company_address: '',
        company_website: '',
        company_instagram: '',
        company_business_hours: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }

    if (!bot) return null;

    return {
      id: bot.id,
      name: bot.name,
      description: bot.description || '',
      status: bot.status || 'active',
      conversations: bot.conversations || 0,
      performance: bot.performance || 0,
      prompt: systemPrompt,
      temperature: bot.temperature || 0.7,
      max_tokens: bot.max_tokens,
      knowledge_base: null,
      persona_name: bot.name,
      persona_objective: bot.persona_objective || '',
      persona_personality: bot.persona_personality || '',
      persona_style: bot.persona_style || '',
      persona_target_audience: bot.persona_target_audience || '',
      company_name: bot.company_name || '',
      company_address: bot.company_address || '',
      company_website: bot.company_website || '',
      company_instagram: bot.company_instagram || '',
      company_business_hours: bot.company_business_hours || '',
      created_at: bot.created_at,
      updated_at: bot.updated_at
    };
  }, [bot, isNewBot, systemPrompt]);

  // Save settings function
  const saveSettings = async (localValues?: { 
    name: string; 
    description: string; 
    temperature: number; 
    wait_time?: number 
  }) => {
    if (!localValues) {
      return null;
    }
    
    if (isNewBot) {
      // Create new bot
      const newBotData = {
        name: localValues.name,
        description: localValues.description,
        prompt: systemPrompt,
        temperature: localValues.temperature,
        status: 'active',
        persona_name: localValues.name,
        persona_objective: '',
        persona_personality: '',
        persona_style: '',
        persona_target_audience: '',
        company_name: '',
        company_address: '',
        company_website: '',
        company_instagram: '',
        company_business_hours: '',
        conversations: 0,
        performance: 0
      };
      
      return await createBotMutation.mutateAsync(newBotData);
    }
    
    if (!assistantId || !assistant) {
      return null;
    }
    
    const updateData = {
      name: localValues.name,
      description: localValues.description,
      prompt: systemPrompt,
      temperature: localValues.temperature,
      ...(localValues.wait_time !== undefined && { wait_time: localValues.wait_time }),
      persona_name: localValues.name,
    };
    
    const result = await updateBotMutation.mutateAsync({
      botId: assistantId,
      updates: updateData
    });

    // Refetch the bot data to ensure UI is synchronized
    await refetch();
    
    return result;
  };

  // Save company function
  const saveCompany = async (companyInfo: {
    name: string;
    address: string;
    website: string;
    instagram: string;
    businessHours: string;
    professionals?: string;
    procedures?: string;
  }) => {
    if (!assistantId || assistantId === 'new') return;

    await updateBotMutation.mutateAsync({
      botId: assistantId,
      updates: {
        company_name: companyInfo.name,
        company_address: companyInfo.address,
        company_website: companyInfo.website,
        company_instagram: companyInfo.instagram,
        company_business_hours: companyInfo.businessHours,
        ...(companyInfo.professionals !== undefined && { company_professionals: companyInfo.professionals }),
        ...(companyInfo.procedures !== undefined && { company_procedures: companyInfo.procedures }),
      }
    });
    
    // Refetch to update the assistant data
    await refetch();
  };

  return {
    assistant,
    bot,
    isLoading,
    isCreating: createBotMutation.isPending,
    isUpdating: updateBotMutation.isPending,
    isDeleting: deleteBotMutation.isPending,
    refetch,
    createBot: createBotMutation.mutateAsync,
    updateBot: updateBotMutation.mutateAsync,
    deleteBot: () => deleteBotMutation.mutateAsync(assistantId),
    saveSettings,
    saveCompany
  };
}
