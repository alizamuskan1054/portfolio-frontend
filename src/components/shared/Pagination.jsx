import { useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

// Pages ka window: 1 … 4 5 6 … 20
function buildPages(page, total) {
  const wanted = [1, total, page - 1, page, page + 1].filter((p) => p >= 1 && p <= total)
  const sorted = [...new Set(wanted)].sort((a, b) => a - b)
  const out = []
  sorted.forEach((p, i) => {
    const prev = sorted[i - 1]
    if (i > 0 && p - prev > 1) out.push(p - prev === 2 ? prev + 1 : `gap-${p}`)
    out.push(p)
  })
  return out
}

const navButton =
  'inline-flex size-9 items-center justify-center rounded-lg border border-line bg-card text-body transition-colors hover:border-primary hover:text-primary disabled:pointer-events-none disabled:opacity-50'

export function Pagination({ page, count, pageSize, onPageChange, className }) {
  const totalPages = Math.ceil(count / pageSize)

  // Last page ka akhri item delete ho jaye to ek page peeche aa jao
  useEffect(() => {
    if (totalPages > 0 && page > totalPages) onPageChange(totalPages)
  }, [page, totalPages, onPageChange])

  if (totalPages <= 1) return null

  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, count)

  return (
    <nav
      aria-label="Pagination"
      className={cn('flex flex-wrap items-center justify-between gap-3', className)}
    >
      <p className="text-sm text-muted">
        Showing {from}–{to} of {count}
      </p>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          className={navButton}
          aria-label="Previous page"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="size-4" />
        </button>

        {buildPages(page, totalPages).map((item) =>
          typeof item === 'number' ? (
            <button
              key={item}
              type="button"
              aria-label={`Page ${item}`}
              aria-current={item === page ? 'page' : undefined}
              onClick={() => onPageChange(item)}
              className={cn(
                'inline-flex size-9 items-center justify-center rounded-lg border text-sm font-medium transition-colors',
                item === page
                  ? 'border-primary bg-primary text-on-primary'
                  : 'border-line bg-card text-body hover:border-primary hover:text-primary',
              )}
            >
              {item}
            </button>
          ) : (
            <span key={item} className="px-1 text-muted" aria-hidden="true">
              …
            </span>
          ),
        )}

        <button
          type="button"
          className={navButton}
          aria-label="Next page"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </nav>
  )
}
