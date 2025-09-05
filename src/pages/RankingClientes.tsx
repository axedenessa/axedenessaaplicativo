import { useState, useEffect } from "react"
import { Users, TrendingUp, Calendar, DollarSign, Search, ChevronLeft, ChevronRight, Eye } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { gameStore } from "@/lib/gameStore"
import { Client, Game } from "@/lib/types"

const RankingClientes = () => {
  const [clients, setClients] = useState<Client[]>([])
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [period, setPeriod] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [clientGames, setClientGames] = useState<Game[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  
  const ITEMS_PER_PAGE = 10

  useEffect(() => {
    const updateClients = () => setClients(gameStore.getClientStats())
    updateClients()
    
    const unsubscribe = gameStore.subscribe(updateClients)
    return unsubscribe
  }, [])

  // Set default dates based on period
  useEffect(() => {
    const toLocalDateString = (date: Date) => {
      const y = date.getFullYear()
      const m = String(date.getMonth() + 1).padStart(2, '0')
      const d = String(date.getDate()).padStart(2, '0')
      return `${y}-${m}-${d}`
    }

    const today = new Date()
    const todayStr = toLocalDateString(today)
    const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1)
    const yesterdayStr = toLocalDateString(yesterday)
    
    switch (period) {
      case 'today':
        setStartDate(todayStr)
        setEndDate(todayStr)
        break
      case 'yesterday':
        setStartDate(yesterdayStr)
        setEndDate(yesterdayStr)
        break
      case 'week':
        const weekAgo = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7)
        setStartDate(toLocalDateString(weekAgo))
        setEndDate(todayStr)
        break
      case 'month':
        const monthAgo = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 30)
        setStartDate(toLocalDateString(monthAgo))
        setEndDate(todayStr)
        break
      case 'all':
        setStartDate('')
        setEndDate('')
        break
    }
  }, [period])

  // Date helpers (local, timezone-safe)
  const toLocalDateString = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  const parseLocalDate = (s: string) => {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, (m || 1) - 1, d || 1);
  }

  const getFilteredClients = () => {
    if (!startDate && !endDate) return clients
    
    return clients.map(client => {
      // Filter game dates based on selected period
      const filteredGameDates = client.gameDates.filter(date => {
        if (startDate && date < startDate) return false
        if (endDate && date > endDate) return false
        return true
      })
      
      if (filteredGameDates.length === 0) return null
      
      // Recalculate stats for filtered dates
      const games = gameStore.getGames().filter(game => 
        game.clientName === client.name && 
        game.status === 'Jogo finalizado' &&
        filteredGameDates.includes(game.date)
      )
      
      const totalSpent = games.reduce((sum, game) => sum + game.value, 0)
      const totalGames = games.length
      const lastGameInPeriod = Math.max(...filteredGameDates.map(date => parseLocalDate(date).getTime()))
      
      return {
        ...client,
        totalSpent,
        totalGames,
        gameDates: filteredGameDates,
        lastGame: toLocalDateString(new Date(lastGameInPeriod))
      }
    }).filter(Boolean) as Client[]
  }

  const filteredClients = getFilteredClients()
    .filter(client => 
      client.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => b.totalSpent - a.totalSpent)

  // Pagination
  const totalPages = Math.ceil(filteredClients.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedClients = filteredClients.slice(startIndex, endIndex)

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  const handleClientClick = (client: Client) => {
    setSelectedClient(client)
    // Get all games for this client
    const allClientGames = gameStore.getGames().filter(game => 
      game.clientName === client.name && game.status === 'Jogo finalizado'
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    setClientGames(allClientGames)
    setModalOpen(true)
  }

  const formatFrequency = (days: number) => {
    if (days === 0) return "Único jogo"
    if (days < 1) return "Menos de 1 dia"
    if (days < 7) return `A cada ${Math.round(days)} dias`
    if (days < 30) return `A cada ${Math.round(days / 7)} semanas`
    return `A cada ${Math.round(days / 30)} meses`
  }

  const formatDate = (dateString: string) => {
    const d = parseLocalDate(dateString)
    return d.toLocaleDateString('pt-BR')
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const totalRevenue = filteredClients.reduce((sum, client) => sum + client.totalSpent, 0)
  const totalGames = filteredClients.reduce((sum, client) => sum + client.totalGames, 0)
  const avgTicket = totalRevenue / totalGames || 0

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Users className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold gradient-brand bg-clip-text text-transparent">
            Ranking de Clientes
          </h1>
          <p className="text-muted-foreground">
            Análise detalhada dos clientes e suas consultas
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtrar por Período</CardTitle>
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
                  <SelectItem value="yesterday">Ontem</SelectItem>
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Users className="h-4 w-4 mr-2 text-primary" />
              Total de Clientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredClients.length}</div>
            <p className="text-xs text-muted-foreground">
              Clientes únicos cadastrados
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-primary" />
              Total de Jogos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalGames}</div>
            <p className="text-xs text-muted-foreground">
              Consultas realizadas
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <DollarSign className="h-4 w-4 mr-2 text-primary" />
              Receita Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Faturamento acumulado
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
            <div className="text-2xl font-bold">R$ {avgTicket.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Por consulta
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Clients Table */}
      <Card className="shadow-card">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Ranking por Gasto Total</CardTitle>
              <CardDescription>
                Clientes ordenados por valor total gasto em consultas
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredClients.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm ? 'Nenhum cliente encontrado com esse nome' : 'Nenhum cliente cadastrado ainda'}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">#</TableHead>
                      <TableHead>Nome do Cliente</TableHead>
                      <TableHead className="text-center">Total de Jogos</TableHead>
                      <TableHead className="text-center">Gasto Total</TableHead>
                      <TableHead className="text-center">Frequência Média</TableHead>
                      <TableHead className="text-center">Último Jogo</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-center">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedClients.map((client, index) => {
                    const MS_PER_DAY = 1000 * 60 * 60 * 24
                    const now = new Date()
                    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
                    const lastGameStart = parseLocalDate(client.lastGame)
                    const daysDiff = Math.floor((todayStart.getTime() - lastGameStart.getTime()) / MS_PER_DAY)
                    
                    let statusColor = "default"
                    let statusText = "Ativo"
                    
                    if (daysDiff > 30) {
                      statusColor = "destructive"
                      statusText = "Inativo"
                    } else if (daysDiff > 14) {
                      statusColor = "secondary"
                      statusText = "Ausente"
                    }

                    return (
                      <TableRow key={client.id}>
                        <TableCell className="font-bold">{startIndex + index + 1}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-semibold">{client.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Ticket médio: R$ {(client.totalSpent / client.totalGames).toFixed(2)}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">{client.totalGames}</Badge>
                        </TableCell>
                        <TableCell className="text-center font-semibold text-accent">
                          R$ {client.totalSpent.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-center">
                          {formatFrequency(client.averageFrequency)}
                        </TableCell>
                        <TableCell className="text-center">
                          <div>
                            <p>{formatDate(client.lastGame)}</p>
                            <p className="text-xs text-muted-foreground">
                              {daysDiff === 0 ? 'Hoje' : daysDiff === 1 ? 'Ontem' : `${daysDiff} dias atrás`}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={statusColor as any}>
                            {statusText}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleClientClick(client)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  </TableBody>
                </Table>
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Mostrando {startIndex + 1} a {Math.min(endIndex, filteredClients.length)} de {filteredClients.length} clientes
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Anterior
                    </Button>
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          className="w-8 h-8 p-0"
                        >
                          {pageNum}
                        </Button>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                    >
                      Próximo
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Client Details Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Detalhes do Cliente: {selectedClient?.name}</span>
            </DialogTitle>
            <DialogDescription>
              Histórico completo de jogos e consultas realizadas
            </DialogDescription>
          </DialogHeader>
          
          {selectedClient && (
            <div className="space-y-6">
              {/* Client Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{selectedClient.totalGames}</div>
                      <div className="text-sm text-muted-foreground">Total de Jogos</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-accent">{formatCurrency(selectedClient.totalSpent)}</div>
                      <div className="text-sm text-muted-foreground">Gasto Total</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-brand-purple">{formatCurrency(selectedClient.totalSpent / selectedClient.totalGames)}</div>
                      <div className="text-sm text-muted-foreground">Ticket Médio</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-emerald-600">{formatFrequency(selectedClient.averageFrequency)}</div>
                      <div className="text-sm text-muted-foreground">Frequência</div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Games History */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Histórico de Jogos</CardTitle>
                  <CardDescription>Lista completa de consultas realizadas</CardDescription>
                </CardHeader>
                <CardContent>
                  {clientGames.length === 0 ? (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Nenhum jogo encontrado</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Data</TableHead>
                            <TableHead>Horário</TableHead>
                            <TableHead>Tipo de Jogo</TableHead>
                            <TableHead>Cartomante</TableHead>
                            <TableHead className="text-right">Valor</TableHead>
                            <TableHead>Campanha</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {clientGames.map((game) => (
                            <TableRow key={game.id}>
                              <TableCell>{formatDate(game.date)}</TableCell>
                              <TableCell>{game.paymentTime}</TableCell>
                              <TableCell>{game.gameType.name}</TableCell>
                              <TableCell>{game.cartomante.name}</TableCell>
                              <TableCell className="text-right font-semibold">{formatCurrency(game.value)}</TableCell>
                              <TableCell>
                                {game.campaign ? (
                                  <Badge variant="secondary">{game.campaign}</Badge>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Top Clients Summary */}
      {filteredClients.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Cliente VIP</CardTitle>
              <CardDescription>Maior gasto total</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="font-semibold text-primary">{filteredClients[0]?.name}</p>
                <p className="text-2xl font-bold text-accent">{formatCurrency(filteredClients[0]?.totalSpent || 0)}</p>
                <p className="text-sm text-muted-foreground">
                  {filteredClients[0]?.totalGames} consultas realizadas
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Mais Frequente</CardTitle>
              <CardDescription>Cliente com mais consultas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {(() => {
                  const mostFrequent = [...filteredClients].sort((a, b) => b.totalGames - a.totalGames)[0]
                  return (
                    <>
                      <p className="font-semibold text-primary">{mostFrequent?.name}</p>
                      <p className="text-2xl font-bold text-accent">{mostFrequent?.totalGames} jogos</p>
                      <p className="text-sm text-muted-foreground">
                        {formatFrequency(mostFrequent?.averageFrequency || 0)}
                      </p>
                    </>
                  )
                })()}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Maior Ticket</CardTitle>
              <CardDescription>Maior valor por consulta</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {(() => {
                  const highestTicket = [...filteredClients]
                    .sort((a, b) => (b.totalSpent / b.totalGames) - (a.totalSpent / a.totalGames))[0]
                  return (
                    <>
                      <p className="font-semibold text-primary">{highestTicket?.name}</p>
                      <p className="text-2xl font-bold text-accent">
                        {formatCurrency((highestTicket?.totalSpent || 0) / (highestTicket?.totalGames || 1))}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Ticket médio por consulta
                      </p>
                    </>
                  )
                })()}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

export default RankingClientes