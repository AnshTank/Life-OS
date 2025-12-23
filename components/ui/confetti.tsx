'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface ConfettiProps {
  active: boolean
  onComplete?: () => void
  className?: string
}

export function Confetti({ active, onComplete, className }: ConfettiProps) {
  const [particles, setParticles] = React.useState<Array<{
    id: number
    x: number
    y: number
    color: string
    size: number
    rotation: number
  }>>([])

  React.useEffect(() => {
    if (active) {
      const colors = [
        '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444',
        '#ec4899', '#84cc16', '#f97316', '#6366f1', '#14b8a6'
      ]
      
      const newParticles = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 4,
        rotation: Math.random() * 360
      }))
      
      setParticles(newParticles)
      
      const timer = setTimeout(() => {
        setParticles([])
        onComplete?.()
      }, 2000)
      
      return () => clearTimeout(timer)
    }
  }, [active, onComplete])

  if (!active || particles.length === 0) return null

  return (
    <div className={cn('fixed inset-0 pointer-events-none z-50', className)}>
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute animate-confetti"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            backgroundColor: particle.color,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            borderRadius: '50%',
            transform: `rotate(${particle.rotation}deg)`,
            animationDelay: `${Math.random() * 0.5}s`,
            animationDuration: `${1.5 + Math.random()}s`
          }}
        />
      ))}
    </div>
  )
}

// Hook for easy confetti triggering
export function useConfetti() {
  const [isActive, setIsActive] = React.useState(false)
  
  const trigger = React.useCallback(() => {
    setIsActive(true)
  }, [])
  
  const handleComplete = React.useCallback(() => {
    setIsActive(false)
  }, [])
  
  return {
    isActive,
    trigger,
    Confetti: (props: Omit<ConfettiProps, 'active' | 'onComplete'>) => (
      <Confetti {...props} active={isActive} onComplete={handleComplete} />
    )
  }
}