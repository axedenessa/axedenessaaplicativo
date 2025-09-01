export interface GameType {
  id: string
  name: string
  basePrice: number
  duration: number // in minutes
}

export interface Cartomante {
  id: string
  name: string
  priceMultiplier: number // 1.0 for full price, 0.5 for 50% discount
}

export interface Game {
  id: string
  clientName: string
  gameType: GameType
  cartomante: Cartomante
  value: number
  date: string
  paymentTime: string
  status: 'Na fila' | 'Apenas pago' | 'Em Jogo' | 'Jogo finalizado'
  campaign?: string
  conversationLink?: string
  startTime?: string
  endTime?: string
}

export interface Client {
  id: string
  name: string
  totalGames: number
  totalSpent: number
  gameDates: string[]
  averageFrequency: number
  lastGame: string
}

export interface FacebookCampaign {
  id: string
  name: string
  spend: number
  results: number
  reach: number
  impressions: number
  cpm: number
  cpc: number
  ctr: number
  date_start: string
  date_stop: string
}

export interface FinancialReport {
  totalRevenue: number
  revenueByCartomante: { [key: string]: number }
  revenueByGameType: { [key: string]: number }
  campaignROAS: { [campaignName: string]: { spend: number, revenue: number, roas: number } }
  period: string
}

export const GAME_TYPES: GameType[] = [
  { id: '1', name: '01 Pergunta Objetiva', basePrice: 10, duration: 10 },
  { id: '2', name: '03 Perguntas Objetivas', basePrice: 25, duration: 15 },
  { id: '3', name: 'Mandala Amorosa', basePrice: 30, duration: 15 },
  { id: '4', name: 'Espiada no Ex', basePrice: 40, duration: 20 },
  { id: '5', name: 'Jogo Completo - 30 Min', basePrice: 50, duration: 30 },
  { id: '6', name: 'Insisto ou desisto?', basePrice: 35, duration: 15 },
]

export const CARTOMANTES: Cartomante[] = [
  { id: '1', name: 'Vanessa Barreto', priceMultiplier: 1.0 },
  { id: '2', name: 'Alana Cerqueira', priceMultiplier: 0.5 },
]

export const GAME_STATUSES = [
  'Na fila',
  'Apenas pago', 
  'Em Jogo',
  'Jogo finalizado'
] as const