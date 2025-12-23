import * as React from 'react'
import { cn } from '@/lib/utils'
import { Button } from './button'

interface FloatingActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

export function FloatingActionButton({ 
  className, 
  position = 'bottom-right',
  children,
  variant = 'default',
  size = 'icon',
  ...props 
}: FloatingActionButtonProps) {
  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6',
  }

  return (
    <Button
      className={cn(
        'fixed z-50 rounded-full shadow-2xl animate-float hover:animate-pulse-glow',
        'w-14 h-14 p-0',
        positionClasses[position],
        className
      )}
      size={size}
      variant={variant}
      {...props}
    >
      {children}
    </Button>
  )
}