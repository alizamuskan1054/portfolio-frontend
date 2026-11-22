import { useQuery } from '@tanstack/react-query'
import { configApi } from '@/api/endpoints'

export const DEFAULT_PLATFORM_NAME = 'Portfolio Builder'

// Brand ke liye naam/logo. Endpoint fail ho to default naam use hota hai (UI kabhi nahi tootta).
export function usePlatformSettings() {
  const { data } = useQuery({
    queryKey: ['config', 'public-settings'],
    queryFn: configApi.getPublicSettings,
    staleTime: 5 * 60 * 1000,
    retry: false,
  })

  return {
    name: data?.platform_name || DEFAULT_PLATFORM_NAME,
    logo: data?.logo || null,
    settings: data ?? null,
  }
}
