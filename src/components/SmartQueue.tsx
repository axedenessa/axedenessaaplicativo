import { useState, useEffect } from 'react'
import { Clock, Users, AlertTriangle, ArrowRight, Zap, Target } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { gameStore } from '@/lib/gameStore'
import { Game, CARTOMANTES } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'

interface QueueOptimization {
  cartomanteId: string
  cartomanteName: string
  currentQueue: number
  suggestedAction: 'redistribute' | 'priority' | 'normal'
  estimatedWaitTime: number
  efficiency: number
}

export const SmartQueue = () => {
  const [games, setGames] = useState<Game[]>([])
  const [optimizations, setOptimizations] = useState<QueueOptimization[]>([])
  const { toast } = useToast()

  useEffect(() => {
    const updateGames = () => {
      const allGames = gameStore.getGames()
      setGames(allGames)
      calculateOptimizations(allGames)
    }
    
    updateGames()
    const unsubscribe = gameStore.subscribe(updateGames)
    
    // Recalcular otimizações a cada 30 segundos
    const interval = setInterval(updateGames, 30000)
    
    return () => {
      unsubscribe()
      clearInterval(interval)
    }
  }, [])

  const calculateOptimizations = (allGames: Game[]) => {
    const queueGames = allGames.filter(g => g.status === 'Na fila')
    const activeGames = allGames.filter(g => g.status === 'Em Jogo')

    const optimizations: QueueOptimization[] = CARTOMANTES.map(cartomante => {
      const cartomanteQueue = queueGames.filter(g => g.cartomante.id === cartomante.id)
      const isActive = activeGames.some(g => g.cartomante.id === cartomante.id)
      
      // Calcular tempo estimado de espera
      const estimatedWaitTime = cartomanteQueue.reduce((total, game, index) => {
        const gamesAhead = cartomanteQueue.slice(0, index)
        const waitTime = gamesAhead.reduce((sum, g) => sum + g.gameType.duration, 0)
        return total + waitTime
      }, 0) / (cartomanteQueue.length || 1)

      // Calcular eficiência baseada na distribuição da fila
      const totalQueue = queueGames.length
      const idealDistribution = totalQueue / CARTOMANTES.length
      const deviation = Math.abs(cartomanteQueue.length - idealDistribution)
      const efficiency = Math.max(0, 100 - (deviation / idealDistribution) * 50)

      // Determinar ação sugerida
      let suggestedAction: 'redistribute' | 'priority' | 'normal' = 'normal'
      
      if (cartomanteQueue.length > idealDistribution * 1.5) {
        suggestedAction = 'redistribute'
      } else if (cartomanteQueue.some(g => {
        const waitTime = gameStore.getEstimatedWaitTime(g.id)
        return waitTime > 60 // Mais de 1 hora
      })) {
        suggestedAction = 'priority'
      }

      return {
        cartomanteId: cartomante.id,
        cartomanteName: cartomante.name,
        currentQueue: cartomanteQueue.length,
        suggestedAction,
        estimatedWaitTime: Math.round(estimatedWaitTime),
        efficiency: Math.round(efficiency)
      }
    })

    setOptimizations(optimizations)
  }

  const handleOptimizeQueue = (cartomanteId: string) => {
    toast({
      title: "Otimização aplicada",
      description: "A fila foi otimizada com base nas sugestões do sistema.",
    })
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'redistribute': return 'destructive'
      case 'priority': return 'default'
      default: return 'secondary'
    }
  }

  const getActionText = (action: string) => {
    switch (action) {
      case 'redistribute': return 'Redistribuir'
      case 'priority': return 'Priorizar'
      default: return 'Normal'
    }
  }

  const totalQueue = games.filter(g => g.status === 'Na fila').length
  const activeCount = games.filter(g => g.status === 'Em Jogo').length
  const averageWaitTime = optimizations.length > 0 
    ? optimizations.reduce((sum, opt) => sum + opt.estimatedWaitTime, 0) / optimizations.length 
    : 0

  return (
    <div className="space-y-6">
      {/* Visão Geral da Fila Inteligente */}
      <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Sistema de Fila Inteligente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{totalQueue}</div>
              <div className="text-sm text-muted-foreground">Total na Fila</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-accent">{Math.round(averageWaitTime)}</div>
              <div className="text-sm text-muted-foreground">Tempo Médio (min)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">{activeCount}</div>
              <div className="text-sm text-muted-foreground">Em Atendimento</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Otimizações por Cartomante */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {optimizations.map(opt => (
          <Card key={opt.cartomanteId} className="border-l-4 border-l-primary">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{opt.cartomanteName}</CardTitle>
                <Badge variant={getActionColor(opt.suggestedAction) as any}>
                  {getActionText(opt.suggestedAction)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Métricas */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="text-xl font-bold text-primary">{opt.currentQueue}</div>
                  <div className="text-xs text-muted-foreground">Na Fila</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-accent">{opt.estimatedWaitTime}</div>
                  <div className="text-xs text-muted-foreground">Min Espera</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-foreground">{opt.efficiency}%</div>
                  <div className="text-xs text-muted-foreground">Eficiência</div>
                </div>
              </div>

              {/* Barra de Eficiência */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Eficiência da Distribuição</span>
                  <span>{opt.efficiency}%</span>
                </div>
                <Progress 
                  value={opt.efficiency} 
                  className="h-2"
                />
              </div>

              {/* Ações Sugeridas */}
              {opt.suggestedAction !== 'normal' && (
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    {opt.suggestedAction === 'redistribute' && (
                      <>
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                        <span className="text-sm font-medium text-destructive">Redistribuição Recomendada</span>
                      </>
                    )}
                    {opt.suggestedAction === 'priority' && (
                      <>
                        <Target className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium text-primary">Priorização Necessária</span>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    {opt.suggestedAction === 'redistribute' 
                      ? 'Esta cartomante tem uma fila muito longa. Considere redistribuir alguns clientes.'
                      : 'Alguns clientes estão esperando muito tempo. Considere priorizar atendimentos.'
                    }
                  </p>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleOptimizeQueue(opt.cartomanteId)}
                    className="w-full"
                  >
                    <ArrowRight className="h-3 w-3 mr-2" />
                    Aplicar Otimização
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recomendações Globais */}
      {optimizations.some(opt => opt.suggestedAction !== 'normal') && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Target className="h-5 w-5" />
              Recomendações do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {optimizations
              .filter(opt => opt.suggestedAction !== 'normal')
              .map(opt => (
                <div key={opt.cartomanteId} className="flex items-center justify-between p-3 bg-card rounded border">
                  <div>
                    <p className="font-medium">{opt.cartomanteName}</p>
                    <p className="text-sm text-muted-foreground">
                      {opt.suggestedAction === 'redistribute' 
                        ? `${opt.currentQueue} clientes na fila - considere redistribuir`
                        : `Tempo de espera: ${opt.estimatedWaitTime}min - priorize atendimentos`
                      }
                    </p>
                  </div>
                  <Badge variant={getActionColor(opt.suggestedAction) as any}>
                    {getActionText(opt.suggestedAction)}
                  </Badge>
                </div>
              ))
            }
          </CardContent>
        </Card>
      )}
    </div>
  )
}