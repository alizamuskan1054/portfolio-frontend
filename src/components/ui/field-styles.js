import { cn } from '@/lib/utils'

// Input, Textarea, Select teeno ki common styling
export function fieldClass(invalid, className) {
  return cn(
    'block w-full rounded-xl border bg-background px-3.5 text-body transition-all placeholder:text-muted/60 focus:ring-[3px] focus:outline-none disabled:cursor-not-allowed disabled:bg-primary-soft/30 disabled:opacity-60',
    invalid
      ? 'border-danger focus:border-danger focus:ring-danger/15'
      : 'border-line hover:border-primary/50 focus:border-primary focus:ring-primary/15',
    className,
  )
}
