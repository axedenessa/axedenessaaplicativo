import { Game, Client, CARTOMANTES, GAME_TYPES } from './types'
import { supabase } from '@/integrations/supabase/client'

class GameStore {
  private games: Game[] = []
  private listeners: (() => void)[] = []

  constructor() {
    this.loadFromSupabase()
  }

  private async loadFromSupabase() {
    try {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      // Map database enum values back to display values
      const gameTypeReverseMap: { [key: string]: string } = {
        'pergunta_objetiva': '01 Pergunta Objetiva',
        'tres_perguntas': '03 Perguntas Objetivas',
        'mandala_amorosa': 'Mandala Amorosa',
        'espiada_ex': 'Espiada no Ex',
        'jogo_completo': 'Jogo Completo - 30 Min',
        'insisto_desisto': 'Insisto ou desisto?'
      }
      
      const cartomanteReverseMap: { [key: string]: string } = {
        'vanessa_barreto': 'Vanessa Barreto',
        'alana_cerqueira': 'Alana Cerqueira'
      }
      
      const statusReverseMap: { [key: string]: string } = {
        'na_fila': 'Na fila',
        'apenas_pago': 'Apenas pago',
        'em_jogo': 'Em Jogo',
        'jogo_finalizado': 'Jogo finalizado'
      }
      
      this.games = data?.map(game => ({
        id: game.id,
        clientName: game.client_name,
        gameType: GAME_TYPES.find(type => type.name === gameTypeReverseMap[game.game_type]) || GAME_TYPES[0],
        cartomante: CARTOMANTES.find(c => c.name === cartomanteReverseMap[game.cartomante]) || CARTOMANTES[0],
        value: Number(game.value),
        date: game.game_date,
        paymentTime: game.payment_time,
        status: statusReverseMap[game.status] as Game['status'],
        campaign: game.campaign,
        conversationLink: game.conversation_link,
        startTime: game.started_at,
        endTime: game.finished_at
      })) || []
      
      this.notifyListeners()
    } catch (error) {
      console.error('Error loading games from Supabase:', error)
    }
  }

  private async saveToSupabase(game: Game) {
    try {
      // Map game types to database enum values
      const gameTypeMap: { [key: string]: string } = {
        '01 Pergunta Objetiva': 'pergunta_objetiva',
        '03 Perguntas Objetivas': 'tres_perguntas',
        'Mandala Amorosa': 'mandala_amorosa',
        'Espiada no Ex': 'espiada_ex',
        'Jogo Completo - 30 Min': 'jogo_completo',
        'Insisto ou desisto?': 'insisto_desisto'
      }
      
      // Map cartomante names to database enum values
      const cartomanteMap: { [key: string]: string } = {
        'Vanessa Barreto': 'vanessa_barreto',
        'Alana Cerqueira': 'alana_cerqueira'
      }
      
      // Map status to database enum values
      const statusMap: { [key: string]: string } = {
        'Na fila': 'na_fila',
        'Apenas pago': 'apenas_pago',
        'Em Jogo': 'em_jogo',
        'Jogo finalizado': 'jogo_finalizado'
      }

      const gameData = {
        id: game.id,
        client_name: game.clientName,
        game_type: gameTypeMap[game.gameType.name] as any,
        cartomante: cartomanteMap[game.cartomante.name] as any,
        value: game.value,
        game_date: game.date,
        payment_time: game.paymentTime,
        status: statusMap[game.status] as any,
        campaign: game.campaign,
        conversation_link: game.conversationLink,
        started_at: game.startTime,
        finished_at: game.endTime,
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('games')
        .upsert(gameData)
      
      if (error) throw error
    } catch (error) {
      console.error('Error saving game to Supabase:', error)
    }
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener())
  }

  subscribe(listener: () => void) {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  async addGame(game: Omit<Game, 'id'>) {
    const newGame: Game = {
      ...game,
      id: crypto.randomUUID(),
    }
    this.games.push(newGame)
    await this.saveToSupabase(newGame)
    this.notifyListeners()
    return newGame
  }

  async updateGame(id: string, updates: Partial<Game>) {
    const index = this.games.findIndex(g => g.id === id)
    if (index !== -1) {
      this.games[index] = { ...this.games[index], ...updates }
      await this.saveToSupabase(this.games[index])
      this.notifyListeners()
    }
  }

  getGames() {
    return [...this.games]
  }

  getGamesByStatus(status: Game['status']) {
    return this.games.filter(game => game.status === status)
  }

  getGamesByDate(date: string) {
    return this.games.filter(game => game.date === date)
  }

  getQueuePosition(gameId: string) {
    const queueGames = this.getGamesByStatus('Na fila')
      .sort((a, b) => new Date(`${a.date} ${a.paymentTime}`).getTime() - new Date(`${b.date} ${b.paymentTime}`).getTime())
    
    return queueGames.findIndex(game => game.id === gameId) + 1
  }

  getEstimatedWaitTime(gameId: string) {
    const queueGames = this.getGamesByStatus('Na fila')
      .sort((a, b) => new Date(`${a.date} ${a.paymentTime}`).getTime() - new Date(`${b.date} ${b.paymentTime}`).getTime())
    
    const gameIndex = queueGames.findIndex(game => game.id === gameId)
    if (gameIndex === -1) return 0

    // Calculate total duration of games ahead in queue
    let totalMinutes = 0
    for (let i = 0; i < gameIndex; i++) {
      totalMinutes += queueGames[i].gameType.duration
    }

    return totalMinutes
  }

  getNextClientForCartomante(cartomanteId: string) {
    const queueGames = this.getGamesByStatus('Na fila')
      .sort((a, b) => new Date(`${a.date} ${a.paymentTime}`).getTime() - new Date(`${b.date} ${b.paymentTime}`).getTime())
    
    return queueGames.find(game => game.cartomante.id === cartomanteId)
  }

  getActiveGameForCartomante(cartomanteId: string) {
    return this.games.find(game => 
      game.cartomante.id === cartomanteId && game.status === 'Em Jogo'
    )
  }

  startGame(gameId: string) {
    this.updateGame(gameId, {
      status: 'Em Jogo',
      startTime: new Date().toISOString()
    })
  }

  finishGame(gameId: string) {
    this.updateGame(gameId, {
      status: 'Jogo finalizado',
      endTime: new Date().toISOString()
    })
  }

  getClientStats(): Client[] {
    const clientMap = new Map<string, Client>()

    this.games.forEach(game => {
      const clientName = game.clientName.toLowerCase()
      
      if (!clientMap.has(clientName)) {
        clientMap.set(clientName, {
          id: clientName,
          name: game.clientName,
          totalGames: 0,
          totalSpent: 0,
          gameDates: [],
          averageFrequency: 0,
          lastGame: ''
        })
      }

      const client = clientMap.get(clientName)!
      client.totalGames++
      client.totalSpent += game.value
      client.gameDates.push(game.date)
      client.lastGame = game.date
    })

    // Calculate average frequency
    clientMap.forEach(client => {
      if (client.gameDates.length > 1) {
        const dates = client.gameDates.sort()
        const daysBetweenGames = []
        
        for (let i = 1; i < dates.length; i++) {
          const diff = new Date(dates[i]).getTime() - new Date(dates[i-1]).getTime()
          daysBetweenGames.push(diff / (1000 * 60 * 60 * 24))
        }
        
        client.averageFrequency = daysBetweenGames.reduce((a, b) => a + b, 0) / daysBetweenGames.length
      }
    })

    return Array.from(clientMap.values()).sort((a, b) => b.totalSpent - a.totalSpent)
  }

  getFinancialData(startDate?: string, endDate?: string) {
    let filteredGames = this.games.filter(game => game.status === 'Jogo finalizado')
    
    if (startDate) {
      filteredGames = filteredGames.filter(game => game.date >= startDate)
    }
    if (endDate) {
      filteredGames = filteredGames.filter(game => game.date <= endDate)
    }

    const totalRevenue = filteredGames.reduce((sum, game) => sum + game.value, 0)
    
    const revenueByCartomante: { [key: string]: number } = {}
    const revenueByGameType: { [key: string]: number } = {}
    
    filteredGames.forEach(game => {
      revenueByCartomante[game.cartomante.name] = (revenueByCartomante[game.cartomante.name] || 0) + game.value
      revenueByGameType[game.gameType.name] = (revenueByGameType[game.gameType.name] || 0) + game.value
    })

    return {
      totalRevenue,
      revenueByCartomante,
      revenueByGameType,
      totalGames: filteredGames.length,
      averageTicket: totalRevenue / (filteredGames.length || 1)
    }
  }
}

export const gameStore = new GameStore()