import { Navigate } from 'react-router-dom'
import { GuestRoute, RootRedirect } from '@/admin/auth'
import { AuthLayout } from '@/admin/layout'
import { LoginPage } from '@/admin/pages/LoginPage'
import { paths } from '@/routes/paths'

// Sab ka common: "/" , ek hi login (/login), aur purana /admin/login redirect.
export const commonRoutes = [
  { path: paths.root, element: <RootRedirect /> },
  { path: paths.adminLogin, element: <Navigate to={paths.login} replace /> },
  {
    element: <AuthLayout />,
    children: [
      {
        element: <GuestRoute />,
        children: [{ path: paths.login, element: <LoginPage /> }],
      },
    ],
  },
]
