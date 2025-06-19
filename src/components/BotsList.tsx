import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bot, Settings, MessageSquare, MoreVertical, Power, Pause, Plus, Activity, TrendingUp, Eye, Play, Calendar } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

type BotData = {
  id: string
  name: string
  description: string | null
  status: string
  conversations: number
  performance: number
  created_at: string
}

export default function BotsList() {
  const [bots, setBots] = useState<BotData[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)
  const { user } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) {
      fetchBots()
    }
  }, [user])

  const fetchBots = async () => {
    try {
      if (!user) return
      
      const { data, error } = await supabase
        .from('bots')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setBots(data || [])
    } catch (error) {
      console.error('Error fetching bots:', error)
      toast({
        title: "Erro ao carregar assistentes",
        description: "Não foi possível carregar a lista de assistentes.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const createSampleBot = async () => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('bots')
        .insert({
          user_id: user.id,
          name: "Assistente de Exemplo",
          description: "Um assistente de IA inteligente para começar",
          status: "Ativo",
          conversations: 0,
          performance: 92.0
        })

      if (error) throw error

      toast({
        title: "✨ Assistente criado!",
        description: "Seu primeiro assistente foi criado com sucesso.",
      })

      fetchBots()
    } catch (error) {
      console.error('Error creating bot:', error)
      toast({
        title: "Erro ao criar assistente",
        description: "Não foi possível criar o assistente.",
        variant: "destructive",
      })
    }
  }

  const toggleBotStatus = async (botId: string, currentStatus: string) => {
    if (!user) return
    
    setUpdatingStatus(botId)
    const newStatus = currentStatus === 'Ativo' ? 'Inativo' : 'Ativo'
    
    try {
      const { error } = await supabase
        .from('bots')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', botId)
        .eq('user_id', user.id)

      if (error) {
        throw error
      }

      setBots(bots.map(bot => 
        bot.id === botId ? { ...bot, status: newStatus } : bot
      ))

      toast({
        title: "Status atualizado",
        description: `Assistente ${newStatus.toLowerCase()} com sucesso.`,
      })
    } catch (error) {
      console.error('Error updating bot status:', error)
      toast({
        title: "Erro ao atualizar status",
        description: "Não foi possível atualizar o status do assistente.",
        variant: "destructive",
      })
    } finally {
      setUpdatingStatus(null)
    }
  }

  const getStatusColor = (status: string) => {
    return status === 'Ativo' 
      ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
      : 'bg-slate-100 text-slate-600 border-slate-200'
  }

  const getPerformanceColor = (performance: number) => {
    if (performance >= 90) return 'text-emerald-600'
    if (performance >= 70) return 'text-blue-600'
    return 'text-red-600'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <Card className="bg-white/90 backdrop-blur-sm border-slate-200/60 shadow-lg">
        <CardHeader className="pb-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-slate-800 text-xl font-bold">Seus Assistentes IA</CardTitle>
              <CardDescription className="text-slate-600 mt-1">
                Carregando seus assistentes...
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-6 rounded-xl border border-slate-200/50 space-y-4">
              <div className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-xl" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Skeleton className="h-16 rounded-lg" />
                <Skeleton className="h-16 rounded-lg" />
                <Skeleton className="h-16 rounded-lg" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  if (bots.length === 0) {
    return (
      <Card className="bg-white/90 backdrop-blur-sm border-slate-200/60 shadow-lg">
        <CardHeader className="pb-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-slate-800 text-xl font-bold">Seus Assistentes IA</CardTitle>
              <CardDescription className="text-slate-600 mt-1">
                Você ainda não tem assistentes configurados
              </CardDescription>
            </div>
            <Button 
              onClick={createSampleBot}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeiro Assistente
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Bot className="w-10 h-10 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Nenhum assistente encontrado</h3>
            <p className="text-slate-500 mb-6 max-w-md mx-auto">
              Comece criando seu primeiro assistente de IA para automatizar tarefas e interações.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white/90 backdrop-blur-sm border-slate-200/60 shadow-lg">
      <CardHeader className="pb-6">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-slate-800 text-xl font-bold">Seus Assistentes IA</CardTitle>
            <CardDescription className="text-slate-600 mt-1">
              {bots.length} assistente{bots.length !== 1 ? 's' : ''} configurado{bots.length !== 1 ? 's' : ''}
            </CardDescription>
          </div>
          <Button 
            onClick={createSampleBot}
            variant="outline"
            className="border-blue-200 text-blue-700 hover:bg-blue-50 rounded-xl"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Assistente
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {bots.map((bot) => (
          <div key={bot.id} className="group relative p-6 rounded-xl border border-slate-200/50 bg-gradient-to-br from-white/50 to-slate-50/30 hover:shadow-lg transition-all duration-300 hover:border-slate-300/60">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">
                    {bot.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 text-lg mb-1">
                    {bot.name}
                  </h3>
                  <p className="text-slate-600 text-sm mb-2">
                    {bot.description || 'Sem descrição'}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Calendar className="w-3 h-3" />
                    Criado em {formatDate(bot.created_at)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge 
                  variant="outline" 
                  className={`${getStatusColor(bot.status)} font-medium px-3 py-1 rounded-full`}
                >
                  <div className={`w-2 h-2 rounded-full mr-2 ${
                    bot.status === 'Ativo' ? 'bg-emerald-500' : 'bg-slate-400'
                  }`}></div>
                  {bot.status}
                </Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => navigate(`/assistant/${bot.id}`)}>
                      <Eye className="mr-2 h-4 w-4" />
                      Visualizar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate(`/assistant/${bot.id}?tab=settings`)}>
                      <Settings className="mr-2 h-4 w-4" />
                      Configurações
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => toggleBotStatus(bot.id, bot.status)}
                      disabled={updatingStatus === bot.id}
                    >
                      {bot.status === 'Ativo' ? (
                        <Pause className="mr-2 h-4 w-4" />
                      ) : (
                        <Play className="mr-2 h-4 w-4" />
                      )}
                      {bot.status === 'Ativo' ? 'Pausar' : 'Ativar'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-white/60 rounded-lg p-4 border border-slate-200/40">
                <div className="flex items-center gap-2 text-slate-600 text-sm font-medium mb-2">
                  <MessageSquare className="w-4 h-4" />
                  Conversas
                </div>
                <div className="text-2xl font-bold text-slate-800">{bot.conversations}</div>
              </div>
              <div className="bg-white/60 rounded-lg p-4 border border-slate-200/40">
                <div className="flex items-center gap-2 text-slate-600 text-sm font-medium mb-2">
                  <TrendingUp className="w-4 h-4" />
                  Performance
                </div>
                <div className={`text-2xl font-bold ${getPerformanceColor(bot.performance)}`}>
                  {bot.performance}%
                </div>
              </div>
              <div className="bg-white/60 rounded-lg p-4 border border-slate-200/40">
                <div className="flex items-center gap-2 text-slate-600 text-sm font-medium mb-2">
                  <Activity className="w-4 h-4" />
                  Status
                </div>
                <div className={`text-sm font-semibold ${
                  bot.status === 'Ativo' ? 'text-emerald-600' : 'text-slate-500'
                }`}>
                  {bot.status === 'Ativo' ? 'Online' : 'Offline'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                size="sm"
                onClick={() => navigate(`/assistant/${bot.id}`)}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              >
                <Eye className="w-4 h-4 mr-2" />
                Abrir
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/assistant/${bot.id}?tab=settings`)}
                className="bg-white/80 hover:bg-slate-50 border-slate-200 text-slate-700 hover:text-slate-800 rounded-lg"
              >
                <Settings className="w-4 h-4 mr-2" />
                Configurar
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleBotStatus(bot.id, bot.status)}
                disabled={updatingStatus === bot.id}
                className={`rounded-lg ${
                  bot.status === 'Ativo' 
                    ? 'bg-red-50 hover:bg-red-100 border-red-200 text-red-700 hover:text-red-800' 
                    : 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-700 hover:text-emerald-800'
                }`}
              >
                {updatingStatus === bot.id ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                ) : bot.status === 'Ativo' ? (
                  <Pause className="w-4 h-4 mr-2" />
                ) : (
                  <Play className="w-4 h-4 mr-2" />
                )}
                {bot.status === 'Ativo' ? 'Pausar' : 'Ativar'}
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
