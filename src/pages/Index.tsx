import { useState, useEffect } from "react"
import { Clock, Play, CheckCircle, Users, Settings, ExternalLink, Undo2, BarChart3, Smartphone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { gameStore } from "@/lib/gameStore"
import { Game, CARTOMANTES } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { toZonedTime, format } from 'date-fns-tz'
import { addMinutes } from 'date-fns'
import { useRealTimeTimer } from '@/hooks/useRealTimeTimer'
import { useIsMobile } from '@/hooks/use-mobile'
import { QueueManager } from '@/components/QueueManager'
import { RealTimeGameTimer } from '@/components/RealTimeGameTimer'
import { NotificationSystem } from '@/components/NotificationSystem'
import { RealTimeDashboard } from '@/components/RealTimeDashboard'
import { MobileDashboard } from '@/components/MobileDashboard'
import { SmartQueue } from '@/components/SmartQueue'

const Index = () => {
  const [games, setGames] = useState<Game[]>([])
  const [showQueueManager, setShowQueueManager] = useState(false)
  const [queueFilter, setQueueFilter] = useState<'all' | 'vanessa' | 'alana'>('all')
  const [activeView, setActiveView] = useState<'dashboard' | 'analytics' | 'queue'>('dashboard')
  const { toast } = useToast()
  const isMobile = useIsMobile()

  useEffect(() => {
    const updateGames = () => setGames(gameStore.getGames())
    updateGames()
    
    const unsubscribe = gameStore.subscribe(updateGames)
    return unsubscribe
  }, [])

  const filteredQueueGames = games
    .filter(game => {
      if (game.status !== 'Na fila') return false
      if (queueFilter === 'all') return true
      if (queueFilter === 'vanessa') return game.cartomante.name === 'Vanessa Barreto'
      if (queueFilter === 'alana') return game.cartomante.name === 'Alana Cerqueira'
      return true
    })
    .sort((a, b) => new Date(`${a.date} ${a.paymentTime}`).getTime() - new Date(`${b.date} ${b.paymentTime}`).getTime())

  const queueGames = filteredQueueGames

  const activeGames = games.filter(game => game.status === 'Em Jogo')
  
  // Calculate today's revenue from all paid games (not just finished)
  const todayPaidGames = games.filter(game => 
    game.date === new Date().toISOString().split('T')[0] &&
    (game.status === 'Jogo finalizado' || game.status === 'Em Jogo' || game.status === 'Na fila')
  )
  
  const todayFinished = games.filter(game => 
    game.status === 'Jogo finalizado' && 
    game.date === new Date().toISOString().split('T')[0]
  )

  const handlePullNext = (cartomanteId: string) => {
    const activeGame = gameStore.getActiveGameForCartomante(cartomanteId)
    if (activeGame) {
      toast({
        title: "Cartomante ocupada",
        description: "Esta cartomante já tem um cliente em atendimento.",
        variant: "destructive"
      })
      return
    }

    const nextGame = gameStore.getNextClientForCartomante(cartomanteId)
    if (!nextGame) {
      toast({
        title: "Fila vazia",
        description: "Não há clientes na fila para esta cartomante.",
      })
      return
    }

    gameStore.startGame(nextGame.id)
    toast({
      title: "Atendimento iniciado",
      description: `${nextGame.clientName} está sendo atendido agora.`,
    })
    
    // Open conversation link if available
    if (nextGame.conversationLink) {
      window.open(nextGame.conversationLink, '_blank')
    }
  }

  const handleFinishGame = (gameId: string) => {
    gameStore.finishGame(gameId)
    toast({
      title: "Atendimento finalizado",
      description: "Jogo marcado como finalizado com sucesso.",
    })
  }

  const handleRevertGame = (gameId: string) => {
    gameStore.updateGame(gameId, {
      status: 'Em Jogo',
      endTime: undefined
    })
    toast({
      title: "Jogo revertido",
      description: "Jogo voltou para status 'Em Jogo'.",
    })
  }

  const getWaitTimeDisplay = (gameId: string) => {
    const waitMinutes = gameStore.getEstimatedWaitTime(gameId)
    const hours = Math.floor(waitMinutes / 60)
    const minutes = waitMinutes % 60
    
    if (hours > 0) {
      return `${hours}h ${minutes}min`
    }
    return `${minutes}min`
  }

  const getEstimatedServiceTime = (gameId: string) => {
    const waitMinutes = gameStore.getEstimatedWaitTime(gameId)
    const now = new Date()
    const estimatedTime = addMinutes(now, waitMinutes)
    
    // Convert to São Paulo timezone
    const saoPauloTime = toZonedTime(estimatedTime, 'America/Sao_Paulo')
    
    return format(saoPauloTime, 'HH:mm', { timeZone: 'America/Sao_Paulo' })
  }

  // Renderizar versão mobile se detectado
  if (isMobile) {
    return <MobileDashboard />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">
            Dashboard Principal
          </h1>
          <p className="text-muted-foreground">
            Gerencie a fila de atendimento e acompanhe os jogos em tempo real
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">
              {queueGames.length} na fila
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-accent" />
            <span className="text-sm font-medium">
              {todayFinished.length} finalizados hoje
            </span>
          </div>
          <NotificationSystem />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowQueueManager(!showQueueManager)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Gerenciar Fila
          </Button>
        </div>
      </div>

      {/* Tabs para diferentes visualizações */}
      <Tabs value={activeView} onValueChange={(value) => setActiveView(value as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="queue" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Fila Inteligente
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          {/* Cartomantes Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {CARTOMANTES.map(cartomante => {
          const activeGame = activeGames.find(game => game.cartomante.id === cartomante.id)
          const canPullNext = !activeGame
          const nextInQueue = gameStore.getNextClientForCartomante(cartomante.id)

          return (
            <Card key={cartomante.id} className="shadow-card">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <span>{cartomante.name}</span>
                  <Badge variant={activeGame ? "default" : "secondary"}>
                    {activeGame ? "Em Atendimento" : "Disponível"}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  {cartomante.priceMultiplier === 0.5 ? "Afiliada (50% comissão)" : "Titular"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {activeGame ? (
                  <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-semibold">{activeGame.clientName}</p>
                        <p className="text-sm text-muted-foreground">{activeGame.gameType.name}</p>
                      </div>
                      <RealTimeGameTimer startTime={activeGame.startTime} />
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => handleFinishGame(activeGame.id)}
                        className="flex-1"
                        variant="outline"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Finalizar Jogo
                      </Button>
                      {activeGame.conversationLink && (
                        <Button 
                          onClick={() => window.open(activeGame.conversationLink, '_blank')}
                          size="sm"
                          variant="outline"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ) : nextInQueue ? (
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-semibold">{nextInQueue.clientName}</p>
                        <p className="text-sm text-muted-foreground">{nextInQueue.gameType.name}</p>
                      </div>
                      <Badge variant="outline">Próximo</Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => handlePullNext(cartomante.id)}
                        className="flex-1 bg-primary text-primary-foreground"
                        disabled={!canPullNext}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Puxar Próximo Cliente
                      </Button>
                      {nextInQueue?.conversationLink && (
                        <Button 
                          onClick={() => window.open(nextInQueue.conversationLink, '_blank')}
                          size="sm"
                          variant="outline"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-muted/50 rounded-lg text-center">
                    <p className="text-muted-foreground">Nenhum cliente na fila</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Queue Manager */}
      {showQueueManager && (
        <QueueManager 
          games={games}
          onUpdate={() => setGames(gameStore.getGames())}
        />
      )}

      {/* Queue Section */}
      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-primary" />
              <span className="text-lg font-semibold">Fila de Atendimento</span>
              <Badge variant="secondary">{queueGames.length}</Badge>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant={queueFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setQueueFilter('all')}
              >
                Todos
              </Button>
              <Button
                variant={queueFilter === 'vanessa' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setQueueFilter('vanessa')}
              >
                Vanessa
              </Button>
              <Button
                variant={queueFilter === 'alana' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setQueueFilter('alana')}
              >
                Alana
              </Button>
            </div>
          </div>
          <CardDescription>
            Clientes aguardando atendimento por ordem de chegada
          </CardDescription>
        </CardHeader>
        <CardContent>
          {queueGames.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum cliente na fila no momento</p>
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
                      <p className="font-semibold">{game.clientName}</p>
                      <p className="text-sm text-muted-foreground">
                        {game.gameType.name} • {game.cartomante.name}
                      </p>
                    </div>
                  </div>
                   <div className="text-right">
                     <p className="text-sm font-medium">Tempo estimado: {getWaitTimeDisplay(game.id)}</p>
                     <p className="text-sm text-muted-foreground">
                       Atendimento às ~{getEstimatedServiceTime(game.id)}
                     </p>
                   </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Today's Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Jogos Hoje</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayFinished.length}</div>
            <p className="text-xs text-muted-foreground">
              +{games.filter(g => g.status === 'Em Jogo').length} em andamento
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Faturamento Hoje</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {todayPaidGames.reduce((sum, game) => sum + game.value, 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Ticket médio: R$ {todayPaidGames.length > 0 ? (todayPaidGames.reduce((sum, game) => sum + game.value, 0) / todayPaidGames.length).toFixed(2) : '0.00'}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Na Fila</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{queueGames.length}</div>
            <p className="text-xs text-muted-foreground">
              Próximo: {queueGames[0]?.clientName || 'Nenhum'}
            </p>
          </CardContent>
        </Card>
      </div>
        </TabsContent>

        <TabsContent value="analytics">
          <RealTimeDashboard />
        </TabsContent>

        <TabsContent value="queue">
          <SmartQueue />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default Index