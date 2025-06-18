
import { DashboardStats } from "@/components/DashboardStats"
import { QuickActions } from "@/components/QuickActions"
import { RecentActivity } from "@/components/RecentActivity"
import { Button } from "@/components/ui/button"
import { Bell, Search, Plus, Bot } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Header */}
      <header className="h-16 border-b border-slate-200 bg-white/90 backdrop-blur-sm flex items-center justify-between px-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">BotBuilder</h1>
              <p className="text-sm text-slate-600">Dashboard</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input 
              placeholder="Buscar bots, conversas..." 
              className="pl-10 w-64 bg-white border-slate-200 focus:border-blue-400"
            />
          </div>
          
          <Button variant="outline" size="sm" className="relative hover:bg-slate-50">
            <Bell className="w-4 h-4" />
            <Badge variant="destructive" className="absolute -top-1 -right-1 w-5 h-5 p-0 text-xs">
              3
            </Badge>
          </Button>
          
          <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
            <Plus className="w-4 h-4 mr-2" />
            Novo Bot
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Welcome Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Bem-vindo de volta!</h2>
            <p className="text-slate-600">Aqui está o resumo dos seus bots de atendimento.</p>
          </div>
          
          {/* Stats Cards */}
          <DashboardStats />
          
          {/* Quick Actions */}
          <QuickActions />
          
          {/* Recent Activity */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2">
              <RecentActivity />
            </div>
            
            <div className="space-y-6">
              {/* Performance Chart Placeholder */}
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-slate-200 shadow-sm">
                <h3 className="font-semibold text-slate-800 mb-4">Performance dos Bots</h3>
                <div className="h-48 bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg flex items-center justify-center">
                  <p className="text-slate-500">Gráfico de Performance</p>
                </div>
              </div>
              
              {/* Quick Stats */}
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-slate-200 shadow-sm">
                <h3 className="font-semibold text-slate-800 mb-4">Estatísticas Rápidas</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Satisfação</span>
                    <span className="font-semibold text-emerald-600">98.5%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Uptime</span>
                    <span className="font-semibold text-blue-600">99.9%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Economia</span>
                    <span className="font-semibold text-slate-700">R$ 15.2k</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
