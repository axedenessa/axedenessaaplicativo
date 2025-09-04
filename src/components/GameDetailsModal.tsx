import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar, DollarSign, Clock } from 'lucide-react'
import { Game } from '@/lib/types'
import { formatDateBR, formatTimeBR } from '@/utils/timezone'

interface GameDetailsModalProps {
  cartomanteName: string
  games: Game[]
  isOpen: boolean
  onClose: () => void
}

export const GameDetailsModal = ({ cartomanteName, games, isOpen, onClose }: GameDetailsModalProps) => {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [period, setPeriod] = useState('all')

  // Set default dates based on period
  const handlePeriodChange = (value: string) => {
    setPeriod(value)
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]
    
    switch (value) {
      case 'today':
        setStartDate(todayStr)
        setEndDate(todayStr)
        break
      case 'yesterday':
        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
        const yesterdayStr = yesterday.toISOString().split('T')[0]
        setStartDate(yesterdayStr)
        setEndDate(yesterdayStr)
        break
      case 'week':
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
        setStartDate(weekAgo.toISOString().split('T')[0])
        setEndDate(todayStr)
        break
      case 'all':
        setStartDate('')
        setEndDate('')
        break
    }
  }

  const filteredGames = games.filter(game => {
    if (game.cartomante.name !== cartomanteName) return false
    if (game.status !== 'Jogo finalizado') return false
    
    if (startDate && game.date < startDate) return false
    if (endDate && game.date > endDate) return false
    
    return true
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const totalRevenue = filteredGames.reduce((sum, game) => sum + game.value, 0)
  const totalGames = filteredGames.length

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <span>Jogos de {cartomanteName}</span>
          </DialogTitle>
        </DialogHeader>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filtrar por Período</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Período</Label>
                <Select value={period} onValueChange={handlePeriodChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Hoje</SelectItem>
                    <SelectItem value="yesterday">Ontem</SelectItem>
                    <SelectItem value="week">Últimos 7 dias</SelectItem>
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

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                Período selecionado
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
              <div className="text-2xl font-bold text-accent">
                {formatCurrency(totalRevenue)}
              </div>
              <p className="text-xs text-muted-foreground">
                Faturamento bruto
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Clock className="h-4 w-4 mr-2 text-primary" />
                Ticket Médio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {formatCurrency(totalGames > 0 ? totalRevenue / totalGames : 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Por jogo
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Games Table */}
        <Card>
          <CardHeader>
            <CardTitle>Detalhes dos Jogos</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredGames.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum jogo encontrado no período selecionado
              </div>
            ) : (
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
                    {filteredGames.map((game) => (
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
              </div>
            )}
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  )
}