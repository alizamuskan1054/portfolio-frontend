import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { ThemeToggle } from '@/components/shared/ThemeToggle'
import { paths } from '@/routes/paths'
import { cn } from '@/lib/utils'
import { usePublicSite } from '@/public/hooks/usePublicSite'
import { getVisibleNav } from '@/public/lib/nav'
import { Container } from './Container'
import { SiteLogo } from './SiteLogo'

// Sticky navbar. Light background.
// Hover aur active tab: text dark brown (text-heading, jo headings/writing ka rang hai) + halka blue pill.
// Dark mode mein text-heading khud cream ho jata hai, is liye wahan bhi saaf dikhta hai.
// Scroll par halka shadow + border aata hai. Navy hero/footer iske neeche aate hain.

const desktopLink = ({ isActive }) =>
  cn(
    'rounded-full px-4 py-2 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary',
    isActive
      ? 'bg-primary-soft font-semibold text-heading'
      : 'text-body hover:bg-primary-soft/60 hover:text-heading focus-visible:text-heading',
  )

const mobileLink = ({ isActive }) =>
  cn(
    'block rounded-xl px-4 py-3 text-base font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary',
    isActive
      ? 'bg-primary-soft font-semibold text-heading'
      : 'text-body hover:bg-primary-soft hover:text-heading focus-visible:text-heading',
  )

export function Navbar() {
  const { slug, portfolio, vis } = usePublicSite()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const items = getVisibleNav(slug, vis)
  const close = () => setOpen(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'sticky top-0 z-40 border-b backdrop-blur-md transition-all duration-300',
        scrolled ? 'border-line bg-background/85 shadow-sm' : 'border-transparent bg-background/70',
      )}
    >
      <Container className="flex h-16 items-center justify-between gap-4">
        <Link
          to={paths.site(slug)}
          onClick={close}
          className="group flex min-w-0 items-center gap-3"
          aria-label={`${portfolio.full_name} home`}
        >
          <SiteLogo logo={portfolio.logo} name={portfolio.full_name} className="transition-transform group-hover:scale-105" />
          <span className="truncate font-serif text-lg font-semibold text-heading">{portfolio.full_name}</span>
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          {items.map((item) => (
            <NavLink key={item.page} to={item.to} end={item.end} className={desktopLink}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <ThemeToggle />
          <button
            type="button"
            className="inline-flex size-10 items-center justify-center rounded-xl text-body transition-colors hover:bg-primary-soft hover:text-heading lg:hidden"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </Container>

      {open && (
        <nav id="mobile-menu" aria-label="Mobile" className="border-t border-line bg-background shadow-lg lg:hidden">
          <Container className="space-y-1 py-4">
            {items.map((item) => (
              <NavLink key={item.page} to={item.to} end={item.end} onClick={close} className={mobileLink}>
                {item.label}
              </NavLink>
            ))}
          </Container>
        </nav>
      )}
    </header>
  )
}