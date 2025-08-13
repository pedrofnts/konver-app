import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { 
  Search,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  MessageSquare,
  Target,
  BarChart3,
  Trash2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MessageFeedbackWithContext, FeedbackStatus } from "@/integrations/supabase/types";

interface BotFeedbackManagementProps {
  botId: string;
  botName: string;
}

export default function BotFeedbackManagement({ botId, botName }: BotFeedbackManagementProps) {
  const [feedbacks, setFeedbacks] = useState<MessageFeedbackWithContext[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | FeedbackStatus>('all');
  const [selectedFeedback, setSelectedFeedback] = useState<MessageFeedbackWithContext | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    applied: 0,
    rejected: 0,
    in_review: 0,
    total_applications: 0
  });
  const { toast } = useToast();

  // Buscar feedbacks
  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('message_feedback_with_context')
        .select('*')
        .eq('bot_id', botId)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      setFeedbacks(data || []);
      
      // Calcular estatísticas
      const stats = {
        total: data?.length || 0,
        pending: data?.filter(f => f.status === 'pending').length || 0,
        applied: data?.filter(f => f.status === 'applied').length || 0,
        rejected: data?.filter(f => f.status === 'rejected').length || 0,
        in_review: data?.filter(f => f.status === 'in_review').length || 0,
        total_applications: data?.reduce((acc, f) => acc + (f.times_applied || 0), 0) || 0
      };
      setStats(stats);

    } catch (error) {
      console.error('Error fetching feedbacks:', error);
      toast({
        title: "Erro ao carregar feedbacks",
        description: "Não foi possível carregar os feedbacks do bot.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Atualizar status do feedback
  const updateFeedbackStatus = async (feedbackId: string, newStatus: FeedbackStatus) => {
    try {
      const { error } = await supabase
        .from('message_feedback')
        .update({ status: newStatus })
        .eq('id', feedbackId);

      if (error) throw error;

      await fetchFeedbacks();
      toast({
        title: "Status atualizado",
        description: `Feedback marcado como ${getStatusText(newStatus)}.`,
      });
    } catch (error) {
      console.error('Error updating feedback status:', error);
      toast({
        title: "Erro ao atualizar status",
        description: "Não foi possível atualizar o status do feedback.",
        variant: "destructive",
      });
    }
  };

  // Deletar feedback
  const deleteFeedback = async (feedbackId: string) => {
    try {
      const { error } = await supabase
        .from('message_feedback')
        .delete()
        .eq('id', feedbackId);

      if (error) throw error;

      await fetchFeedbacks();
      setSelectedFeedback(null);
      toast({
        title: "Feedback removido",
        description: "O feedback foi removido com sucesso.",
      });
    } catch (error) {
      console.error('Error deleting feedback:', error);
      toast({
        title: "Erro ao remover feedback",
        description: "Não foi possível remover o feedback.",
        variant: "destructive",
      });
    }
  };

  // Filtrar feedbacks
  const filteredFeedbacks = feedbacks.filter(feedback => {
    const matchesSearch = searchTerm === '' || 
      feedback.user_message_context?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      feedback.improved_response?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      feedback.user_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  useEffect(() => {
    fetchFeedbacks();
  }, [botId, statusFilter]);

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pending': return 'konver-status-warning';
      case 'applied': return 'konver-status-success';
      case 'rejected': return 'konver-status-error';
      case 'in_review': return 'konver-status-info';
      default: return 'konver-status-info';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'applied': return 'Aplicado';
      case 'rejected': return 'Rejeitado';
      case 'in_review': return 'Em análise';
      default: return 'Desconhecido';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="konver-animate-in">
        <div className="konver-card-feature">
          <div className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-muted rounded w-1/3"></div>
              <div className="space-y-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-16 bg-muted rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="konver-animate-in space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="konver-card-stats">
          <div className="text-2xl font-bold text-primary">{stats.total}</div>
          <div className="text-sm text-muted-foreground">Total</div>
        </div>
        <div className="konver-card-stats">
          <div className="text-2xl font-bold text-warning">{stats.pending}</div>
          <div className="text-sm text-muted-foreground">Pendentes</div>
        </div>
        <div className="konver-card-stats">
          <div className="text-2xl font-bold text-success">{stats.applied}</div>
          <div className="text-sm text-muted-foreground">Aplicados</div>
        </div>
        <div className="konver-card-stats">
          <div className="text-2xl font-bold text-info">{stats.in_review}</div>
          <div className="text-sm text-muted-foreground">Em Análise</div>
        </div>
        <div className="konver-card-stats">
          <div className="text-2xl font-bold text-destructive">{stats.rejected}</div>
          <div className="text-sm text-muted-foreground">Rejeitados</div>
        </div>
        <div className="konver-card-stats">
          <div className="text-2xl font-bold text-accent">{stats.total_applications}</div>
          <div className="text-sm text-muted-foreground">Aplicações</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="konver-card-feature">
        <div className="konver-tab-header">
          <div className="konver-tab-title">
            <Target className="w-5 h-5 text-primary" />
            <span>Training & Feedback</span>
          </div>
          <div className="konver-tab-actions">
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchFeedbacks}
              className="konver-button-secondary"
            >
              <TrendingUp className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="konver-tab-content">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Lista de Feedbacks */}
            <div className="lg:col-span-2">
              
              {/* Filtros */}
              <div className="space-y-3 mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por contexto, resposta ou usuário..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 konver-focus"
                  />
                </div>
                
                <div className="flex gap-2 flex-wrap">
                  {(['all', 'pending', 'applied', 'in_review', 'rejected'] as const).map(status => (
                    <Button
                      key={status}
                      variant={statusFilter === status ? "default" : "outline"}
                      size="sm"
                      onClick={() => setStatusFilter(status)}
                      className={`text-xs ${statusFilter === status ? "konver-button-primary" : "konver-button-secondary"}`}
                    >
                      {status === 'all' ? 'Todos' : getStatusText(status)}
                    </Button>
                  ))}
                </div>
              </div>
              
              <ScrollArea className="h-[600px] konver-scrollbar">
                <div className="space-y-2 p-4">
                {filteredFeedbacks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
                    <p>Nenhum feedback encontrado</p>
                  </div>
                ) : (
                  filteredFeedbacks.map((feedback) => (
                    <div
                      key={feedback.id}
                      className={`p-4 rounded-lg border cursor-pointer transition-colors konver-hover-subtle ${
                        selectedFeedback?.id === feedback.id
                          ? 'bg-primary/10 border-primary/20'
                          : 'border-border'
                      }`}
                      onClick={() => setSelectedFeedback(feedback)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getStatusBadgeClass(feedback.status || '')}`}
                          >
                            {getStatusText(feedback.status || '')}
                          </Badge>
                          {feedback.times_applied && feedback.times_applied > 0 && (
                            <Badge variant="outline" className="text-xs konver-status-info">
                              {feedback.times_applied}x usado
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {feedback.created_at && formatDate(feedback.created_at)}
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Contexto do usuário:</p>
                          <p className="text-sm font-medium line-clamp-2">
                            {feedback.user_message_context}
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Resposta melhorada:</p>
                          <p className="text-sm text-success line-clamp-2">
                            {feedback.improved_response}
                          </p>
                        </div>
                        
                        {feedback.user_name && (
                          <p className="text-xs text-muted-foreground">
                            Conversa com: {feedback.user_name}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
                </div>
              </ScrollArea>
            </div>

            {/* Detalhes do Feedback */}
            <div className="bg-card border rounded-lg">
              {selectedFeedback ? (
                <>
                  <div className="p-4 border-b">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Detalhes do Feedback</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedFeedback(null)}
                        className="konver-button-secondary h-8 w-8 p-0"
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="p-4 space-y-4">
                    {/* Status e Tipo */}
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="outline" 
                        className={getStatusBadgeClass(selectedFeedback.status || '')}
                      >
                        {getStatusText(selectedFeedback.status || '')}
                      </Badge>
                    </div>

                    {/* Contexto do Usuário */}
                    <div>
                      <p className="text-sm font-medium text-foreground mb-2">Mensagem do usuário:</p>
                      <Textarea
                        value={selectedFeedback.user_message_context || ''}
                        readOnly
                        className="min-h-[60px] bg-muted/20"
                      />
                    </div>

                    {/* Resposta Original */}
                    <div>
                      <p className="text-sm font-medium text-foreground mb-2">Resposta original:</p>
                      <Textarea
                        value={selectedFeedback.original_bot_response || ''}
                        readOnly
                        className="min-h-[80px] bg-muted/20"
                      />
                    </div>

                    {/* Resposta Melhorada */}
                    <div>
                      <p className="text-sm font-medium text-success mb-2">Resposta melhorada:</p>
                      <Textarea
                        value={selectedFeedback.improved_response || ''}
                        readOnly
                        className="min-h-[100px] bg-success/10 border-success/20"
                      />
                    </div>

                    {/* Estatísticas de Uso */}
                    {selectedFeedback.times_applied && selectedFeedback.times_applied > 0 && (
                      <div className="bg-info/10 border border-info/20 p-3 rounded-lg">
                        <p className="text-sm font-medium text-info mb-1">Estatísticas de uso:</p>
                        <div className="text-sm text-info">
                          <p>Aplicado {selectedFeedback.times_applied} vezes</p>
                          {selectedFeedback.last_applied_at && (
                            <p>Última aplicação: {formatDate(selectedFeedback.last_applied_at)}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Informações da Conversa */}
                    {selectedFeedback.user_name && (
                      <div className="bg-muted/20 p-3 rounded-lg">
                        <p className="text-sm font-medium text-foreground mb-1">Conversa original:</p>
                        <div className="text-sm text-muted-foreground">
                          <p>Usuário: {selectedFeedback.user_name}</p>
                          {selectedFeedback.phone_number && (
                            <p>Telefone: {selectedFeedback.phone_number}</p>
                          )}
                          {selectedFeedback.message_created_at && (
                            <p>Data: {formatDate(selectedFeedback.message_created_at)}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Ações */}
                    <div className="flex flex-col gap-2 pt-4 border-t">
                      {selectedFeedback.status === 'pending' && (
                        <>
                          <Button
                            onClick={() => updateFeedbackStatus(selectedFeedback.id!, 'applied')}
                            className="w-full konver-button-primary"
                            size="sm"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Aprovar e Aplicar
                          </Button>
                          <Button
                            onClick={() => updateFeedbackStatus(selectedFeedback.id!, 'in_review')}
                            variant="outline"
                            className="w-full konver-button-secondary"
                            size="sm"
                          >
                            <Clock className="h-4 w-4 mr-2" />
                            Marcar para Análise
                          </Button>
                          <Button
                            onClick={() => updateFeedbackStatus(selectedFeedback.id!, 'rejected')}
                            variant="outline"
                            className="w-full text-destructive border-destructive/20 hover:bg-destructive/10"
                            size="sm"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Rejeitar
                          </Button>
                        </>
                      )}

                      {selectedFeedback.status === 'in_review' && (
                        <>
                          <Button
                            onClick={() => updateFeedbackStatus(selectedFeedback.id!, 'applied')}
                            className="w-full konver-button-primary"
                            size="sm"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Aprovar e Aplicar
                          </Button>
                          <Button
                            onClick={() => updateFeedbackStatus(selectedFeedback.id!, 'rejected')}
                            variant="outline"
                            className="w-full text-destructive border-destructive/20 hover:bg-destructive/10"
                            size="sm"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Rejeitar
                          </Button>
                        </>
                      )}

                      {selectedFeedback.status === 'applied' && (
                        <Button
                          onClick={() => updateFeedbackStatus(selectedFeedback.id!, 'pending')}
                          variant="outline"
                          className="w-full konver-button-secondary"
                          size="sm"
                        >
                          <Clock className="h-4 w-4 mr-2" />
                          Reverter para Pendente
                        </Button>
                      )}

                      {selectedFeedback.status === 'rejected' && (
                        <Button
                          onClick={() => updateFeedbackStatus(selectedFeedback.id!, 'pending')}
                          variant="outline"
                          className="w-full konver-button-secondary"
                          size="sm"
                        >
                          <Clock className="h-4 w-4 mr-2" />
                          Reverter para Pendente
                        </Button>
                      )}

                      <Button
                        onClick={() => deleteFeedback(selectedFeedback.id!)}
                        variant="outline"
                        className="w-full text-destructive border-destructive/20 hover:bg-destructive/10"
                        size="sm"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remover Feedback
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-12 text-center">
                  <BarChart3 className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Selecione um feedback
                  </h3>
                  <p className="text-muted-foreground">
                    Escolha um feedback da lista para visualizar detalhes e gerenciar status
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 