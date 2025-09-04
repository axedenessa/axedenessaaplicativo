import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Clock, Play, CheckCircle, DollarSign, Target, Calendar, History } from 'lucide-react'
import { gameStore } from '@/lib/gameStore'
import { Game, CARTOMANTES } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'
import { RealTimeGameTimer } from '@/components/RealTimeGameTimer'
import { PDFReport } from '@/components/PDFReport'
import { formatDateBR, formatTimeBR } from '@/utils/timezone'

const EmployeeAccess = () => {
  const [games, setGames] = useState<Game[]>([])
  const [userProfile, setUserProfile] = useState<any>(null)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [period, setPeriod] = useState('today')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
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

  // Set default dates based on period
  useEffect(() => {
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]
    
    switch (period) {
      case 'today':
        setStartDate(todayStr)
        setEndDate(todayStr)
        break
      case 'week':
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
        setStartDate(weekAgo.toISOString().split('T')[0])
        setEndDate(todayStr)
        break
      case 'month':
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
        setStartDate(monthAgo.toISOString().split('T')[0])
        setEndDate(todayStr)
        break
    }
  }, [period])

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

  // Historical games based on selected period
  const getHistoricalGames = () => {
    let filtered = myGames.filter(game => game.status === 'Jogo finalizado')
    
    if (period === 'custom') {
      if (startDate) filtered = filtered.filter(game => game.date >= startDate)
      if (endDate) filtered = filtered.filter(game => game.date <= endDate)
    } else {
      if (startDate) filtered = filtered.filter(game => game.date >= startDate)
      if (endDate) filtered = filtered.filter(game => game.date <= endDate)
    }
    
    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }

  const historicalGames = getHistoricalGames()
  const historicalRevenue = historicalGames.reduce((sum, game) => sum + game.value, 0)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

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

      {/* Historical Performance */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <History className="h-5 w-5" />
            <span>Histórico de Performance</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Date Filter */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Período</Label>
                <Select value={period} onValueChange={setPeriod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Hoje</SelectItem>
                    <SelectItem value="week">Últimos 7 dias</SelectItem>
                    <SelectItem value="month">Últimos 30 dias</SelectItem>
                    <SelectItem value="custom">Personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Data Inicial</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  disabled={period !== 'custom'}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Data Final</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  disabled={period !== 'custom'}
                />
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-primary" />
                    Jogos no Período
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{historicalGames.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Jogos finalizados
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <DollarSign className="h-4 w-4 mr-2 text-primary" />
                    Faturamento Total
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-accent">
                    {formatCurrency(historicalRevenue)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {employeeCartomante.priceMultiplier === 0.5 && (
                      <>Sua comissão: {formatCurrency(historicalRevenue * 0.5)}</>
                    )}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <Target className="h-4 w-4 mr-2 text-primary" />
                    Ticket Médio
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">
                    {formatCurrency(historicalGames.length > 0 ? historicalRevenue / historicalGames.length : 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Por jogo
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Games Table */}
            {historicalGames.length > 0 && (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Tipo de Jogo</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Horário</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead>Campanha</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historicalGames.slice(0, 10).map((game) => (
                      <TableRow key={game.id}>
                        <TableCell className="font-medium">
                          {game.clientName}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {game.gameType.name}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {formatDateBR(game.date)}
                        </TableCell>
                        <TableCell>
                          {formatTimeBR(`${game.date} ${game.paymentTime}`)}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-accent">
                          {formatCurrency(game.value)}
                        </TableCell>
                        <TableCell>
                          {game.campaign ? (
                            <Badge variant="secondary" className="text-xs">
                              {game.campaign}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {historicalGames.length > 10 && (
                  <p className="text-center text-muted-foreground text-sm mt-4">
                    Mostrando 10 de {historicalGames.length} jogos
                  </p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* PDF Reports */}
      <PDFReport />
    </div>
  )
}

export default EmployeeAccess