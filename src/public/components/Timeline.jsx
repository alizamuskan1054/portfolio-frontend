import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

// Education aur Experience dono isi se.
// items: [{ key, title, subtitle, period, description, current }]
//   Education: title = degree, subtitle = institution
//   Experience: title = position, subtitle = organization
// current: dot filled + "Current" badge
export function Timeline({ items, className }) {
  if (!items?.length) return null

  return (
    <ol className={cn('relative space-y-8 border-l-2 border-line pl-8', className)}>
      {items.map((item) => (
        <li key={item.key} className="relative">
          <span
            aria-hidden="true"
            className={cn(
              'absolute top-1.5 -left-[41px] size-4 rounded-full border-2 border-primary',
              item.current ? 'bg-primary ring-4 ring-primary/20' : 'bg-background',
            )}
          />
          <div className="flex flex-wrap items-center gap-2">
            {item.period && <p className="text-sm font-semibold text-primary">{item.period}</p>}
            {item.current && (
              <Badge variant="primary" size="sm">
                Current
              </Badge>
            )}
          </div>
          <h3 className="mt-1 text-lg">{item.title}</h3>
          {item.subtitle && <p className="font-medium text-muted">{item.subtitle}</p>}
          {item.description && <p className="mt-2 max-w-2xl text-body">{item.description}</p>}
        </li>
      ))}
    </ol>
  )
}
