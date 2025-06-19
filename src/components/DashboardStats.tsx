import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bot, MessageSquare, Users, TrendingUp } from "lucide-react"

const stats = [
  {
    title: "Assistentes Ativos",
    value: "12",
    change: "+2 este mês",
    trend: "up",
    icon: Bot,
    color: "text-blue-600",
    bgColor: "bg-gradient-to-br from-blue-50 to-blue-100/80",
    iconBg: "bg-gradient-to-br from-blue-500 to-blue-600"
  },
  {
    title: "Conversas Hoje",
    value: "1,247",
    change: "+18% vs ontem",
    trend: "up",
    icon: MessageSquare,
    color: "text-emerald-600",
    bgColor: "bg-gradient-to-br from-emerald-50 to-emerald-100/80",
    iconBg: "bg-gradient-to-br from-emerald-500 to-emerald-600"
  },
  {
    title: "Usuários Ativos",
    value: "8,392",
    change: "+12% este mês",
    trend: "up",
    icon: Users,
    color: "text-purple-600",
    bgColor: "bg-gradient-to-br from-purple-50 to-purple-100/80",
    iconBg: "bg-gradient-to-br from-purple-500 to-purple-600"
  },
  {
    title: "Taxa de Resolução",
    value: "94.2%",
    change: "+2.1% vs mês anterior",
    trend: "up",
    icon: TrendingUp,
    color: "text-indigo-600",
    bgColor: "bg-gradient-to-br from-indigo-50 to-indigo-100/80",
    iconBg: "bg-gradient-to-br from-indigo-500 to-indigo-600"
  }
]

export function DashboardStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => (
        <Card 
          key={stat.title} 
          className="group hover:shadow-xl transition-all duration-500 border-0 shadow-md bg-white/90 backdrop-blur-sm animate-fade-in overflow-hidden hover:scale-[1.02]"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div className={`absolute inset-0 ${stat.bgColor} opacity-40`}></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
              {stat.title}
            </CardTitle>
            <div className={`p-3 rounded-xl ${stat.iconBg} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
              <stat.icon className="w-5 h-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="space-y-3">
              <div className="text-3xl font-bold text-slate-800">
                {stat.value}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">
                  <TrendingUp className="w-3 h-3" />
                  <span>{stat.change}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
