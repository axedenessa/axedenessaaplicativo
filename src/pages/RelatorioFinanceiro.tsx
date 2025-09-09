import { useState, useEffect } from "react"
import { BarChart3, DollarSign, TrendingUp, Calendar, PieChart, FileDown } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { gameStore } from "@/lib/gameStore"
import { CARTOMANTES, GAME_TYPES } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { PDFReport } from "@/components/PDFReport"
import { getTodayBRDateString, formatDateToBRYMD } from "@/utils/timezone"

const RelatorioFinanceiro = () => {
  const [games, setGames] = useState(gameStore.getGames())
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [period, setPeriod] = useState('all')

  useEffect(() => {
    const unsubscribe = gameStore.subscribe(() => {
      setGames(gameStore.getGames())
    })
    
    return unsubscribe
  }, [])

  // Set default dates based on period
  useEffect(() => {
    const today = new Date()
    const todayStr = getTodayBRDateString()
    
    switch (period) {
      case 'today':
        setStartDate(todayStr)
        setEndDate(todayStr)
        break
      case 'week':
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
        setStartDate(formatDateToBRYMD(weekAgo))
        setEndDate(todayStr)
        break
      case 'month':
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
        setStartDate(formatDateToBRYMD(monthAgo))
        setEndDate(todayStr)
        break
      case 'all':
        setStartDate('')
        setEndDate('')
        break
    }
  }, [period])

  const getFilteredGames = () => {
    let filtered = games.filter(game => game.status === 'Jogo finalizado')
    
    if (startDate) {
      filtered = filtered.filter(game => game.date >= startDate)
    }
    if (endDate) {
      filtered = filtered.filter(game => game.date <= endDate)
    }
    
    return filtered
  }

  const filteredGames = getFilteredGames()
  const financialData = gameStore.getFinancialData(startDate, endDate)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const getRevenueByDate = () => {
    const dateRevenue: { [date: string]: number } = {}
    
    filteredGames.forEach(game => {
      dateRevenue[game.date] = (dateRevenue[game.date] || 0) + game.value
    })
    
    return Object.entries(dateRevenue)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, revenue]) => ({
        date: new Date(date).toLocaleDateString('pt-BR'),
        revenue
      }))
  }

  const getTopClients = () => {
    const clientRevenue: { [client: string]: { revenue: number, games: number } } = {}
    
    filteredGames.forEach(game => {
      const client = game.clientName
      if (!clientRevenue[client]) {
        clientRevenue[client] = { revenue: 0, games: 0 }
      }
      clientRevenue[client].revenue += game.value
      clientRevenue[client].games += 1
    })
    
    return Object.entries(clientRevenue)
      .sort(([,a], [,b]) => b.revenue - a.revenue)
      .slice(0, 5)
      .map(([client, data]) => ({ client, ...data }))
  }

  const getCampaignRevenue = () => {
    const campaignRevenue: { [campaign: string]: { revenue: number, games: number } } = {}
    
    filteredGames.forEach(game => {
      const campaign = game.campaign || 'Sem campanha'
      if (!campaignRevenue[campaign]) {
        campaignRevenue[campaign] = { revenue: 0, games: 0 }
      }
      campaignRevenue[campaign].revenue += game.value
      campaignRevenue[campaign].games += 1
    })
    
    return Object.entries(campaignRevenue)
      .sort(([,a], [,b]) => b.revenue - a.revenue)
      .map(([campaign, data]) => ({ campaign, ...data }))
  }

  const dailyRevenue = getRevenueByDate()
  const topClients = getTopClients()
  const campaignRevenue = getCampaignRevenue()

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <BarChart3 className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold text-primary">
            Relatório Financeiro
          </h1>
          <p className="text-muted-foreground">
            Análise detalhada da performance financeira do negócio
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros de Período</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Período Rápido</Label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Hoje</SelectItem>
                  <SelectItem value="week">Últimos 7 dias</SelectItem>
                  <SelectItem value="month">Últimos 30 dias</SelectItem>
                  <SelectItem value="all">Todos os períodos</SelectItem>
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
            
            <div className="flex items-end">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  setStartDate('')
                  setEndDate('')
                  setPeriod('all')
                }}
              >
                Limpar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <DollarSign className="h-4 w-4 mr-2 text-primary" />
              Faturamento Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(financialData.totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              Inclui todos os jogos pagos
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <TrendingUp className="h-4 w-4 mr-2 text-primary" />
              Ticket Médio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(financialData.averageTicket)}
            </div>
            <p className="text-xs text-muted-foreground">
              Por consulta
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-primary" />
              Jogos por Dia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dailyRevenue.length > 0 ? (filteredGames.length / dailyRevenue.length).toFixed(1) : '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              Média no período
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <PieChart className="h-4 w-4 mr-2 text-primary" />
              Receita por Dia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(dailyRevenue.length > 0 ? financialData.totalRevenue / dailyRevenue.length : 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Média no período
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue by Cartomante */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Receita por Cartomante</CardTitle>
            <CardDescription>Distribuição da receita entre as cartomantes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {CARTOMANTES.map(cartomante => {
                const revenue = financialData.revenueByCartomante[cartomante.name] || 0
                const percentage = financialData.totalRevenue > 0 ? (revenue / financialData.totalRevenue) * 100 : 0
                const gamesCount = filteredGames.filter(g => g.cartomante.name === cartomante.name).length
                
                return (
                  <div key={cartomante.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold">{cartomante.name}</span>
                        {cartomante.priceMultiplier === 0.5 && (
                          <Badge variant="secondary" className="text-xs">Afiliada</Badge>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-primary">{formatCurrency(revenue)}</p>
                        <p className="text-xs text-muted-foreground">{gamesCount} jogos</p>
                      </div>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{percentage.toFixed(1)}% do total</span>
                      <span>Ticket médio: {formatCurrency(gamesCount > 0 ? revenue / gamesCount : 0)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Revenue by Game Type */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Receita por Tipo de Jogo</CardTitle>
            <CardDescription>Performance de cada tipo de consulta</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {GAME_TYPES.map(gameType => {
                const revenue = financialData.revenueByGameType[gameType.name] || 0
                const percentage = financialData.totalRevenue > 0 ? (revenue / financialData.totalRevenue) * 100 : 0
                const gamesCount = filteredGames.filter(g => g.gameType.name === gameType.name).length
                
                return (
                  <div key={gameType.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm">{gameType.name}</span>
                      <div className="text-right">
                        <p className="font-semibold text-primary text-sm">{formatCurrency(revenue)}</p>
                        <p className="text-xs text-muted-foreground">{gamesCount} jogos</p>
                      </div>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground text-right">
                      {percentage.toFixed(1)}% do total
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Clients and Campaign Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Top 5 Clientes</CardTitle>
            <CardDescription>Clientes que mais contribuíram para a receita</CardDescription>
          </CardHeader>
          <CardContent>
            {topClients.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">Nenhum cliente no período selecionado</p>
            ) : (
              <div className="space-y-3">
                {topClients.map((client, index) => (
                  <div key={client.client} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-6 h-6 bg-primary text-primary-foreground rounded-full text-xs font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-semibold">{client.client}</p>
                        <p className="text-xs text-muted-foreground">{client.games} jogos</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-primary">{formatCurrency(client.revenue)}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(client.revenue / client.games)} por jogo
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Performance por Campanha</CardTitle>
            <CardDescription>Receita gerada por cada campanha</CardDescription>
          </CardHeader>
          <CardContent>
            {campaignRevenue.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">Nenhuma campanha no período selecionado</p>
            ) : (
              <div className="space-y-3">
                {campaignRevenue.map((campaign, index) => (
                  <div key={campaign.campaign} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-semibold">{campaign.campaign}</p>
                      <p className="text-xs text-muted-foreground">{campaign.games} conversões</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-primary">{formatCurrency(campaign.revenue)}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(campaign.revenue / campaign.games)} por conversão
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* PDF Export */}
      <PDFReport />
    </div>
  )
}

export default RelatorioFinanceiro