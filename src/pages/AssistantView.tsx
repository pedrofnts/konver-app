import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { 
  ArrowLeft, 
  Bot,
  Settings,
  Bell,
  Search,
  User,
  LogOut,
  Home,
  Play,
  Zap,
  Brain
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import AssistantTestTab from "@/components/AssistantTestTab";
import AssistantSettingsTab from "@/components/AssistantSettingsTab";
import AssistantKnowledgeTab from "@/components/AssistantKnowledgeTab";
import FloatingPromptAssistant from "@/components/FloatingPromptAssistant";
import { KnowledgeFile, AssistantData } from "@/types/assistant";
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
  
  // Settings states
  const [assistantName, setAssistantName] = useState('');
  const [assistantDescription, setAssistantDescription] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [temperature, setTemperature] = useState([0.7]);
  const [assistantStatus, setAssistantStatus] = useState('Ativo');
  const [knowledgeFiles, setKnowledgeFiles] = useState<KnowledgeFile[]>([]);
  
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
        knowledge_base: Array.isArray(data.knowledge_base) ? data.knowledge_base as unknown as KnowledgeFile[] : [],
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
      setKnowledgeFiles(Array.isArray(data.knowledge_base) ? data.knowledge_base as unknown as KnowledgeFile[] : []);
      
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
          knowledge_base: knowledgeFiles as any,
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
        knowledge_base: knowledgeFiles,
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

  const removeKnowledgeFile = (index: number) => {
    setKnowledgeFiles(prev => prev.filter((_, i) => i !== index));
  };

  const addKnowledgeFile = () => {
    // Simulate file upload
    const newFile: KnowledgeFile = {
      name: `documento_${Date.now()}.pdf`,
      type: 'pdf',
      size: '2.5 MB'
    };
    setKnowledgeFiles(prev => [...prev, newFile]);
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
        {/* Header Skeleton */}
        <header className="h-20 border-b border-slate-200/60 bg-white/95 backdrop-blur-xl flex items-center justify-between px-8 shadow-sm sticky top-0 z-50">
          <div className="flex items-center gap-6">
            <Skeleton className="h-12 w-12 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </header>
        
        {/* Content Skeleton */}
        <main className="p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
            <Card>
              <CardContent className="p-6">
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  if (!assistant) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
        {/* Header */}
        <header className="h-20 border-b border-slate-200/60 bg-white/95 backdrop-blur-xl flex items-center justify-between px-8 shadow-sm sticky top-0 z-50">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-xl flex items-center justify-center shadow-lg">
                <Bot className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  AI Assistant Hub
                </h1>
                <p className="text-sm text-slate-500 font-medium">Assistente não encontrado</p>
              </div>
            </div>
          </div>
          
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="h-11 px-4 rounded-xl hover:bg-slate-100"
          >
            <Home className="w-5 h-5 mr-2" />
            Voltar
          </Button>
        </header>

        {/* Error Content */}
        <main className="p-8">
          <div className="max-w-7xl mx-auto">
            <Card className="bg-white/80 backdrop-blur-sm border-slate-200/60 shadow-lg">
              <CardContent className="p-12 text-center">
                <Bot className="w-20 h-20 text-slate-400 mx-auto mb-6" />
                <h2 className="text-2xl font-bold text-slate-800 mb-3">Assistente não encontrado</h2>
                <p className="text-slate-600 mb-8 max-w-md mx-auto">
                  O assistente solicitado não foi encontrado ou você não tem permissão para acessá-lo.
                </p>
                <Button 
                  onClick={() => navigate('/')}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white h-12 px-8 rounded-xl shadow-lg"
                >
                  <Home className="w-5 h-5 mr-2" />
                  Voltar para Home
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      {/* Header */}
      <header className="h-20 border-b border-slate-200/60 bg-white/95 backdrop-blur-xl flex items-center justify-between px-8 shadow-sm sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <Button 
            variant="outline" 
            onClick={() => navigate('/')}
            className="h-11 px-4 rounded-xl border-slate-200/80 hover:bg-slate-50"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Voltar
          </Button>
          
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-xl flex items-center justify-center shadow-lg">
              <Bot className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                AI Assistant Hub
              </h1>
              <p className="text-sm text-slate-500 font-medium">
                Configurações do Assistente
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="relative hidden lg:block">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <Input 
              placeholder="Buscar na conversa..." 
              className="pl-12 w-80 h-11 bg-white/80 border-slate-200/80 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 rounded-xl"
            />
          </div>
          
          <Button variant="outline" size="default" className="relative hover:bg-slate-50 rounded-xl border-slate-200/80 h-11 px-4">
            <Bell className="w-5 h-5" />
            <Badge variant="destructive" className="absolute -top-2 -right-2 w-6 h-6 p-0 text-xs rounded-full">
              3
            </Badge>
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-11 w-11 rounded-xl hover:bg-slate-100">
                <Avatar className="h-10 w-10">
                  <AvatarImage src="/placeholder.svg" alt="Avatar" />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold">
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64 p-2" align="end">
              <div className="px-3 py-2">
                <p className="text-sm font-medium text-slate-800">{user?.email?.split('@')[0] || 'Usuário'}</p>
                <p className="text-xs text-slate-500">{user?.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                Perfil
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                Configurações
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer text-red-600" onClick={() => signOut()}>
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main Content */}  
      <main className="p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Assistant Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 via-blue-500 to-purple-600 flex items-center justify-center shadow-xl">
                <span className="text-white font-bold text-2xl">
                  {assistant.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h2 className="text-3xl font-bold text-slate-800 mb-1">{assistant.name}</h2>
                <p className="text-lg text-slate-600">{assistant.description || 'Assistente de IA personalizado'}</p>
                <div className="flex items-center gap-4 mt-2">
                  <Badge 
                    variant={assistant.status === 'Ativo' ? 'default' : 'secondary'}
                    className={assistant.status === 'Ativo' 
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700' 
                      : ''
                    }
                  >
                    {assistant.status}
                  </Badge>
                  <div className="text-sm text-slate-500">
                    {assistant.conversations} conversas • {assistant.performance}% performance
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs with colorful design */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
            <TabsList className="grid w-full grid-cols-3 bg-white/90 backdrop-blur-sm border border-slate-200/60 rounded-2xl p-1 shadow-lg">
              <TabsTrigger 
                value="test" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl transition-all duration-300"
              >
                <Play className="w-4 h-4 mr-2" />
                Conversar
              </TabsTrigger>
              <TabsTrigger 
                value="settings"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl transition-all duration-300"
              >
                <Zap className="w-4 h-4 mr-2" />
                Configurações
              </TabsTrigger>
              <TabsTrigger 
                value="knowledge"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl transition-all duration-300"
              >
                <Brain className="w-4 h-4 mr-2" />
                Base de Conhecimento
              </TabsTrigger>
            </TabsList>

            {/* Test Interface */}
            <TabsContent value="test">
              <AssistantTestTab
                assistant={assistant}
                systemPrompt={systemPrompt}
                temperature={temperature}
                maxTokens={1000}
              />
            </TabsContent>

            {/* Settings */}
            <TabsContent value="settings">
              <AssistantSettingsTab
                assistantName={assistantName}
                setAssistantName={setAssistantName}
                assistantDescription={assistantDescription}
                setAssistantDescription={setAssistantDescription}
                systemPrompt={systemPrompt}
                setSystemPrompt={setSystemPrompt}
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
            </TabsContent>

            {/* Knowledge Base */}
            <TabsContent value="knowledge">
              <AssistantKnowledgeTab
                knowledgeFiles={knowledgeFiles}
                addKnowledgeFile={addKnowledgeFile}
                removeKnowledgeFile={removeKnowledgeFile}
              />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Floating Prompt Assistant */}
      {assistant && (
        <FloatingPromptAssistant
          currentPrompt={systemPrompt}
          onApplyPrompt={handleApplyPromptFromAssistant}
          assistantName="Assistente de Prompts"
        />
      )}
    </div>
  );
} 