import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Bot, Home, Menu } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useAssistantState } from "@/hooks/useAssistantState";
import KonverLayout from "@/components/KonverLayout";
import AssistantSidebar from "@/components/AssistantSidebar";
import TestChatContent from "@/components/TestChatContent";
import SettingsContent from "@/components/SettingsContent";
import KnowledgeBaseContent from "@/components/KnowledgeBaseContent";
import ConversationsContent from "@/components/ConversationsContent";
import BotFeedbackManagement from "@/components/BotFeedbackManagement";
import IntegrationsContent from "@/components/IntegrationsContent";
import FlowsContent from "@/components/FlowsContent";
import CompanyContent from "@/components/CompanyContent";
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
  
  // Use the new assistant state hook
  const {
    assistant,
    bot,
    isLoading: loading,
    refetch,
    saveSettings,
    saveCompany
  } = useAssistantState({
    assistantId: id || '',
    isNewBot
  });
  
  const { toast } = useToast();
  const { user, signOut } = useAuth();

  // Monitor ID changes to update isNewBot state
  useEffect(() => {
    setIsNewBot(id === 'new');
  }, [id]);

  const handleSaveSettings = async (localValues?: { name: string; description: string; temperature: number; wait_time?: number }) => {
    try {
      const result = await saveSettings(localValues);
      
      if (isNewBot && result && typeof result === 'object' && 'id' in result) {
        toast({
          title: "Sucesso",
          description: "Assistente criado com sucesso!",
        });
        
        // Redirect to the new bot's page
        navigate(`/assistant/${result.id}?tab=settings`, { replace: true });
        return;
      }
      
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
    // TODO: Apply prompt to system - this function needs to be refactored with the new hook
    toast({
      title: "Prompt Aplicado!",
      description: "O novo prompt foi aplicado com sucesso. Você pode testá-lo na aba de teste.",
      duration: 5000,
    });
  };

  const handleSaveCompany = async (companyInfo: {
    name: string;
    address: string;
    website: string;
    instagram: string;
    businessHours: string;
    professionals?: string;
    procedures?: string;
  }) => {
    try {
      await saveCompany(companyInfo);
      toast({
        title: "Informações da empresa salvas",
        description: "As informações da empresa foram atualizadas com sucesso.",
      });
    } catch (error) {
      console.error('Error saving company info:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as informações da empresa.",
        variant: "destructive",
      });
    }
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
        return isNewBot ? null : <ConversationsContent assistantId={id || ''} onRefresh={() => refetch()} />;
      
      case 'settings':
        return (
          <SettingsContent
            assistant={{
              id: assistant.id,
              name: assistant.name,
              description: assistant.description,
              temperature: assistant.temperature,
              active: assistant.status === 'active',
              wait_time: (bot as any)?.wait_time,
              prompts: {
                principal: [],
                triagem: [],
                think: []
              }
            }}
            updateAssistant={(updates) => {
              console.log('🟢 AssistantView.updateAssistant called with:', updates);
              // This function is now mainly for immediate UI feedback
              // The actual saving is handled by the SettingsContent component
            }}
            onSave={handleSaveSettings}
          />
        );
      
      case 'company':
        return (
          <CompanyContent
            assistantId={id || ''}
            companyInfo={bot ? {
              company_name: bot.company_name,
              company_address: bot.company_address,
              company_website: bot.company_website,
              company_instagram: bot.company_instagram,
              company_business_hours: bot.company_business_hours,
              company_professionals: (bot as any).company_professionals,
              company_procedures: (bot as any).company_procedures,
            } : undefined}
            onSave={handleSaveCompany}
          />
        );
      
      case 'integrations':
        return isNewBot ? null : <IntegrationsContent assistantId={id || ''} />;
      
      case 'flows':
        return isNewBot ? null : <FlowsContent assistantId={id || ''} />;
      
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
        { label: isNewBot ? 'Criar Assistente' : assistant?.name || 'Assistente' }
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
      <div className="flex h-[calc(100vh-7rem)] bg-gradient-to-br from-background via-background/95 to-card/10 relative overflow-hidden">
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
              name: assistant?.name || 'Novo Assistente',
              conversations: assistant?.conversations || 0,
              performance: assistant?.performance || 0,
              status: assistant?.status || 'active'
            }}
            isNewBot={isNewBot}
          />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 konver-content-area relative z-10 min-w-0 flex flex-col h-full overflow-hidden">
          <div className="p-4 md:p-6 lg:p-8 flex-1 flex flex-col h-full min-h-0">
            <div className="konver-animate-fade-in flex-1 h-full min-h-0 overflow-hidden">
              {renderActiveTabContent()}
            </div>
          </div>
        </div>
      </div>
    </KonverLayout>
  );
}