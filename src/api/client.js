import axios from 'axios'
import { tokenStore, SESSION_EXPIRED_EVENT } from './tokenStore'
import { normalizeError } from './errors'

export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000/api'
).replace(/\/+$/, '')

// Raw instance. Response interceptor poora envelope { success, message, data, errors } deta hai.
export const client = axios.create({ baseURL: API_BASE_URL, timeout: 30000 })

// ---------- Token refresh (ek time par sirf ek refresh call) ----------
let refreshPromise = null

export function refreshAccessToken() {
  const refresh = tokenStore.getRefresh()
  if (!refresh) return Promise.reject(new Error('No refresh token'))

  if (!refreshPromise) {
    // Plain axios: interceptors dobara na chalein
    refreshPromise = axios
      .post(`${API_BASE_URL}/auth/refresh/`, { refresh })
      .then((res) => {
        const payload = res.data?.data ?? res.data
        tokenStore.setAccess(payload.access)
        if (payload.refresh) tokenStore.setRefresh(payload.refresh) // rotation on ho to
        return payload.access
      })
      .catch((err) => {
        const status = err?.response?.status
        // Token invalid/expired -> session khatam. Network error par session nahi todte.
        if (status === 400 || status === 401 || status === 403) {
          tokenStore.clear()
          window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT))
        }
        throw err
      })
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

// ---------- Interceptors ----------
// Per-request flag: { skipAuth: true } = token mat lagao aur 401 par refresh mat karo
// (login, signup, public site endpoints, etc.)
client.interceptors.request.use((config) => {
  const token = tokenStore.getAccess()
  if (token && !config.skipAuth) config.headers.Authorization = `Bearer ${token}`
  return config
})

client.interceptors.response.use(
  (response) => (response.config.responseType === 'blob' ? response : response.data),
  async (error) => {
    const original = error.config
    const status = error.response?.status

    if (
      status === 401 &&
      original &&
      !original.skipAuth &&
      !original._retried &&
      tokenStore.getRefresh()
    ) {
      original._retried = true
      try {
        const access = await refreshAccessToken()
        original.headers.Authorization = `Bearer ${access}`
        return client(original)
      } catch (refreshError) {
        return Promise.reject(normalizeError(refreshError))
      }
    }
    return Promise.reject(normalizeError(error))
  },
)

// ---------- Simple helpers: sirf envelope ka `data` return karte hain ----------
// Envelope ho ({ success, ... }) to `data`, warna jo response aaya wahi (non-enveloped endpoints ke liye)
const pick = (res) =>
  res && typeof res === 'object' && 'success' in res ? (res.data ?? null) : (res ?? null)

export const api = {
  get: (url, config) => client.get(url, config).then(pick),
  post: (url, body, config) => client.post(url, body, config).then(pick),
  put: (url, body, config) => client.put(url, body, config).then(pick),
  patch: (url, body, config) => client.patch(url, body, config).then(pick),
  delete: (url, config) => client.delete(url, config).then(pick),
  options: (url, config) => client.options(url, config).then(pick),
}
