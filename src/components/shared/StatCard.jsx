import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatNumber } from '@/lib/format'
import { cn } from '@/lib/utils'

export function StatCard({ icon: Icon, label, value, hint, loading = false, className }) {
  return (
    <Card hoverable className={cn('flex items-center gap-4 p-5', className)}>
      {Icon && (
        <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
          <Icon className="size-6" />
        </span>
      )}
      <div className="min-w-0">
        <p className="text-sm text-muted">{label}</p>
        {loading ? (
          <Skeleton className="mt-1 h-8 w-16" />
        ) : (
          <p className="font-serif text-3xl font-semibold text-primary">
            {typeof value === 'number' ? formatNumber(value) : value}
          </p>
        )}
        {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
      </div>
    </Card>
  )
}
