import { useCallback, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { ChevronLeft, ChevronRight, PanelLeftClose } from 'lucide-react'
import { Brand } from '@/components/shared/Brand'
import { cn } from '@/lib/utils'

const STORAGE_KEY = 'sidebar-open'

// Desktop par sidebar khula/band. Choice browser mein yaad rehti hai (na mile to khula).
export function useSidebarOpen() {
  const [open, setOpen] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) !== 'false'
    } catch {
      return true
    }
  })
  const set = useCallback((next) => {
    setOpen(next)
    try {
      localStorage.setItem(STORAGE_KEY, String(next))
    } catch {
      /* storage na mile to bas is session mein */
    }
  }, [])
  return [open, set]
}

// Admin aur client portal dono ka sidebar.
// nav: [{ label, to, icon, end?, badge? }], counts: { [badge]: number }
// collapsed: sirf icons (desktop rail), warna icons + naam
export function AppSidebar({
  nav,
  counts = {},
  footer,
  collapsed = false,
  onNavigate,
  onClose,
}) {
  return (
    <div
      className={cn(
        'bg-navy flex h-full flex-col text-white transition-[width] duration-200',
        collapsed ? 'w-16' : 'w-64',
      )}
    >
      <div
        className={cn(
          'flex h-16 shrink-0 items-center border-b border-white/10',
          collapsed ? 'justify-center' : 'justify-between pr-3 pl-5',
        )}
      >
        <Brand inverted compact={collapsed} />
        {onClose && !collapsed && (
          <button
            type="button"
            aria-label="Close sidebar"
            onClick={onClose}
            className="inline-flex size-9 items-center justify-center rounded-lg text-white transition-colors hover:bg-white/10 lg:hidden"
          >
            <PanelLeftClose className="size-5" />
          </button>
        )}
      </div>

      <nav
        aria-label="Main"
        className="flex-1 space-y-1 overflow-x-hidden overflow-y-auto p-3"
      >
        {nav.map(({ label, to, icon: Icon, end, badge }) => {
          const count = badge ? (counts[badge] ?? 0) : 0
          return (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onNavigate}
              title={collapsed ? label : undefined}
              aria-label={collapsed ? label : undefined}
              className={({ isActive }) =>
                cn(
                  'relative flex items-center rounded-lg py-2.5 text-sm font-medium transition-colors',
                  collapsed ? 'justify-center px-0' : 'gap-3 px-3',
                  isActive
                    ? 'bg-background text-primary shadow-sm'
                    : 'text-white hover:bg-white/10',
                )
              }
            >
              <Icon className="size-5 shrink-0" />
              {!collapsed && label}
              {count > 0 &&
                (collapsed ? (
                  <span className="bg-danger absolute top-1.5 right-2 size-2.5 rounded-full ring-2 ring-[var(--color-navy)]" />
                ) : (
                  <span className="bg-danger ml-auto flex min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] leading-5 font-semibold text-white">
                    {count > 99 ? '99+' : count}
                  </span>
                ))}
            </NavLink>
          )
        })}
      </nav>

      {footer && !collapsed && (
        <p className="border-t border-white/10 p-4 text-xs text-white/70">{footer}</p>
      )}
    </div>
  )
}

// Sidebar ke kinare par chhota gol button (sirf desktop): open / close.
export function SidebarEdgeToggle({ open, onToggle }) {
  const Icon = open ? ChevronLeft : ChevronRight
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={open ? 'Collapse sidebar' : 'Expand sidebar'}
      title={open ? 'Collapse sidebar' : 'Expand sidebar'}
      className={cn(
        'border-line bg-background text-primary hover:bg-primary hover:text-on-primary fixed top-[52px] z-40 hidden size-6 -translate-x-1/2 items-center justify-center rounded-full border shadow-sm transition-[left,background-color,color] duration-200 lg:flex',
        open ? 'left-64' : 'left-16',
      )}
    >
      <Icon className="size-4" />
    </button>
  )
}
