import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { Clock, Users, DollarSign, TrendingUp, Play, CheckCircle2, Timer } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"

interface Game {
  id: string
  client_name: string
  game_type: string
  value: number
  game_date: string
  payment_time: string
  status: string
  queue_position?: number
  started_at?: string
  finished_at?: string
  created_at: string
}

const CartomanteDashboard = () => {
  const [queueGames, setQueueGames] = useState<Game[]>([])
  const [todayStats, setTodayStats] = useState({
    totalGames: 0,
    totalEarnings: 0,
    completedGames: 0,
    averageTime: 0
  })
  const [currentGame, setCurrentGame] = useState<Game | null>(null)
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()

  // Get user's cartomante_id from profile
  const [cartomanteId, setCartomanteId] = useState<string>('')

  useEffect(() => {
    getUserProfile()
  }, [user])

  useEffect(() => {
    if (cartomanteId) {
      loadQueueGames()
      loadTodayStats()
      loadCurrentGame()
    }
  }, [cartomanteId])

  const getUserProfile = async () => {
    if (!user) return
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('cartomante_id')
        .eq('user_id', user.id)
        .single()
      
      if (error) throw error
      setCartomanteId(data.cartomante_id || '')
    } catch (error) {
      console.error('Error loading profile:', error)
    }
  }

  const loadQueueGames = async () => {
    try {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('cartomante', cartomanteId as any)
        .eq('status', 'na_fila')
        .order('queue_position', { ascending: true })
      
      if (error) throw error
      setQueueGames(data || [])
    } catch (error) {
      console.error('Error loading queue games:', error)
    }
  }

  const loadCurrentGame = async () => {
    try {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('cartomante', cartomanteId as any)
        .eq('status', 'em_jogo')
        .maybeSingle()
      
      if (error) throw error
      setCurrentGame(data)
    } catch (error) {
      console.error('Error loading current game:', error)
    }
  }

  const loadTodayStats = async () => {
    const today = new Date().toISOString().split('T')[0]
    
    try {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('cartomante', cartomanteId as any)
        .eq('game_date', today)
      
      if (error) throw error
      
      const games = data || []
      const completed = games.filter(g => g.status === 'jogo_finalizado')
      const totalEarnings = games.reduce((sum, game) => sum + Number(game.value), 0)
      
      // Calculate average time for completed games
      let totalMinutes = 0
      let gamesWithTime = 0
      
      completed.forEach(game => {
        if (game.started_at && game.finished_at) {
          const start = new Date(game.started_at)
          const end = new Date(game.finished_at)
          const minutes = (end.getTime() - start.getTime()) / (1000 * 60)
          totalMinutes += minutes
          gamesWithTime++
        }
      })
      
      setTodayStats({
        totalGames: games.length,
        totalEarnings,
        completedGames: completed.length,
        averageTime: gamesWithTime > 0 ? totalMinutes / gamesWithTime : 0
      })
    } catch (error) {
      console.error('Error loading today stats:', error)
    }
  }

  const startGame = async (gameId: string) => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('games')
        .update({ 
          status: 'em_jogo' as any,
          started_at: new Date().toISOString()
        })
        .eq('id', gameId)
      
      if (error) throw error
      
      toast({
        title: "Jogo iniciado",
        description: "O jogo foi iniciado com sucesso!",
      })
      
      loadQueueGames()
      loadCurrentGame()
      loadTodayStats()
    } catch (error) {
      console.error('Error starting game:', error)
      toast({
        title: "Erro",
        description: "Não foi possível iniciar o jogo.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const finishGame = async (gameId: string) => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('games')
        .update({ 
          status: 'jogo_finalizado',
          finished_at: new Date().toISOString()
        })
        .eq('id', gameId)
      
      if (error) throw error
      
      toast({
        title: "Jogo finalizado",
        description: "O jogo foi finalizado com sucesso!",
      })
      
      loadQueueGames()
      loadCurrentGame()
      loadTodayStats()
    } catch (error) {
      console.error('Error finishing game:', error)
      toast({
        title: "Erro",
        description: "Não foi possível finalizar o jogo.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const getGameTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'pergunta_objetiva': 'Pergunta Objetiva',
      'tres_perguntas': 'Três Perguntas',
      'jogo_completo': 'Jogo Completo',
      'mandala_amorosa': 'Mandala Amorosa',
      'espiada_ex': 'Espiada do Ex'
    }
    return types[type] || type
  }

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = Math.floor(minutes % 60)
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-primary">
          Painel da Cartomante
        </h1>
        <p className="text-muted-foreground">
          Acompanhe sua fila de atendimento e estatísticas
        </p>
      </div>

      {/* Estatísticas do Dia */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jogos Hoje</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayStats.totalGames}</div>
            <p className="text-xs text-muted-foreground">
              {todayStats.completedGames} finalizados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturamento Hoje</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {todayStats.totalEarnings.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Valor total do dia
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatTime(todayStats.averageTime)}</div>
            <p className="text-xs text-muted-foreground">
              Por atendimento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Na Fila</CardTitle>
            <Timer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{queueGames.length}</div>
            <p className="text-xs text-muted-foreground">
              Aguardando atendimento
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Jogo Atual */}
      {currentGame && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Play className="h-5 w-5 text-primary" />
              <span>Jogo em Andamento</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{currentGame.client_name}</p>
                <p className="text-sm text-muted-foreground">
                  {getGameTypeLabel(currentGame.game_type)} • R$ {Number(currentGame.value).toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Iniciado às {currentGame.started_at ? new Date(currentGame.started_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}
                </p>
              </div>
              <Button onClick={() => finishGame(currentGame.id)} disabled={loading}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Finalizar Jogo
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fila de Atendimento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Timer className="h-5 w-5 text-primary" />
            <span>Fila de Atendimento</span>
            <Badge variant="secondary">{queueGames.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {queueGames.length === 0 ? (
            <div className="text-center py-8">
              <Timer className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum jogo na fila</p>
            </div>
          ) : (
            <div className="space-y-3">
              {queueGames.map((game, index) => (
                <div key={game.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-full text-sm font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold">{game.client_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {getGameTypeLabel(game.game_type)} • R$ {Number(game.value).toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Pagamento: {game.payment_time} • {new Date(game.game_date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {index === 0 && !currentGame && (
                      <Button onClick={() => startGame(game.id)} disabled={loading}>
                        <Play className="h-4 w-4 mr-2" />
                        Iniciar
                      </Button>
                    )}
                    <Badge variant={index === 0 ? 'default' : 'secondary'}>
                      {index === 0 ? 'Próximo' : `${index + 1}º na fila`}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default CartomanteDashboard