import { useQuery } from '@tanstack/react-query'
import { notificationsApi } from './api'

export const NOTIF_COUNT_KEY = ['notifications', 'unread-count']

// Bell ka count. Endpoint na ho ya error aaye to 0 (sidebar kharab nahi hona chahiye).
export function useUnreadNotifications() {
  const query = useQuery({
    queryKey: NOTIF_COUNT_KEY,
    queryFn: async () => {
      try {
        const data = await notificationsApi.unreadCount()
        return Number(typeof data === 'number' ? data : (data?.count ?? 0)) || 0
      } catch {
        return 0
      }
    },
    refetchInterval: 60_000,
  })
  return query.data ?? 0
}
