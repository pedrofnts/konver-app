
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bot, MessageSquare, Users, TrendingUp, Zap, Clock } from "lucide-react"

const stats = [
  {
    title: "Bots Ativos",
    value: "12",
    change: "+2 este mês",
    icon: Bot,
    color: "from-blue-500 to-blue-600",
    bgColor: "bg-blue-50",
    textColor: "text-blue-600"
  },
  {
    title: "Conversas Hoje",
    value: "1,247",
    change: "+18% vs ontem",
    icon: MessageSquare,
    color: "from-green-500 to-green-600",
    bgColor: "bg-green-50",
    textColor: "text-green-600"
  },
  {
    title: "Usuários Ativos",
    value: "8,392",
    change: "+12% este mês",
    icon: Users,
    color: "from-purple-500 to-purple-600",
    bgColor: "bg-purple-50",
    textColor: "text-purple-600"
  },
  {
    title: "Taxa de Resolução",
    value: "94.2%",
    change: "+2.1% vs mês anterior",
    icon: TrendingUp,
    color: "from-orange-500 to-orange-600",
    bgColor: "bg-orange-50",
    textColor: "text-orange-600"
  },
  {
    title: "Tempo Médio",
    value: "2.3min",
    change: "-0.5min vs ontem",
    icon: Clock,
    color: "from-pink-500 to-pink-600",
    bgColor: "bg-pink-50",
    textColor: "text-pink-600"
  },
  {
    title: "Automação",
    value: "87%",
    change: "+5% este mês",
    icon: Zap,
    color: "from-indigo-500 to-indigo-600",
    bgColor: "bg-indigo-50",
    textColor: "text-indigo-600"
  }
]

export function DashboardStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {stats.map((stat, index) => (
        <Card 
          key={stat.title} 
          className="hover:shadow-lg transition-all duration-300 hover:scale-105 border-0 shadow-sm bg-white/80 backdrop-blur-sm animate-fade-in"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              {stat.title}
            </CardTitle>
            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`w-5 h-5 ${stat.textColor}`} />
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
