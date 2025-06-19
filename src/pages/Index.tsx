import BotsList from "@/components/BotsList"
import { DashboardStats } from "@/components/DashboardStats"
import { Button } from "@/components/ui/button"
import { Bell, Search, Plus, Bot, User, Settings, LogOut } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useAuth } from "@/hooks/useAuth"

const Index = () => {
  const { user, signOut } = useAuth()
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      {/* Header */}
      <header className="h-20 border-b border-slate-200/60 bg-white/95 backdrop-blur-xl flex items-center justify-between px-8 shadow-sm sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-xl flex items-center justify-center shadow-lg">
              <Bot className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                Bella Dash
              </h1>
              <p className="text-sm text-slate-500 font-medium">Gerenciador de Assistentes IA</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="relative hidden lg:block">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <Input 
              placeholder="Buscar assistentes..." 
              className="pl-12 w-80 h-11 bg-white/80 border-slate-200/80 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 rounded-xl"
            />
          </div>
          
          <Button variant="outline" size="default" className="relative hover:bg-slate-50 rounded-xl border-slate-200/80 h-11 px-4">
            <Bell className="w-5 h-5" />
            <Badge variant="destructive" className="absolute -top-2 -right-2 w-6 h-6 p-0 text-xs rounded-full">
              3
            </Badge>
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-11 w-11 rounded-xl hover:bg-slate-100">
                <Avatar className="h-10 w-10">
                  <AvatarImage src="/placeholder.svg" alt="Avatar" />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold">
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64 p-2" align="end">
              <div className="px-3 py-2">
                <p className="text-sm font-medium text-slate-800">{user?.email?.split('@')[0] || 'Usuário'}</p>
                <p className="text-xs text-slate-500">{user?.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                Perfil
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                Configurações
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer text-red-600" onClick={() => signOut()}>
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-3xl font-bold text-slate-800 mb-2">
                  Bem-vindo, {user?.email?.split('@')[0] || 'usuário'}! 👋
                </h2>
                <p className="text-lg text-slate-600">Gerencie seus assistentes de IA de forma simples e eficiente.</p>
              </div>
              <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white h-12 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                <Plus className="w-5 h-5 mr-2" />
                Novo Assistente
              </Button>
            </div>
          </div>
          
          {/* Dashboard Stats */}
          <DashboardStats />
          
          {/* Assistants List - Main Focus */}
          <div className="space-y-6">
            <BotsList />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
