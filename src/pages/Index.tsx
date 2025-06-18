
import { BotsList } from "@/components/BotsList"
import { Button } from "@/components/ui/button"
import { Bell, Search, Plus, Bot } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/hooks/useAuth"

const Index = () => {
  const { user } = useAuth()
  
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
              placeholder="Buscar bots..." 
              className="pl-10 w-64 bg-white border-slate-200 focus:border-blue-400"
            />
          </div>
          
          <Button variant="outline" size="sm" className="relative hover:bg-slate-50">
            <Bell className="w-4 h-4" />
            <Badge variant="destructive" className="absolute -top-1 -right-1 w-5 h-5 p-0 text-xs">
              3
            </Badge>
          </Button>
          
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600 hidden sm:block">
              {user?.email}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Welcome Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              Bem-vindo de volta, {user?.email?.split('@')[0] || 'usuário'}!
            </h2>
            <p className="text-slate-600">Gerencie seus bots de atendimento inteligente.</p>
          </div>
          
          {/* Bots List */}
          <BotsList />
        </div>
      </main>
    </div>
  );
};

export default Index;
