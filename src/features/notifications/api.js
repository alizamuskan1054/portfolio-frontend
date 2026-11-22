import { api } from '@/api/client'
import { createResource } from '@/api/resource'

// Notifications (bell): { id, kind, title, body, is_read, created_at, portfolio? }
export const notificationsResource = createResource('/notifications', {
  name: 'notifications',
})
export const notificationsApi = {
  unreadCount: () => api.get('/notifications/unread-count/'), // { count } ya seedha number
  markRead: (id) => api.post(`/notifications/${id}/read/`),
  markAllRead: () => api.post('/notifications/read-all/'),
}
