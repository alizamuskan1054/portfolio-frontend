import { RequireRole } from '@/admin/auth'
import { AuthLayout } from '@/admin/layout'
import { PortfolioItemPage } from '@/admin/pages/PortfolioItemPage'
import { ProfilePage } from '@/admin/pages/ProfilePage'
import { paths } from '@/routes/paths'
import { NotificationsPage } from '@/features/notifications/NotificationsPage'
import { PortalLayout, PortalNotFoundPage } from './layout'
import { PortfolioLayout } from './PortfolioLayout'
import { AcceptInvitePage } from './pages/AcceptInvitePage'
import { DashboardPage } from './pages/DashboardPage'
import { BasicInfoPage } from './pages/BasicInfoPage'
import { MessagesPage } from './pages/MessagesPage'
import { MyPortfoliosPage } from './pages/MyPortfoliosPage'
import { NewPortfolioPage } from './pages/NewPortfolioPage'
import { PortfolioHomePage } from './pages/PortfolioHomePage'
import {
  AcademicPage,
  ContactPage,
  ContentPage,
  VisibilityPage,
} from './pages/SectionPages'

// Client portal ke SAARE routes yahin. AuthProvider router.jsx mein lagta hai.
export const portalRoutes = [
  // Invite link: login ki zaroorat nahi
  {
    element: <AuthLayout />,
    children: [{ path: paths.portalAcceptInvite, element: <AcceptInvitePage /> }],
  },

  // Sirf client role
  {
    element: <RequireRole role="client" />,
    children: [
      {
        element: <PortalLayout />,
        children: [
          { path: paths.portal, element: <DashboardPage /> },
          { path: paths.portalPortfolios, element: <MyPortfoliosPage /> },
          { path: paths.portalPortfolioNew, element: <NewPortfolioPage /> },
          {
            path: '/portal/portfolios/:id',
            element: <PortfolioLayout />,
            children: [
              { index: true, element: <PortfolioHomePage /> },
              { path: 'basic', element: <BasicInfoPage /> },
              { path: 'academic', element: <AcademicPage /> },
              { path: 'content', element: <ContentPage /> },
              { path: 'contact', element: <ContactPage /> },
              { path: 'visibility', element: <VisibilityPage /> },
              { path: 'items/:section/:itemId', element: <PortfolioItemPage /> },
            ],
          },
          { path: paths.portalMessages, element: <MessagesPage /> },
          {
            path: paths.portalNotifications,
            element: (
              <NotificationsPage
                portfolioPath={paths.portalPortfolio}
                messagesPath={paths.portalMessages}
              />
            ),
          },
          { path: paths.portalAccount, element: <ProfilePage /> },
          { path: '/portal/*', element: <PortalNotFoundPage /> },
        ],
      },
    ],
  },
]
