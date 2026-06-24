import * as React from 'react'
import { cva } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-[9px] py-[3px] text-[10.5px] font-bold uppercase tracking-[0.04em] leading-[1.4] transition-[transform,filter] duration-150 hover:-translate-y-px hover:saturate-[1.08]',
  {
    variants: {
      variant: {
        default:
          'bg-pine text-white',
        secondary:
          'bg-secondary text-secondary-foreground',
        outline:
          'border border-[--border-color] text-pine bg-transparent',
        destructive:
          'bg-destructive/15 text-destructive border border-destructive/30',
        success:
          'bg-forest/15 text-forest border border-forest/30',
        warning:
          'bg-amber/20 text-amber-700 border border-amber/40',
        info:
          'bg-sky-100 text-sky-700 border border-sky-300',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

function Badge({ className, variant, ...props }) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
