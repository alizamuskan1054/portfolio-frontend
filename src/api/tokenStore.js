// Access token: sirf memory mein (page refresh par jata hai, refresh token se wapas aata hai).
// Refresh token: "Remember me" ON -> localStorage, OFF -> sessionStorage.
const REFRESH_KEY = 'pp-refresh'

export const SESSION_EXPIRED_EVENT = 'auth:session-expired'

let accessToken = null

function safe(fn, fallback = null) {
  try {
    return fn()
  } catch {
    return fallback
  }
}

function currentRefreshStorage() {
  return safe(() => {
    if (localStorage.getItem(REFRESH_KEY) !== null) return localStorage
    if (sessionStorage.getItem(REFRESH_KEY) !== null) return sessionStorage
    return null
  })
}

export const tokenStore = {
  getAccess: () => accessToken,
  setAccess: (token) => {
    accessToken = token
  },

  getRefresh: () => currentRefreshStorage()?.getItem(REFRESH_KEY) ?? null,

  // Refresh token rotate ho to wahi storage use hoti hai jahan pehle tha
  setRefresh: (token) => {
    safe(() => (currentRefreshStorage() ?? localStorage).setItem(REFRESH_KEY, token))
  },

  setTokens: ({ access, refresh, remember = true }) => {
    accessToken = access
    safe(() => {
      localStorage.removeItem(REFRESH_KEY)
      sessionStorage.removeItem(REFRESH_KEY)
      ;(remember ? localStorage : sessionStorage).setItem(REFRESH_KEY, refresh)
    })
  },

  clear: () => {
    accessToken = null
    safe(() => {
      localStorage.removeItem(REFRESH_KEY)
      sessionStorage.removeItem(REFRESH_KEY)
    })
  },
}
