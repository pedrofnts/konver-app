import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { 
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  MessageSquare,
  Target,
  BarChart3,
  Eye,
  Edit3,
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'applied': return 'text-green-600 bg-green-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      case 'in_review': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
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
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="space-y-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-gray-600">Total</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-sm text-gray-600">Pendentes</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.applied}</div>
            <div className="text-sm text-gray-600">Aplicados</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.in_review}</div>
            <div className="text-sm text-gray-600">Em Análise</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            <div className="text-sm text-gray-600">Rejeitados</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">{stats.total_applications}</div>
            <div className="text-sm text-gray-600">Aplicações</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Feedbacks */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Feedbacks - {botName}</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchFeedbacks}
                className="h-8 w-8 p-0"
              >
                <TrendingUp className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Filtros */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por contexto, resposta ou usuário..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              <div className="flex gap-2">
                {(['all', 'pending', 'applied', 'in_review', 'rejected'] as const).map(status => (
                  <Button
                    key={status}
                    variant={statusFilter === status ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter(status)}
                    className="text-xs"
                  >
                    {status === 'all' ? 'Todos' : getStatusText(status)}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            <ScrollArea className="h-[600px]">
              <div className="space-y-2 p-4">
                {filteredFeedbacks.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>Nenhum feedback encontrado</p>
                  </div>
                ) : (
                  filteredFeedbacks.map((feedback) => (
                    <div
                      key={feedback.id}
                      className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                        selectedFeedback?.id === feedback.id
                          ? 'bg-blue-50 border-blue-200'
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedFeedback(feedback)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getStatusColor(feedback.status || '')}`}
                          >
                            {getStatusText(feedback.status || '')}
                          </Badge>
                          {feedback.times_applied && feedback.times_applied > 0 && (
                            <Badge variant="outline" className="text-xs bg-purple-100 text-purple-800">
                              {feedback.times_applied}x usado
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          {feedback.created_at && formatDate(feedback.created_at)}
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Contexto do usuário:</p>
                          <p className="text-sm font-medium line-clamp-2">
                            {feedback.user_message_context}
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Resposta melhorada:</p>
                          <p className="text-sm text-green-700 line-clamp-2">
                            {feedback.improved_response}
                          </p>
                        </div>
                        
                        {feedback.user_name && (
                          <p className="text-xs text-gray-500">
                            Conversa com: {feedback.user_name}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Detalhes do Feedback */}
        <Card>
          {selectedFeedback ? (
            <>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Detalhes do Feedback</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedFeedback(null)}
                      className="h-8 w-8 p-0"
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Status e Tipo */}
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="outline" 
                    className={getStatusColor(selectedFeedback.status || '')}
                  >
                    {getStatusText(selectedFeedback.status || '')}
                  </Badge>
                  <span className="text-sm text-gray-600">
                    {getStatusText(selectedFeedback.status || '')}
                  </span>
                </div>

                {/* Contexto do Usuário */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Mensagem do usuário:</p>
                  <Textarea
                    value={selectedFeedback.user_message_context || ''}
                    readOnly
                    className="min-h-[60px] bg-blue-50"
                  />
                </div>

                {/* Resposta Original */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Resposta original:</p>
                  <Textarea
                    value={selectedFeedback.original_bot_response || ''}
                    readOnly
                    className="min-h-[80px] bg-gray-50"
                  />
                </div>

                {/* Resposta Melhorada */}
                <div>
                  <p className="text-sm font-medium text-green-700 mb-2">Resposta melhorada:</p>
                  <Textarea
                    value={selectedFeedback.improved_response || ''}
                    readOnly
                    className="min-h-[100px] bg-green-50 border-green-200"
                  />
                </div>

                {/* Estatísticas de Uso */}
                {selectedFeedback.times_applied && selectedFeedback.times_applied > 0 && (
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <p className="text-sm font-medium text-purple-700 mb-1">Estatísticas de uso:</p>
                    <div className="text-sm text-purple-600">
                      <p>Aplicado {selectedFeedback.times_applied} vezes</p>
                      {selectedFeedback.last_applied_at && (
                        <p>Última aplicação: {formatDate(selectedFeedback.last_applied_at)}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Informações da Conversa */}
                {selectedFeedback.user_name && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm font-medium text-gray-700 mb-1">Conversa original:</p>
                    <div className="text-sm text-gray-600">
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
                        className="w-full"
                        size="sm"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Aprovar e Aplicar
                      </Button>
                      <Button
                        onClick={() => updateFeedbackStatus(selectedFeedback.id!, 'in_review')}
                        variant="outline"
                        className="w-full"
                        size="sm"
                      >
                        <Clock className="h-4 w-4 mr-2" />
                        Marcar para Análise
                      </Button>
                      <Button
                        onClick={() => updateFeedbackStatus(selectedFeedback.id!, 'rejected')}
                        variant="outline"
                        className="w-full text-red-600 border-red-200 hover:bg-red-50"
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
                        className="w-full"
                        size="sm"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Aprovar e Aplicar
                      </Button>
                      <Button
                        onClick={() => updateFeedbackStatus(selectedFeedback.id!, 'rejected')}
                        variant="outline"
                        className="w-full text-red-600 border-red-200 hover:bg-red-50"
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
                      className="w-full"
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
                      className="w-full"
                      size="sm"
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      Reverter para Pendente
                    </Button>
                  )}

                  <Button
                    onClick={() => deleteFeedback(selectedFeedback.id!)}
                    variant="outline"
                    className="w-full text-red-600 border-red-200 hover:bg-red-50"
                    size="sm"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remover Feedback
                  </Button>
                </div>
              </CardContent>
            </>
          ) : (
            <CardContent className="p-12 text-center">
              <BarChart3 className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Selecione um feedback
              </h3>
              <p className="text-gray-600">
                Escolha um feedback da lista para visualizar detalhes e gerenciar status
              </p>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
} 