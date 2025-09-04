import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Clock, Users, DollarSign, Target, Zap, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { gameStore } from '@/lib/gameStore'
import { Game, CARTOMANTES } from '@/lib/types'
import { useRealTimeTimer } from '@/hooks/useRealTimeTimer'

interface DashboardMetrics {
  todayRevenue: number
  todayGames: number
  activeGames: number
  queueLength: number
  avgWaitTime: number
  conversionRate: number
  peakHour: string
  efficiency: number
}

export const RealTimeDashboard = () => {
  const [games, setGames] = useState<Game[]>([])
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    todayRevenue: 0,
    todayGames: 0,
    activeGames: 0,
    queueLength: 0,
    avgWaitTime: 0,
    conversionRate: 0,
    peakHour: '14:00',
    efficiency: 0
  })

  // Atualizar jogos em tempo real
  useEffect(() => {
    const updateGames = () => {
      const allGames = gameStore.getGames()
      setGames(allGames)
      calculateMetrics(allGames)
    }
    
    updateGames()
    const unsubscribe = gameStore.subscribe(updateGames)
    
    // Atualizar métricas a cada 30 segundos
    const metricsInterval = setInterval(updateGames, 30000)
    
    return () => {
      unsubscribe()
      clearInterval(metricsInterval)
    }
  }, [])

  const calculateMetrics = (allGames: Game[]) => {
    const today = new Date().toISOString().split('T')[0]
    
    // Jogos de hoje (pagos)
    const todayGames = allGames.filter(game => 
      game.date === today && 
      (game.status === 'Jogo finalizado' || game.status === 'Em Jogo' || game.status === 'Na fila')
    )
    
    // Jogos finalizados hoje
    const finishedToday = allGames.filter(game => 
      game.status === 'Jogo finalizado' && game.date === today
    )
    
    // Jogos ativos
    const activeGames = allGames.filter(game => game.status === 'Em Jogo')
    
    // Fila
    const queueGames = allGames.filter(game => game.status === 'Na fila')
    
    // Tempo médio de espera
    const avgWaitTime = queueGames.length > 0 
      ? queueGames.reduce((sum, game) => sum + gameStore.getEstimatedWaitTime(game.id), 0) / queueGames.length
      : 0

    // Taxa de conversão (finalizados / total)
    const conversionRate = todayGames.length > 0 
      ? (finishedToday.length / todayGames.length) * 100 
      : 0

    // Horário de pico (simplificado)
    const hourCounts = finishedToday.reduce((acc, game) => {
      if (game.endTime) {
        const hour = new Date(game.endTime).getHours()
        acc[hour] = (acc[hour] || 0) + 1
      }
      return acc
    }, {} as Record<number, number>)
    
    const peakHour = Object.entries(hourCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || '14'

    // Eficiência (jogos finalizados vs tempo total)
    const totalDuration = finishedToday.reduce((sum, game) => {
      if (game.startTime && game.endTime) {
        return sum + (new Date(game.endTime).getTime() - new Date(game.startTime).getTime())
      }
      return sum
    }, 0)
    
    const expectedDuration = finishedToday.reduce((sum, game) => 
      sum + (game.gameType.duration * 60 * 1000), 0
    )
    
    const efficiency = expectedDuration > 0 
      ? Math.min(100, (expectedDuration / totalDuration) * 100) || 0
      : 0

    setMetrics({
      todayRevenue: todayGames.reduce((sum, game) => sum + game.value, 0),
      todayGames: finishedToday.length,
      activeGames: activeGames.length,
      queueLength: queueGames.length,
      avgWaitTime: Math.round(avgWaitTime),
      conversionRate: Math.round(conversionRate),
      peakHour: `${peakHour}:00`,
      efficiency: Math.round(efficiency)
    })
  }

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}min` : `${mins}min`
  }

  // Status da operação
  const getOperationStatus = () => {
    if (metrics.queueLength > 8) return { status: 'overload', color: 'destructive', text: 'Sobrecarga' }
    if (metrics.queueLength > 4) return { status: 'busy', color: 'default', text: 'Movimento Alto' }
    if (metrics.activeGames > 0) return { status: 'active', color: 'default', text: 'Operando' }
    return { status: 'calm', color: 'secondary', text: 'Tranquilo' }
  }

  const operationStatus = getOperationStatus()

  return (
    <div className="space-y-6">
      {/* Status Geral */}
      <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Status da Operação</CardTitle>
            <Badge variant={operationStatus.color as any} className="flex items-center gap-1">
              <Zap className="h-3 w-3" />
              {operationStatus.text}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{metrics.activeGames}</div>
              <div className="text-sm text-muted-foreground">Em Atendimento</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-accent">{metrics.queueLength}</div>
              <div className="text-sm text-muted-foreground">Na Fila</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">{formatTime(metrics.avgWaitTime)}</div>
              <div className="text-sm text-muted-foreground">Tempo Médio</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{metrics.efficiency}%</div>
              <div className="text-sm text-muted-foreground">Eficiência</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Métricas do Dia */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturamento Hoje</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.todayRevenue)}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <TrendingUp className="h-3 w-3 mr-1 text-accent" />
              Meta: R$ 500,00
            </div>
            <Progress 
              value={(metrics.todayRevenue / 500) * 100} 
              className="mt-2 h-2" 
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jogos Finalizados</CardTitle>
            <Target className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.todayGames}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <TrendingUp className="h-3 w-3 mr-1 text-accent" />
              Meta: 20 jogos
            </div>
            <Progress 
              value={(metrics.todayGames / 20) * 100} 
              className="mt-2 h-2" 
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.conversionRate}%</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              {metrics.conversionRate >= 80 ? (
                <TrendingUp className="h-3 w-3 mr-1 text-accent" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1 text-destructive" />
              )}
              Meta: 80%
            </div>
            <Progress 
              value={metrics.conversionRate} 
              className="mt-2 h-2" 
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Horário de Pico</CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.peakHour}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Maior movimento
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status das Cartomantes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Status das Cartomantes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {CARTOMANTES.map(cartomante => {
              const activeGame = games.find(g => 
                g.status === 'Em Jogo' && g.cartomante.id === cartomante.id
              )
              const queueCount = games.filter(g => 
                g.status === 'Na fila' && g.cartomante.id === cartomante.id
              ).length
              const todayFinished = games.filter(g => 
                g.status === 'Jogo finalizado' && 
                g.cartomante.id === cartomante.id &&
                g.date === new Date().toISOString().split('T')[0]
              ).length

              return (
                <div key={cartomante.id} className="p-4 border rounded-lg bg-muted/30">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{cartomante.name}</h3>
                    <Badge variant={activeGame ? 'default' : 'secondary'}>
                      {activeGame ? 'Atendendo' : 'Disponível'}
                    </Badge>
                  </div>
                  
                  {activeGame && (
                    <div className="mb-2 p-2 bg-primary/10 rounded border-primary/20 border">
                      <p className="text-sm font-medium">{activeGame.clientName}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <RealTimeTimer startTime={activeGame.startTime} />
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="font-medium text-primary">{queueCount}</div>
                      <div className="text-xs text-muted-foreground">Na fila</div>
                    </div>
                    <div>
                      <div className="font-medium text-accent">{todayFinished}</div>
                      <div className="text-xs text-muted-foreground">Hoje</div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Alertas */}
      {(metrics.queueLength > 5 || metrics.avgWaitTime > 60) && (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Alertas de Operação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {metrics.queueLength > 5 && (
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-destructive" />
                <span>Fila longa: {metrics.queueLength} clientes aguardando</span>
              </div>
            )}
            {metrics.avgWaitTime > 60 && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-destructive" />
                <span>Tempo de espera alto: {formatTime(metrics.avgWaitTime)} em média</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Componente auxiliar para timer em tempo real
const RealTimeTimer = ({ startTime }: { startTime?: string }) => {
  const duration = useRealTimeTimer(startTime)
  return <span>{duration}</span>
}