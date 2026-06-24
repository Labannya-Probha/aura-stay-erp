import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merges Tailwind CSS class names, resolving conflicts intelligently.
 * Drop-in replacement for clsx — shadcn/ui components rely on this.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
