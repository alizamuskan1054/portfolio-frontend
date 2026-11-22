import { useCallback, useState } from 'react'
import { PAGE_SIZE } from '@/lib/constants'

// Search ya filter badalne par reset() zaroor call karein.
export function usePagination({ pageSize = PAGE_SIZE } = {}) {
  const [page, setPage] = useState(1)
  const reset = useCallback(() => setPage(1), [])
  return { page, setPage, reset, pageSize }
}
