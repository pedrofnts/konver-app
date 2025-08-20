import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Bot, MessageSquare, Users, Zap } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import KonverLayout from "@/components/KonverLayout";
import KonverStats from "@/components/KonverStats";
import BotsList from "@/components/BotsList";
import { useDashboardStats } from "@/hooks/useDashboardStats";

const Index = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const { data: dashboardStats } = useDashboardStats();

  const stats = [
    {
      label: "Assistentes Ativos",
      value: dashboardStats?.activeAssistants?.toString() || "0",
      icon: <Bot className="h-5 w-5" />,
      trend: { 
        value: dashboardStats?.newAssistantsThisWeek || 0, 
        isPositive: (dashboardStats?.newAssistantsThisWeek || 0) > 0 
      },
      description: `${dashboardStats?.newAssistantsThisWeek || 0} novos esta semana`
    },
    {
      label: "Total de Conversas",
      value: dashboardStats?.totalConversations?.toLocaleString('pt-BR') || "0",
      icon: <MessageSquare className="h-5 w-5" />,
      trend: { 
        value: Math.round(((dashboardStats?.conversationsLast30Days || 0) / (dashboardStats?.totalConversations || 1)) * 100), 
        isPositive: true 
      },
      description: "Últimos 30 dias"
    },
    {
      label: "Usuários Ativos",
      value: dashboardStats?.activeUsers?.toString() || "0",
      icon: <Users className="h-5 w-5" />,
      trend: { value: 5, isPositive: true },
      description: "Online agora"
    },
    {
      label: "Performance",
      value: `${dashboardStats?.averagePerformance?.toFixed(1) || "0"}%`,
      icon: <Zap className="h-5 w-5" />,
      trend: { 
        value: Math.round(dashboardStats?.averagePerformance || 0) >= 80 ? 2 : -2, 
        isPositive: Math.round(dashboardStats?.averagePerformance || 0) >= 80 
      },
      description: "Precisão das respostas"
    }
  ];

  const actions = (
    <div className="flex items-center gap-4">
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 group-focus-within:text-primary transition-colors" />
        <Input
          placeholder="Buscar seus assistentes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-11 w-72 h-11 bg-background/50 border-border hover:border-primary/30 focus:border-primary konver-focus text-sm backdrop-blur-sm"
        />
      </div>
      
      <Button
        className="konver-button-primary h-11 px-6 font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
        onClick={() => navigate('/assistant/new')}
      >
        <Plus className="h-4 w-4 mr-2" />
        Novo Assistente
      </Button>
    </div>
  );

  return (
    <KonverLayout
      title={`Bem-vindo de volta, ${profile?.full_name || user?.email?.split('@')[0] || 'usuário'}!`}
      subtitle="Transforme seu fluxo de trabalho com assistentes de IA inteligentes. Construa, implante e escale experiências conversacionais que geram resultados."
      actions={actions}
    >
      <div className="space-y-12">
        {/* Enhanced Stats Overview */}
        <section className="konver-animate-in">
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-2 flex items-center gap-3">
              <div className="w-1 h-6 konver-gradient-primary rounded-full"></div>
              Visão Geral do Dashboard
            </h2>
            <p className="text-muted-foreground/90">
              Monitore a performance dos seus assistentes de IA e métricas de engajamento
            </p>
          </div>
          <KonverStats stats={stats} />
        </section>

        {/* Enhanced Main Content */}
        <section className="space-y-8 konver-animate-in" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-foreground flex items-center gap-3">
                <div className="w-1 h-7 konver-gradient-accent rounded-full"></div>
                Seus Assistentes de IA
              </h2>
              <p className="text-base text-muted-foreground/90 leading-relaxed max-w-2xl">
                Crie assistentes de IA conversacionais poderosos, personalizados para o seu atendimento.
              </p>
            </div>
          </div>

          {/* Enhanced Assistants List */}
          <div className="konver-animate-in" style={{ animationDelay: '300ms' }}>
            <BotsList searchQuery={searchQuery} />
          </div>
        </section>

      </div>
    </KonverLayout>
  );
};

export default Index;