import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, Bot, MessageSquare, AlertCircle, RotateCcw, Zap, Shield, ChevronDown, Settings } from "lucide-react";
import { Message, AssistantData } from "@/types/assistant";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PromptVersion, PromptVersionSummary } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/useAuth";

interface AssistantTestTabProps {
  assistant: AssistantData;
  systemPrompt: string;
  temperature: number[];
  maxTokens: number;
}

export default function AssistantTestTab({ 
  assistant, 
  systemPrompt, 
  temperature, 
  maxTokens 
}: AssistantTestTabProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sessionId = useRef<string>(crypto.randomUUID());
  
  // Estados para gerenciar versões de prompts
  const [promptVersions, setPromptVersions] = useState<PromptVersionSummary>({
    principal: { active: null, versions: [] },
    triagem: { active: null, versions: [] }
  });
  const [selectedPrincipalId, setSelectedPrincipalId] = useState<string | null>(null);
  const [selectedTriagemId, setSelectedTriagemId] = useState<string | null>(null);
  const [loadingPrompts, setLoadingPrompts] = useState(true);
  const [showPromptSettings, setShowPromptSettings] = useState(false);
  
  const { user } = useAuth();

  // Função para buscar versões dos prompts
  const fetchPromptVersions = async () => {
    if (!assistant.id || !user) return;
    
    try {
      const { data, error } = await supabase
        .from('prompt_versions')
        .select('*')
        .eq('bot_id', assistant.id)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Organizar por tipo
      const principalVersions = data.filter(p => p.prompt_type === 'principal') as PromptVersion[];
      const triagemVersions = data.filter(p => p.prompt_type === 'triagem') as PromptVersion[];

      const promptSummary: PromptVersionSummary = {
        principal: {
          active: principalVersions.find(p => p.is_active) || null,
          versions: principalVersions
        },
        triagem: {
          active: triagemVersions.find(p => p.is_active) || null,
          versions: triagemVersions
        }
      };

      setPromptVersions(promptSummary);
      
      // Definir versões ativas como padrão
      if (promptSummary.principal.active && !selectedPrincipalId) {
        setSelectedPrincipalId(promptSummary.principal.active.id);
      }
      if (promptSummary.triagem.active && !selectedTriagemId) {
        setSelectedTriagemId(promptSummary.triagem.active.id);
      }
    } catch (error) {
      console.error('Error fetching prompt versions:', error);
    } finally {
      setLoadingPrompts(false);
    }
  };

  useEffect(() => {
    fetchPromptVersions();
  }, [assistant.id, user]);

  const clearChat = () => {
    setMessages([]);
    setError(null);
    setShowPromptSettings(false); // Fechar configurações ao limpar chat
    sessionId.current = crypto.randomUUID(); // Generate new session ID
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: newMessage,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const messageContent = newMessage;
    setNewMessage('');
    setIsTyping(true);
    setError(null);

    try {
      // Call the Supabase Edge Function
      const { data, error: edgeFunctionError } = await supabase.functions.invoke('chat-assistant', {
        body: {
          chatInput: messageContent,
          sessionId: sessionId.current,
          assistant: assistant.id,
          promptVersions: {
            principal: selectedPrincipalId,
            triagem: selectedTriagemId
          }
        }
      });

      if (edgeFunctionError) {
        console.error('Edge function error:', edgeFunctionError);
        throw new Error(edgeFunctionError.message || 'Erro ao comunicar com o assistente');
      }

      if (!data.success) {
        throw new Error(data.error || 'Resposta inválida do assistente');
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        sender: 'assistant',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido ao enviar mensagem');
      
      // Add error message to chat
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        content: 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.',
        sender: 'assistant',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div>
      <Card className="w-full bg-white/90 backdrop-blur-sm border-slate-200/60 shadow-xl rounded-2xl">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-3 text-xl">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                Conversa
              </span>
            </CardTitle>
            
            <div className="flex items-center gap-2">
              {/* Botão de configurações de prompts */}
              {!loadingPrompts && (promptVersions.principal.versions.length > 0 || promptVersions.triagem.versions.length > 0) && (
                <Button
                  onClick={() => setShowPromptSettings(!showPromptSettings)}
                  variant="outline"
                  size="sm"
                  className={showPromptSettings ? "bg-slate-100" : ""}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Versões
                </Button>
              )}
              
              <Button
                onClick={clearChat}
                variant="outline"
                size="sm"
                disabled={messages.length === 0}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Limpar Chat
              </Button>
            </div>
          </div>
          
          {/* Seletores de Versão de Prompts - Mostrar apenas quando solicitado */}
          {showPromptSettings && (
            <>
              {loadingPrompts && (
                <div className="flex items-center gap-2 mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="w-4 h-4 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin" />
                  <span className="text-sm text-slate-600">Carregando versões dos prompts...</span>
                </div>
              )}
              
              {!loadingPrompts && (promptVersions.principal.versions.length > 0 || promptVersions.triagem.versions.length > 0) && (
                <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-4">
                  <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4 text-slate-600" />
                    <span className="text-sm font-medium text-slate-700">Configurações de Versões</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Selector Principal */}
                    {promptVersions.principal.versions.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium text-slate-700">Prompt Principal</span>
                        </div>
                        <Select value={selectedPrincipalId || ''} onValueChange={setSelectedPrincipalId}>
                          <SelectTrigger className="w-full h-10">
                            <SelectValue placeholder="Selecione uma versão" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border border-slate-200 shadow-lg">
                            {promptVersions.principal.versions.map((version) => (
                              <SelectItem key={version.id} value={version.id} className="hover:bg-slate-50">
                                <div className="flex items-center justify-between w-full">
                                  <span className="mr-2">v{version.version_number}</span>
                                  {version.is_active && (
                                    <Badge variant="outline" className="text-xs px-2 py-0.5 bg-green-50 text-green-700 border-green-200">
                                      Ativo
                                    </Badge>
                                  )}
                                  {version.description && (
                                    <span className="text-xs text-slate-500 ml-2 truncate max-w-32">
                                      {version.description}
                                    </span>
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    
                    {/* Selector Triagem */}
                    {promptVersions.triagem.versions.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium text-slate-700">Prompt de Triagem</span>
                        </div>
                        <Select value={selectedTriagemId || ''} onValueChange={setSelectedTriagemId}>
                          <SelectTrigger className="w-full h-10">
                            <SelectValue placeholder="Selecione uma versão" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border border-slate-200 shadow-lg">
                            {promptVersions.triagem.versions.map((version) => (
                              <SelectItem key={version.id} value={version.id} className="hover:bg-slate-50">
                                <div className="flex items-center justify-between w-full">
                                  <span className="mr-2">v{version.version_number}</span>
                                  {version.is_active && (
                                    <Badge variant="outline" className="text-xs px-2 py-0.5 bg-green-50 text-green-700 border-green-200">
                                      Ativo
                                    </Badge>
                                  )}
                                  {version.description && (
                                    <span className="text-xs text-slate-500 ml-2 truncate max-w-32">
                                      {version.description}
                                    </span>
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                  
                  <div className="text-xs text-slate-500 bg-blue-50 p-2 rounded border border-blue-200">
                    💡 Altere as versões dos prompts para testar diferentes comportamentos do assistente
                  </div>
                </div>
              )}
            </>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <ScrollArea className="h-[600px] border border-slate-200/60 rounded-xl p-6 bg-gradient-to-br from-slate-50/50 to-blue-50/30">
            {messages.length === 0 ? (
              <div className="text-center text-slate-500 py-12">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Bot className="w-8 h-8 text-white" />
                </div>
                <p className="text-lg font-medium mb-2">Inicie uma conversa</p>
                <p className="text-sm">Teste seu assistente enviando uma mensagem</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs lg:max-w-md px-5 py-3 rounded-2xl shadow-md ${
                      message.sender === 'user' 
                        ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white' 
                        : 'bg-white border border-slate-200/80 shadow-lg'
                    }`}>
                      <p className="text-sm leading-relaxed">{message.content}</p>
                      <p className={`text-xs mt-2 ${
                        message.sender === 'user' ? 'text-blue-100' : 'text-slate-500'
                      }`}>
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-slate-200/80 shadow-lg px-5 py-3 rounded-2xl">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gradient-to-r from-pink-500 to-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
          
          <div className="flex space-x-3">
            <Input
              placeholder="Digite sua mensagem..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              className="flex-1 h-12 rounded-xl border-slate-200/80 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
            />
            <Button 
              onClick={sendMessage} 
              disabled={!newMessage.trim() || isTyping}
              className="h-12 px-6 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl shadow-lg"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 