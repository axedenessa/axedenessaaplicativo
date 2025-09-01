import { useState, useEffect } from "react"
import { TrendingUp, DollarSign, Minus, Plus, Calculator } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { gameStore } from "@/lib/gameStore"
import { facebookAPI } from "@/lib/facebookApi"
import { CARTOMANTES } from "@/lib/types"

const CustosLucros = () => {
  const [games, setGames] = useState(gameStore.getGames())
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [period, setPeriod] = useState('month')

  useEffect(() => {
    const unsubscribe = gameStore.subscribe(() => {
      setGames(gameStore.getGames())
    })
    
    loadCampaigns()
    return unsubscribe
  }, [])

  // Reload campaigns when date range changes
  useEffect(() => {
    if (startDate && endDate) {
      loadCampaigns()
    }
  }, [startDate, endDate])

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
      case 'all':
        setStartDate('')
        setEndDate('')
        break
    }
  }, [period])

  const loadCampaigns = async () => {
    try {
      let dateRange = { 
        since: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        until: new Date().toISOString().split('T')[0]
      }
      
      // Use filtered date range if available
      if (startDate && endDate) {
        dateRange = { since: startDate, until: endDate }
      }
      
      const campaignData = await facebookAPI.getCampaigns('act_776827264799644', dateRange)
      setCampaigns(campaignData)
    } catch (error) {
      console.error('Error loading campaigns:', error)
      setCampaigns([]) // Clear campaigns on error
    }
  }

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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  // Calculate financial metrics
  const totalRevenue = filteredGames.reduce((sum, game) => sum + game.value, 0)

  // Calculate commission for Alana (50% of her games - already comes with 50% value)
  const alanaCommission = filteredGames
    .filter(game => game.cartomante.name === 'Alana Cerqueira')
    .reduce((sum, game) => sum + game.value, 0)

  // Calculate Facebook Ads spend
  const totalAdSpend = campaigns.reduce((sum, campaign) => sum + campaign.spend, 0)

  // Calculate total costs
  const totalCosts = alanaCommission + totalAdSpend

  // Calculate net profit
  const netProfit = totalRevenue - totalCosts

  // Profit margin
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0

  // Break down revenue by cartomante
  const vanessaRevenue = filteredGames
    .filter(game => game.cartomante.name === 'Vanessa Barreto')
    .reduce((sum, game) => sum + game.value, 0)

  const alanaRevenue = filteredGames
    .filter(game => game.cartomante.name === 'Alana Cerqueira')
    .reduce((sum, game) => sum + game.value, 0)

  // Calculate what Axe de Nessa keeps from Alana's sales (50%)
  const axeDeNessaFromAlana = alanaRevenue * 0.5

  // Total for Axe de Nessa (100% Vanessa + 50% Alana)
  const axeDeNessaRevenue = vanessaRevenue + axeDeNessaFromAlana

  // ROI calculation
  const roi = totalCosts > 0 ? ((netProfit / totalCosts) * 100) : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Calculator className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold gradient-brand bg-clip-text text-transparent">
            Custos & Lucros
          </h1>
          <p className="text-muted-foreground">
            Análise completa de custos, comissões e lucratividade
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Período de Análise</CardTitle>
        </CardHeader>
        <CardContent>
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
          </div>
        </CardContent>
      </Card>

      {/* Main Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <DollarSign className="h-4 w-4 mr-2 text-accent" />
              Receita Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">
              {formatCurrency(totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              {filteredGames.length} jogos
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Minus className="h-4 w-4 mr-2 text-destructive" />
              Custos Totais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {formatCurrency(totalCosts)}
            </div>
            <p className="text-xs text-muted-foreground">
              Comissões + Ads
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Plus className="h-4 w-4 mr-2 text-primary" />
              Lucro Líquido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-primary' : 'text-destructive'}`}>
              {formatCurrency(netProfit)}
            </div>
            <p className="text-xs text-muted-foreground">
              Margem: {profitMargin.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <TrendingUp className="h-4 w-4 mr-2 text-primary" />
              ROI
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${roi >= 0 ? 'text-primary' : 'text-destructive'}`}>
              {roi.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Retorno sobre investimento
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Distribuição de Receita</CardTitle>
            <CardDescription>Como a receita é dividida entre as partes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg border border-primary/20">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-primary rounded-full"></div>
                  <div>
                    <p className="font-semibold">Vanessa Barreto (100%)</p>
                    <p className="text-sm text-muted-foreground">Titular - Fica com valor integral</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary">{formatCurrency(vanessaRevenue)}</p>
                  <p className="text-xs text-muted-foreground">
                    {filteredGames.filter(g => g.cartomante.name === 'Vanessa Barreto').length} jogos
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-accent/10 rounded-lg border border-accent/20">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-accent rounded-full"></div>
                  <div>
                    <p className="font-semibold">Alana Cerqueira (50%)</p>
                    <p className="text-sm text-muted-foreground">Afiliada - Comissão de 50%</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-accent">{formatCurrency(alanaCommission)}</p>
                  <p className="text-xs text-muted-foreground">
                    {filteredGames.filter(g => g.cartomante.name === 'Alana Cerqueira').length} jogos
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-brand-purple/10 rounded-lg border border-brand-purple/20">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-brand-purple rounded-full"></div>
                  <div>
                    <p className="font-semibold">Axe de Nessa (Total)</p>
                    <p className="text-sm text-muted-foreground">100% Vanessa + 50% Alana</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-brand-purple">{formatCurrency(axeDeNessaRevenue)}</p>
                  <p className="text-xs text-muted-foreground">Receita bruta da empresa</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Detalhamento de Custos</CardTitle>
            <CardDescription>Breakdown completo dos custos operacionais</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-destructive rounded-full"></div>
                  <div>
                    <p className="font-semibold">Comissão Alana</p>
                    <p className="text-sm text-muted-foreground">50% dos jogos da Alana</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-destructive">{formatCurrency(alanaCommission)}</p>
                  <p className="text-xs text-muted-foreground">
                    {((alanaCommission / totalCosts) * 100).toFixed(1)}% dos custos
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <div>
                    <p className="font-semibold">Facebook Ads</p>
                    <p className="text-sm text-muted-foreground">Gasto em campanhas</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-blue-500">{formatCurrency(totalAdSpend)}</p>
                  <p className="text-xs text-muted-foreground">
                    {totalCosts > 0 ? ((totalAdSpend / totalCosts) * 100).toFixed(1) : 0}% dos custos
                  </p>
                </div>
              </div>

              <div className="border-t pt-3">
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <p className="font-bold">Total de Custos</p>
                    <p className="text-sm text-muted-foreground">Soma de todos os custos</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-2xl">{formatCurrency(totalCosts)}</p>
                    <p className="text-xs text-muted-foreground">
                      {totalRevenue > 0 ? ((totalCosts / totalRevenue) * 100).toFixed(1) : 0}% da receita
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Profitability Analysis */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Análise de Lucratividade</CardTitle>
          <CardDescription>Métricas de performance financeira do negócio</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-gradient-brand rounded-lg text-white">
              <h3 className="text-lg font-semibold mb-2">Lucro Líquido</h3>
              <p className="text-3xl font-bold mb-2">{formatCurrency(netProfit)}</p>
              <Badge variant={netProfit >= 0 ? "secondary" : "destructive"} className="text-white">
                {netProfit >= 0 ? "Positivo" : "Negativo"}
              </Badge>
            </div>

            <div className="text-center p-6 bg-muted rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Margem de Lucro</h3>
              <p className="text-3xl font-bold mb-2">{profitMargin.toFixed(1)}%</p>
              <p className="text-sm text-muted-foreground">
                {profitMargin >= 20 ? "Excelente" : profitMargin >= 10 ? "Boa" : "Baixa"} margem
              </p>
            </div>

            <div className="text-center p-6 bg-muted rounded-lg">
              <h3 className="text-lg font-semibold mb-2">ROI</h3>
              <p className="text-3xl font-bold mb-2">{roi.toFixed(1)}%</p>
              <p className="text-sm text-muted-foreground">
                Retorno sobre {formatCurrency(totalCosts)} investidos
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle>Insights e Recomendações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {profitMargin < 10 && (
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <p className="text-sm">
                  <strong>⚠️ Margem baixa:</strong> Consider ajustar preços ou reduzir custos para melhorar a lucratividade.
                </p>
              </div>
            )}
            
            {totalAdSpend > axeDeNessaRevenue * 0.3 && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-sm">
                  <strong>🚨 Gasto alto em ads:</strong> O investimento em Facebook Ads está muito alto em relação à receita. Otimize as campanhas.
                </p>
              </div>
            )}
            
            {netProfit > 0 && profitMargin > 20 && (
              <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <p className="text-sm">
                  <strong>✅ Performance excelente:</strong> Lucratividade saudável! Consider escalar os investimentos em marketing.
                </p>
              </div>
            )}
            
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-sm">
                <strong>💡 Dica:</strong> Acompanhe essas métricas regularmente para identificar tendências e otimizar a operação.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default CustosLucros
