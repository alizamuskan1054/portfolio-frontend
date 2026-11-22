// Saare API endpoints ek jagah. Naya module: neeche ek object add karo.

import { api, client } from './client'
import { createResource } from './resource'

// === Auth ==================================================================
// Public endpoints par skipAuth: stale token ki wajah se 401 na aaye.
export const authApi = {
  signup: (payload) => api.post('/auth/signup/', payload, { skipAuth: true }),
  verifyEmail: (payload) => api.post('/auth/verify-email/', payload, { skipAuth: true }),
  resendVerification: (payload) =>
    api.post('/auth/resend-verification/', payload, { skipAuth: true }),
  // Tokens `data` ke andar hon ya top-level par, dono handle
  login: async (payload) => {
    const res = await client.post('/auth/login/', payload, { skipAuth: true })
    return res?.data?.access ? res.data : res
  },
  logout: (refresh) => api.post('/auth/logout/', { refresh }),
  forgotPassword: (payload) =>
    api.post('/auth/forgot-password/', payload, { skipAuth: true }),
  resetPassword: (payload) =>
    api.post('/auth/reset-password/', payload, { skipAuth: true }),
  changePassword: (payload) => api.post('/auth/change-password/', payload),
  getProfile: () => api.get('/auth/profile/'),
  updateProfile: (payload) => api.patch('/auth/profile/', payload), // FormData bhi chalega
}

// === Clients ===============================================================
export const clientsResource = createResource('/clients', {
  name: 'clients',
  invalidates: [['dashboard']],
})

// === Portfolios ============================================================
export const portfoliosResource = {
  ...createResource('/portfolios/portfolios', {
    name: 'portfolios',
    invalidates: [['dashboard']],
  }),
  publish: (id) => api.post(`/portfolios/portfolios/${id}/publish/`),
  unpublish: (id) => api.post(`/portfolios/portfolios/${id}/unpublish/`),
  checkSlug: (slug) =>
    api.get('/portfolios/portfolios/check-slug/', { params: { slug } }),
}

// === Dashboard =============================================================
export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats/'),
  getRecentActivity: () => api.get('/dashboard/recent-activity/'),
}

// === Platform config =======================================================
export const templatesResource = createResource('/config/templates', {
  name: 'templates',
})

export const configApi = {
  getPublicSettings: () => api.get('/config/public/settings/', { skipAuth: true }),
  getSettings: () => api.get('/config/settings/'),
  updateSettings: (payload) => api.patch('/config/settings/', payload),
  // DRF metadata: default_theme / default_typography ke choices
  getSettingsMeta: () => api.options('/config/settings/'),
}
