import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { gameStore } from "@/lib/gameStore"
import { GAME_TYPES, CARTOMANTES, GAME_STATUSES } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { UserPlus } from "lucide-react"
import { formatInTimeZone } from 'date-fns-tz/formatInTimeZone'

const NovoJogo = () => {
  const navigate = useNavigate()
  const { toast } = useToast()
  
  const [formData, setFormData] = useState({
    clientName: '',
    gameTypeId: '',
    cartomanteId: '',
    date: formatInTimeZone(new Date(), 'America/Sao_Paulo', 'yyyy-MM-dd'),
    paymentTime: formatInTimeZone(new Date(), 'America/Sao_Paulo', 'HH:mm'),
    status: 'Na fila' as const,
    campaign: '',
    conversationLink: ''
  })

  const selectedGameType = GAME_TYPES.find(gt => gt.id === formData.gameTypeId)
  const selectedCartomante = CARTOMANTES.find(c => c.id === formData.cartomanteId)
  
  const calculatedValue = selectedGameType 
    ? selectedGameType.basePrice
    : 0

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.clientName || !formData.gameTypeId || !formData.cartomanteId) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive"
      })
      return
    }

    const gameType = GAME_TYPES.find(gt => gt.id === formData.gameTypeId)!
    const cartomante = CARTOMANTES.find(c => c.id === formData.cartomanteId)!
    
    gameStore.addGame({
      clientName: formData.clientName,
      gameType,
      cartomante,
      value: calculatedValue,
      date: formData.date,
      paymentTime: formData.paymentTime,
      status: formData.status,
      campaign: formData.campaign || undefined,
      conversationLink: formData.conversationLink || undefined
    })

    toast({
      title: "Jogo cadastrado",
      description: `${formData.clientName} foi adicionado à fila com sucesso.`,
    })

    // Reset form
    setFormData({
      clientName: '',
      gameTypeId: '',
      cartomanteId: '',
      date: formatInTimeZone(new Date(), 'America/Sao_Paulo', 'yyyy-MM-dd'),
      paymentTime: formatInTimeZone(new Date(), 'America/Sao_Paulo', 'HH:mm'),
      status: 'Na fila',
      campaign: '',
      conversationLink: ''
    })

    // Navigate back to dashboard
    navigate('/')
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center space-x-3">
        <UserPlus className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold gradient-brand bg-clip-text text-transparent">
            Novo Jogo
          </h1>
          <p className="text-muted-foreground">
            Cadastre um novo cliente na fila de atendimento
          </p>
        </div>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Informações do Cliente</CardTitle>
          <CardDescription>
            Preencha os dados do cliente e do jogo solicitado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clientName">Nome do Cliente *</Label>
                <Input
                  id="clientName"
                  placeholder="Digite o nome do cliente"
                  value={formData.clientName}
                  onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gameType">Tipo de Jogo *</Label>
                <Select value={formData.gameTypeId} onValueChange={(value) => setFormData(prev => ({ ...prev, gameTypeId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o jogo" />
                  </SelectTrigger>
                  <SelectContent>
                    {GAME_TYPES.map(gameType => (
                      <SelectItem key={gameType.id} value={gameType.id}>
                        {gameType.name} - R$ {gameType.basePrice.toFixed(2)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cartomante">Cartomante *</Label>
                <Select value={formData.cartomanteId} onValueChange={(value) => setFormData(prev => ({ ...prev, cartomanteId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a cartomante" />
                  </SelectTrigger>
                  <SelectContent>
                    {CARTOMANTES.map(cartomante => (
                      <SelectItem key={cartomante.id} value={cartomante.id}>
                        {cartomante.name} {cartomante.priceMultiplier === 0.5 && "(50% desconto)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="value">Valor Calculado</Label>
                <Input
                  id="value"
                  value={`R$ ${calculatedValue.toFixed(2)}`}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Data</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentTime">Horário do Pagamento</Label>
                <Input
                  id="paymentTime"
                  type="time"
                  value={formData.paymentTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, paymentTime: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GAME_STATUSES.map(status => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="campaign">Campanha (Opcional)</Label>
                <Input
                  id="campaign"
                  placeholder="Ex: Campanha Storie 25-08"
                  value={formData.campaign}
                  onChange={(e) => setFormData(prev => ({ ...prev, campaign: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="conversationLink">Link da Conversa (Opcional)</Label>
              <Input
                id="conversationLink"
                type="url"
                placeholder="https://wa.me/..."
                value={formData.conversationLink}
                onChange={(e) => setFormData(prev => ({ ...prev, conversationLink: e.target.value }))}
              />
            </div>

            <div className="flex space-x-4">
              <Button 
                type="submit" 
                className="flex-1 gradient-brand text-white border-0"
                disabled={!formData.clientName || !formData.gameTypeId || !formData.cartomanteId}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Cadastrar Jogo
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate('/')}
                className="px-8"
              >
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Price Information Card */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-lg">Tabela de Preços</CardTitle>
          <CardDescription>O cliente sempre paga o valor integral. O desconto é apenas na comissão que a cartomante recebe.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Valores que o Cliente Paga</h4>
              <div className="space-y-1 text-sm">
                {GAME_TYPES.map(gameType => (
                  <div key={gameType.id} className="flex justify-between">
                    <span>{gameType.name}</span>
                    <span>R$ {gameType.basePrice.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-muted p-3 rounded-lg">
              <h4 className="font-semibold mb-2 text-sm">Comissão das Cartomantes</h4>
              <div className="space-y-1 text-xs text-muted-foreground">
                <div>• Vanessa Barreto: 100% do valor</div>
                <div>• Alana Cerqueira: 50% do valor</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default NovoJogo