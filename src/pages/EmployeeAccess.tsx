import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, Play, CheckCircle, DollarSign, Target } from 'lucide-react'
import { gameStore } from '@/lib/gameStore'
import { Game, CARTOMANTES } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'
import { RealTimeGameTimer } from '@/components/RealTimeGameTimer'
import { PDFReport } from '@/components/PDFReport'

const EmployeeAccess = () => {
  const [games, setGames] = useState<Game[]>([])
  const [userProfile, setUserProfile] = useState<any>(null)
  const { user } = useAuth()
  const { toast } = useToast()

  // Get employee's cartomante based on user profile
  const employeeCartomante = userProfile?.name === 'Alana Cerqueira' 
    ? CARTOMANTES.find(c => c.name === 'Alana Cerqueira')
    : CARTOMANTES.find(c => c.name === 'Vanessa Barreto')

  useEffect(() => {
    const updateGames = () => setGames(gameStore.getGames())
    updateGames()
    
    const unsubscribe = gameStore.subscribe(updateGames)
    return unsubscribe
  }, [])

  useEffect(() => {
    // Get user profile to determine which cartomante this employee is
    if (user) {
      // For now, we'll use a simple mapping based on email or default to Alana
      setUserProfile({ name: 'Alana Cerqueira', role: 'employee' })
    }
  }, [user])

  const myGames = games.filter(game => 
    employeeCartomante && game.cartomante.id === employeeCartomante.id
  )

  const queueGames = myGames.filter(game => game.status === 'Na fila')
    .sort((a, b) => new Date(`${a.date} ${a.paymentTime}`).getTime() - new Date(`${b.date} ${b.paymentTime}`).getTime())

  const activeGame = myGames.find(game => game.status === 'Em Jogo')
  
  const todayGames = myGames.filter(game => 
    game.date === new Date().toISOString().split('T')[0]
  )

  const finishedToday = todayGames.filter(game => game.status === 'Jogo finalizado')
  const todayRevenue = todayGames.reduce((sum, game) => sum + game.value, 0)

  const handlePullNext = () => {
    if (activeGame) {
      toast({
        title: "Você já está atendendo",
        description: "Finalize o atendimento atual antes de puxar o próximo.",
        variant: "destructive"
      })
      return
    }

    const nextGame = queueGames[0]
    if (!nextGame) {
      toast({
        title: "Fila vazia",
        description: "Não há clientes na sua fila.",
      })
      return
    }

    gameStore.startGame(nextGame.id)
    toast({
      title: "Atendimento iniciado",
      description: `Você está atendendo ${nextGame.clientName} agora.`,
    })
  }

  const handleFinishGame = () => {
    if (!activeGame) return

    gameStore.finishGame(activeGame.id)
    toast({
      title: "Atendimento finalizado",
      description: "Jogo marcado como finalizado com sucesso.",
    })
  }

  if (!employeeCartomante) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Acesso não autorizado</h1>
        <p className="text-muted-foreground">Você não tem permissão para acessar esta área.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">
            Meu Dashboard - {employeeCartomante.name}
          </h1>
          <p className="text-muted-foreground">
            Gerencie seus atendimentos e acompanhe sua performance
          </p>
        </div>
        <Badge variant="secondary" className="text-lg px-4 py-2">
          {employeeCartomante.priceMultiplier === 0.5 ? 'Afiliada' : 'Titular'}
        </Badge>
      </div>

      {/* Current Status */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Status Atual</CardTitle>
        </CardHeader>
        <CardContent>
          {activeGame ? (
            <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-semibold text-lg">{activeGame.clientName}</p>
                  <p className="text-muted-foreground">{activeGame.gameType.name}</p>
                  <p className="text-sm text-muted-foreground">Valor: R$ {activeGame.value.toFixed(2)}</p>
                </div>
                <RealTimeGameTimer startTime={activeGame.startTime} className="text-lg" />
              </div>
              <Button 
                onClick={handleFinishGame}
                className="w-full"
                size="lg"
              >
                <CheckCircle className="h-5 w-5 mr-2" />
                Finalizar Atendimento
              </Button>
            </div>
          ) : queueGames.length > 0 ? (
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-semibold text-lg">{queueGames[0].clientName}</p>
                  <p className="text-muted-foreground">{queueGames[0].gameType.name}</p>
                  <p className="text-sm text-muted-foreground">Valor: R$ {queueGames[0].value.toFixed(2)}</p>
                </div>
                <Badge variant="outline" className="text-lg px-3 py-1">Próximo</Badge>
              </div>
              <Button 
                onClick={handlePullNext}
                className="w-full bg-primary text-primary-foreground"
                size="lg"
              >
                <Play className="h-5 w-5 mr-2" />
                Iniciar Atendimento
              </Button>
            </div>
          ) : (
            <div className="p-4 bg-muted/50 rounded-lg text-center">
              <p className="text-muted-foreground text-lg">Nenhum cliente na fila</p>
              <p className="text-sm text-muted-foreground mt-2">
                Aguarde novos clientes ou descanse um pouco
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Queue Overview */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5" />
            <span>Minha Fila ({queueGames.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {queueGames.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              Nenhum cliente aguardando
            </p>
          ) : (
            <div className="space-y-3">
              {queueGames.slice(0, 5).map((game, index) => (
                <div key={game.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">
                      {index + 1}
                    </Badge>
                    <div>
                      <p className="font-medium">{game.clientName}</p>
                      <p className="text-sm text-muted-foreground">{game.gameType.name}</p>
                    </div>
                  </div>
                  <p className="font-semibold text-primary">R$ {game.value.toFixed(2)}</p>
                </div>
              ))}
              {queueGames.length > 5 && (
                <p className="text-center text-muted-foreground text-sm">
                  +{queueGames.length - 5} clientes adicionais na fila
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Today's Performance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Atendimentos Hoje</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{finishedToday.length}</div>
            <p className="text-xs text-muted-foreground">
              +{activeGame ? 1 : 0} em andamento
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Faturamento Hoje</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {todayRevenue.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {employeeCartomante.priceMultiplier === 0.5 && (
                <>Sua comissão: R$ {(todayRevenue * 0.5).toFixed(2)}</>
              )}
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
              clientes aguardando
            </p>
          </CardContent>
        </Card>
      </div>

      {/* PDF Reports */}
      <PDFReport />
    </div>
  )
}

export default EmployeeAccess