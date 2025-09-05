import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { Clock, Users, DollarSign, TrendingUp, Play, CheckCircle2, Timer, Calendar, BarChart3, ChevronDown, ChevronRight } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { RealTimeGameTimer } from "@/components/RealTimeGameTimer"

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
  conversation_link?: string
}

interface DailySummary {
  date: string
  totalGames: number
  totalEarnings: number
  completedGames: number
  averageTime: number
}

const CartomanteDashboard = () => {
  const [queueGames, setQueueGames] = useState<Game[]>([])
  const [todayStats, setTodayStats] = useState({
    totalGames: 0,
    totalEarnings: 0,
    completedGames: 0,
    averageTime: 0
  })
  const [dailyHistory, setDailyHistory] = useState<DailySummary[]>([])
  const [currentGame, setCurrentGame] = useState<Game | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState('')
  const [expandedDay, setExpandedDay] = useState<string | null>(null)
  const [dayGames, setDayGames] = useState<Game[]>([])
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
      loadDailyHistory()
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

  const loadDailyHistory = async () => {
    try {
      // Get last 30 days of data
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const startDate = thirtyDaysAgo.toISOString().split('T')[0]
      
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('cartomante', cartomanteId as any)
        .gte('game_date', startDate)
        .order('game_date', { ascending: false })
      
      if (error) throw error
      
      // Group by date and calculate stats
      const groupedByDate: Record<string, Game[]> = {}
      data?.forEach(game => {
        const date = game.game_date
        if (!groupedByDate[date]) {
          groupedByDate[date] = []
        }
        groupedByDate[date].push(game)
      })
      
      const history: DailySummary[] = Object.entries(groupedByDate).map(([date, games]) => {
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
        
        return {
          date,
          totalGames: games.length,
          totalEarnings,
          completedGames: completed.length,
          averageTime: gamesWithTime > 0 ? totalMinutes / gamesWithTime : 0
        }
      })
      
      setDailyHistory(history)
    } catch (error) {
      console.error('Error loading daily history:', error)
    }
  }

  const loadDateStats = async (date: string) => {
    try {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('cartomante', cartomanteId as any)
        .eq('game_date', date)
      
      if (error) throw error
      
      const games = data || []
      const completed = games.filter(g => g.status === 'jogo_finalizado')
      const totalEarnings = games.reduce((sum, game) => sum + Number(game.value), 0)
      
      return {
        totalGames: games.length,
        totalEarnings,
        completedGames: completed.length,
        games
      }
    } catch (error) {
      console.error('Error loading date stats:', error)
      return null
    }
  }

  const loadDayGames = async (date: string) => {
    try {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('cartomante', cartomanteId as any)
        .eq('game_date', date)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setDayGames(data || [])
    } catch (error) {
      console.error('Error loading day games:', error)
    }
  }

  const toggleDayExpansion = async (date: string) => {
    if (expandedDay === date) {
      setExpandedDay(null)
      setDayGames([])
    } else {
      setExpandedDay(date)
      await loadDayGames(date)
    }
  }

  const startGame = async (gameId: string) => {
    setLoading(true)
    try {
      // First get the game to check if it has a conversation link
      const { data: gameData, error: fetchError } = await supabase
        .from('games')
        .select('conversation_link')
        .eq('id', gameId)
        .single()
      
      if (fetchError) throw fetchError
      
      const { error } = await supabase
        .from('games')
        .update({ 
          status: 'em_jogo' as any,
          started_at: new Date().toISOString()
        })
        .eq('id', gameId)
      
      if (error) throw error
      
      // Open conversation link if it exists
      if (gameData.conversation_link) {
        window.open(gameData.conversation_link, '_blank')
      }
      
      toast({
        title: "Jogo iniciado",
        description: "O jogo foi iniciado com sucesso!",
      })
      
      loadQueueGames()
      loadCurrentGame()
      loadTodayStats()
      loadDailyHistory()
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
      loadDailyHistory()
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
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <span>
                    Iniciado às {currentGame.started_at ? new Date(currentGame.started_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                  {currentGame.started_at && (
                    <div className="flex items-center space-x-1">
                      <span>•</span>
                      <RealTimeGameTimer startTime={currentGame.started_at} />
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {currentGame.conversation_link && (
                  <Button 
                    variant="outline" 
                    onClick={() => window.open(currentGame.conversation_link, '_blank')}
                  >
                    Abrir Conversa
                  </Button>
                )}
                <Button onClick={() => finishGame(currentGame.id)} disabled={loading}>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Finalizar Jogo
                </Button>
              </div>
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
      {/* Histórico de Faturamento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <span>Histórico de Faturamento</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Filtro por data específica */}
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <Label htmlFor="date-filter">Consultar data específica</Label>
                <Input
                  id="date-filter"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
              <Button 
                onClick={async () => {
                  if (selectedDate) {
                    const stats = await loadDateStats(selectedDate)
                    if (stats) {
                      toast({
                        title: `Estatísticas de ${new Date(selectedDate).toLocaleDateString('pt-BR')}`,
                        description: `${stats.totalGames} jogos • R$ ${stats.totalEarnings.toFixed(2)} • ${stats.completedGames} finalizados`,
                      })
                    }
                  }
                }}
                disabled={!selectedDate}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Consultar
              </Button>
            </div>

            {/* Lista dos últimos dias */}
            <div>
              <h4 className="font-semibold mb-3">Últimos 30 dias</h4>
              {dailyHistory.length === 0 ? (
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhum histórico encontrado</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {dailyHistory.map((day) => (
                    <div key={day.date}>
                      <div 
                        className="flex items-center justify-between p-3 bg-muted rounded-lg cursor-pointer hover:bg-muted/80 transition-colors"
                        onClick={() => toggleDayExpansion(day.date)}
                      >
                        <div className="flex items-center space-x-2">
                          {expandedDay === day.date ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                          <div>
                            <p className="font-medium">
                              {new Date(day.date).toLocaleDateString('pt-BR', { 
                                weekday: 'short', 
                                day: '2-digit', 
                                month: '2-digit',
                                year: 'numeric'
                              })}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {day.totalGames} jogos • {day.completedGames} finalizados
                              {day.averageTime > 0 && ` • ${formatTime(day.averageTime)} médio`}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">R$ {day.totalEarnings.toFixed(2)}</p>
                          <Badge variant={day.date === new Date().toISOString().split('T')[0] ? 'default' : 'secondary'}>
                            {day.date === new Date().toISOString().split('T')[0] ? 'Hoje' : 
                             day.totalEarnings > 100 ? 'Bom dia' : 'Dia normal'}
                          </Badge>
                        </div>
                      </div>
                      
                      {/* Expanded day details */}
                      {expandedDay === day.date && (
                        <div className="ml-6 mt-2 space-y-2">
                          {dayGames.length === 0 ? (
                            <p className="text-sm text-muted-foreground p-2">Carregando jogos...</p>
                          ) : (
                            dayGames.map((game) => (
                              <div key={game.id} className="p-3 bg-background border rounded-lg">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-medium">{game.client_name}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {getGameTypeLabel(game.game_type)} • {game.payment_time}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-bold">R$ {Number(game.value).toFixed(2)}</p>
                                    <Badge variant={
                                      game.status === 'jogo_finalizado' ? 'default' : 
                                      game.status === 'em_jogo' ? 'secondary' : 'outline'
                                    }>
                                      {game.status === 'jogo_finalizado' ? 'Finalizado' : 
                                       game.status === 'em_jogo' ? 'Em andamento' : 'Na fila'}
                                    </Badge>
                                  </div>
                                </div>
                                {game.status === 'jogo_finalizado' && game.started_at && game.finished_at && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Duração: {formatTime((new Date(game.finished_at).getTime() - new Date(game.started_at).getTime()) / (1000 * 60))}
                                  </p>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Resumo semanal/mensal */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Últimos 7 dias</p>
                <p className="text-2xl font-bold text-primary">
                  R$ {dailyHistory.slice(0, 7).reduce((sum, day) => sum + day.totalEarnings, 0).toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {dailyHistory.slice(0, 7).reduce((sum, day) => sum + day.totalGames, 0)} jogos
                </p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Últimos 30 dias</p>
                <p className="text-2xl font-bold text-primary">
                  R$ {dailyHistory.reduce((sum, day) => sum + day.totalEarnings, 0).toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {dailyHistory.reduce((sum, day) => sum + day.totalGames, 0)} jogos
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default CartomanteDashboard