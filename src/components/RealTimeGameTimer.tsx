import { Clock } from 'lucide-react'
import { useRealTimeTimer } from '@/hooks/useRealTimeTimer'

interface RealTimeGameTimerProps {
  startTime?: string
  className?: string
}

export const RealTimeGameTimer = ({ startTime, className = "" }: RealTimeGameTimerProps) => {
  const duration = useRealTimeTimer(startTime)

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Clock className="h-4 w-4 text-primary" />
      <span className="font-mono">{duration}</span>
    </div>
  )
}