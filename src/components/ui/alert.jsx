import * as React from 'react'
import { cva } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const alertVariants = cva(
  'relative w-full rounded-xl border px-4 py-3 text-sm [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4',
  {
    variants: {
      variant: {
        default:
          'bg-[#F1EEE9] text-ink border-[--border-color] [&>svg]:text-ink',
        destructive:
          'bg-red-50 text-red-700 border-red-200 [&>svg]:text-red-600',
        success:
          'bg-forest/10 text-forest border-forest/30 [&>svg]:text-forest',
        warning:
          'bg-amber/10 text-amber-800 border-amber/30 [&>svg]:text-amber-700',
        info:
          'bg-sky-50 text-sky-700 border-sky-200 [&>svg]:text-sky-600',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

const Alert = React.forwardRef(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
))
Alert.displayName = 'Alert'

const AlertTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn('mb-1 font-semibold leading-none tracking-tight', className)}
    {...props}
  />
))
AlertTitle.displayName = 'AlertTitle'

const AlertDescription = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('text-sm [&_p]:leading-relaxed', className)}
    {...props}
  />
))
AlertDescription.displayName = 'AlertDescription'

export { Alert, AlertTitle, AlertDescription }
