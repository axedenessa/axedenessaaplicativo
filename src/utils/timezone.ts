import { toZonedTime, fromZonedTime, formatInTimeZone } from 'date-fns-tz'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const TIMEZONE = 'America/Sao_Paulo'

export const formatDateTimeBR = (date: Date | string, formatStr: string = 'dd/MM/yyyy HH:mm'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return formatInTimeZone(dateObj, TIMEZONE, formatStr, { locale: ptBR })
}

export const formatTimeBR = (date: Date | string): string => {
  return formatDateTimeBR(date, 'HH:mm')
}

export const formatDateBR = (date: Date | string): string => {
  return formatDateTimeBR(date, 'dd/MM/yyyy')
}

export const getCurrentTimeBR = (): Date => {
  return toZonedTime(new Date(), TIMEZONE)
}

export const convertToUTC = (date: Date): Date => {
  return fromZonedTime(date, TIMEZONE)
}

export const convertFromUTC = (date: Date | string): Date => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return toZonedTime(dateObj, TIMEZONE)
}