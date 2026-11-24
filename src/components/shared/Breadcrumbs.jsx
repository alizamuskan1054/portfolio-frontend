import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ChevronRight, Home } from 'lucide-react'
import { clientsResource, portfoliosResource } from '@/api/endpoints'
import { cn } from '@/lib/utils'

// Segment ke labels. Jo yahan na ho wo "education" -> "Education" ban jata hai.
const LABELS = {
  portfolios: 'Portfolios',
  clients: 'Clients',
  templates: 'Templates',
  notifications: 'Notifications',
  settings: 'Settings',
  profile: 'Profile',
  account: 'Account',
  messages: 'Messages',
  new: 'New',
  edit: 'Edit',
  basic: 'Basic info',
  academic: 'Academic',
  content: 'Website content',
  contact: 'Contact & links',
  visibility: 'Visibility',
}
const SINGULAR = { portfolios: 'Portfolio', clients: 'Client' }
const HIDDEN = new Set(['items']) // /items/<section>/<id> mein "items" alag crumb nahi
const titleCase = (s) => s.replace(/[-_]/g, ' ').replace(/^\w/, (c) => c.toUpperCase())
const isId = (s) => /^\d+$/.test(s)

// Pages entity ka asli naam (client / portfolio title) crumb mein dikhane ke liye:
//   useBreadcrumbLabel(paths.portalPortfolio(id), portfolio?.title)
const BreadcrumbContext = createContext(null)

export function BreadcrumbProvider({ children }) {
  const [labels, setLabels] = useState({})
  const value = useMemo(
    () => ({
      labels,
      setLabel: (path, label) =>
        setLabels((prev) => {
          if (label) return prev[path] === label ? prev : { ...prev, [path]: label }
          if (!(path in prev)) return prev
          const rest = { ...prev }
          delete rest[path]
          return rest
        }),
    }),
    [labels],
  )
  return <BreadcrumbContext.Provider value={value}>{children}</BreadcrumbContext.Provider>
}

export function useBreadcrumbLabel(path, label) {
  const ctx = useContext(BreadcrumbContext)
  const setLabel = ctx?.setLabel
  useEffect(() => {
    if (!setLabel || !label) return undefined
    setLabel(path, label)
    return () => setLabel(path, null)
  }, [setLabel, path, label])
}

// base: '/admin' ya '/portal'. Dashboard par kuch nahi dikhta.
export function Breadcrumbs({ base, rootLabel = 'Dashboard', className }) {
  const { pathname } = useLocation()
  const ctx = useContext(BreadcrumbContext)

  const rest = pathname.replace(base, '').split('/').filter(Boolean)

  // /portfolios/<id> ya /clients/<id>: asli naam (title / full name) laate hain.
  // Query key portfolio ke apne page jaisi hai, isliye aksar cache se foran mil jata hai.
  const entityIndex = rest.findIndex(
    (seg, i) => isId(seg) && (rest[i - 1] === 'portfolios' || rest[i - 1] === 'clients'),
  )
  const entityKind = entityIndex > 0 ? rest[entityIndex - 1] : null
  const entityId = entityIndex > 0 ? rest[entityIndex] : null
  const entityResource = entityKind === 'clients' ? clientsResource : portfoliosResource
  const entity = useQuery({
    queryKey: entityResource.keys.detail(entityId),
    queryFn: () => entityResource.get(entityId),
    enabled: Boolean(entityId),
    retry: false,
    staleTime: 60_000,
  })
  const entityLabel = entity.data?.title || entity.data?.full_name || entity.data?.name

  if (rest.length === 0) return null

  const crumbs = []
  let acc = base
  rest.forEach((seg, i) => {
    acc = `${acc}/${seg}`
    if (HIDDEN.has(seg)) return
    const prev = rest[i - 1]
    let label
    if (isId(seg)) {
      label =
        ctx?.labels[acc] ||
        (i === entityIndex && entityLabel) ||
        (SINGULAR[prev] ? `${SINGULAR[prev]} #${seg}` : 'Edit')
    } else {
      label = LABELS[seg] || titleCase(decodeURIComponent(seg))
    }
    // Jin paths ka apna page nahi hota unhe link nahi banate
    const noPage =
      (base === '/admin' && prev === 'portfolios' && isId(seg)) ||
      rest[i - 1] === 'items' ||
      (rest[i - 2] === 'items' && isId(seg))
    crumbs.push({ label, to: acc, link: !noPage })
  })

  const all = [{ label: rootLabel, to: base, link: true, home: true }, ...crumbs]

  return (
    <nav aria-label="Breadcrumb" className={cn('mb-5', className)}>
      <ol className="text-muted flex flex-wrap items-center gap-1.5 text-sm">
        {all.map((c, i) => {
          const last = i === all.length - 1
          return (
            <li key={c.to} className="flex min-w-0 items-center gap-1.5">
              {i > 0 && <ChevronRight className="size-3.5 shrink-0 opacity-60" />}
              {last || !c.link ? (
                <span
                  aria-current={last ? 'page' : undefined}
                  className={cn('truncate', last && 'text-heading font-medium')}
                >
                  {c.label}
                </span>
              ) : (
                <Link
                  to={c.to}
                  className="hover:text-primary inline-flex items-center gap-1 truncate transition-colors"
                >
                  {c.home && <Home className="size-3.5" />}
                  {c.label}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
