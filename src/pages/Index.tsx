
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/AppSidebar"
import { DashboardStats } from "@/components/DashboardStats"
import { QuickActions } from "@/components/QuickActions"
import { RecentActivity } from "@/components/RecentActivity"
import { Button } from "@/components/ui/button"
import { Bell, Search, Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

const Index = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur-sm flex items-center justify-between px-6 shadow-sm">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="text-slate-600 hover:text-slate-800" />
              <div>
                <h1 className="text-xl font-bold text-slate-800">Dashboard</h1>
                <p className="text-sm text-slate-600">Bem-vindo de volta! Aqui está o resumo dos seus bots.</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input 
                  placeholder="Buscar bots, conversas..." 
                  className="pl-10 w-64 bg-white/80 border-slate-200 focus:border-blue-300"
                />
              </div>
              
              <Button variant="outline" size="sm" className="relative hover:bg-slate-50">
                <Bell className="w-4 h-4" />
                <Badge variant="destructive" className="absolute -top-1 -right-1 w-5 h-5 p-0 text-xs">
                  3
                </Badge>
              </Button>
              
              <Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-md">
                <Plus className="w-4 h-4 mr-2" />
                Novo Bot
              </Button>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-6 overflow-auto">
            <div className="max-w-7xl mx-auto">
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
                  <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border-0 shadow-sm">
                    <h3 className="font-semibold text-slate-800 mb-4">Performance dos Bots</h3>
                    <div className="h-48 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg flex items-center justify-center">
                      <p className="text-slate-500">Gráfico de Performance</p>
                    </div>
                  </div>
                  
                  {/* Quick Stats */}
                  <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border-0 shadow-sm">
                    <h3 className="font-semibold text-slate-800 mb-4">Estatísticas Rápidas</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">Satisfação</span>
                        <span className="font-semibold text-green-600">98.5%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">Uptime</span>
                        <span className="font-semibold text-blue-600">99.9%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">Economia</span>
                        <span className="font-semibold text-purple-600">R$ 15.2k</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Index;
