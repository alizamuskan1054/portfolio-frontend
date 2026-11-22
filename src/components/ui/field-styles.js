import { cn } from '@/lib/utils'

// Input, Textarea, Select teeno ki common styling
export function fieldClass(invalid, className) {
  return cn(
    'block w-full rounded-lg border bg-card px-3 text-body transition-colors placeholder:text-muted/70 focus:ring-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60',
    invalid
      ? 'border-danger focus:border-danger focus:ring-danger/20'
      : 'border-line hover:border-primary/50 focus:border-primary focus:ring-primary/20',
    className,
  )
}
