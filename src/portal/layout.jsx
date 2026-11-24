// Client portal ka layout: sidebar (mobile par drawer) + topbar (bell, theme, profile).

import { useState } from 'react'
import { Link, Outlet } from 'react-router-dom'
import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react'
import {
  Bell,
  Compass,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  User,
} from 'lucide-react'
import { useAuth } from '@/admin/auth'
import {
  AppSidebar,
  SidebarEdgeToggle,
  useSidebarOpen,
} from '@/components/shared/AppSidebar'
import { BreadcrumbProvider, Breadcrumbs } from '@/components/shared/Breadcrumbs'
import { EmptyState } from '@/components/shared/EmptyState'
import { LogoutDialog } from '@/components/shared/LogoutDialog'
import { ScrollToTop } from '@/components/shared/ScrollToTop'
import { ThemeToggle } from '@/components/shared/ThemeToggle'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { DropdownMenu } from '@/components/ui/DropdownMenu'
import { useUnreadNotifications } from '@/features/notifications/useUnreadNotifications'
import { usePortalMe } from '@/portal/hooks/usePortalMe'
import { cn } from '@/lib/utils'
import { paths } from '@/routes/paths'

// badge: 'messages' | 'notifications' (unread count sidebar mein dikhta hai)
const NAV = [
  { label: 'Dashboard', to: paths.portal, icon: LayoutDashboard, end: true },
  { label: 'My portfolios', to: paths.portalPortfolios, icon: FolderKanban },
  { label: 'Messages', to: paths.portalMessages, icon: MessageSquare, badge: 'messages' },
  {
    label: 'Notifications',
    to: paths.portalNotifications,
    icon: Bell,
    badge: 'notifications',
  },
  { label: 'Account', to: paths.portalAccount, icon: User },
]

function NotificationBell() {
  const count = useUnreadNotifications()

  return (
    <Link
      to={paths.portalNotifications}
      aria-label={count ? `Notifications, ${count} unread` : 'Notifications'}
      className="text-muted hover:bg-primary-soft hover:text-primary relative inline-flex size-10 items-center justify-center rounded-lg transition-colors"
    >
      <Bell className="size-5" />
      {count > 0 && (
        <span className="bg-danger absolute top-1 right-1 flex min-w-4.5 items-center justify-center rounded-full px-1 text-[10px] leading-4.5 font-semibold text-white">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  )
}

function ProfileMenu() {
  const { user, logout } = useAuth()
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)

  return (
    <>
    <DropdownMenu
      label="Account menu"
      trigger={
        <button
          type="button"
          aria-label="Account menu"
          className="hover:bg-primary-soft flex items-center gap-2 rounded-full p-1 pr-3 transition-colors"
        >
          <Avatar name={user?.full_name} src={user?.profile_photo} size="sm" />
          <span className="text-heading hidden max-w-32 truncate text-sm font-medium sm:block">
            {user?.full_name}
          </span>
        </button>
      }
      items={[
        { label: 'Account', icon: User, to: paths.portalAccount },
        { label: 'Logout', icon: LogOut, danger: true, onClick: () => setConfirming(true) },
      ]}
    />
    <LogoutDialog
      open={confirming}
      loading={busy}
      onClose={() => setConfirming(false)}
      onConfirm={async () => {
        setBusy(true)
        try {
          await logout()
        } finally {
          setBusy(false)
          setConfirming(false)
        }
      }}
    />
    </>
  )
}

function SidebarContent({ collapsed, onNavigate, onClose }) {
  const me = usePortalMe()
  const notifications = useUnreadNotifications()
  return (
    <AppSidebar
      nav={NAV}
      counts={{ messages: me.data?.unread_messages_count ?? 0, notifications }}
      footer="Client portal"
      collapsed={collapsed}
      onNavigate={onNavigate}
      onClose={onClose}
    />
  )
}

export function PortalLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useSidebarOpen()

  return (
    <BreadcrumbProvider>
      <div
        className={cn(
          'bg-background min-h-screen transition-[padding] duration-200',
          sidebarOpen ? 'lg:pl-64' : 'lg:pl-16',
        )}
      >
        <a
          href="#main"
          className="focus:bg-primary focus:text-on-primary sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:px-4 focus:py-2"
        >
          Skip to content
        </a>

        {/* Desktop sidebar */}
        <aside className="fixed inset-y-0 left-0 z-30 hidden lg:block">
          <SidebarContent
            collapsed={!sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
        </aside>
        <SidebarEdgeToggle
          open={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        {/* Mobile drawer */}
        <Dialog
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          className="relative z-40 lg:hidden"
        >
          <DialogBackdrop
            transition
            className="bg-navy/60 fixed inset-0 transition-opacity duration-200 data-closed:opacity-0"
          />
          <div className="fixed inset-0 flex">
            <DialogPanel
              transition
              className="relative transition duration-200 ease-out data-closed:-translate-x-full"
            >
              <SidebarContent
                onNavigate={() => setMobileOpen(false)}
                onClose={() => setMobileOpen(false)}
              />
            </DialogPanel>
          </div>
        </Dialog>

        <header className="border-line bg-background/90 sticky top-0 z-20 flex h-16 items-center gap-2 border-b px-4 backdrop-blur sm:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label="Open menu"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="size-5" />
          </Button>
          <div className="flex-1" />
          <NotificationBell />
          <ThemeToggle />
          <ProfileMenu />
        </header>

        <main id="main" className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
          <Breadcrumbs base="/portal" />
          <Outlet />
        </main>

        <ScrollToTop className="right-4 bottom-24 sm:right-6" />
      </div>
    </BreadcrumbProvider>
  )
}

export function PortalNotFoundPage() {
  return (
    <EmptyState
      icon={Compass}
      title="Page not found"
      description="The page you are looking for does not exist."
      action={
        <Button as={Link} to={paths.portal}>
          Back to dashboard
        </Button>
      }
      className="mt-10"
    />
  )
}
