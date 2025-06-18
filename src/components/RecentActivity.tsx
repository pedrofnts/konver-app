
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Activity, MessageSquare, User, Bot, Settings, Zap } from "lucide-react"

const activities = [
  {
    id: 1,
    user: "João Silva",
    avatar: "JS",
    action: "iniciou conversa com",
    target: "Bot Vendas",
    time: "2 min atrás",
    type: "conversation",
    status: "active"
  },
  {
    id: 2,
    user: "Admin",
    avatar: "AD",  
    action: "atualizou configurações do",
    target: "Bot Suporte",
    time: "5 min atrás",
    type: "config",
    status: "updated"
  },
  {
    id: 3,
    user: "Maria Costa",
    avatar: "MC",
    action: "completou conversa com", 
    target: "Bot FAQ",
    time: "8 min atrás",
    type: "conversation",
    status: "completed"
  },
  {
    id: 4,
    user: "Sistema",
    avatar: "SY",
    action: "treinou modelo IA do",
    target: "Bot Atendimento",
    time: "15 min atrás", 
    type: "system",
    status: "training"
  },
  {
    id: 5,
    user: "Carlos Lima",
    avatar: "CL",
    action: "solicitou escalação no",
    target: "Bot Técnico",
    time: "23 min atrás",
    type: "escalation",
    status: "pending"
  },
  {
    id: 6,
    user: "Admin",
    avatar: "AD",
    action: "criou novo bot",
    target: "Bot Onboarding",
    time: "1h atrás",
    type: "creation",
    status: "created"
  }
]

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'conversation':
      return MessageSquare
    case 'config':
      return Settings
    case 'system':
      return Zap
    case 'escalation':
      return User
    case 'creation':
      return Bot
    default:
      return Activity
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-700'
    case 'updated':
      return 'bg-blue-100 text-blue-700'
    case 'completed':
      return 'bg-purple-100 text-purple-700'
    case 'training':
      return 'bg-orange-100 text-orange-700'
    case 'pending':
      return 'bg-yellow-100 text-yellow-700'
    case 'created':
      return 'bg-emerald-100 text-emerald-700'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}

export function RecentActivity() {
  return (
    <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-800">
          <Activity className="w-5 h-5 text-indigo-600" />
          Atividade Recente
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity, index) => {
            const ActivityIcon = getActivityIcon(activity.type)
            return (
              <div 
                key={activity.id}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="relative">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src="/placeholder.svg" />
                    <AvatarFallback className="bg-gradient-to-br from-slate-600 to-slate-700 text-white text-sm">
                      {activity.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-sm">
                    <ActivityIcon className="w-3 h-3 text-slate-600" />
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-slate-800">{activity.user}</span>
                    <span className="text-slate-600">{activity.action}</span>
                    <span className="font-medium text-slate-800">{activity.target}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">{activity.time}</span>
                    <Badge variant="secondary" className={`text-xs ${getStatusColor(activity.status)}`}>
                      {activity.status}
                    </Badge>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
