import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Bot, Home, Menu, MessageSquare, Database, Settings, Trash2, RefreshCw, Upload } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useBot, useUpdateBot, useDeleteBot, useCreateBot } from "@/hooks/useBots";
import { useToast } from "@/hooks/use-toast";
import KonverLayout from "@/components/KonverLayout";
import AssistantSidebar from "@/components/AssistantSidebar";
import TabContainer from "@/components/TabContainer";
import TestChatContent from "@/components/TestChatContent";
import SettingsContent from "@/components/SettingsContent";
import KnowledgeBaseContent from "@/components/KnowledgeBaseContent";
import ConversationsContent from "@/components/ConversationsContent";
import BotFeedbackManagement from "@/components/BotFeedbackManagement";
import IntegrationsContent from "@/components/IntegrationsContent";
import { AssistantData } from "@/types/assistant";
import { PromptModificationRequest } from "@/components/PromptWizard";

export default function AssistantView() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const defaultTab = searchParams.get('tab') || (id === 'new' ? 'settings' : 'test');
  
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isNewBot, setIsNewBot] = useState(id === 'new');
  
  // Use the new hooks
  const { data: bot, isLoading: loading, refetch } = useBot(id && id !== 'new' ? id : '');
  const updateBotMutation = useUpdateBot();
  const deleteBotMutation = useDeleteBot();
  const createBotMutation = useCreateBot();
  
  // Settings states
  const [assistantName, setAssistantName] = useState(isNewBot ? 'Novo Assistente' : '');
  const [assistantDescription, setAssistantDescription] = useState(isNewBot ? 'Descrição do assistente' : '');
  const [systemPrompt, setSystemPrompt] = useState(isNewBot ? 'Você é um assistente útil e inteligente.' : '');
  const [temperature, setTemperature] = useState([0.7]);
  const [assistantStatus, setAssistantStatus] = useState('active');
  
  // Persona states
  const [personaObjective, setPersonaObjective] = useState('');
  const [personaPersonality, setPersonaPersonality] = useState('');
  const [personaStyle, setPersonaStyle] = useState('');
  const [personaTargetAudience, setPersonaTargetAudience] = useState('');
  
  const { toast } = useToast();
  const { user, signOut } = useAuth();

  // Transform bot data to AssistantData format
  const assistant: AssistantData | null = isNewBot ? {
    id: 'new',
    name: assistantName,
    description: assistantDescription,
    status: assistantStatus,
    conversations: 0,
    performance: 0,
    prompt: systemPrompt,
    temperature: temperature[0],
    max_tokens: null,
    knowledge_base: null,
    persona_name: assistantName,
    persona_objective: personaObjective,
    persona_personality: personaPersonality,
    persona_style: personaStyle,
    persona_target_audience: personaTargetAudience,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  } : bot ? {
    id: bot.id,
    name: bot.name,
    description: bot.description,
    status: bot.status || 'active',
    conversations: bot.conversations || 0,
    performance: bot.performance || 0,
    prompt: bot.prompt,
    temperature: bot.temperature,
    max_tokens: bot.max_tokens,
    knowledge_base: null,
    persona_name: bot.persona_name,
    persona_objective: bot.persona_objective,
    persona_personality: bot.persona_personality,
    persona_style: bot.persona_style,
    persona_target_audience: bot.persona_target_audience,
    created_at: bot.created_at,
    updated_at: bot.updated_at
  } : null;

  // Monitor ID changes to update isNewBot state
  useEffect(() => {
    setIsNewBot(id === 'new');
  }, [id]);

  // Initialize states from bot data
  useEffect(() => {
    if (bot && !isNewBot) {
      setAssistantName(bot.name);
      setAssistantDescription(bot.description || '');
      setSystemPrompt(bot.prompt || 'Você é um assistente útil e inteligente.');
      setTemperature([bot.temperature || 0.7]);
      setAssistantStatus(bot.status || 'active');
      setPersonaObjective(bot.persona_objective || '');
      setPersonaPersonality(bot.persona_personality || '');
      setPersonaStyle(bot.persona_style || '');
      setPersonaTargetAudience(bot.persona_target_audience || '');
    }
  }, [bot, isNewBot]);

  const saveSettings = async () => {
    if (isNewBot) {
      // Create new bot
      try {
        const newBot = await createBotMutation.mutateAsync({
          name: assistantName,
          description: assistantDescription,
          prompt: systemPrompt,
          temperature: temperature[0],
          status: assistantStatus,
          persona_name: assistantName,
          persona_objective: personaObjective,
          persona_personality: personaPersonality,
          persona_style: personaStyle,
          persona_target_audience: personaTargetAudience,
          conversations: 0,
          performance: 0
        });
        
        toast({
          title: "Sucesso",
          description: "Assistente criado com sucesso!",
        });
        
        // Redirect to the new bot's page
        navigate(`/assistant/${newBot.id}?tab=settings`, { replace: true });
        return;
      } catch (error) {
        console.error('Error creating bot:', error);
        toast({
          title: "Erro",
          description: "Falha ao criar o assistente",
          variant: "destructive",
        });
        return;
      }
    }
    
    if (!id || !assistant) return;
    
    try {
      await updateBotMutation.mutateAsync({
        botId: id,
        updates: {
          name: assistantName,
          description: assistantDescription,
          prompt: systemPrompt,
          temperature: temperature[0],
          status: assistantStatus,
          persona_name: assistantName,
          persona_objective: personaObjective,
          persona_personality: personaPersonality,
          persona_style: personaStyle,
          persona_target_audience: personaTargetAudience,
        }
      });

      toast({
        title: "Configurações salvas",
        description: "As configurações do assistente foram atualizadas com sucesso.",
      });

    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive",
      });
    }
  };

  const handlePromptModificationRequest = (request: PromptModificationRequest) => {
    // Por enquanto, apenas exibimos um toast com a solicitação
    // Em uma implementação real, isso seria enviado para um assistente especializado em prompts
    toast({
      title: "Solicitação de Modificação Enviada",
      description: `Sua solicitação para "${request.modificationGoal.substring(0, 50)}..." foi enviada para processamento.`,
      duration: 5000,
    });

    // Log da requisição para desenvolvimento
    console.log('Prompt Modification Request:', request);
  };

  const handleApplyPromptFromAssistant = (newPrompt: string) => {
    setSystemPrompt(newPrompt);
    toast({
      title: "Prompt Aplicado!",
      description: "O novo prompt foi aplicado com sucesso. Você pode testá-lo na aba de teste.",
      duration: 5000,
    });
  };

  if (loading && !isNewBot) {
    return (
      <KonverLayout 
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Loading...' }
        ]}
        actions={
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="konver-hover-subtle"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        }
      >
        <div className="flex min-h-[calc(100vh-12rem)]">
          {/* Loading Sidebar */}
          <div className="w-80 bg-card/30 border-r border-border/50 p-6">
            <div className="space-y-4">
              <div className="h-32 bg-muted rounded-2xl animate-pulse" />
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />
                ))}
              </div>
            </div>
          </div>
          
          {/* Loading Content */}
          <div className="flex-1 p-8">
            <div className="konver-card max-w-4xl">
              <div className="h-64 w-full bg-muted rounded animate-pulse" />
            </div>
          </div>
        </div>
      </KonverLayout>
    );
  }

  if (!assistant && !isNewBot) {
    return (
      <KonverLayout 
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Assistant Not Found' }
        ]}
        actions={
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="konver-hover-subtle"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        }
      >
        <div className="konver-card-feature max-w-2xl mx-auto text-center p-12 mt-16">
          <div className="w-20 h-20 konver-gradient-primary rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl konver-animate-float">
            <Bot className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-3">Assistant Not Found</h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto leading-relaxed">
            The requested assistant was not found or you don't have permission to access it.
          </p>
          <Button 
            onClick={() => navigate('/')}
            className="konver-button-primary"
          >
            <Home className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </KonverLayout>
    );
  }

  const renderActiveTabContent = () => {
    if (!assistant) return null;

    switch (activeTab) {
      case 'test':
        return isNewBot ? null : <TestChatContent assistantId={id || ''} />;
      
      case 'conversations':
        return isNewBot ? null : <ConversationsContent assistantId={id || ''} />;
      
      case 'settings':
        return (
          <SettingsContent
            assistant={{
              id: assistant.id,
              name: assistantName,
              description: assistantDescription,
              temperature: temperature[0],
              active: assistantStatus === 'active',
              prompts: {
                principal: [],
                triagem: [],
                think: []
              }
            }}
            updateAssistant={(updates) => {
              if (updates.name !== undefined) setAssistantName(updates.name);
              if (updates.description !== undefined) setAssistantDescription(updates.description);
              if (updates.temperature !== undefined) setTemperature([updates.temperature]);
              if (updates.active !== undefined) setAssistantStatus(updates.active ? 'active' : 'inactive');
            }}
            onSave={saveSettings}
          />
        );
      
      case 'integrations':
        return isNewBot ? null : <IntegrationsContent assistantId={id || ''} />;
      
      case 'knowledge':
        return isNewBot ? null : <KnowledgeBaseContent assistantId={id || ''} />;
      
      case 'feedback':
        return isNewBot ? null : (
          <BotFeedbackManagement
            botId={id || ''}
            botName={assistant?.name || 'Bot'}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <KonverLayout 
      assistant={assistant}
      breadcrumbs={[
        { label: 'Dashboard', href: '/' },
        { label: isNewBot ? 'Criar Assistente' : assistant.name }
      ]}
      actions={
        <div className="flex items-center gap-2">
          {/* Mobile sidebar toggle */}
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden konver-hover-subtle"
          >
            <Menu className="w-4 h-4" />
          </Button>
          
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="konver-hover-subtle"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </div>
      }
    >
      <div className="flex h-[calc(100vh-7rem)] bg-gradient-to-br from-background via-background/95 to-card/10 relative">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/20"></div>
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, hsl(var(--border)) 1px, transparent 0)`,
            backgroundSize: '32px 32px'
          }}></div>
        </div>

        {/* Mobile Overlay with Enhanced Animation */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/60 z-40 md:hidden konver-animate-fade-in backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
            style={{
              animation: 'konver-fade-in 0.2s ease-out'
            }}
          />
        )}

        {/* Modern Sidebar Navigation with Enhanced Transitions */}
        <div className={`relative z-50 md:z-10 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]`}>
          <AssistantSidebar 
            activeTab={activeTab} 
            onTabChange={(tab) => {
              setActiveTab(tab);
              setSidebarOpen(false); // Close sidebar on mobile when tab changes
            }}
            assistant={{
              name: assistant.name,
              conversations: assistant.conversations,
              performance: assistant.performance,
              status: assistant.status
            }}
            isNewBot={isNewBot}
          />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 konver-content-area relative z-10 min-w-0 flex flex-col h-full">
          <div className="p-4 md:p-6 lg:p-8 flex-1 flex flex-col h-full">
            <div className="konver-animate-fade-in flex-1 h-full overflow-hidden">
              {renderActiveTabContent()}
            </div>
          </div>
        </div>
      </div>


    </KonverLayout>
  );
} 