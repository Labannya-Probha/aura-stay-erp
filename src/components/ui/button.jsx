import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap text-[13.5px] font-semibold transition-all duration-150 disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'rounded-[9px] text-white bg-gradient-to-br from-[#1F6F78] to-[#16565D] border border-white/[0.18] shadow-[0_8px_18px_rgba(31,111,120,0.18)] hover:brightness-[1.06] hover:-translate-y-px hover:shadow-[0_12px_26px_rgba(31,111,120,0.26)] active:translate-y-0',
        outline:
          'rounded-[9px] text-pine bg-white border border-[--border-color] hover:bg-[#FAF8F5] hover:-translate-y-px hover:border-[rgba(31,111,120,0.30)] hover:shadow-[0_8px_20px_rgba(23,23,23,0.08)] active:translate-y-0',
        amber:
          'rounded-[9px] text-white bg-gradient-to-br from-[#C89B5C] to-[#B38443] border border-white/[0.18] shadow-[0_8px_18px_rgba(184,134,11,0.16)] hover:brightness-105 hover:-translate-y-px hover:shadow-[0_11px_24px_rgba(184,134,11,0.24)] active:translate-y-0',
        ghost:
          'rounded-[9px] text-pine hover:bg-[#FAF8F5]',
        destructive:
          'rounded-[9px] bg-destructive text-destructive-foreground hover:bg-destructive/90',
        link:
          'text-pine underline-offset-4 hover:underline',
        secondary:
          'rounded-[9px] bg-secondary text-secondary-foreground hover:bg-secondary/80',
      },
      size: {
        default: 'h-[38px] px-4',
        sm:      'h-8 px-3 text-xs rounded-[8px]',
        lg:      'h-11 px-8 rounded-[11px]',
        icon:    'h-[38px] w-[38px] p-0 rounded-[9px]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size:    'default',
    },
  },
)

const Button = React.forwardRef(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  },
)
Button.displayName = 'Button'

export { Button, buttonVariants }
