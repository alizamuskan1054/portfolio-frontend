import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowRight,
  ArrowUpRight,
  Bell,
  ExternalLink,
  FolderKanban,
  Globe,
  MessageSquare,
  PencilLine,
  Plus,
} from 'lucide-react'
import { toList } from '@/admin/sections'
import { useAuth } from '@/admin/auth'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { PageHeader } from '@/components/shared/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { notificationsResource } from '@/features/notifications/api'
import { formatNumber, formatRelative } from '@/lib/format'
import { cn } from '@/lib/utils'
import { messagesResource } from '@/portal/api'
import { usePortalMe } from '@/portal/hooks/usePortalMe'
import { paths } from '@/routes/paths'

// =====================================================================================
// PORTAL DASHBOARD (v2)
//   * Stat cards chhote (compact) aur poore clickable: icon + heading upar, count neeche.
//     StatCard (shared, bara) ki jagah is file ka MetricCard. Hover par uthta hai, count 0 se ginta hai.
//     Portfolios card par quota bar (count / limit).
//   * Panels compact: patla header, chhoti rows, hover highlight; messages panel par unread badge.
//   * Draft banner par rangeen patti. prefers-reduced-motion par animations band.
// =====================================================================================

const first = (m, keys) => keys.map((k) => m[k]).find((v) => v) || ''

// Is page ki hover/animation CSS (pd-*): alag CSS file mein kuch add nahi karna
const PD_CSS = `
@keyframes pd-rise { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }

.pd-metric { position: relative; display: block; overflow: hidden; padding: 0.875rem 1rem; border-radius: 0.875rem; text-decoration: none; color: inherit;
  border: 1px solid var(--c-line); background: var(--c-card); box-shadow: 0 1px 2px color-mix(in srgb, var(--c-navy) 6%, transparent);
  transition: transform .3s cubic-bezier(.2,.7,.2,1), box-shadow .3s, border-color .3s;
  animation: pd-rise .5s cubic-bezier(.2,.7,.2,1) both; animation-delay: var(--d, 0ms); }
.pd-metric::after { content: ""; position: absolute; left: 0; bottom: 0; width: 100%; height: 3px; transform: scaleX(0); transform-origin: left;
  background: linear-gradient(90deg, var(--c-primary), var(--c-accent)); transition: transform .45s cubic-bezier(.2,.7,.2,1); }
.pd-metric:hover { transform: translateY(-3px); border-color: color-mix(in srgb, var(--c-primary) 45%, var(--c-line));
  box-shadow: 0 16px 30px -22px var(--c-primary); }
.pd-metric:hover::after, .pd-metric:focus-visible::after { transform: scaleX(1); }
.pd-metric:focus-visible { outline: 2px solid var(--c-primary); outline-offset: 2px; }
.pd-icon { transition: transform .35s cubic-bezier(.2,.7,.2,1); }
.pd-metric:hover .pd-icon { transform: scale(1.08) rotate(-4deg); }
.pd-arrow { opacity: .55; transition: transform .25s, color .25s, opacity .25s; }
.pd-metric:hover .pd-arrow, .pd-metric:focus-visible .pd-arrow { transform: translate(2px, -2px); color: var(--c-primary); opacity: 1; }

.pd-banner { position: relative; overflow: hidden; }
.pd-banner::before { content: ""; position: absolute; left: 0; top: 0; bottom: 0; width: 4px; background: var(--c-warning); }

@media (prefers-reduced-motion: reduce) {
  .pd-metric { animation: none !important; }
  .pd-metric, .pd-icon, .pd-arrow, .pd-metric::after { transition: none !important; }
  .pd-metric:hover, .pd-metric:hover .pd-icon { transform: none; }
}
`

// 0 se target tak ginta hai (reduced-motion par seedha target)
function useCountUp(target, active, duration = 800) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!active) return undefined
    const number = Number(target) || 0
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || number === 0) {
      setValue(number)
      return undefined
    }
    let frame
    const start = performance.now()
    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1)
      setValue(number * (1 - Math.pow(1 - t, 3)))
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, active, duration])
  return value
}

// ---------- Stat card (compact, poora clickable) ----------
const TONES = {
  primary: 'bg-primary-soft text-primary',
  success: 'bg-success/15 text-success',
  warning: 'bg-warning/15 text-warning',
  accent: 'bg-accent/20 text-accent-text',
}

// Layout: [icon] Heading ↗ (upar), neeche count (suffix jaise " / 5" ke saath), optional patli progress bar.
function MetricCard({ icon: Icon, tone = 'primary', label, value, suffix = '', loading, to, progress, index = 0 }) {
  const counted = useCountUp(value, !loading)

  return (
    <Link
      to={to}
      className="pd-metric group"
      style={{ '--d': `${index * 60}ms` }}
      aria-label={`${label}: ${loading ? 'loading' : `${formatNumber(value ?? 0)}${suffix}`}. Open ${label.toLowerCase()}`}
    >
      <div className="flex items-center gap-2.5">
        <span className={cn('pd-icon flex size-9 shrink-0 items-center justify-center rounded-lg', TONES[tone])}>
          <Icon className="size-[1.125rem]" />
        </span>
        <p className="text-heading min-w-0 flex-1 truncate text-sm font-semibold">{label}</p>
        <ArrowUpRight className="pd-arrow text-muted size-4 shrink-0" aria-hidden="true" />
      </div>

      <div className="mt-2.5">
        {loading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <p className="text-heading font-serif text-3xl leading-none font-semibold tabular-nums">
            {formatNumber(Math.round(counted))}
            {suffix && <span className="text-muted ml-1 font-sans text-base font-medium">{suffix}</span>}
          </p>
        )}
      </div>

      {progress !== undefined && (
        <div className="bg-surface mt-3 h-1.5 overflow-hidden rounded-full" aria-hidden="true">
          <div
            className="bg-primary h-full rounded-full transition-all duration-700"
            style={{ width: `${progress}%`, background: 'linear-gradient(90deg, var(--c-primary), var(--c-accent))' }}
          />
        </div>
      )}
    </Link>
  )
}

// ---------- Panel ----------
function Panel({ title, to, linkLabel = 'View all', badge, children, className }) {
  return (
    <Card className={cn('flex flex-col overflow-hidden', className)}>
      <div className="border-line flex items-center justify-between gap-3 border-b px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <h2 className="truncate text-base">{title}</h2>
          {badge}
        </div>
        {to && (
          <Link
            to={to}
            className="text-primary inline-flex shrink-0 items-center gap-1 text-sm font-medium hover:underline"
          >
            {linkLabel}
            <ArrowRight className="size-3.5" />
          </Link>
        )}
      </div>
      {children}
    </Card>
  )
}

function ListSkeleton({ rows = 3 }) {
  return (
    <div className="space-y-3 p-4" aria-busy="true">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-10" />
      ))}
    </div>
  )
}

function PortfolioRow({ portfolio }) {
  const published = portfolio.status === 'published'
  return (
    <li className="hover:bg-primary-soft/40 flex flex-wrap items-center gap-3 px-4 py-3 transition-colors">
      <div className="min-w-0 flex-1">
        <p className="text-heading truncate font-medium">
          {portfolio.title || 'Untitled'}
        </p>
        <p className="text-muted truncate text-sm">/{portfolio.slug}</p>
      </div>
      <Badge variant={published ? 'success' : 'warning'} dot>
        {published ? 'Published' : 'Draft'}
      </Badge>
      <div className="flex gap-2">
        <Button as={Link} to={paths.portalPortfolio(portfolio.id)} size="sm">
          {published ? 'Manage' : 'Continue'}
        </Button>
        {published && (
          <Button
            as="a"
            href={paths.site(portfolio.slug)}
            target="_blank"
            rel="noreferrer"
            variant="secondary"
            size="sm"
            aria-label="View site"
          >
            <ExternalLink className="size-4" />
          </Button>
        )}
      </div>
    </li>
  )
}

function RecentMessages({ titles, unread }) {
  const params = { page_size: 5 }
  const { data, isPending } = useQuery({
    queryKey: messagesResource.keys.list(params),
    queryFn: () => messagesResource.list(params),
  })
  const items = toList(data).slice(0, 5)

  return (
    <Panel
      title="Recent messages"
      to={paths.portalMessages}
      badge={unread > 0 ? <Badge variant="primary">{unread} new</Badge> : null}
    >
      {isPending ? (
        <ListSkeleton />
      ) : items.length === 0 ? (
        <p className="text-muted px-4 py-6 text-center text-sm">
          No messages yet. Visitors who contact you will show up here.
        </p>
      ) : (
        <ul className="divide-line divide-y">
          {items.map((m) => {
            const isUnread = m.is_read === false
            return (
              <li key={m.id}>
                <Link
                  to={paths.portalMessages}
                  className="hover:bg-primary-soft/40 flex items-start gap-3 px-4 py-2.5 transition-colors"
                >
                  <span
                    className={cn(
                      'mt-2 size-2 shrink-0 rounded-full',
                      isUnread ? 'bg-primary' : 'bg-transparent',
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span
                        className={cn('text-heading truncate text-sm', isUnread && 'font-semibold')}
                      >
                        {first(m, ['name', 'sender_name', 'full_name']) || 'Anonymous'}
                      </span>
                      <span className="text-muted shrink-0 text-xs">
                        {formatRelative(m.created_at)}
                      </span>
                    </div>
                    <p className="text-muted truncate text-sm">
                      {first(m, ['subject', 'message', 'body', 'content'])}
                    </p>
                    {titles[String(m.portfolio)] && (
                      <p className="text-muted/80 truncate text-xs">
                        {titles[String(m.portfolio)]}
                      </p>
                    )}
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </Panel>
  )
}

function RecentNotifications() {
  const params = { page_size: 5 }
  const { data, isPending } = useQuery({
    queryKey: notificationsResource.keys.list(params),
    queryFn: () => notificationsResource.list(params),
    retry: false,
  })
  const items = toList(data).slice(0, 5)

  return (
    <Panel title="Notifications" to={paths.portalNotifications}>
      {isPending ? (
        <ListSkeleton />
      ) : items.length === 0 ? (
        <p className="text-muted px-4 py-6 text-center text-sm">You are all caught up.</p>
      ) : (
        <ul className="divide-line divide-y">
          {items.map((n) => (
            <li key={n.id}>
              <Link
                to={paths.portalNotifications}
                className="hover:bg-primary-soft/40 flex items-start gap-3 px-4 py-2.5 transition-colors"
              >
                <span
                  className={cn(
                    'mt-2 size-2 shrink-0 rounded-full',
                    n.is_read === false ? 'bg-primary' : 'bg-transparent',
                  )}
                />
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      'text-heading truncate text-sm',
                      n.is_read === false && 'font-semibold',
                    )}
                  >
                    {n.title || n.message || n.body}
                  </p>
                  <p className="text-muted text-xs">{formatRelative(n.created_at)}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}

export function DashboardPage() {
  const { user } = useAuth()
  const { data, isPending, isError, refetch } = usePortalMe()

  if (isError) return <ErrorState onRetry={refetch} />

  const portfolios = data?.portfolios ?? []
  const limit = data?.portfolio_limit ?? 5
  const count = data?.portfolio_count ?? portfolios.length
  const published = portfolios.filter((p) => p.status === 'published').length
  const drafts = portfolios.length - published
  const unreadMessages = data?.unread_messages_count ?? 0
  const titles = Object.fromEntries(portfolios.map((p) => [String(p.id), p.title]))
  const firstName = (user?.full_name || '').split(' ')[0]
  const full = count >= limit
  const quota = limit > 0 ? Math.min(100, Math.round((count / limit) * 100)) : 0

  const newButton = (
    <Button as={Link} to={paths.portalPortfolioNew} disabled={full}>
      <Plus className="size-4" />
      New portfolio
    </Button>
  )

  return (
    <>
      <style>{PD_CSS}</style>

      <PageHeader
        title={firstName ? `Welcome back, ${firstName}` : 'Dashboard'}
        description="Here is what is happening with your portfolios."
        actions={newButton}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          index={0}
          icon={FolderKanban}
          label="Portfolios"
          value={count}
          suffix={`/ ${limit}`}
          progress={isPending ? undefined : quota}
          loading={isPending}
          to={paths.portalPortfolios}
        />
        <MetricCard
          index={1}
          icon={Globe}
          tone="success"
          label="Published"
          value={published}
          loading={isPending}
          to={paths.portalPortfolios}
        />
        <MetricCard
          index={2}
          icon={PencilLine}
          tone="warning"
          label="Drafts"
          value={drafts}
          loading={isPending}
          to={paths.portalPortfolios}
        />
        <MetricCard
          index={3}
          icon={MessageSquare}
          tone="accent"
          label="Unread messages"
          value={unreadMessages}
          loading={isPending}
          to={paths.portalMessages}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Panel
            title="Your portfolios"
            to={paths.portalPortfolios}
            linkLabel="Manage all"
          >
            {isPending ? (
              <ListSkeleton />
            ) : portfolios.length === 0 ? (
              <EmptyState
                icon={FolderKanban}
                title="No portfolios yet"
                description="Create your first portfolio to get started."
                action={newButton}
                className="border-0"
              />
            ) : (
              <ul className="divide-line divide-y">
                {portfolios.map((p) => (
                  <PortfolioRow key={p.id} portfolio={p} />
                ))}
              </ul>
            )}
          </Panel>

          {drafts > 0 && (
            <Card className="pd-banner border-warning/40 bg-warning/5 flex items-start gap-3 py-4 pr-4 pl-5">
              <Bell className="text-warning mt-0.5 size-5 shrink-0" />
              <div>
                <p className="text-heading font-medium">
                  {drafts === 1
                    ? '1 portfolio is still a draft'
                    : `${drafts} portfolios are still drafts`}
                </p>
                <p className="text-muted text-sm">
                  Finish the steps and publish from Review &amp; publish to make it
                  visible on the web.
                </p>
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <RecentMessages titles={titles} unread={unreadMessages} />
          <RecentNotifications />
        </div>
      </div>
    </>
  )
}