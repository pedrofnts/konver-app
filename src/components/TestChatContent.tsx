import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import AssistantStepHeader from "@/components/AssistantStepHeader";
import AssistantStepContent from "@/components/AssistantStepContent";
import { useAuth } from "@/hooks/useAuth";
import { 
  Bot, 
  User, 
  Send, 
  Trash2,
  MessageSquare,
  Clock,
  Zap,
  Edit3,
  Copy,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  Check,
  X
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  feedback?: 'positive' | 'negative' | null;
  responseTime?: number;
  correction?: string;
}

interface TestChatContentProps {
  assistantId: string;
}

export default function TestChatContent({ assistantId }: TestChatContentProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResponseTime, setLastResponseTime] = useState<number>(0);
  const [sessionId] = useState(() => `test-${assistantId}-${Date.now()}`);
  const [correctionInput, setCorrectionInput] = useState<string>('');
  const [correctingMessageId, setCorrectingMessageId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const startTime = Date.now();
    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setIsTyping(true);
    setError(null);

    try {
      // Simulate typing delay for better UX
      await new Promise(resolve => setTimeout(resolve, 800));

      const { data, error } = await supabase.functions.invoke('assistant-chat', {
        body: {
          chatInput: userMessage.content,
          sessionId: sessionId,
          assistant: assistantId,
          promptVersions: {
            principal: assistantId, // ID do prompt principal (mesmo que o assistant para simplicidade)
            triagem: assistantId    // ID do prompt de triagem (mesmo que o assistant para simplicidade)
          }
        }
      });

      if (error) throw error;

      const responseTime = Date.now() - startTime;
      setLastResponseTime(responseTime);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response || 'Desculpe, não consegui processar sua mensagem.',
        sender: 'assistant',
        timestamp: new Date(),
        responseTime
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Erro ao enviar mensagem. Tente novamente.');
      toast({
        title: "Erro de Conexão",
        description: "Não foi possível enviar a mensagem. Verificar conexão.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };


  const handleFeedback = async (messageId: string, feedback: 'positive' | 'negative') => {
    if (!user) return;

    // Para feedback negativo sem correção, vamos criar um registro básico
    if (feedback === 'negative') {
      const messageIndex = messages.findIndex(m => m.id === messageId);
      if (messageIndex === -1) return;

      const assistantMessage = messages[messageIndex];
      const userMessage = messages[messageIndex - 1];
      
      if (userMessage && userMessage.sender === 'user') {
        try {
          const { error } = await supabase.from('message_feedback').insert({
            bot_id: assistantId,
            created_by_user_id: user.id,
            user_message_context: userMessage.content,
            original_bot_response: assistantMessage.content,
            improved_response: 'Feedback negativo sem correção específica',
            feedback_type: 'improve_response',
            status: 'pending',
            conversation_context: {
              session_id: sessionId,
              timestamp: new Date().toISOString(),
              message_id: messageId,
              feedback_type: 'negative_only'
            }
          });

          if (error) throw error;
        } catch (error) {
          console.error('Erro ao salvar feedback negativo:', error);
        }
      }
    }

    // Atualizar estado local
    setMessages(prev => prev.map(m => 
      m.id === messageId ? { ...m, feedback } : m
    ));
    
    toast({
      title: feedback === 'positive' ? "Feedback Positivo" : "Feedback Negativo",
      description: "Obrigado pelo seu feedback! Isso nos ajuda a melhorar.",
    });
  };

  const startCorrection = (messageId: string) => {
    setCorrectingMessageId(messageId);
    const message = messages.find(m => m.id === messageId);
    setCorrectionInput(message?.correction || '');
  };

  const saveCorrection = async (messageId: string) => {
    if (!correctionInput.trim() || !user) return;
    
    // Encontrar a mensagem do assistente e a mensagem do usuário anterior
    const messageIndex = messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) return;

    const assistantMessage = messages[messageIndex];
    const userMessage = messages[messageIndex - 1];
    
    if (!userMessage || userMessage.sender !== 'user') return;

    try {
      // Salvar no banco de dados
      const { error } = await supabase.from('message_feedback').insert({
        bot_id: assistantId,
        created_by_user_id: user.id,
        user_message_context: userMessage.content,
        original_bot_response: assistantMessage.content,
        improved_response: correctionInput.trim(),
        feedback_type: 'improve_response',
        status: 'pending',
        conversation_context: {
          session_id: sessionId,
          timestamp: new Date().toISOString(),
          message_id: messageId
        }
      });

      if (error) throw error;

      // Atualizar estado local
      setMessages(prev => prev.map(m => 
        m.id === messageId ? { ...m, correction: correctionInput.trim(), feedback: 'negative' } : m
      ));
      
      setCorrectingMessageId(null);
      setCorrectionInput('');
      
      toast({
        title: "Correção Salva",
        description: "Sua correção foi salva no banco de dados e será usada para melhorar o assistente.",
      });
    } catch (error) {
      console.error('Erro ao salvar feedback:', error);
      toast({
        title: "Erro ao Salvar",
        description: "Não foi possível salvar a correção. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const cancelCorrection = () => {
    setCorrectingMessageId(null);
    setCorrectionInput('');
  };

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Copiado!",
      description: "Mensagem copiada para a área de transferência.",
    });
  };

  const clearChat = () => {
    setMessages([]);
    setError(null);
  };



  const MessageActions = ({ message, isUser }: { message: Message; isUser: boolean }) => (
    <div className="opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center space-x-1 absolute -top-2 right-2 bg-background border border-border rounded-lg shadow-md p-1 z-50">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => copyToClipboard(message.content)}
        className="h-6 w-6 p-0 hover:bg-accent/10"
      >
        <Copy className="w-3 h-3" />
      </Button>
      {!isUser && (
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => startCorrection(message.id)}
            disabled={isLoading}
            className="h-6 w-6 p-0 hover:bg-accent/10"
          >
            <Edit3 className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleFeedback(message.id, 'positive')}
            className={`h-6 w-6 p-0 ${message.feedback === 'positive' ? 'text-success bg-success/10' : 'hover:bg-success/10'}`}
          >
            <ThumbsUp className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleFeedback(message.id, 'negative')}
            className={`h-6 w-6 p-0 ${message.feedback === 'negative' ? 'text-destructive bg-destructive/10' : 'hover:bg-destructive/10'}`}
          >
            <ThumbsDown className="w-3 h-3" />
          </Button>
        </>
      )}
    </div>
  );

  // Header configuration
  const headerActions = [
    {
      label: "Limpar Chat",
      icon: <Trash2 className="w-4 h-4" />,
      onClick: clearChat,
      disabled: isLoading || messages.length === 0,
      variant: "outline" as const
    }
  ];

  return (
    <div className="flex flex-col h-full">
      <AssistantStepHeader
        title="Assistente"
        description="Converse com seu assistente de IA"
        icon={<MessageSquare className="w-5 h-5 text-white" />}
        actions={headerActions}
        loading={isLoading && messages.length === 0}
        compact={true}
        className="flex-shrink-0 shadow-none border-0 bg-transparent backdrop-blur-none"
      />

      <div className="flex-1 min-h-0 mt-4">
        <div className="konver-glass-card rounded-2xl h-full flex flex-col overflow-hidden">
          {/* Chat Messages Area */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <ScrollArea className="h-full konver-scrollbar">
              <div className="p-6 space-y-4">
                  <div className="space-y-4">
                  {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-64 text-center">
                      <div className="max-w-sm space-y-4">
                        <div className="konver-gradient-primary w-12 h-12 rounded-xl flex items-center justify-center mx-auto shadow-lg">
                          <MessageSquare className="w-6 h-6 text-white" />
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-lg font-semibold konver-text-gradient">Converse com seu Assistente</h3>
                          <p className="text-sm text-muted-foreground">
                            Inicie uma conversa para interagir com seu assistente de IA.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    messages.map((message, index) => {
                      const isUser = message.sender === 'user';
                      
                      return (
                        <div 
                          key={message.id} 
                          className={`flex items-start group relative konver-animate-in mb-4 ${
                            isUser ? 'justify-end' : 'justify-start'
                          }`}
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          {/* Conditional ordering: user messages show avatar after, assistant before */}
                          {!isUser && (
                            <div className="flex-shrink-0 mr-3">
                              <Avatar className="h-8 w-8 ring-2 ring-border/20">
                                <AvatarFallback className="konver-gradient-primary font-medium text-white text-xs">
                                  <Bot className="w-4 h-4" />
                                </AvatarFallback>
                              </Avatar>
                            </div>
                          )}
                          
                          {/* Message bubble */}
                          <div className="max-w-xs md:max-w-sm lg:max-w-md relative">
                            <MessageActions message={message} isUser={isUser} />
                            
                            <div className={`px-4 py-3 rounded-2xl shadow-sm border transition-all duration-200 group-hover:shadow-md backdrop-blur-sm ${
                              isUser
                                ? 'konver-gradient-primary text-white border-primary/20 rounded-br-md'
                                : 'bg-muted/80 text-foreground border-border/50 rounded-bl-md'
                            }`}>
                              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                                {message.content}
                              </p>
                              
                              {/* Timestamp and metadata */}
                              <div className={`mt-2 pt-2 border-t border-current/10 flex items-center justify-between text-xs ${
                                isUser ? 'text-white/70' : 'text-muted-foreground'
                              }`}>
                                <div className="flex items-center space-x-2">
                                  <Clock className="w-3 h-3" />
                                  <span>
                                    {message.timestamp.toLocaleTimeString('pt-BR', { 
                                      hour: '2-digit', 
                                      minute: '2-digit'
                                    })}
                                  </span>
                                </div>
                                
                                {!isUser && message.responseTime && (
                                  <div className="flex items-center space-x-1">
                                    <Zap className="w-3 h-3" />
                                    <span>{message.responseTime}ms</span>
                                  </div>
                                )}
                              </div>
                              
                              {/* Feedback indicators */}
                              {!isUser && message.feedback && (
                                <div className={`mt-2 flex items-center space-x-1 text-xs ${
                                  message.feedback === 'positive' ? 'text-success' : 'text-destructive'
                                }`}>
                                  {message.feedback === 'positive' ? (
                                    <>
                                      <ThumbsUp className="w-3 h-3" />
                                      <span>Útil</span>
                                    </>
                                  ) : (
                                    <>
                                      <ThumbsDown className="w-3 h-3" />
                                      <span>Não útil</span>
                                    </>
                                  )}
                                </div>
                              )}
                              
                              {/* Correction display */}
                              {!isUser && message.correction && (
                                <div className="mt-2 pt-2 border-t border-current/10">
                                  <div className="text-xs text-muted-foreground mb-1">Correção sugerida:</div>
                                  <div className="text-xs bg-muted/20 rounded px-2 py-1 border border-border/30">
                                    {message.correction}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Correction Input */}
                          {!isUser && correctingMessageId === message.id && (
                            <div className="mt-3 space-y-2">
                              <div className="text-xs text-muted-foreground">Digite a resposta adequada:</div>
                              <Textarea
                                value={correctionInput}
                                onChange={(e) => setCorrectionInput(e.target.value)}
                                placeholder="Como deveria ter respondido?"
                                className="min-h-20 text-sm konver-focus rounded-lg border-border/50 bg-background/90 backdrop-blur-sm resize-none"
                                rows={3}
                              />
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  onClick={() => saveCorrection(message.id)}
                                  disabled={!correctionInput.trim()}
                                  className="konver-button-primary"
                                >
                                  <Check className="w-3 h-3 mr-1" />
                                  Salvar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={cancelCorrection}
                                >
                                  <X className="w-3 h-3 mr-1" />
                                  Cancelar
                                </Button>
                              </div>
                            </div>
                          )}
                          
                          {/* User avatar comes after message */}
                          {isUser && (
                            <div className="flex-shrink-0 ml-3">
                              <Avatar className="h-8 w-8 ring-2 ring-border/20">
                                <AvatarFallback className="konver-gradient-accent font-medium text-white text-xs">
                                  <User className="w-4 h-4" />
                                </AvatarFallback>
                              </Avatar>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                  
                  {/* Enhanced Typing Indicator */}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <Avatar className="h-8 w-8 ring-2 ring-border/20">
                            <AvatarFallback className="konver-gradient-primary font-medium text-white text-xs">
                              <Bot className="w-4 h-4" />
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        <div className="bg-muted/80 border border-border/50 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm backdrop-blur-sm">
                          <div className="flex items-center space-x-2">
                            <div className="text-sm text-muted-foreground">Digitando</div>
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          </div>
          
          {/* Chat Input Area - Fixed at bottom */}
          <div className="flex-shrink-0 border-t border-border/20 bg-card/80 backdrop-blur-sm">
            <div className="p-6 space-y-3">
                {/* Input Field */}
                <div className="relative">
                  <Textarea
                    ref={inputRef}
                    placeholder="Digite sua mensagem..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    disabled={isLoading}
                    className="min-h-12 max-h-24 text-sm pr-16 konver-focus rounded-xl border-border/50 bg-background/90 backdrop-blur-sm resize-none"
                    rows={1}
                  />
                  
                  {/* Send Button */}
                  <div className="absolute right-2 bottom-2">
                    <Button 
                      onClick={sendMessage} 
                      disabled={!inputMessage.trim() || isLoading}
                      size="sm"
                      className="konver-button-primary h-8 w-8 p-0 rounded-lg"
                    >
                      {isLoading ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                      ) : (
                        <Send className="w-3 h-3" />
                      )}
                    </Button>
                  </div>
                </div>
                

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
