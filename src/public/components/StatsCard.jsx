import { Card } from '@/components/ui/Card'
import { formatNumber } from '@/lib/format'
import { cn } from '@/lib/utils'

// metrics: { publications, citations, h_index } (null = nahi diya). Koi bhi value na ho to card hide.
// Home par hero ke neeche overlap: className="relative z-10 -mt-12". Publications page par seedha use karo.
const STATS = [
  { key: 'publications', label: 'Publications' },
  { key: 'citations', label: 'Citations' },
  { key: 'h_index', label: 'h-index' },
]

export function StatsCard({ metrics, className }) {
  const visible = STATS.filter(({ key }) => metrics?.[key] !== null && metrics?.[key] !== undefined)
  if (visible.length === 0) return null

  return (
    <Card className={cn('grid divide-x divide-line p-2 shadow-lg', className)} style={{ gridTemplateColumns: `repeat(${visible.length}, minmax(0, 1fr))` }}>
      {visible.map(({ key, label }) => (
        <div key={key} className="px-4 py-4 text-center">
          <p className="font-serif text-2xl font-semibold text-primary sm:text-3xl">{formatNumber(metrics[key])}</p>
          <p className="mt-1 text-sm text-muted">{label}</p>
        </div>
      ))}
    </Card>
  )
}
