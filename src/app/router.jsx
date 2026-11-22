import { createBrowserRouter } from 'react-router-dom'
import { AuthRoot } from '@/admin/auth'
import { adminRoutes } from '@/admin/routes'
import { portalRoutes } from '@/portal/routes'
import { commonRoutes } from '@/routes/commonRoutes'
import UiKitPage from '@/features/dev/UiKitPage'
import SharedKitPage from '@/features/dev/SharedKitPage'
import { NotFound } from '@/components/shared/NotFound'
import { publicRoutes } from '@/public/routes'

export const router = createBrowserRouter([
  // Login, admin aur client portal: ek hi session provider (AuthRoot) ke andar
  {
    element: <AuthRoot />,
    children: [...commonRoutes, ...adminRoutes, ...portalRoutes],
  },

  // Sirf development mein: UI kit showcase
  ...(import.meta.env.DEV
    ? [
        { path: '/dev/ui', element: <UiKitPage /> },
        { path: '/dev/shared', element: <SharedKitPage /> },
      ]
    : []),

  // Public site routes
  ...publicRoutes,

  { path: '*', element: <NotFound /> },
])