'use client'

import * as React from 'react'
import * as ProgressPrimitive from '@radix-ui/react-progress'

import { cn } from '@/lib/utils'

interface ProgressProps extends React.ComponentProps<typeof ProgressPrimitive.Root> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'gradient'
  animated?: boolean
}

function Progress({
  className,
  value,
  variant = 'default',
  animated = true,
  ...props
}: ProgressProps) {
  const [displayValue, setDisplayValue] = React.useState(0)

  React.useEffect(() => {
    if (animated && value !== undefined && value !== null) {
      const timer = setTimeout(() => {
        setDisplayValue(value)
      }, 100)
      return () => clearTimeout(timer)
    } else {
      setDisplayValue(value || 0)
    }
  }, [value, animated])

  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return {
          background: 'var(--success)',
          boxShadow: '0 0 10px rgba(16, 185, 129, 0.3)'
        }
      case 'warning':
        return {
          background: 'var(--accent)',
          boxShadow: '0 0 10px rgba(251, 191, 36, 0.3)'
        }
      case 'danger':
        return {
          background: 'var(--destructive)',
          boxShadow: '0 0 10px rgba(239, 68, 68, 0.3)'
        }
      case 'gradient':
        return {
          background: 'var(--primary)',
          boxShadow: '0 0 15px rgba(139, 92, 246, 0.4)'
        }
      default:
        return {
          background: 'var(--primary)',
          boxShadow: '0 0 8px rgba(139, 92, 246, 0.2)'
        }
    }
  }

  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        'relative h-3 w-full overflow-hidden rounded-full glass border-0',
        'bg-gradient-to-r from-muted/50 to-muted/30',
        className,
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={cn(
          'h-full w-full flex-1 rounded-full transition-all duration-1000 ease-out',
          animated && 'animate-progress-fill'
        )}
        style={{ 
          transform: `translateX(-${100 - displayValue}%)`,
          ...getVariantStyles()
        }}
      />
      
      {/* Shimmer effect for active progress */}
      {displayValue > 0 && displayValue < 100 && (
        <div 
          className="absolute inset-0 rounded-full animate-shimmer opacity-30"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)',
            backgroundSize: '200% 100%',
            width: `${displayValue}%`
          }}
        />
      )}
    </ProgressPrimitive.Root>
  )
}

export { Progress }
