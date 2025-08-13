import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Bot, Home, Menu } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import KonverLayout from "@/components/KonverLayout";
import AssistantSidebar from "@/components/AssistantSidebar";
import AssistantTestTab from "@/components/AssistantTestTab";
import AssistantSettingsTab from "@/components/AssistantSettingsTab";
import AssistantKnowledgeTab from "@/components/AssistantKnowledgeTab";
import AssistantConversationsTab from "@/components/AssistantConversationsTab";
import BotFeedbackManagement from "@/components/BotFeedbackManagement";
import FloatingPromptAssistant from "@/components/FloatingPromptAssistant";
import { AssistantData } from "@/types/assistant";
import { PromptModificationRequest } from "@/components/PromptWizard";

export default function AssistantView() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const defaultTab = searchParams.get('tab') || 'test';
  
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [assistant, setAssistant] = useState<AssistantData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Settings states
  const [assistantName, setAssistantName] = useState('');
  const [assistantDescription, setAssistantDescription] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [temperature, setTemperature] = useState([0.7]);
  const [assistantStatus, setAssistantStatus] = useState('Ativo');
  
  // Persona states
  const [personaObjective, setPersonaObjective] = useState('');
  const [personaPersonality, setPersonaPersonality] = useState('');
  const [personaStyle, setPersonaStyle] = useState('');
  const [personaTargetAudience, setPersonaTargetAudience] = useState('');
  
  const { toast } = useToast();
  const { user, signOut } = useAuth();

  const fetchAssistant = async () => {
    if (!id || !user) return;
    
    try {
      const { data, error } = await supabase
        .from('bots')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error) {
        throw error;
      }

      // Transform the data to match our interface
      const transformedData: AssistantData = {
        id: data.id,
        name: data.name,
        description: data.description,
        status: data.status,
        conversations: data.conversations,
        performance: data.performance,
        prompt: data.prompt,
        temperature: data.temperature,
        max_tokens: data.max_tokens,
        knowledge_base: null, // Not used anymore
        persona_name: data.persona_name,
        persona_objective: data.persona_objective,
        persona_personality: data.persona_personality,
        persona_style: data.persona_style,
        persona_target_audience: data.persona_target_audience,
        created_at: data.created_at,
        updated_at: data.updated_at
      };

      setAssistant(transformedData);
      setAssistantName(data.name);
      setAssistantDescription(data.description || '');
      setSystemPrompt(data.prompt || 'You are a helpful AI assistant.');
      setTemperature([data.temperature || 0.7]);
      setAssistantStatus(data.status);
      
      // Set persona states
      setPersonaObjective(data.persona_objective || '');
      setPersonaPersonality(data.persona_personality || '');
      setPersonaStyle(data.persona_style || '');
      setPersonaTargetAudience(data.persona_target_audience || '');
      
    } catch (error) {
      console.error('Error fetching assistant:', error);
      toast({
        title: "Erro ao carregar assistente",
        description: "Não foi possível carregar os dados do assistente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssistant();
  }, [id, user]);

  const saveSettings = async () => {
    if (!id || !user || !assistant) return;
    
    setSaving(true);
    
    try {
      const { error } = await supabase
        .from('bots')
        .update({
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
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      // Update local state
      setAssistant({
        ...assistant,
        name: assistantName,
        description: assistantDescription,
        prompt: systemPrompt,
        temperature: temperature[0],
        status: assistantStatus,
        knowledge_base: null, // Not used anymore
        updated_at: new Date().toISOString()
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
    } finally {
      setSaving(false);
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

  if (loading) {
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
            Back
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

  if (!assistant) {
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
            Back
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
    switch (activeTab) {
      case 'test':
        return (
          <AssistantTestTab
            assistant={assistant}
            systemPrompt={systemPrompt}
            temperature={temperature}
            maxTokens={1000}
          />
        );
      case 'conversations':
        return <AssistantConversationsTab botId={id || ''} />;
      case 'settings':
        return (
          <AssistantSettingsTab
            botId={id || ''}
            assistantName={assistantName}
            setAssistantName={setAssistantName}
            assistantDescription={assistantDescription}
            setAssistantDescription={setAssistantDescription}
            temperature={temperature}
            setTemperature={setTemperature}
            assistantStatus={assistantStatus}
            setAssistantStatus={setAssistantStatus}
            personaObjective={personaObjective}
            setPersonaObjective={setPersonaObjective}
            personaPersonality={personaPersonality}  
            setPersonaPersonality={setPersonaPersonality}
            personaStyle={personaStyle}
            setPersonaStyle={setPersonaStyle}
            personaTargetAudience={personaTargetAudience}
            setPersonaTargetAudience={setPersonaTargetAudience}
            saveSettings={saveSettings}
            saving={saving}
          />
        );
      case 'knowledge':
        return <AssistantKnowledgeTab botId={id || ''} />;
      case 'feedback':
        return (
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
        { label: assistant.name }
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
            Back
          </Button>
        </div>
      }
    >
      <div className="flex min-h-[calc(100vh-12rem)] bg-gradient-to-br from-background via-background/95 to-card/10 relative">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/20"></div>
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, hsl(var(--border)) 1px, transparent 0)`,
            backgroundSize: '32px 32px'
          }}></div>
        </div>

        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Modern Sidebar Navigation */}
        <div className={`relative z-50 md:z-10 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 ease-out`}>
          <AssistantSidebar 
            activeTab={activeTab} 
            onTabChange={(tab) => {
              setActiveTab(tab);
              setSidebarOpen(false); // Close sidebar on mobile when tab changes
            }}
            assistant={{
              conversations: assistant.conversations,
              performance: assistant.performance,
              status: assistant.status
            }}
          />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 konver-content-area relative z-10 min-w-0">
          <div className="relative">
            {/* Content Container */}
            <div className="p-4 sm:p-6 lg:p-8 xl:p-10 konver-scrollbar max-h-[calc(100vh-12rem)] overflow-y-auto">
              <div className="max-w-6xl mx-auto">
                {/* Content Header */}
                <div className="mb-6 lg:mb-8 konver-animate-slide-right">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-1.5 sm:w-2 h-6 sm:h-8 rounded-full flex-shrink-0 ${
                        activeTab === 'test' ? 'bg-violet-500' :
                        activeTab === 'conversations' ? 'bg-emerald-500' :
                        activeTab === 'settings' ? 'bg-blue-500' :
                        activeTab === 'knowledge' ? 'bg-amber-500' :
                        'bg-rose-500'
                      }`} />
                      <div className="min-w-0">
                        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground leading-tight">
                          {activeTab === 'test' && 'Test Chat'}
                          {activeTab === 'conversations' && 'Conversations'}
                          {activeTab === 'settings' && 'Configuration'}
                          {activeTab === 'knowledge' && 'Knowledge Base'}
                          {activeTab === 'feedback' && 'Training & Feedback'}
                        </h2>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
                          {activeTab === 'test' && 'Test your assistant with live conversations and see real-time responses'}
                          {activeTab === 'conversations' && 'View chat history, analytics, and conversation insights'}
                          {activeTab === 'settings' && 'Manage assistant settings, prompts, and persona configuration'}
                          {activeTab === 'knowledge' && 'Upload and organize knowledge sources for your assistant'}
                          {activeTab === 'feedback' && 'Improve responses through feedback and training data'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Main Content */}
                <div className="konver-animate-fade-in">
                  <div className="relative">
                    {renderActiveTabContent()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Prompt Assistant */}
      {assistant && (
        <FloatingPromptAssistant
          currentPrompt={systemPrompt}
          onApplyPrompt={handleApplyPromptFromAssistant}
          assistantName="Assistente de Prompts"
        />
      )}
    </KonverLayout>
  );
} 