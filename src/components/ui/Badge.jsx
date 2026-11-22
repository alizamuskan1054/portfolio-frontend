import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva('inline-flex items-center gap-1.5 rounded-full font-semibold whitespace-nowrap', {
  variants: {
    variant: {
      neutral: 'bg-surface text-muted',
      primary: 'bg-primary-soft text-primary',
      success: 'bg-success/15 text-success',
      warning: 'bg-warning/15 text-warning',
      danger: 'bg-danger/15 text-danger',
      accent: 'bg-accent/20 text-accent-text',
    },
    size: { sm: 'px-2 py-0.5 text-xs', md: 'px-3 py-1 text-xs' },
  },
  defaultVariants: { variant: 'neutral', size: 'md' },
})

export function Badge({ variant, size, dot = false, className, children, ...props }) {
  return (
    <span className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {dot && <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />}
      {children}
    </span>
  )
}
