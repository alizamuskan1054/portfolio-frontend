import { api } from './client'

export const configApi = {
  getPublicSettings: () => api.get('/config/public/settings/', { skipAuth: true }),
}
