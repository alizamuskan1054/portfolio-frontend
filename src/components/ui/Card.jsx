import { cn } from '@/lib/utils'

export function Card({ hoverable = false, className, ...props }) {
  return (
    <div
      className={cn(
        'rounded-xl border border-line bg-card shadow-xs',
        hoverable && 'transition-colors hover:border-primary',
        className,
      )}
      {...props}
    />
  )
}

export function CardHeader({ title, description, action, className }) {
  return (
    <div className={cn('flex items-start justify-between gap-4 border-b border-line p-5', className)}>
      <div className="min-w-0">
        <h3 className="text-lg">{title}</h3>
        {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

export function CardContent({ className, ...props }) {
  return <div className={cn('p-5', className)} {...props} />
}

export function CardFooter({ className, ...props }) {
  return (
    <div className={cn('flex items-center justify-end gap-3 border-t border-line p-5', className)} {...props} />
  )
}
