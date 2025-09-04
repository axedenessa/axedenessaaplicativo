import { useState, useEffect } from 'react'
import { Play, CheckCircle, Users, Clock, DollarSign, Bell, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { gameStore } from '@/lib/gameStore'
import { Game, CARTOMANTES } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'
import { RealTimeGameTimer } from '@/components/RealTimeGameTimer'
import { NotificationSystem } from '@/components/NotificationSystem'

export const MobileDashboard = () => {
  const [games, setGames] = useState<Game[]>([])
  const [activeTab, setActiveTab] = useState<'overview' | 'queue' | 'active'>('overview')
  const { toast } = useToast()

  useEffect(() => {
    const updateGames = () => setGames(gameStore.getGames())
    updateGames()
    
    const unsubscribe = gameStore.subscribe(updateGames)
    return unsubscribe
  }, [])

  // Dados processados
  const today = new Date().toISOString().split('T')[0]
  const todayGames = games.filter(game => 
    game.date === today && 
    (game.status === 'Jogo finalizado' || game.status === 'Em Jogo' || game.status === 'Na fila')
  )
  const finishedToday = games.filter(game => 
    game.status === 'Jogo finalizado' && game.date === today
  )
  const activeGames = games.filter(game => game.status === 'Em Jogo')
  const queueGames = games.filter(game => game.status === 'Na fila')
    .sort((a, b) => new Date(`${a.date} ${a.paymentTime}`).getTime() - new Date(`${b.date} ${b.paymentTime}`).getTime())

  // Ações
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
  }

  const handleFinishGame = (gameId: string) => {
    gameStore.finishGame(gameId)
    toast({
      title: "Atendimento finalizado",
      description: "Jogo marcado como finalizado com sucesso.",
    })
  }

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header Mobile */}
      <div className="flex items-center justify-between p-4 border-b bg-card">
        <h1 className="text-lg font-bold">Dashboard</h1>
        <div className="flex items-center space-x-2">
          <NotificationSystem />
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <div className="space-y-4 pt-4">
                <h2 className="text-lg font-semibold">Menu</h2>
                <div className="space-y-2">
                  <Button variant="ghost" className="w-full justify-start">
                    Novo Jogo
                  </Button>
                  <Button variant="ghost" className="w-full justify-start">
                    Relatórios
                  </Button>
                  <Button variant="ghost" className="w-full justify-start">
                    Configurações
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Tabs Mobile */}
      <div className="flex border-b bg-card">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 py-3 px-4 text-sm font-medium ${
            activeTab === 'overview' 
              ? 'text-primary border-b-2 border-primary' 
              : 'text-muted-foreground'
          }`}
        >
          Visão Geral
        </button>
        <button
          onClick={() => setActiveTab('active')}
          className={`flex-1 py-3 px-4 text-sm font-medium ${
            activeTab === 'active' 
              ? 'text-primary border-b-2 border-primary' 
              : 'text-muted-foreground'
          }`}
        >
          Ativos ({activeGames.length})
        </button>
        <button
          onClick={() => setActiveTab('queue')}
          className={`flex-1 py-3 px-4 text-sm font-medium ${
            activeTab === 'queue' 
              ? 'text-primary border-b-2 border-primary' 
              : 'text-muted-foreground'
          }`}
        >
          Fila ({queueGames.length})
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === 'overview' && (
          <>
            {/* Métricas Principais */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="p-3">
                <div className="text-center">
                  <div className="text-xl font-bold text-primary">
                    {formatCurrency(todayGames.reduce((sum, game) => sum + game.value, 0))}
                  </div>
                  <div className="text-xs text-muted-foreground">Faturamento</div>
                </div>
              </Card>
              
              <Card className="p-3">
                <div className="text-center">
                  <div className="text-xl font-bold text-accent">{finishedToday.length}</div>
                  <div className="text-xs text-muted-foreground">Finalizados</div>
                </div>
              </Card>
              
              <Card className="p-3">
                <div className="text-center">
                  <div className="text-xl font-bold text-foreground">{activeGames.length}</div>
                  <div className="text-xs text-muted-foreground">Em Atendimento</div>
                </div>
              </Card>
              
              <Card className="p-3">
                <div className="text-center">
                  <div className="text-xl font-bold text-primary">{queueGames.length}</div>
                  <div className="text-xs text-muted-foreground">Na Fila</div>
                </div>
              </Card>
            </div>

            {/* Status das Cartomantes */}
            <div className="space-y-3">
              <h2 className="text-lg font-semibold">Cartomantes</h2>
              {CARTOMANTES.map(cartomante => {
                const activeGame = activeGames.find(game => game.cartomante.id === cartomante.id)
                const nextInQueue = gameStore.getNextClientForCartomante(cartomante.id)

                return (
                  <Card key={cartomante.id} className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium">{cartomante.name}</h3>
                      <Badge variant={activeGame ? 'default' : 'secondary'}>
                        {activeGame ? 'Atendendo' : 'Disponível'}
                      </Badge>
                    </div>

                    {activeGame ? (
                      <div className="space-y-3">
                        <div className="p-3 bg-primary/10 rounded border-primary/20 border">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-sm">{activeGame.clientName}</p>
                              <p className="text-xs text-muted-foreground">{activeGame.gameType.name}</p>
                            </div>
                            <RealTimeGameTimer startTime={activeGame.startTime} className="text-xs" />
                          </div>
                        </div>
                        <Button 
                          onClick={() => handleFinishGame(activeGame.id)}
                          className="w-full"
                          size="sm"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Finalizar
                        </Button>
                      </div>
                    ) : nextInQueue ? (
                      <div className="space-y-3">
                        <div className="p-3 bg-muted rounded">
                          <p className="font-medium text-sm">{nextInQueue.clientName}</p>
                          <p className="text-xs text-muted-foreground">{nextInQueue.gameType.name}</p>
                        </div>
                        <Button 
                          onClick={() => handlePullNext(cartomante.id)}
                          className="w-full bg-primary text-primary-foreground"
                          size="sm"
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Puxar Próximo
                        </Button>
                      </div>
                    ) : (
                      <div className="p-3 bg-muted/50 rounded text-center">
                        <p className="text-sm text-muted-foreground">Sem clientes na fila</p>
                      </div>
                    )}
                  </Card>
                )
              })}
            </div>
          </>
        )}

        {activeTab === 'active' && (
          <>
            <h2 className="text-lg font-semibold">Jogos Ativos</h2>
            {activeGames.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhum jogo ativo no momento</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeGames.map(game => (
                  <Card key={game.id} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium">{game.clientName}</p>
                        <p className="text-sm text-muted-foreground">
                          {game.gameType.name} • {game.cartomante.name}
                        </p>
                      </div>
                      <RealTimeGameTimer startTime={game.startTime} />
                    </div>
                    <Button 
                      onClick={() => handleFinishGame(game.id)}
                      className="w-full"
                      size="sm"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Finalizar Jogo
                    </Button>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'queue' && (
          <>
            <h2 className="text-lg font-semibold">Fila de Atendimento</h2>
            {queueGames.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhum cliente na fila</p>
              </div>
            ) : (
              <div className="space-y-3">
                {queueGames.map((game, index) => (
                  <Card key={game.id} className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-full text-sm font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{game.clientName}</p>
                        <p className="text-sm text-muted-foreground">
                          {game.gameType.name} • {game.cartomante.name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Tempo estimado: {Math.round(gameStore.getEstimatedWaitTime(game.id))}min
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}