import { useState } from 'react'
import { ArrowUp, ArrowDown, Play, CheckCircle, MoreHorizontal, Undo2, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { Game } from '@/lib/types'
import { gameStore } from '@/lib/gameStore'
import { useToast } from '@/hooks/use-toast'

interface QueueManagerProps {
  games: Game[]
  onUpdate: () => void
}

export const QueueManager = ({ games, onUpdate }: QueueManagerProps) => {
  const [processing, setProcessing] = useState<string | null>(null)
  const { toast } = useToast()

  const queueGames = games
    .filter(game => game.status === 'Na fila')
    .sort((a, b) => {
      // Sort by queue_position if available, otherwise by payment time
      if (a.queue_position && b.queue_position) {
        return a.queue_position - b.queue_position
      }
      return new Date(`${a.date} ${a.paymentTime}`).getTime() - new Date(`${b.date} ${b.paymentTime}`).getTime()
    })

  const moveInQueue = async (gameId: string, direction: 'up' | 'down') => {
    setProcessing(gameId)
    try {
      const currentIndex = queueGames.findIndex(g => g.id === gameId)
      const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
      
      if (targetIndex < 0 || targetIndex >= queueGames.length) {
        toast({
          title: "Movimento inválido",
          description: "Não é possível mover para essa posição.",
          variant: "destructive"
        })
        return
      }

      const currentGame = queueGames[currentIndex]
      const targetGame = queueGames[targetIndex]

      // Swap queue positions
      await gameStore.updateGame(currentGame.id, { queue_position: targetGame.queue_position || targetIndex + 1 })
      await gameStore.updateGame(targetGame.id, { queue_position: currentGame.queue_position || currentIndex + 1 })

      toast({
        title: "Posição alterada",
        description: `${currentGame.clientName} foi movido na fila.`,
      })
      onUpdate()
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível alterar a posição na fila.",
        variant: "destructive"
      })
    } finally {
      setProcessing(null)
    }
  }

  const startGame = async (gameId: string) => {
    setProcessing(gameId)
    try {
      await gameStore.startGame(gameId)
      const game = games.find(g => g.id === gameId)
      toast({
        title: "Jogo iniciado",
        description: `${game?.clientName} está sendo atendido agora.`,
      })
      onUpdate()
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível iniciar o jogo.",
        variant: "destructive"
      })
    } finally {
      setProcessing(null)
    }
  }

  const finishGame = async (gameId: string) => {
    setProcessing(gameId)
    try {
      await gameStore.finishGame(gameId)
      const game = games.find(g => g.id === gameId)
      toast({
        title: "Jogo finalizado",
        description: `Jogo de ${game?.clientName} foi concluído.`,
      })
      onUpdate()
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível finalizar o jogo.",
        variant: "destructive"
      })
    } finally {
      setProcessing(null)
    }
  }

  const revertGame = async (gameId: string) => {
    setProcessing(gameId)
    try {
      await gameStore.updateGame(gameId, {
        status: 'Em Jogo',
        endTime: undefined
      })
      const game = games.find(g => g.id === gameId)
      toast({
        title: "Jogo revertido",
        description: `Jogo de ${game?.clientName} voltou para 'Em Jogo'.`,
      })
      onUpdate()
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível reverter o jogo.",
        variant: "destructive"
      })
    } finally {
      setProcessing(null)
    }
  }

  // Include all games for management (queue, active, finished)
  const allGames = games.filter(game => 
    game.status === 'Na fila' || 
    game.status === 'Em Jogo' || 
    game.status === 'Jogo finalizado'
  ).sort((a, b) => {
    // Sort by status priority and then by time
    const statusOrder = { 'Em Jogo': 0, 'Na fila': 1, 'Jogo finalizado': 2 }
    const aOrder = statusOrder[a.status as keyof typeof statusOrder]
    const bOrder = statusOrder[b.status as keyof typeof statusOrder]
    
    if (aOrder !== bOrder) return aOrder - bOrder
    
    return new Date(`${a.date} ${a.paymentTime}`).getTime() - new Date(`${b.date} ${b.paymentTime}`).getTime()
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciar Fila de Atendimento</CardTitle>
      </CardHeader>
      <CardContent>
        {allGames.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Nenhum jogo encontrado
          </p>
        ) : (
          <div className="space-y-2">
            {allGames.map((game, index) => (
              <div 
                key={game.id} 
                className="flex items-center justify-between p-3 bg-muted rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    {game.status === 'Na fila' && (
                      <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">
                        {queueGames.findIndex(q => q.id === game.id) + 1}
                      </Badge>
                    )}
                    <Badge variant={
                      game.status === 'Em Jogo' ? 'default' : 
                      game.status === 'Na fila' ? 'secondary' : 
                      'outline'
                    }>
                      {game.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="font-medium">{game.clientName}</p>
                    <p className="text-sm text-muted-foreground">
                      {game.gameType.name} • {game.cartomante.name}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {game.status === 'Na fila' && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => moveInQueue(game.id, 'up')}
                        disabled={queueGames.findIndex(q => q.id === game.id) === 0 || processing === game.id}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => moveInQueue(game.id, 'down')}
                        disabled={queueGames.findIndex(q => q.id === game.id) === queueGames.length - 1 || processing === game.id}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => startGame(game.id)}
                        disabled={processing === game.id}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Iniciar
                      </Button>
                    </>
                  )}
                  
                  {game.status === 'Em Jogo' && (
                    <div className="flex gap-1">
                      <Button
                        onClick={() => finishGame(game.id)}
                        size="sm"
                        variant="outline"
                        disabled={processing === game.id}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Finalizar
                      </Button>
                      {game.conversationLink && (
                        <Button
                          onClick={() => window.open(game.conversationLink, '_blank')}
                          size="sm"
                          variant="outline"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  )}
                  
                  {game.status === 'Jogo finalizado' && (
                    <Button
                      onClick={() => revertGame(game.id)}
                      size="sm"
                      variant="outline"
                      disabled={processing === game.id}
                    >
                      <Undo2 className="h-4 w-4 mr-2" />
                      Reverter
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}