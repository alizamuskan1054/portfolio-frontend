/* eslint-disable react-refresh/only-export-components */
// Session (admin + client): context, provider, useAuth, aur route guards
// (RootRedirect, RequireRole, GuestRoute). Role backend se aata hai: 'admin' ya 'client'.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { authApi } from '@/api/endpoints'
import { refreshAccessToken } from '@/api/client'
import { SESSION_EXPIRED_EVENT, tokenStore } from '@/api/tokenStore'
import { FullPageSpinner } from '@/components/ui/Spinner'
import { paths } from '@/routes/paths'

export const AuthContext = createContext(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}

// Role na aaye (purana backend) to admin maante hain.
export const roleOf = (user) => (user?.role === 'client' ? 'client' : 'admin')

// Login ke baad har role ka apna ghar
export const roleHome = (user) => (roleOf(user) === 'client' ? paths.portal : paths.admin)

// status: 'loading' (app start par session check) | 'authenticated' | 'unauthenticated'
export function AuthProvider({ children }) {
  const queryClient = useQueryClient()
  const [user, setUser] = useState(null)
  const [status, setStatus] = useState('loading')

  const endSession = useCallback(() => {
    setUser(null)
    setStatus('unauthenticated')
    queryClient.clear()
  }, [queryClient])

  // App start: refresh token se session restore
  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      if (!tokenStore.getRefresh()) {
        setStatus('unauthenticated')
        return
      }
      try {
        await refreshAccessToken()
        const profile = await authApi.getProfile()
        if (cancelled) return
        setUser(profile)
        setStatus('authenticated')
      } catch {
        if (!cancelled) setStatus('unauthenticated')
      }
    }

    bootstrap()
    return () => {
      cancelled = true
    }
  }, [])

  // Refresh fail hone par (client.js) session khud khatam
  useEffect(() => {
    window.addEventListener(SESSION_EXPIRED_EVENT, endSession)
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, endSession)
  }, [endSession])

  const login = useCallback(
    async ({ email, password, remember = true }) => {
      const tokens = await authApi.login({ email, password })
      tokenStore.setTokens({ access: tokens.access, refresh: tokens.refresh, remember })
      try {
        const profile = await authApi.getProfile()
        // Pichle user ka cached data (admin ya doosra client) naye user ko na dikhe
        queryClient.clear()
        setUser(profile)
        setStatus('authenticated')
        return profile
      } catch (error) {
        tokenStore.clear()
        throw error
      }
    },
    [queryClient],
  )

  const logout = useCallback(async () => {
    const refresh = tokenStore.getRefresh()
    try {
      if (refresh) await authApi.logout(refresh)
    } catch {
      /* server logout fail ho to bhi local session khatam karte hain */
    }
    tokenStore.clear()
    endSession()
  }, [endSession])

  const value = useMemo(
    () => ({
      user,
      status,
      role: roleOf(user),
      isAuthenticated: status === 'authenticated',
      login,
      logout,
      setUser, // Profile page update ke baad use hoga
    }),
    [user, status, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Admin, portal aur login: sab ek hi session provider ke andar (public site par ye load nahi hota).
export function AuthRoot() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  )
}

// "/" : login nahi to /login, warna apne role ke ghar
export function RootRedirect() {
  const { status, user } = useAuth()
  if (status === 'loading') return <FullPageSpinner />
  return (
    <Navigate to={status === 'authenticated' ? roleHome(user) : paths.login} replace />
  )
}

// Sirf `role` wale user ke liye. Login nahi to /login; galat role ho to uske apne ghar.
export function RequireRole({ role }) {
  const { status, user } = useAuth()
  const location = useLocation()

  if (status === 'loading') return <FullPageSpinner />
  if (status !== 'authenticated') {
    return <Navigate to={paths.login} replace state={{ from: location }} />
  }
  if (roleOf(user) !== role) return <Navigate to={roleHome(user)} replace />
  return <Outlet />
}

// Login jaise pages: already logged-in user ko uske ghar (ya pichle page) par bhej deta hai
export function GuestRoute() {
  const { status, user } = useAuth()
  const location = useLocation()

  if (status === 'loading') return <FullPageSpinner />
  if (status === 'authenticated') {
    const from = location.state?.from
    const home = roleHome(user)
    // Pichla page sirf tab jab wo isi role ka area ho (client ko /admin par na bheja jaye)
    const sameArea = from && from.pathname.startsWith(home)
    return <Navigate to={sameArea ? `${from.pathname}${from.search}` : home} replace />
  }
  return <Outlet />
}
