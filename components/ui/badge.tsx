import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-xl border-0 px-3 py-1.5 text-xs font-semibold w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1.5 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-all duration-300 shadow-sm hover:shadow-md transform hover:scale-105',
  {
    variants: {
      variant: {
        default:
          'text-primary-foreground shadow-lg animate-magnetic-hover',
        secondary:
          'text-secondary-foreground shadow-md animate-magnetic-hover',
        destructive:
          'text-white shadow-lg focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 animate-magnetic-hover',
        outline:
          'border glass text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground animate-magnetic-hover',
        success:
          'text-white shadow-lg animate-magnetic-hover',
        accent:
          'text-accent-foreground shadow-lg animate-magnetic-hover',
        gradient:
          'text-white shadow-lg animate-magnetic-hover',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<'span'> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'span'

  // Apply gradient backgrounds based on variant
  const gradientStyle = React.useMemo(() => {
    switch (variant) {
      case 'default':
        return { background: 'var(--primary)' }
      case 'secondary':
        return { background: 'var(--secondary)' }
      case 'destructive':
        return { background: 'var(--destructive)' }
      case 'success':
        return { background: 'var(--success)' }
      case 'accent':
        return { background: 'var(--accent)' }
      default:
        return {}
    }
  }, [variant])

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      style={gradientStyle}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
