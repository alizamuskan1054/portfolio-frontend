import { paths } from '@/routes/paths'
import { GuestRoute, RequireRole } from './auth'
import { AdminLayout, AdminNotFoundPage, AuthLayout } from './layout'
import { SignupPage } from './pages/SignupPage'
import { VerifyEmailPage } from './pages/VerifyEmailPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'
import { DashboardPage } from './pages/DashboardPage'
import { ClientDetailPage } from './pages/ClientDetailPage'
import { ClientsPage } from './pages/ClientsPage'
import { ProfilePage } from './pages/ProfilePage'
import { PortfolioItemPage } from './pages/PortfolioItemPage'
import { PortfolioWizardPage } from './pages/PortfolioWizardPage'
import { NotificationsPage } from '@/features/notifications/NotificationsPage'
import { PortfoliosPage } from './pages/PortfoliosPage'
import { SettingsPage } from './pages/SettingsPage'
import { TemplatesPage } from './pages/TemplatesPage'

// Admin ke SAARE routes yahin. Naya admin page: page file banao, yahan ek line add karo.
// Login ab /login par hai (src/routes/commonRoutes.jsx). AuthProvider router.jsx mein lagta hai.
export const adminRoutes = [
  // Login se pehle ke pages
  {
    element: <AuthLayout />,
    children: [
      {
        element: <GuestRoute />,
        children: [{ path: paths.adminSignup, element: <SignupPage /> }],
      },
      { path: paths.adminVerifyEmail, element: <VerifyEmailPage /> },
      { path: paths.adminForgotPassword, element: <ForgotPasswordPage /> },
      { path: paths.adminResetPassword, element: <ResetPasswordPage /> },
    ],
  },

  // Login ke baad: sirf admin role (sidebar + topbar)
  {
    element: <RequireRole role="admin" />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { path: paths.admin, element: <DashboardPage /> },
          { path: paths.adminClients, element: <ClientsPage /> },
          { path: '/admin/clients/:id', element: <ClientDetailPage /> },
          { path: paths.adminTemplates, element: <TemplatesPage /> },
          { path: paths.adminPortfolios, element: <PortfoliosPage /> },
          { path: paths.adminPortfolioNew, element: <PortfolioWizardPage /> },
          {
            path: '/admin/portfolios/:id/edit/:section/:itemId',
            element: <PortfolioItemPage />,
          },
          { path: '/admin/portfolios/:id/edit', element: <PortfolioWizardPage /> },
          {
            path: paths.adminNotifications,
            element: <NotificationsPage portfolioPath={paths.adminPortfolioFocus} />,
          },
          { path: paths.adminSettings, element: <SettingsPage /> },
          { path: paths.adminProfile, element: <ProfilePage /> },
          { path: '/admin/*', element: <AdminNotFoundPage /> },
        ],
      },
    ],
  },
]
