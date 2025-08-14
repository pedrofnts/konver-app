import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Bot, 
  Settings, 
  MessageSquare, 
  MoreVertical, 
  Power, 
  Pause, 
  Plus, 
  Activity, 
  TrendingUp, 
  Eye, 
  Play, 
  Calendar 
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useBots, useDeleteBot, useUpdateBot } from "@/hooks/useBots";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import KonverCard from "@/components/KonverCard";

type BotData = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  conversations: number;
  performance: number;
  created_at: string;
};

interface BotsListProps {
  searchQuery?: string;
}

export default function BotsList({ searchQuery = '' }: BotsListProps) {
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Use the new hooks
  const { data: bots = [], isLoading: loading } = useBots();
  const deleteBot = useDeleteBot();
  const updateBot = useUpdateBot();

  const toggleBotStatus = async (botId: string, currentStatus: string) => {
    setUpdatingStatus(botId);
    
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      
      await updateBot.mutateAsync({
        botId,
        updates: { status: newStatus }
      });

      toast({
        title: "Sucesso",
        description: `Assistente ${newStatus === 'active' ? 'ativado' : 'desativado'} com sucesso`,
      });
    } catch (error) {
      console.error('Error updating bot status:', error);
      toast({
        title: "Erro",
        description: "Falha ao atualizar status do assistente",
        variant: "destructive",
      });
    } finally {
      setUpdatingStatus(null);
    }
  };

  const filteredBots = bots.filter(bot =>
    bot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bot.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <KonverCard key={i}>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-5 w-3/4" />
              </div>
              <Skeleton className="h-4 w-full" />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-6 w-12" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </div>
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-24" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-8 rounded" />
                  <Skeleton className="h-8 w-8 rounded" />
                </div>
              </div>
            </div>
          </KonverCard>
        ))}
      </div>
    );
  }

  if (filteredBots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-primary shadow-lg mb-6">
          <Bot className="h-10 w-10 text-white" />
        </div>
        <h3 className="text-2xl font-semibold mb-3 text-foreground">
          {searchQuery ? 'Nenhum assistente encontrado' : 'Pronto para criar seu primeiro assistente?'}
        </h3>
        <p className="text-base text-muted-foreground/90 mb-8 max-w-md leading-relaxed">
          {searchQuery 
            ? `Nenhum assistente corresponde a "${searchQuery}". Tente um termo de busca diferente ou crie um novo assistente.`
            : 'Comece a criar assistentes inteligentes que entendem contexto, aprendem com interações e oferecem experiências excepcionais aos usuários.'
          }
        </p>
        <div className="flex gap-3">
          {!searchQuery && (
            <Button 
              onClick={() => navigate('/assistant/new')}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-5 w-5 mr-2" />
              Criar Seu Primeiro Assistente
            </Button>
          )}
          {searchQuery && (
            <Button 
              onClick={() => navigate('/assistant/new')}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Criar Novo Assistente
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {filteredBots.map((bot, index) => (
        <KonverCard
          key={bot.id}
          title={bot.name}
          description={bot.description || "Nenhuma descrição fornecida"}
          status={bot.status}
          hover
          onClick={() => navigate(`/assistant/${bot.id}`)}
          className="group"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div className="space-y-5">
            {/* Enhanced Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 group/stat">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-md bg-primary/10 group-hover/stat:bg-primary/20 transition-colors">
                    <MessageSquare className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">Conversas</span>
                </div>
                <p className="text-xl font-bold text-foreground transition-all duration-300">
                  {bot.conversations.toLocaleString()}
                </p>
              </div>
              
              <div className="space-y-2 group/stat">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-md bg-accent/10 group-hover/stat:bg-accent/20 transition-colors">
                    <TrendingUp className="h-4 w-4 text-accent" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">Performance</span>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-xl font-bold text-foreground transition-all duration-300">
                    {bot.performance}%
                  </p>
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    bot.performance >= 95 ? "bg-green-500 animate-pulse" :
                    bot.performance >= 80 ? "bg-yellow-500" : "bg-red-500"
                  )}></div>
                </div>
              </div>
            </div>

            {/* Enhanced Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-border/50">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-md bg-muted/30">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                </div>
                <span className="text-xs font-medium text-muted-foreground">
                  Criado em {new Date(bot.created_at).toLocaleDateString('pt-BR', { 
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/assistant/${bot.id}?tab=test`);
                  }}
                  className="h-8 w-8 p-0 hover:bg-accent/10"
                >
                  <Play className="h-4 w-4 text-muted-foreground group-hover/play:text-accent transition-colors" />
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => e.stopPropagation()}
                      className="h-8 w-8 p-0 hover:bg-accent/10"
                    >
                      <MoreVertical className="h-4 w-4 text-muted-foreground group-hover/menu:text-primary transition-colors" />
                    </Button>
                  </DropdownMenuTrigger>
                  
                  <DropdownMenuContent align="end" className="bg-card border border-border shadow-lg">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/assistant/${bot.id}?tab=settings`);
                      }}
                      className="hover:bg-accent/10 cursor-pointer"
                    >
                      <Settings className="mr-3 h-4 w-4 text-primary" />
                      <span className="font-medium">Configurações</span>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/assistant/${bot.id}?tab=conversations`);
                      }}
                      className="hover:bg-accent/10 cursor-pointer"
                    >
                      <Eye className="mr-3 h-4 w-4 text-accent" />
                      <span className="font-medium">Ver Conversas</span>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleBotStatus(bot.id, bot.status);
                      }}
                      disabled={updatingStatus === bot.id}
                      className="hover:bg-accent/10 cursor-pointer"
                    >
                      {bot.status === 'active' ? (
                        <>
                          <Pause className="mr-3 h-4 w-4 text-warning" />
                          <span className="font-medium">Desativar</span>
                        </>
                      ) : (
                        <>
                          <Power className="mr-3 h-4 w-4 text-success" />
                          <span className="font-medium">Ativar</span>
                        </>
                      )}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </KonverCard>
      ))}
    </div>
  );
}