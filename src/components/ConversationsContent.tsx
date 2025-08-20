import React, { useState, useEffect, useMemo } from 'react';
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import AssistantStepHeader from "@/components/AssistantStepHeader";
import AssistantStepContent from "@/components/AssistantStepContent";
import { 
  Search, 
  MessageSquare, 
  Bot, 
  User, 
  RefreshCw, 
  Clock,
  Phone,
  MessageCircle
} from "lucide-react";
import { useConversations, useConversationWithMessages } from '@/hooks/useConversations';

// Helper function to format time, can be moved to a utils file
const formatTime = (timestamp: string, format: 'time' | 'date') => {
  const date = new Date(timestamp);
  if (format === 'time') {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }
  const now = new Date();
  const diffInHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60);
  if (diffInHours < 24) {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' });
};

// Conversation list component
const ConversationList = ({ conversations, selectedConversation, onSelect, loading }) => {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="p-4 border border-border/50 rounded-xl animate-pulse">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-muted rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {conversations.map(conversation => (
        <div
          key={conversation.id}
          className={`p-4 border border-border/50 rounded-xl cursor-pointer transition-all duration-200 hover:border-border/80 hover:bg-accent/5 ${
            selectedConversation?.id === conversation.id ? 'border-primary/50 bg-primary/5' : ''
          }`}
          onClick={() => onSelect(conversation)}
        >
          <div className="flex items-start space-x-3">
            <Avatar className="h-10 w-10 ring-2 ring-border/20">
              <AvatarFallback className="konver-gradient-accent text-white font-semibold">
                <User className="w-5 h-5" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium text-foreground truncate">
                  {conversation.user_name || 'Usuário'}
                </p>
                <span className="text-xs text-muted-foreground">
                  {formatTime(conversation.created_at || new Date().toISOString(), 'date')}
                </span>
              </div>
              <div className="flex items-center space-x-2 mb-2">
                <Phone className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {conversation.phone_number || 'N/A'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                {conversation.last_message_at ? 'Última conversa em ' + formatTime(conversation.last_message_at, 'date') : 'Sem mensagens'}
              </p>
              <div className="flex items-center justify-between">
                <Badge 
                  variant="outline" 
                  className={`text-xs px-2 py-1 bg-success/10 text-success border-success/20`}
                >
                  {conversation.status || 'active'}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Conversa ativa
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Message details component
const MessageDetails = ({ conversation, messages, loading }) => {
  if (!conversation) {
    return (
      <div className="flex items-center justify-center h-full text-center p-8">
        <div className="max-w-sm space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-muted/20 flex items-center justify-center mx-auto">
            <MessageCircle className="w-8 h-8 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Selecione uma conversa</h3>
            <p className="text-sm text-muted-foreground">
              Escolha uma conversa da lista para ver as mensagens
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
            <div className="max-w-xs space-y-2 animate-pulse">
              <div className="h-12 bg-muted rounded-2xl" />
              <div className="h-3 bg-muted rounded w-16" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10 ring-2 ring-border/20">
            <AvatarFallback className="konver-gradient-primary text-white font-semibold">
              <User className="w-5 h-5" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">
              {conversation.user_name || 'Usuário'}
            </h3>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Phone className="w-3 h-3" />
              <span>{conversation.phone_number || 'N/A'}</span>
              <span>•</span>
              <span>{messages.length} mensagens</span>
            </div>
          </div>
          <Badge 
            variant="outline" 
            className={`text-xs px-2 py-1 bg-success/10 text-success border-success/20`}
          >
            {conversation.status || 'active'}
          </Badge>
        </div>
      </div>
      <ScrollArea className="flex-1 p-4">
        {messages.map(message => (
          <div key={message.id} className={`flex ${message.message_type === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
            <div className={`max-w-xs lg:max-w-sm rounded-2xl px-4 py-3 shadow-sm ${
              message.message_type === 'user'
                ? 'konver-gradient-primary text-white'
                : 'bg-muted/70 text-foreground'
            }`}>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {message.content}
              </p>
              <div className={`mt-2 flex items-center space-x-1 text-xs ${
                message.message_type === 'user' ? 'text-white/70' : 'text-muted-foreground'
              }`}>
                <Clock className="w-3 h-3" />
                <span>{formatTime(message.created_at || new Date().toISOString(), 'time')}</span>
                {message.message_type === 'bot' && (
                  <Bot className="w-3 h-3 ml-1" />
                )}
              </div>
            </div>
          </div>
        ))}
      </ScrollArea>
    </div>
  );
};

export default function ConversationsContent({ assistantId, onRefresh }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedConversation, setSelectedConversation] = useState(null);

  const {
    data: conversations = [],
    isLoading: loadingConversations,
    error,
    refetch: loadConversations
  } = useConversations(assistantId);

  const {
    data: messagesData,
    isLoading: loadingMessages,
    refetch: loadMessages
  } = useConversationWithMessages(selectedConversation?.id || '');

  const messages = messagesData?.messages || [];

  useEffect(() => {
    if (selectedConversation && loadMessages) {
      loadMessages();
    }
  }, [selectedConversation, loadMessages]);

  const filteredConversations = useMemo(() => {
    return conversations.filter(conv => {
      const matchesSearch = conv.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           conv.phone_number?.includes(searchTerm);
      const matchesStatus = statusFilter === 'all' || conv.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [conversations, searchTerm, statusFilter]);

  const headerActions = [
    {
      label: "Refresh",
      icon: <RefreshCw className="w-4 h-4" />,
      onClick: loadConversations,
      disabled: loadingConversations,
      variant: "ghost"
    }
  ];

  return (
    <div className="flex flex-col h-full">
      <AssistantStepHeader
        title="Conversations"
        description={`${filteredConversations.length} conversas encontradas`}
        icon={<MessageSquare className="w-5 h-5 text-white" />}
        compact={true}
        actions={headerActions}
        loading={loadingConversations}
        className="flex-shrink-0 shadow-none border-0 bg-transparent backdrop-blur-none"
      />
      <AssistantStepContent
        loading={loadingConversations}
        error={error}
        empty={filteredConversations.length === 0}
        emptyState={{
          icon: <MessageSquare className="w-10 h-10 text-white" />,
          title: "Nenhuma conversa ainda",
          description: "As conversas aparecerão aqui quando os usuários interagirem com seu assistente."
        }}
        className="mt-4"
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
          <div className="lg:col-span-1 flex flex-col min-h-0">
            {/* Search and Filters */}
            <div className="space-y-4 mb-6 p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar conversas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 konver-focus"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {['all', 'active', 'pending', 'resolved'].map(filter => (
                  <Button
                    key={filter}
                    variant={statusFilter === filter ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter(filter)}
                    className="text-xs h-8"
                  >
                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
            <ScrollArea className="flex-1 p-4">
              <ConversationList 
                conversations={filteredConversations} 
                selectedConversation={selectedConversation}
                onSelect={setSelectedConversation}
                loading={loadingConversations}
              />
            </ScrollArea>
          </div>
          <div className="lg:col-span-2 flex flex-col min-h-0">
            <MessageDetails 
              conversation={selectedConversation} 
              messages={messages} 
              loading={loadingMessages} 
            />
          </div>
        </div>
      </AssistantStepContent>
    </div>
  );
}
