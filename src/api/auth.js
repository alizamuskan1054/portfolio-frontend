import { api, client } from './client'

// Public endpoints par skipAuth: stale token ki wajah se 401 na aaye.
// NOTE: forgot/reset/change password ke exact request fields API doc mein nahi hain.
// Auth pages banate waqt backend serializer se confirm karenge.
export const authApi = {
  signup: (payload) => api.post('/auth/signup/', payload, { skipAuth: true }),
  verifyEmail: (payload) => api.post('/auth/verify-email/', payload, { skipAuth: true }),
  // Tokens `data` ke andar hon ya top-level par, dono handle
    // ASSUMPTION: backend mein resend endpoint abhi doc mein nahi. Naam/fields confirm karne hain.
  resendVerification: (payload) => api.post('/auth/resend-verification/', payload, { skipAuth: true }),
  login: async (payload) => {
    const res = await client.post('/auth/login/', payload, { skipAuth: true })
    return res?.data?.access ? res.data : res
  },
  logout: (refresh) => api.post('/auth/logout/', { refresh }),
  forgotPassword: (payload) => api.post('/auth/forgot-password/', payload, { skipAuth: true }),
  resetPassword: (payload) => api.post('/auth/reset-password/', payload, { skipAuth: true }),
  changePassword: (payload) => api.post('/auth/change-password/', payload),
  getProfile: () => api.get('/auth/profile/'),
  updateProfile: (payload) => api.patch('/auth/profile/', payload), // FormData bhi chalega
}
