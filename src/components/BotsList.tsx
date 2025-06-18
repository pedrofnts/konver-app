
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bot, Settings, MessageSquare, MoreVertical, Power, Pause } from "lucide-react"

const bots = [
  {
    id: 1,
    name: "Atendimento Vendas",
    description: "Bot especializado em vendas e conversão de leads",
    status: "Ativo",
    conversations: 156,
    lastActive: "2 min atrás",
    performance: 94.2,
    statusColor: "green"
  },
  {
    id: 2,
    name: "Suporte Técnico",
    description: "Assistente para resolução de problemas técnicos",
    status: "Ativo",
    conversations: 89,
    lastActive: "5 min atrás",
    performance: 91.8,
    statusColor: "green"
  },
  {
    id: 3,
    name: "FAQ Geral",
    description: "Respostas automáticas para perguntas frequentes",
    status: "Pausado",
    conversations: 34,
    lastActive: "1h atrás",
    performance: 87.5,
    statusColor: "yellow"
  },
  {
    id: 4,
    name: "Onboarding",
    description: "Guia novos usuários através do processo de cadastro",
    status: "Ativo",
    conversations: 67,
    lastActive: "3 min atrás",
    performance: 96.1,
    statusColor: "green"
  },
  {
    id: 5,
    name: "Bot Financeiro",
    description: "Assistente para dúvidas sobre pagamentos e faturas",
    status: "Ativo",
    conversations: 23,
    lastActive: "12 min atrás",
    performance: 89.3,
    statusColor: "green"
  },
  {
    id: 6,
    name: "Agendamento",
    description: "Gerencia agendamentos e compromissos automaticamente",
    status: "Pausado",
    conversations: 12,
    lastActive: "2h atrás",
    performance: 85.7,
    statusColor: "yellow"
  }
]

export function BotsList() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-800">Meus Bots</h3>
        <p className="text-sm text-slate-600">{bots.length} bots configurados</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bots.map((bot, index) => (
          <Card 
            key={bot.id}
            className="hover:shadow-lg transition-all duration-300 border border-slate-200 bg-white/90 backdrop-blur-sm animate-fade-in cursor-pointer group"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base font-semibold text-slate-800 truncate">
                      {bot.name}
                    </CardTitle>
                    <Badge 
                      variant="secondary"
                      className={`text-xs mt-1 ${
                        bot.statusColor === 'green' 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {bot.status}
                    </Badge>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-600 line-clamp-2">
                {bot.description}
              </p>
              
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" />
                  {bot.conversations} conversas
                </span>
                <span>há {bot.lastActive}</span>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600">Performance</span>
                  <span className="font-medium text-slate-800">{bot.performance}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5">
                  <div 
                    className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${bot.performance}%` }}
                  />
                </div>
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button 
                  size="sm" 
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Settings className="w-3 h-3 mr-1" />
                  Configurar
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="hover:bg-slate-50"
                >
                  {bot.status === "Ativo" ? (
                    <Pause className="w-3 h-3" />
                  ) : (
                    <Power className="w-3 h-3" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
