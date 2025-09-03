import { useState } from 'react'
import { FileDown, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { gameStore } from '@/lib/gameStore'
import { CARTOMANTES } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export const PDFReport = () => {
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedCartomante, setSelectedCartomante] = useState<string>('all')
  const [generating, setGenerating] = useState(false)
  const { toast } = useToast()

  const generatePDF = async () => {
    setGenerating(true)
    
    try {
      // Get games data
      const allGames = gameStore.getGames()
      let filteredGames = allGames.filter(game => 
        game.status === 'Jogo finalizado' &&
        game.date >= startDate &&
        game.date <= endDate
      )

      if (selectedCartomante !== 'all') {
        filteredGames = filteredGames.filter(game => game.cartomante.id === selectedCartomante)
      }

      if (filteredGames.length === 0) {
        toast({
          title: "Nenhum dado encontrado",
          description: "Não há jogos finalizados no período selecionado.",
          variant: "destructive"
        })
        return
      }

      // Create PDF
      const pdf = new jsPDF()
      
      // Header
      pdf.setFontSize(20)
      pdf.text('Relatório de Jogos - Axe de Nessa', 20, 30)
      
      pdf.setFontSize(12)
      const cartomanteName = selectedCartomante === 'all' 
        ? 'Todas as Cartomantes' 
        : CARTOMANTES.find(c => c.id === selectedCartomante)?.name || 'N/A'
      
      pdf.text(`Período: ${startDate} até ${endDate}`, 20, 45)
      pdf.text(`Cartomante: ${cartomanteName}`, 20, 55)
      pdf.text(`Total de jogos: ${filteredGames.length}`, 20, 65)
      
      const totalRevenue = filteredGames.reduce((sum, game) => sum + game.value, 0)
      pdf.text(`Faturamento Total: R$ ${totalRevenue.toFixed(2)}`, 20, 75)

      // Games table
      const tableData = filteredGames.map(game => [
        game.date,
        game.clientName,
        game.gameType.name,
        game.cartomante.name,
        `R$ ${game.value.toFixed(2)}`,
        game.paymentTime,
        game.startTime ? new Date(game.startTime).toLocaleTimeString('pt-BR') : 'N/A',
        game.endTime ? new Date(game.endTime).toLocaleTimeString('pt-BR') : 'N/A',
        game.campaign || 'N/A'
      ])

      autoTable(pdf, {
        head: [['Data', 'Cliente', 'Tipo de Jogo', 'Cartomante', 'Valor', 'Pagamento', 'Início', 'Fim', 'Campanha']],
        body: tableData,
        startY: 90,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [154, 83, 244] }, // Purple color
      })

      // Summary by cartomante
      if (selectedCartomante === 'all') {
        const cartomanteData = CARTOMANTES.map(cartomante => {
          const cartomanteGames = filteredGames.filter(g => g.cartomante.id === cartomante.id)
          const revenue = cartomanteGames.reduce((sum, game) => sum + game.value, 0)
          return [
            cartomante.name,
            cartomanteGames.length.toString(),
            `R$ ${revenue.toFixed(2)}`,
            cartomante.priceMultiplier === 0.5 ? 'Afiliada (50%)' : 'Titular'
          ]
        })

        const finalY = (pdf as any).lastAutoTable.finalY || 90
        pdf.text('Resumo por Cartomante:', 20, finalY + 20)
        
        autoTable(pdf, {
          head: [['Cartomante', 'Jogos', 'Receita', 'Tipo']],
          body: cartomanteData,
          startY: finalY + 30,
          styles: { fontSize: 10 },
          headStyles: { fillColor: [154, 83, 244] },
        })
      }

      // Save PDF
      const fileName = `relatorio-jogos-${startDate}-${endDate}${selectedCartomante !== 'all' ? '-' + cartomanteName.replace(' ', '-') : ''}.pdf`
      pdf.save(fileName)

      toast({
        title: "PDF gerado com sucesso",
        description: `Relatório salvo como ${fileName}`,
      })

    } catch (error) {
      console.error('Error generating PDF:', error)
      toast({
        title: "Erro ao gerar PDF",
        description: "Ocorreu um erro ao gerar o relatório.",
        variant: "destructive"
      })
    } finally {
      setGenerating(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileDown className="h-5 w-5" />
          <span>Exportar Relatório PDF</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="start-date">Data Inicial</Label>
            <Input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="end-date">Data Final</Label>
            <Input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="cartomante">Cartomante</Label>
          <Select value={selectedCartomante} onValueChange={setSelectedCartomante}>
            <SelectTrigger>
              <SelectValue placeholder="Selecionar cartomante" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Cartomantes</SelectItem>
              {CARTOMANTES.map(cartomante => (
                <SelectItem key={cartomante.id} value={cartomante.id}>
                  <div className="flex items-center space-x-2">
                    <span>{cartomante.name}</span>
                    {cartomante.priceMultiplier === 0.5 && (
                      <Badge variant="secondary" className="text-xs">Afiliada</Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button 
          onClick={generatePDF} 
          disabled={generating || !startDate || !endDate}
          className="w-full"
        >
          <FileDown className="h-4 w-4 mr-2" />
          {generating ? 'Gerando PDF...' : 'Gerar Relatório PDF'}
        </Button>
      </CardContent>
    </Card>
  )
}