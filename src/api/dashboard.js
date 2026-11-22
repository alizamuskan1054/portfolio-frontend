import { api } from './client'

export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats/'),
  getRecentActivity: () => api.get('/dashboard/recent-activity/'),
}
