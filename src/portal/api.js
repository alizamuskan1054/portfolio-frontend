// Client portal ke endpoints.
import { api, client } from '@/api/client'
import { ApiError } from '@/api/errors'
import { createResource } from '@/api/resource'

// Visitors ke messages (client apne portfolios ke dekh sakta hai aur is_read mark kar sakta hai)
export const messagesResource = createResource('/portfolios/messages', {
  name: 'pf-messages',
})

export const portalApi = {
  // Admin: client ko invite bhejo (ya dobara). Response: { invite_url, email_sent, sent_to? }
  inviteClient: (clientId) => api.post(`/clients/${clientId}/invite/`),

  // Client ki info, uske portfolios, unread messages, limit (5)
  getMe: () => api.get('/clients/me/'),

  // Invite link se pehli baar password set. Tokens wapas nahi aate, phir login karna padta hai.
  // Backend kabhi 200 ke saath { success: false } bheje to bhi error maana jaye (nahi to
  // "password set" dikha kar login par bhej deta).
  acceptInvite: async (payload) => {
    const res = await client.post('/auth/accept-invite/', payload, { skipAuth: true })
    if (res && typeof res === 'object' && res.success === false) {
      throw new ApiError(res.message || 'Could not set the password.', {
        status: 200,
        errors: res.errors ?? null,
        data: res,
      })
    }
    return res?.data ?? null
  },
}
