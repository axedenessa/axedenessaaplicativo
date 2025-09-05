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

// Returns today's date string in BR timezone as YYYY-MM-DD
export const getTodayBRDateString = (): string => {
  return formatInTimeZone(new Date(), TIMEZONE, 'yyyy-MM-dd')
}

// Format a YYYY-MM-DD (stored) date as BR label, honoring Sao Paulo timezone
export const formatBRDateLabel = (yyyyMmDd: string, pattern: string = 'EEE, dd/MM/yyyy'): string => {
  // Interpret the plain date as midnight in Sao Paulo, then format back in the same TZ
  const utcFromLocalMidnight = fromZonedTime(new Date(`${yyyyMmDd}T00:00:00`), TIMEZONE)
  return formatInTimeZone(utcFromLocalMidnight, TIMEZONE, pattern, { locale: ptBR })
}

// Format only date (dd/MM/yyyy) from YYYY-MM-DD stored value
export const formatDateBRFromYMD = (yyyyMmDd: string): string => {
  return formatBRDateLabel(yyyyMmDd, 'dd/MM/yyyy')
}

// Format any JS Date into YYYY-MM-DD for BR timezone boundaries
export const formatDateToBRYMD = (date: Date): string => {
  return formatInTimeZone(date, TIMEZONE, 'yyyy-MM-dd')
}