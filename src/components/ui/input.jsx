import * as React from 'react'
import { cn } from '../../lib/utils'

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        'flex h-[38px] w-full rounded-[10px] border border-[--border-color] bg-white px-3 py-2 text-[14px] text-ink transition-all duration-150',
        'placeholder:text-[rgba(95,90,85,0.55)]',
        'focus:outline-none focus:border-[--brand-color] focus:shadow-[0_0_0_3px_var(--interactive-glow)] focus:bg-white focus:-translate-y-px',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'file:border-0 file:bg-transparent file:text-sm file:font-medium',
        className,
      )}
      ref={ref}
      {...props}
    />
  )
})
Input.displayName = 'Input'

export { Input }
