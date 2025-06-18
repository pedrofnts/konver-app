
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bot, MessageSquare, Users, TrendingUp, Zap, Clock } from "lucide-react"

const stats = [
  {
    title: "Bots Ativos",
    value: "12",
    change: "+2 este mês",
    icon: Bot,
    color: "text-blue-600",
    bgColor: "bg-blue-50"
  },
  {
    title: "Conversas Hoje",
    value: "1,247",
    change: "+18% vs ontem",
    icon: MessageSquare,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50"
  },
  {
    title: "Usuários Ativos",
    value: "8,392",
    change: "+12% este mês",
    icon: Users,
    color: "text-slate-600",
    bgColor: "bg-slate-50"
  },
  {
    title: "Taxa de Resolução",
    value: "94.2%",
    change: "+2.1% vs mês anterior",
    icon: TrendingUp,
    color: "text-blue-600",
    bgColor: "bg-blue-50"
  },
  {
    title: "Tempo Médio",
    value: "2.3min",
    change: "-0.5min vs ontem",
    icon: Clock,
    color: "text-slate-600",
    bgColor: "bg-slate-50"
  },
  {
    title: "Automação",
    value: "87%",
    change: "+5% este mês",
    icon: Zap,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50"
  }
]

export function DashboardStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {stats.map((stat, index) => (
        <Card 
          key={stat.title} 
          className="hover:shadow-md transition-all duration-300 border border-slate-200 bg-white/90 backdrop-blur-sm animate-fade-in"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              {stat.title}
            </CardTitle>
            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800 mb-1">
              {stat.value}
            </div>
            <p className="text-xs text-slate-500">
              {stat.change}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
