import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-300 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transform hover:scale-105 active:scale-95",
  {
    variants: {
      variant: {
        default: 'text-primary-foreground shadow-lg hover:shadow-xl animate-magnetic-hover',
        destructive:
          'text-white shadow-lg hover:shadow-xl focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 animate-magnetic-hover',
        outline:
          'border glass shadow-md hover:shadow-lg dark:hover:bg-input/50 animate-magnetic-hover',
        secondary:
          'text-secondary-foreground shadow-md hover:shadow-lg animate-magnetic-hover',
        ghost:
          'hover:bg-accent/80 hover:text-accent-foreground dark:hover:bg-accent/50 animate-magnetic-hover',
        link: 'text-primary underline-offset-4 hover:underline',
        success: 'text-white shadow-lg hover:shadow-xl animate-magnetic-hover',
        accent: 'text-accent-foreground shadow-lg hover:shadow-xl animate-magnetic-hover',
      },
      size: {
        default: 'h-10 px-6 py-2 has-[>svg]:px-4',
        sm: 'h-8 rounded-lg gap-1.5 px-4 has-[>svg]:px-3',
        lg: 'h-12 rounded-xl px-8 has-[>svg]:px-6 text-base',
        icon: 'size-10',
        'icon-sm': 'size-8',
        'icon-lg': 'size-12',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : 'button'

  // Apply gradient backgrounds based on variant
  const gradientStyle = React.useMemo(() => {
    switch (variant) {
      case 'default':
        return { background: 'var(--primary)' }
      case 'destructive':
        return { background: 'var(--destructive)' }
      case 'secondary':
        return { background: 'var(--secondary)' }
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
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      style={gradientStyle}
      {...props}
    />
  )
}

export { Button, buttonVariants }
