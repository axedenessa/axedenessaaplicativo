import { useState, useEffect } from "react"
import { Facebook, TrendingUp, Target, Eye, DollarSign, RefreshCw } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { facebookAPI } from "@/lib/facebookApi"
import { gameStore } from "@/lib/gameStore"
import { FacebookCampaign } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

const Campanhas = () => {
  const [campaigns, setCampaigns] = useState<FacebookCampaign[]>([])
  const [loading, setLoading] = useState(false)
  const [games, setGames] = useState(gameStore.getGames())
  const { toast } = useToast()

  useEffect(() => {
    loadCampaigns()
    
    const unsubscribe = gameStore.subscribe(() => {
      setGames(gameStore.getGames())
    })
    
    return unsubscribe
  }, [])

  const loadCampaigns = async () => {
    setLoading(true)
    try {
      const campaignData = await facebookAPI.getCampaigns()
      setCampaigns(campaignData)
      
      toast({
        title: "Campanhas carregadas",
        description: `${campaignData.length} campanhas encontradas do Facebook Ads.`
      })
    } catch (error) {
      toast({
        title: "Erro ao carregar campanhas",
        description: "Não foi possível conectar com o Facebook Ads. Verifique o token de acesso.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const getCampaignROAS = (campaignName: string) => {
    // Filter games by campaign name
    const campaignGames = games.filter(game => 
      game.campaign && game.campaign.toLowerCase().includes(campaignName.toLowerCase()) && 
      game.status === 'Jogo finalizado'
    )
    
    const revenue = campaignGames.reduce((sum, game) => sum + game.value, 0)
    const campaign = campaigns.find(c => c.name.toLowerCase().includes(campaignName.toLowerCase()))
    const spend = campaign?.spend || 0
    
    return {
      revenue,
      spend,
      roas: spend > 0 ? revenue / spend : 0,
      conversions: campaignGames.length
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(2)}%`
  }

  const totalSpend = campaigns.reduce((sum, campaign) => sum + campaign.spend, 0)
  const totalReach = campaigns.reduce((sum, campaign) => sum + campaign.reach, 0)
  const totalResults = campaigns.reduce((sum, campaign) => sum + campaign.results, 0)
  const avgCPM = campaigns.length > 0 ? campaigns.reduce((sum, campaign) => sum + campaign.cpm, 0) / campaigns.length : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Facebook className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold gradient-brand bg-clip-text text-transparent">
              Campanhas Facebook
            </h1>
            <p className="text-muted-foreground">
              Análise de performance das campanhas do Facebook Ads
            </p>
          </div>
        </div>
        <Button onClick={loadCampaigns} disabled={loading} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar Dados
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <DollarSign className="h-4 w-4 mr-2 text-primary" />
              Gasto Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalSpend)}</div>
            <p className="text-xs text-muted-foreground">
              Últimos 30 dias
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Eye className="h-4 w-4 mr-2 text-primary" />
              Alcance Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalReach.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Pessoas alcançadas
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Target className="h-4 w-4 mr-2 text-primary" />
              Resultados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalResults}</div>
            <p className="text-xs text-muted-foreground">
              Leads gerados
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <TrendingUp className="h-4 w-4 mr-2 text-primary" />
              CPM Médio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(avgCPM)}</div>
            <p className="text-xs text-muted-foreground">
              Custo por mil impressões
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns Table */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Performance das Campanhas</CardTitle>
          <CardDescription>
            Dados detalhados de cada campanha com cálculo de ROAS baseado nos jogos realizados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Carregando campanhas...</p>
            </div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-8">
              <Facebook className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhuma campanha encontrada</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome da Campanha</TableHead>
                    <TableHead className="text-center">Gasto</TableHead>
                    <TableHead className="text-center">Resultados</TableHead>
                    <TableHead className="text-center">Alcance</TableHead>
                    <TableHead className="text-center">CPM</TableHead>
                    <TableHead className="text-center">CPC</TableHead>
                    <TableHead className="text-center">CTR</TableHead>
                    <TableHead className="text-center">Receita</TableHead>
                    <TableHead className="text-center">ROAS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.map((campaign) => {
                    const roasData = getCampaignROAS(campaign.name)
                    
                    return (
                      <TableRow key={campaign.id}>
                        <TableCell>
                          <div>
                            <p className="font-semibold">{campaign.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {campaign.date_start} - {campaign.date_stop}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-semibold">
                          {formatCurrency(campaign.spend)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">{campaign.results}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {campaign.reach.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-center">
                          {formatCurrency(campaign.cpm)}
                        </TableCell>
                        <TableCell className="text-center">
                          {formatCurrency(campaign.cpc)}
                        </TableCell>
                        <TableCell className="text-center">
                          {formatPercentage(campaign.ctr / 100)}
                        </TableCell>
                        <TableCell className="text-center font-semibold text-accent">
                          {formatCurrency(roasData.revenue)}
                          {roasData.conversions > 0 && (
                            <p className="text-xs text-muted-foreground">
                              {roasData.conversions} conversões
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge 
                            variant={roasData.roas >= 2 ? "default" : roasData.roas >= 1 ? "secondary" : "destructive"}
                          >
                            {roasData.roas.toFixed(2)}x
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ROAS Analysis */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Análise de ROAS por Campanha</CardTitle>
          <CardDescription>
            Return on Ad Spend calculado com base nos jogos finalizados de cada campanha
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {campaigns.map((campaign) => {
              const roasData = getCampaignROAS(campaign.name)
              
              return (
                <Card key={campaign.id} className="border border-muted">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{campaign.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Gasto:</span>
                      <span className="font-semibold">{formatCurrency(campaign.spend)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Receita:</span>
                      <span className="font-semibold text-accent">{formatCurrency(roasData.revenue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Conversões:</span>
                      <span className="font-semibold">{roasData.conversions}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="text-sm font-medium">ROAS:</span>
                      <Badge 
                        variant={roasData.roas >= 2 ? "default" : roasData.roas >= 1 ? "secondary" : "destructive"}
                        className="text-sm"
                      >
                        {roasData.roas.toFixed(2)}x
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Connection Status */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-lg">Status da Integração Facebook</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-accent rounded-full"></div>
              <span className="text-sm">Conectado</span>
            </div>
            <div className="text-sm text-muted-foreground">
              Token de acesso configurado • Dados atualizados automaticamente
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Os dados das campanhas são sincronizados automaticamente com o Facebook Ads.
            O ROAS é calculado cruzando os gastos das campanhas com a receita gerada pelos jogos marcados com cada campanha.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default Campanhas