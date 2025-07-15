import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  MessageSquare, 
  Phone, 
  User, 
  Bot,
  Clock, 
  Search, 
  RefreshCw,
  ExternalLink,
  Edit3,
  Save,
  X
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ExternalConversation, ConversationMessage, ConversationStatus, MessageFeedback, TablesInsert } from "@/integrations/supabase/types";

interface AssistantConversationsTabProps {
  botId: string;
}

interface ConversationWithMessages extends ExternalConversation {
  messages: ConversationMessage[];
  messageCount: number;
  lastMessage?: ConversationMessage;
}

export default function AssistantConversationsTab({ botId }: AssistantConversationsTabProps) {
  const [conversations, setConversations] = useState<ConversationWithMessages[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ConversationWithMessages | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Feedback modal state
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<ConversationMessage | null>(null);
  const [userContextMessage, setUserContextMessage] = useState('');
  const [improvedResponse, setImprovedResponse] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  
  const { toast } = useToast();

  // Buscar conversas do assistente
  const fetchConversations = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('external_conversations')
        .select(`
          *,
          conversation_messages (
            id,
            message_type,
            content,
            created_at,
            metadata
          )
        `)
        .eq('bot_id', botId)
        .order('last_message_at', { ascending: false });

      if (error) {
        throw error;
      }

      const conversationsWithData: ConversationWithMessages[] = (data || []).map(conv => {
        const mappedMessages = (conv.conversation_messages || []).map(msg => ({
          ...msg,
          conversation_id: conv.id,
          message_type: msg.message_type as 'user' | 'bot'
        }));
        
        const lastMessage = mappedMessages.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];
        
        return {
          ...conv,
          status: conv.status as ConversationStatus,
          messages: mappedMessages,
          messageCount: conv.conversation_messages?.length || 0,
          lastMessage
        };
      });

      setConversations(conversationsWithData);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast({
        title: "Erro ao carregar conversas",
        description: "Não foi possível carregar as conversas do assistente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Abrir modal de feedback
  const handleImproveBotMessage = (message: ConversationMessage) => {
    if (!selectedConversation) return;
    
    // Find the user message that triggered this bot response
    const messageIndex = selectedConversation.messages.findIndex(m => m.id === message.id);
    const previousUserMessage = selectedConversation.messages
      .slice(0, messageIndex)
      .reverse()
      .find(m => m.message_type === 'user');
    
    setSelectedMessage(message);
    setUserContextMessage(previousUserMessage?.content || '');
    setImprovedResponse('');
    setFeedbackDialogOpen(true);
  };

  // Enviar feedback
  const handleSubmitFeedback = async () => {
    if (!selectedMessage || !selectedConversation || !improvedResponse.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha a resposta melhorada.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmittingFeedback(true);

      // Extract keywords from user context
      const { data: keywordsData } = await supabase
        .rpc('extract_keywords_from_text', { input_text: userContextMessage });

      const feedbackData: TablesInsert<'message_feedback'> = {
        conversation_message_id: selectedMessage.id,
        bot_id: botId,
        user_message_context: userContextMessage,
        original_bot_response: selectedMessage.content,
        improved_response: improvedResponse.trim(),
        status: 'pending',
        similarity_keywords: keywordsData || [],
        conversation_context: {
          conversation_id: selectedMessage.conversation_id,
          user_name: selectedConversation.user_name,
          phone_number: selectedConversation.phone_number,
          message_timestamp: selectedMessage.created_at
        }
      };

      const { error } = await supabase
        .from('message_feedback')
        .insert(feedbackData);

      if (error) throw error;

      toast({
        title: "Feedback enviado!",
        description: "Sua sugestão de melhoria foi registrada e será aplicada ao bot.",
      });

      setFeedbackDialogOpen(false);
      setSelectedMessage(null);
      setUserContextMessage('');
      setImprovedResponse('');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: "Erro ao enviar feedback",
        description: "Não foi possível registrar sua sugestão. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSubmittingFeedback(false);
    }
  };

  // Filtrar conversas
  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = searchTerm === '' || 
      conv.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.phone_number.includes(searchTerm);
    
    return matchesSearch;
  });

  useEffect(() => {
    fetchConversations();
  }, [botId]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins}min`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
        <Card className="lg:col-span-1">
          <CardContent className="p-6">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="animate-pulse">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              <div className="space-y-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-12 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Interface Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
        {/* Lista de Conversas */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Conversas</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchConversations}
                className="h-8 w-8 p-0"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Busca */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nome ou telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            <ScrollArea className="h-[480px]">
              <div className="space-y-1 p-4">
                {filteredConversations.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>Nenhuma conversa encontrada</p>
                  </div>
                ) : (
                  filteredConversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      className={`p-2 rounded-lg cursor-pointer transition-colors ${
                        selectedConversation?.id === conversation.id
                          ? 'bg-blue-50 border border-blue-200'
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedConversation(conversation)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 flex-1 min-w-0">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
                              {conversation.user_name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1">
                              <p className="font-medium text-sm truncate">
                                {conversation.user_name}
                              </p>
                              <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                {conversation.messageCount}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500 truncate">
                              {conversation.phone_number}
                            </div>
                            {conversation.lastMessage && (
                              <p className="text-xs text-gray-600 mt-1 truncate">
                                {conversation.lastMessage.message_type === 'bot' ? '🤖 ' : '👤 '}
                                {conversation.lastMessage.content}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-xs text-gray-500 ml-2">
                          {conversation.last_message_at && formatTime(conversation.last_message_at)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Visualização da Conversa */}
        <Card className="lg:col-span-2">
          {selectedConversation ? (
            <>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                        {selectedConversation.user_name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">{selectedConversation.user_name}</h3>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {selectedConversation.phone_number}
                        </span>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            selectedConversation.status === 'active' 
                              ? 'bg-green-100 text-green-800 border-green-200'
                              : selectedConversation.status === 'archived'
                              ? 'bg-gray-100 text-gray-800 border-gray-200'
                              : selectedConversation.status === 'blocked'
                              ? 'bg-red-100 text-red-800 border-red-200'
                              : 'bg-gray-100 text-gray-800 border-gray-200'
                          }`}
                        >
                          {selectedConversation.status === 'active' 
                            ? 'Ativa' 
                            : selectedConversation.status === 'archived'
                            ? 'Arquivada'
                            : selectedConversation.status === 'blocked'
                            ? 'Bloqueada'
                            : selectedConversation.status
                          }
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right text-sm text-gray-500">
                    <div>Criada em {new Date(selectedConversation.created_at).toLocaleDateString('pt-BR')}</div>
                    <div>{selectedConversation.messageCount} mensagens</div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-0">
                <ScrollArea className="h-[450px]">
                  <div className="p-4 space-y-4">
                    {selectedConversation.messages
                      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                      .map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.message_type === 'bot' ? 'justify-start' : 'justify-end'}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg p-3 relative group ${
                              message.message_type === 'bot'
                                ? 'bg-gray-100 text-gray-800'
                                : 'bg-blue-500 text-white'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              {message.message_type === 'bot' ? (
                                <Bot className="h-4 w-4" />
                              ) : (
                                <User className="h-4 w-4" />
                              )}
                              <span className="text-xs opacity-75">
                                {formatTime(message.created_at)}
                              </span>
                              
                              {/* Botão Melhorar Resposta - apenas para mensagens do bot */}
                              {message.message_type === 'bot' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 ml-auto"
                                  onClick={() => handleImproveBotMessage(message)}
                                  title="Melhorar esta resposta"
                                >
                                  <Edit3 className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                            <p className="text-sm leading-relaxed">{message.content}</p>
                          </div>
                        </div>
                      ))}
                    
                    {selectedConversation.messages.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        <p>Nenhuma mensagem nesta conversa</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </>
          ) : (
            <CardContent className="p-12 text-center">
              <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Selecione uma conversa
              </h3>
              <p className="text-gray-600">
                Escolha uma conversa da lista para visualizar as mensagens
              </p>
            </CardContent>
          )}
        </Card>
      </div>

      {/* Modal de Feedback */}
      <Dialog open={feedbackDialogOpen} onOpenChange={setFeedbackDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="h-5 w-5" />
              Melhorar Resposta do Bot
            </DialogTitle>
            <DialogDescription>
              Forneça uma resposta melhorada para esta conversa para aprimorar as respostas do seu chatbot.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Mensagem do Usuário */}
            <div className="space-y-2">
              <Label htmlFor="user-message">Mensagem do usuário</Label>
              <Textarea
                id="user-message"
                value={userContextMessage}
                onChange={(e) => setUserContextMessage(e.target.value)}
                className="min-h-[60px] bg-blue-50"
                placeholder="Contexto da mensagem do usuário..."
              />
            </div>

            {/* Resposta Original do Bot */}
            <div className="space-y-2">
              <Label htmlFor="bot-response">Resposta original do bot</Label>
              <Textarea
                id="bot-response"
                value={selectedMessage?.content || ''}
                readOnly
                className="min-h-[80px] bg-gray-50 cursor-not-allowed"
              />
            </div>

            {/* Resposta Melhorada */}
            <div className="space-y-2">
              <Label htmlFor="improved-response" className="text-green-700 font-medium">
                Resposta esperada/melhorada
              </Label>
              <Textarea
                id="improved-response"
                value={improvedResponse}
                onChange={(e) => setImprovedResponse(e.target.value)}
                className="min-h-[100px] border-green-200 focus:border-green-500"
                placeholder="Digite aqui a resposta melhorada que o bot deveria ter dado..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setFeedbackDialogOpen(false)}
              disabled={submittingFeedback}
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button
              onClick={handleSubmitFeedback}
              disabled={submittingFeedback || !improvedResponse.trim()}
            >
              {submittingFeedback ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Melhoria
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 