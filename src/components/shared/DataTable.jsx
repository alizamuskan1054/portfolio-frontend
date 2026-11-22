import { useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/utils'
import { EmptyState } from './EmptyState'
import { ErrorState } from './ErrorState'
import { Pagination } from './Pagination'

const FLASH_CLASSES = ['bg-primary-soft', 'ring-2', 'ring-inset', 'ring-primary/50']

// columns: [{ key, header, cell?(row), className, align: 'right', mobile?: 'title' | 'actions' | 'hidden' }]
//   - cell na do to row[key] dikhta hai
//   - key: 'actions' wala column mobile card mein upar-right aata hai
//   - mobile: pehla non-actions column card ka title banta hai (ya mobile: 'title' se chuno)
// pagination: { page, count, pageSize, onPageChange }
export function DataTable({
  columns,
  data,
  rowKey = 'id',
  loading = false,
  fetching = false,
  error,
  onRetry,
  empty,
  pagination,
  skeletonRows = 5,
  highlightId,
  className,
}) {
  // highlightId: notification se aaye row ko scroll karke kuch der highlight karta hai.
  // Classes seedha element par lagti/hatti hain (state nahi), taake re-render par highlight na toote.
  const hasHighlight =
    highlightId !== undefined &&
    highlightId !== null &&
    Boolean(data?.some((r) => String(r[rowKey]) === String(highlightId)))
  useEffect(() => {
    if (!hasHighlight || loading) return undefined
    const rows = [...document.querySelectorAll(`[data-row-id="${highlightId}"]`)]
    const visible = rows.find((el) => el.offsetParent !== null) ?? rows[0]
    visible?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    rows.forEach((el) => el.classList.add(...FLASH_CLASSES))
    const timer = setTimeout(
      () => rows.forEach((el) => el.classList.remove(...FLASH_CLASSES)),
      3500,
    )
    return () => {
      clearTimeout(timer)
      rows.forEach((el) => el.classList.remove(...FLASH_CLASSES))
    }
  }, [hasHighlight, highlightId, loading])

  const isActions = (col) => col.mobile === 'actions' || col.key === 'actions'
  const titleCol =
    columns.find((c) => c.mobile === 'title') ?? columns.find((c) => !isActions(c))
  const actionsCol = columns.find(isActions)
  const detailCols = columns.filter(
    (c) => c !== titleCol && c !== actionsCol && c.mobile !== 'hidden',
  )

  const renderCell = (col, row) => (col.cell ? col.cell(row) : (row[col.key] ?? '—'))

  if (error && !data?.length) {
    return <ErrorState message={error.message} onRetry={onRetry} className={className} />
  }

  if (!loading && !data?.length) {
    return empty ?? <EmptyState title="Nothing here yet" className={className} />
  }

  const rows = loading
    ? Array.from({ length: skeletonRows }, (_, i) => ({ [rowKey]: `sk-${i}` }))
    : data

  return (
    <div className={cn('space-y-4', className)}>
      <Card
        className={cn(
          'overflow-hidden transition-opacity',
          fetching && !loading && 'opacity-70',
        )}
      >
        {/* Desktop: table */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface text-muted text-xs font-semibold tracking-wide uppercase">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    scope="col"
                    className={cn(
                      'px-4 py-3 whitespace-nowrap',
                      col.align === 'right' && 'text-right',
                      col.headerClassName,
                    )}
                  >
                    {col.key === 'actions' && !col.header ? (
                      <span className="sr-only">Actions</span>
                    ) : (
                      col.header
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-line divide-y">
              {rows.map((row) => (
                <tr
                  key={row[rowKey]}
                  data-row-id={row[rowKey]}
                  className="hover:bg-primary-soft/40 transition-colors duration-700"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        'px-4 py-3.5 align-middle',
                        col.align === 'right' && 'text-right',
                        col.className,
                      )}
                    >
                      {loading ? <Skeleton className="h-5 w-24" /> : renderCell(col, row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile: cards */}
        <ul className="divide-line divide-y md:hidden">
          {rows.map((row) => (
            <li
              key={row[rowKey]}
              data-row-id={row[rowKey]}
              className="space-y-3 p-4 transition-colors duration-700"
            >
              {loading ? (
                <>
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-4 w-1/2" />
                </>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">{titleCol && renderCell(titleCol, row)}</div>
                    {actionsCol && (
                      <div className="shrink-0">{renderCell(actionsCol, row)}</div>
                    )}
                  </div>
                  {detailCols.length > 0 && (
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                      {detailCols.map((col) => (
                        <div key={col.key} className="min-w-0">
                          <dt className="text-muted text-xs">{col.header}</dt>
                          <dd className="text-body truncate">{renderCell(col, row)}</dd>
                        </div>
                      ))}
                    </dl>
                  )}
                </>
              )}
            </li>
          ))}
        </ul>
      </Card>

      {pagination && !loading && <Pagination {...pagination} />}
    </div>
  )
}
