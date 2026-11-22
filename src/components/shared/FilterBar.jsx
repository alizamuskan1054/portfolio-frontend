import { cn } from '@/lib/utils'

// Search + filters ki row: <FilterBar><SearchInput/><Select/></FilterBar>
export function FilterBar({ className, children }) {
  return <div className={cn('mb-5 flex flex-wrap items-center gap-3', className)}>{children}</div>
}
