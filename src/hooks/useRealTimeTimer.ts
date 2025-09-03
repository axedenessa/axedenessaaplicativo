import { useState, useEffect } from 'react'

export const useRealTimeTimer = (startTime?: string) => {
  const [duration, setDuration] = useState<string>("00:00")

  useEffect(() => {
    if (!startTime) {
      setDuration("00:00")
      return
    }

    const updateTimer = () => {
      const start = new Date(startTime)
      const now = new Date()
      const diffSeconds = Math.floor((now.getTime() - start.getTime()) / 1000)
      
      const minutes = Math.floor(diffSeconds / 60)
      const seconds = diffSeconds % 60
      
      setDuration(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`)
    }

    // Update immediately
    updateTimer()
    
    // Update every second
    const interval = setInterval(updateTimer, 1000)
    
    return () => clearInterval(interval)
  }, [startTime])

  return duration
}