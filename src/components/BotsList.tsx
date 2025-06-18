
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bot, Settings, MessageSquare, MoreVertical, Power, Pause, Plus } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { useToast } from "@/hooks/use-toast"

type BotData = {
  id: string
  name: string
  description: string | null
  status: string
  conversations: number
  performance: number
  created_at: string
}

export function BotsList() {
  const [bots, setBots] = useState<BotData[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    if (user) {
      fetchBots()
    }
  }, [user])

  const fetchBots = async () => {
    try {
      const { data, error } = await supabase
        .from('bots')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setBots(data || [])
    } catch (error) {
      console.error('Error fetching bots:', error)
      toast({
        title: "Erro ao carregar bots",
        description: "Não foi possível carregar seus bots.",
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
          name: "Bot de Exemplo",
          description: "Um bot de exemplo para começar",
          status: "Ativo",
          conversations: 0,
          performance: 85.0
        })

      if (error) throw error

      toast({
        title: "Bot criado!",
        description: "Seu primeiro bot foi criado com sucesso.",
      })

      fetchBots()
    } catch (error) {
      console.error('Error creating bot:', error)
      toast({
        title: "Erro ao criar bot",
        description: "Não foi possível criar o bot.",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-800">Meus Bots</h3>
          <p className="text-sm text-slate-600">Carregando...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                <div className="h-3 bg-slate-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-slate-200 rounded"></div>
                  <div className="h-3 bg-slate-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (bots.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-800">Meus Bots</h3>
          <p className="text-sm text-slate-600">0 bots configurados</p>
        </div>
        
        <Card className="text-center py-12">
          <CardContent>
            <Bot className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-800 mb-2">
              Nenhum bot encontrado
            </h3>
            <p className="text-slate-600 mb-6">
              Crie seu primeiro bot para começar a automatizar suas conversas.
            </p>
            <Button 
              onClick={createSampleBot}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeiro Bot
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-800">Meus Bots</h3>
        <div className="flex items-center gap-4">
          <p className="text-sm text-slate-600">{bots.length} bots configurados</p>
          <Button 
            onClick={createSampleBot}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Bot
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bots.map((bot, index) => (
          <Card 
            key={bot.id}
            className="hover:shadow-lg transition-all duration-300 border border-slate-200 bg-white/90 backdrop-blur-sm animate-fade-in cursor-pointer group"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base font-semibold text-slate-800 truncate">
                      {bot.name}
                    </CardTitle>
                    <Badge 
                      variant="secondary"
                      className={`text-xs mt-1 ${
                        bot.status === 'Ativo' 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {bot.status}
                    </Badge>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-600 line-clamp-2">
                {bot.description || "Sem descrição"}
              </p>
              
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" />
                  {bot.conversations} conversas
                </span>
                <span>
                  {new Date(bot.created_at).toLocaleDateString('pt-BR')}
                </span>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600">Performance</span>
                  <span className="font-medium text-slate-800">{bot.performance}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5">
                  <div 
                    className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${bot.performance}%` }}
                  />
                </div>
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button 
                  size="sm" 
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Settings className="w-3 h-3 mr-1" />
                  Configurar
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="hover:bg-slate-50"
                >
                  {bot.status === "Ativo" ? (
                    <Pause className="w-3 h-3" />
                  ) : (
                    <Power className="w-3 h-3" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
