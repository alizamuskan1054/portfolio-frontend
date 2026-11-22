import { useQuery } from '@tanstack/react-query'
import { portalApi } from '@/portal/api'

export const PORTAL_ME_KEY = ['portal', 'me']

// /clients/me/: portfolios ki list, limit, aur bell ka unread count. Har minute refresh.
export function usePortalMe(options = {}) {
  return useQuery({
    queryKey: PORTAL_ME_KEY,
    queryFn: portalApi.getMe,
    refetchInterval: 60_000,
    ...options,
  })
}
