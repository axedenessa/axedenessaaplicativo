import { Game, Client, CARTOMANTES, GAME_TYPES } from './types'

class GameStore {
  private games: Game[] = []
  private listeners: (() => void)[] = []

  constructor() {
    // Load from localStorage
    const saved = localStorage.getItem('axe-de-nessa-games')
    if (saved) {
      this.games = JSON.parse(saved)
    }
  }

  private save() {
    localStorage.setItem('axe-de-nessa-games', JSON.stringify(this.games))
    this.listeners.forEach(listener => listener())
  }

  subscribe(listener: () => void) {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  addGame(game: Omit<Game, 'id'>) {
    const newGame: Game = {
      ...game,
      id: Date.now().toString(),
    }
    this.games.push(newGame)
    this.save()
    return newGame
  }

  updateGame(id: string, updates: Partial<Game>) {
    const index = this.games.findIndex(g => g.id === id)
    if (index !== -1) {
      this.games[index] = { ...this.games[index], ...updates }
      this.save()
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