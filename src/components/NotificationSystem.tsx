import { useState, useEffect, useCallback } from 'react'
import { Bell, Volume2, VolumeX, Clock, CheckCircle2, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { gameStore } from '@/lib/gameStore'
import { Game } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'

interface Notification {
  id: string
  type: 'queue_update' | 'game_started' | 'game_finished' | 'wait_time_alert'
  title: string
  message: string
  timestamp: Date
  priority: 'high' | 'medium' | 'low'
}

export const NotificationSystem = () => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [isVisible, setIsVisible] = useState(false)
  const [games, setGames] = useState<Game[]>([])
  const { toast } = useToast()

  // Atualizar jogos em tempo real
  useEffect(() => {
    const updateGames = () => setGames(gameStore.getGames())
    updateGames()
    
    const unsubscribe = gameStore.subscribe(updateGames)
    return unsubscribe
  }, [])

  // Função para reproduzir som
  const playNotificationSound = useCallback((priority: 'high' | 'medium' | 'low') => {
    if (!soundEnabled) return

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    // Sons diferentes para prioridades diferentes
    const frequencies = {
      high: [800, 1000, 800], // Som de urgência
      medium: [600, 700], // Som moderado
      low: [400, 500] // Som suave
    }

    const freqs = frequencies[priority]
    let currentFreq = 0

    const playTone = () => {
      if (currentFreq < freqs.length) {
        oscillator.frequency.setValueAtTime(freqs[currentFreq], audioContext.currentTime)
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3)
        
        setTimeout(() => {
          currentFreq++
          if (currentFreq < freqs.length) {
            playTone()
          }
        }, 300)
      }
    }

    oscillator.start()
    playTone()
    
    setTimeout(() => {
      oscillator.stop()
    }, freqs.length * 300)
  }, [soundEnabled])

  // Adicionar notificação
  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date()
    }

    setNotifications(prev => [newNotification, ...prev.slice(0, 9)]) // Manter apenas 10 notificações
    playNotificationSound(notification.priority)

    // Mostrar toast para notificações de alta prioridade
    if (notification.priority === 'high') {
      toast({
        title: notification.title,
        description: notification.message,
        duration: 5000,
      })
    }
  }, [playNotificationSound, toast])

  // Monitor de mudanças na fila
  useEffect(() => {
    const queueGames = games.filter(g => g.status === 'Na fila')
    const activeGames = games.filter(g => g.status === 'Em Jogo')
    const finishedToday = games.filter(g => 
      g.status === 'Jogo finalizado' && 
      g.date === new Date().toISOString().split('T')[0]
    )

    // Notificações de fila longa
    if (queueGames.length >= 5) {
      addNotification({
        type: 'queue_update',
        title: 'Fila Longa',
        message: `${queueGames.length} clientes aguardando atendimento`,
        priority: 'high'
      })
    }

    // Notificações de tempo de espera alto
    queueGames.forEach(game => {
      const waitTime = gameStore.getEstimatedWaitTime(game.id)
      if (waitTime > 60) { // Mais de 1 hora
        addNotification({
          type: 'wait_time_alert',
          title: 'Tempo de Espera Alto',
          message: `${game.clientName} aguarda há mais de 1 hora`,
          priority: 'high'
        })
      }
    })

  }, [games, addNotification])

  // Auto-remover notificações antigas
  useEffect(() => {
    const interval = setInterval(() => {
      setNotifications(prev => 
        prev.filter(n => Date.now() - n.timestamp.getTime() < 10 * 60 * 1000) // Remover após 10 minutos
      )
    }, 60000) // Verificar a cada minuto

    return () => clearInterval(interval)
  }, [])

  const unreadCount = notifications.length

  return (
    <div className="relative">
      {/* Botão de notificações */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsVisible(!isVisible)}
        className="relative"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Painel de notificações */}
      {isVisible && (
        <Card className="absolute right-0 top-12 w-80 z-50 shadow-lg border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Notificações</CardTitle>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={soundEnabled}
                  onCheckedChange={setSoundEnabled}
                />
                {soundEnabled ? (
                  <Volume2 className="h-4 w-4 text-primary" />
                ) : (
                  <VolumeX className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                <Bell className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">Nenhuma notificação</p>
              </div>
            ) : (
              notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg border ${
                    notification.priority === 'high' 
                      ? 'bg-destructive/10 border-destructive/20' 
                      : notification.priority === 'medium'
                      ? 'bg-primary/10 border-primary/20'
                      : 'bg-muted border-border'
                  }`}
                >
                  <div className="flex items-start space-x-2">
                    {notification.type === 'queue_update' && <Users className="h-4 w-4 mt-0.5 text-primary" />}
                    {notification.type === 'game_started' && <Clock className="h-4 w-4 mt-0.5 text-primary" />}
                    {notification.type === 'game_finished' && <CheckCircle2 className="h-4 w-4 mt-0.5 text-accent" />}
                    {notification.type === 'wait_time_alert' && <Clock className="h-4 w-4 mt-0.5 text-destructive" />}
                    <div className="flex-1">
                      <p className="text-sm font-medium">{notification.title}</p>
                      <p className="text-xs text-muted-foreground">{notification.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {notification.timestamp.toLocaleTimeString('pt-BR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}