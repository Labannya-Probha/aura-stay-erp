import { cn } from '../../lib/utils'
import { Button } from './button'
import { Input } from './input'
import { Textarea } from './textarea'

function stripLegacyClasses(className = '') {
  return className
    .split(/\s+/)
    .filter(Boolean)
    .filter((token) => token !== 'btn-primary' && token !== 'btn-ghost' && token !== 'btn-amber' && token !== 'input')
    .join(' ')
}

function deriveButtonVariant(className = '') {
  if (className.includes('btn-ghost')) return 'ghost'
  if (className.includes('btn-amber')) return 'secondary'
  return 'default'
}

function deriveButtonSize(className = '') {
  if (className.includes('!py-1') || className.includes('text-xs')) return 'xs'
  return 'default'
}

export function LegacyButton({ className = '', variant, size, ...props }) {
  return (
    <Button
      variant={variant || deriveButtonVariant(className)}
      size={size || deriveButtonSize(className)}
      className={cn(stripLegacyClasses(className))}
      {...props}
    />
  )
}

export function LegacyInput({ className = '', ...props }) {
  return <Input className={cn(stripLegacyClasses(className))} {...props} />
}

export function LegacyTextarea({ className = '', ...props }) {
  return <Textarea className={cn(stripLegacyClasses(className))} {...props} />
}
