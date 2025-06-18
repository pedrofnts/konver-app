
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Bot, MessageSquare, Settings, Sparkles, Rocket, Zap } from "lucide-react"

const quickActions = [
  {
    title: "Criar Novo Bot",
    description: "Configure um novo assistente de IA personalizado",
    icon: Plus,
    color: "from-blue-500 to-blue-600",
    bgColor: "bg-blue-50",
    textColor: "text-blue-600",
    action: "primary"
  },
  {
    title: "Templates Prontos",
    description: "Use modelos pré-configurados para começar rapidamente",
    icon: Sparkles,
    color: "from-purple-500 to-purple-600",
    bgColor: "bg-purple-50",
    textColor: "text-purple-600",
    action: "secondary"
  },
  {
    title: "Importar Bot",
    description: "Importe configurações de outros assistentes",
    icon: Rocket,
    color: "from-green-500 to-green-600",
    bgColor: "bg-green-50",
    textColor: "text-green-600",
    action: "secondary"
  }
]

const recentBots = [
  {
    name: "Atendimento Vendas", 
    status: "Ativo", 
    conversations: 156,
    lastActive: "2min",
    color: "green"
  },
  {
    name: "Suporte Técnico", 
    status: "Ativo", 
    conversations: 89,
    lastActive: "5min",
    color: "green"
  },
  {
    name: "FAQ Geral", 
    status: "Pausado", 
    conversations: 34,
    lastActive: "1h",
    color: "yellow"
  },
  {
    name: "Onboarding", 
    status: "Ativo", 
    conversations: 67,
    lastActive: "3min",
    color: "green"
  }
]

export function QuickActions() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <div className="lg:col-span-2">
        <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-800">
              <Zap className="w-5 h-5 text-blue-600" />
              Ações Rápidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {quickActions.map((action, index) => (
                <div 
                  key={action.title}
                  className="group p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-all duration-300 hover:shadow-md cursor-pointer bg-gradient-to-br from-white to-slate-50"
                >
                  <div className={`w-12 h-12 rounded-lg ${action.bgColor} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-200`}>
                    <action.icon className={`w-6 h-6 ${action.textColor}`} />
                  </div>
                  <h3 className="font-semibold text-slate-800 mb-1">{action.title}</h3>
                  <p className="text-sm text-slate-600 mb-3">{action.description}</p>
                  <Button 
                    size="sm" 
                    variant={action.action === "primary" ? "default" : "outline"}
                    className={action.action === "primary" ? "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700" : ""}
                  >
                    {action.action === "primary" ? "Criar Agora" : "Explorar"}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-800">
              <Bot className="w-5 h-5 text-purple-600" />
              Bots Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentBots.map((bot, index) => (
                <div key={bot.name} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-slate-800 truncate">{bot.name}</h4>
                      <Badge 
                        variant="secondary"
                        className={`text-xs ${
                          bot.color === 'green' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {bot.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        {bot.conversations}
                      </span>
                      <span>há {bot.lastActive}</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="p-1">
                    <Settings className="w-4 h-4 text-slate-400" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
