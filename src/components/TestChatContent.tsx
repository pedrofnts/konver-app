import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Bot, 
  User, 
  Send, 
  AlertCircle, 
  Trash2,
  MessageSquare,
  Clock,
  Zap,
  RotateCcw,
  Copy,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  CheckCircle,
  Wifi,
  WifiOff,
  Sparkles,
  Activity,
  TrendingUp,
  MessageCircle,
  Timer,
  Target
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
}

interface ChatStats {
  totalMessages: number;
  avgResponseTime: number;
  successRate: number;
  totalChats: number;
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
  const [isConnected, setIsConnected] = useState(true);
  const [lastResponseTime, setLastResponseTime] = useState<number>(0);
  const [totalChats, setTotalChats] = useState(0);
  const [inputMode, setInputMode] = useState<'single' | 'multi'>('single');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Simulate connection status
  useEffect(() => {
    const interval = setInterval(() => {
      setIsConnected(Math.random() > 0.05); // 95% uptime
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const getChatStats = useCallback((): ChatStats => {
    const totalMessages = messages.length;
    const assistantMessages = messages.filter(m => m.sender === 'assistant');
    const responseTimes = assistantMessages.map(m => m.responseTime || 0).filter(t => t > 0);
    const avgResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
      : 0;
    const successRate = totalMessages > 0 ? (assistantMessages.length / (totalMessages / 2)) * 100 : 100;

    return {
      totalMessages,
      avgResponseTime,
      successRate,
      totalChats
    };
  }, [messages, totalChats]);

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

      const { data, error } = await supabase.functions.invoke('chat-with-assistant', {
        body: {
          message: userMessage.content,
          assistantId: assistantId,
          conversationId: `test-${assistantId}-${Date.now()}`
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

  const regenerateResponse = async (messageId: string) => {
    const messageIndex = messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) return;

    const userMessage = messages[messageIndex - 1];
    if (!userMessage || userMessage.sender !== 'user') return;

    setIsLoading(true);
    setIsTyping(true);

    try {
      const { data, error } = await supabase.functions.invoke('chat-with-assistant', {
        body: {
          message: userMessage.content,
          assistantId: assistantId,
          conversationId: `test-${assistantId}-${Date.now()}`
        }
      });

      if (error) throw error;

      const updatedMessage: Message = {
        ...messages[messageIndex],
        content: data.response || 'Desculpe, não consegui processar sua mensagem.',
        timestamp: new Date(),
        responseTime: Date.now() - Date.now()
      };

      setMessages(prev => prev.map(m => m.id === messageId ? updatedMessage : m));
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível regenerar a resposta.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const handleFeedback = (messageId: string, feedback: 'positive' | 'negative') => {
    setMessages(prev => prev.map(m => 
      m.id === messageId ? { ...m, feedback } : m
    ));
    
    toast({
      title: feedback === 'positive' ? "Feedback Positivo" : "Feedback Negativo",
      description: "Obrigado pelo seu feedback! Isso nos ajuda a melhorar.",
    });
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
    setTotalChats(prev => prev + 1);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    } else if (e.key === 'Enter' && e.shiftKey) {
      setInputMode('multi');
    }
  };

  const stats = getChatStats();

  const MessageActions = ({ message, isUser }: { message: Message; isUser: boolean }) => (
    <div className="opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center space-x-1 absolute -top-2 right-2 bg-background border border-border rounded-lg shadow-md p-1">
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
            onClick={() => regenerateResponse(message.id)}
            disabled={isLoading}
            className="h-6 w-6 p-0 hover:bg-accent/10"
          >
            <RotateCcw className="w-3 h-3" />
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

  const TypingIndicator = () => (
    <div className="flex justify-start konver-animate-in">
      <div className="flex items-end space-x-3">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-full konver-gradient-primary flex items-center justify-center shadow-md">
            <Bot className="w-4 h-4 text-white" />
          </div>
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
  );

  const EmptyState = () => (
    <div className="flex items-center justify-center h-full text-center p-8 konver-animate-fade-in">
      <div className="max-w-md space-y-6">
        <div className="konver-gradient-primary w-20 h-20 rounded-3xl flex items-center justify-center mx-auto shadow-xl konver-animate-float">
          <MessageSquare className="w-10 h-10 text-white" />
        </div>
        <div className="space-y-3">
          <h3 className="text-2xl font-bold konver-text-gradient">Teste seu Assistente</h3>
          <p className="text-muted-foreground leading-relaxed">
            Inicie uma conversa para testar as respostas e comportamento do seu assistente de IA. Use perguntas variadas para avaliar sua performance.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 text-sm">
          <div className="konver-glass-card p-4 rounded-xl">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-success/10 text-success flex items-center justify-center">
                <Zap className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="font-medium">Respostas Rápidas</div>
                <div className="text-xs text-muted-foreground">Teste velocidade de resposta</div>
              </div>
            </div>
          </div>
          <div className="konver-glass-card p-4 rounded-xl">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-accent/10 text-accent flex items-center justify-center">
                <Target className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="font-medium">Precisão das Respostas</div>
                <div className="text-xs text-muted-foreground">Avalie qualidade do conteúdo</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="konver-tab-content-flex">
      {/* Enhanced Stats Header */}
      <div className="konver-glass-card rounded-2xl p-6 mb-6 konver-animate-fade-in">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="konver-gradient-primary w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <div className="text-2xl font-bold konver-text-gradient">{stats.totalMessages}</div>
            <div className="text-sm text-muted-foreground">Mensagens</div>
          </div>
          <div className="text-center">
            <div className="bg-accent/10 text-accent w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-accent/20">
              <Timer className="w-6 h-6" />
            </div>
            <div className="text-2xl font-bold text-accent">{Math.round(stats.avgResponseTime)}ms</div>
            <div className="text-sm text-muted-foreground">Tempo Médio</div>
          </div>
          <div className="text-center">
            <div className="bg-success/10 text-success w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-success/20">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div className="text-2xl font-bold text-success">{Math.round(stats.successRate)}%</div>
            <div className="text-sm text-muted-foreground">Taxa de Sucesso</div>
          </div>
          <div className="text-center">
            <div className="bg-warning/10 text-warning w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-warning/20">
              <Activity className="w-6 h-6" />
            </div>
            <div className="text-2xl font-bold text-warning">{stats.totalChats}</div>
            <div className="text-sm text-muted-foreground">Conversas</div>
          </div>
        </div>
      </div>

      {/* Connection Status & Last Response Time */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className={`flex items-center space-x-2 px-3 py-2 rounded-xl border ${
            isConnected 
              ? 'bg-success/10 text-success border-success/20' 
              : 'bg-destructive/10 text-destructive border-destructive/20'
          }`}>
            {isConnected ? (
              <Wifi className="w-4 h-4" />
            ) : (
              <WifiOff className="w-4 h-4" />
            )}
            <span className="text-sm font-medium">
              {isConnected ? 'Online' : 'Offline'}
            </span>
          </div>
          {lastResponseTime > 0 && (
            <Badge variant="outline" className="bg-accent/5 text-accent border-accent/20">
              <Clock className="w-3 h-3 mr-1" />
              Último: {lastResponseTime}ms
            </Badge>
          )}
        </div>
        
        {messages.length > 0 && (
          <Button
            onClick={clearChat}
            variant="outline"
            disabled={isLoading}
            className="konver-hover-subtle"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Limpar Chat
          </Button>
        )}
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6 konver-animate-shake">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="font-medium">{error}</AlertDescription>
        </Alert>
      )}

      {/* Enhanced Chat Interface */}
      <div className="flex-1 konver-glass-card rounded-2xl overflow-hidden konver-animate-slide-up flex flex-col min-h-0">
        {messages.length === 0 ? (
          <EmptyState />
        ) : (
          <ScrollArea className="flex-1 konver-scrollbar">
            <div className="p-6 space-y-6">
              {messages.map((message, index) => {
                const isUser = message.sender === 'user';
                const isFirst = index === 0 || messages[index - 1].sender !== message.sender;
                const isLast = index === messages.length - 1 || messages[index + 1].sender !== message.sender;
                
                return (
                  <div 
                    key={message.id} 
                    className={`flex items-end space-x-3 group relative konver-animate-in ${
                      isUser ? 'justify-end flex-row-reverse space-x-reverse' : 'justify-start'
                    }`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {/* Avatar - only show on first message in a series */}
                    {isFirst && (
                      <div className="flex-shrink-0">
                        <Avatar className="h-10 w-10 ring-2 ring-border/30 shadow-md">
                          <AvatarFallback className={`font-semibold text-white ${
                            isUser ? 'konver-gradient-accent' : 'konver-gradient-primary'
                          }`}>
                            {isUser ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    )}
                    
                    {/* Message bubble */}
                    <div className={`max-w-sm lg:max-w-md relative ${!isFirst ? (isUser ? 'mr-13' : 'ml-13') : ''}`}>
                      <MessageActions message={message} isUser={isUser} />
                      
                      <div className={`px-5 py-4 rounded-2xl shadow-sm border transition-all duration-200 group-hover:shadow-md backdrop-blur-sm ${
                        isUser
                          ? 'konver-gradient-primary text-white border-primary/20'
                          : 'bg-muted/70 text-foreground border-border/50'
                      } ${
                        isFirst && isLast ? 'rounded-2xl' :
                        isFirst ? (isUser ? 'rounded-br-md' : 'rounded-bl-md') :
                        isLast ? (isUser ? 'rounded-tr-md' : 'rounded-tl-md') :
                        (isUser ? 'rounded-r-md' : 'rounded-l-md')
                      }`}>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                          {message.content}
                        </p>
                        
                        {/* Timestamp and metadata - only show on last message in a series */}
                        {isLast && (
                          <div className={`mt-3 pt-2 border-t border-current/10 flex items-center justify-between text-xs ${
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
                        )}
                        
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
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {/* Enhanced Typing Indicator */}
              {isTyping && <TypingIndicator />}
              
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        )}

        {/* Enhanced Input Area */}
        <div className="flex-shrink-0 p-6 border-t border-border/50 bg-gradient-to-r from-background/50 to-surface-elevation-1/50">
          <div className="space-y-3">
            {/* Input Mode Toggle */}
            <div className="flex items-center space-x-2">
              <Button
                variant={inputMode === 'single' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setInputMode('single')}
                className="text-xs h-7 px-3"
              >
                Single Line
              </Button>
              <Button
                variant={inputMode === 'multi' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setInputMode('multi')}
                className="text-xs h-7 px-3"
              >
                Multi Line
              </Button>
              <div className="flex-1" />
              <div className="text-xs text-muted-foreground">
                {inputMode === 'single' ? 'Enter para enviar' : 'Ctrl+Enter para enviar'}
              </div>
            </div>
            
            {/* Input Field */}
            <div className="relative">
              {inputMode === 'single' ? (
                <Input
                  ref={inputRef as any}
                  placeholder="Digite sua mensagem..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isLoading}
                  className="h-14 text-base pr-24 konver-focus rounded-xl border-border/50 bg-background/80 backdrop-blur-sm"
                />
              ) : (
                <Textarea
                  ref={inputRef}
                  placeholder="Digite sua mensagem... (Ctrl+Enter para enviar)"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && e.ctrlKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  disabled={isLoading}
                  className="min-h-14 max-h-32 text-base pr-24 konver-focus rounded-xl border-border/50 bg-background/80 backdrop-blur-sm resize-none"
                  rows={2}
                />
              )}
              
              {/* Send Button */}
              <div className="absolute right-2 bottom-2 flex items-center space-x-2">
                <div className="text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded-md border border-border/30">
                  {inputMessage.length}
                </div>
                <Button 
                  onClick={sendMessage} 
                  disabled={!inputMessage.trim() || isLoading}
                  size="sm"
                  className="konver-button-primary h-10 w-10 p-0 shadow-lg"
                >
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
            
            {/* Shortcuts Help */}
            <div className="flex items-center justify-center text-xs text-muted-foreground space-x-4">
              <div className="flex items-center space-x-1">
                <kbd className="px-2 py-0.5 bg-muted rounded text-xs border border-border/50">Enter</kbd>
                <span>Enviar</span>
              </div>
              <div className="flex items-center space-x-1">
                <kbd className="px-2 py-0.5 bg-muted rounded text-xs border border-border/50">Shift+Enter</kbd>
                <span>Nova linha</span>
              </div>
              <div className="flex items-center space-x-1">
                <kbd className="px-2 py-0.5 bg-muted rounded text-xs border border-border/50">Ctrl+K</kbd>
                <span>Limpar</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
