import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowRight,
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
import { StatCard } from '@/components/shared/StatCard'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { notificationsResource } from '@/features/notifications/api'
import { formatRelative } from '@/lib/format'
import { cn } from '@/lib/utils'
import { messagesResource } from '@/portal/api'
import { usePortalMe } from '@/portal/hooks/usePortalMe'
import { paths } from '@/routes/paths'

const first = (m, keys) => keys.map((k) => m[k]).find((v) => v) || ''

function Panel({ title, to, linkLabel = 'View all', children, className }) {
  return (
    <Card className={cn('flex flex-col', className)}>
      <div className="border-line flex items-center justify-between gap-3 border-b px-5 py-4">
        <h2 className="text-lg">{title}</h2>
        {to && (
          <Link
            to={to}
            className="text-primary inline-flex items-center gap-1 text-sm font-medium hover:underline"
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
    <div className="space-y-3 p-5" aria-busy="true">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-10" />
      ))}
    </div>
  )
}

function PortfolioRow({ portfolio }) {
  const published = portfolio.status === 'published'
  return (
    <li className="flex flex-wrap items-center gap-3 px-5 py-4">
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

function RecentMessages({ titles }) {
  const params = { page_size: 5 }
  const { data, isPending } = useQuery({
    queryKey: messagesResource.keys.list(params),
    queryFn: () => messagesResource.list(params),
  })
  const items = toList(data).slice(0, 5)

  return (
    <Panel title="Recent messages" to={paths.portalMessages}>
      {isPending ? (
        <ListSkeleton />
      ) : items.length === 0 ? (
        <p className="text-muted px-5 py-8 text-center text-sm">
          No messages yet. Visitors who contact you will show up here.
        </p>
      ) : (
        <ul className="divide-line divide-y">
          {items.map((m) => {
            const unread = m.is_read === false
            return (
              <li key={m.id}>
                <Link
                  to={paths.portalMessages}
                  className="hover:bg-primary-soft/40 flex items-start gap-3 px-5 py-3 transition-colors"
                >
                  <span
                    className={cn(
                      'mt-2 size-2 shrink-0 rounded-full',
                      unread ? 'bg-primary' : 'bg-transparent',
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span
                        className={cn('text-heading truncate', unread && 'font-semibold')}
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
        <p className="text-muted px-5 py-8 text-center text-sm">You are all caught up.</p>
      ) : (
        <ul className="divide-line divide-y">
          {items.map((n) => (
            <li key={n.id}>
              <Link
                to={paths.portalNotifications}
                className="hover:bg-primary-soft/40 flex items-start gap-3 px-5 py-3 transition-colors"
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

  const newButton = (
    <Button as={Link} to={paths.portalPortfolioNew} disabled={full}>
      <Plus className="size-4" />
      New portfolio
    </Button>
  )

  return (
    <>
      <PageHeader
        title={firstName ? `Welcome back, ${firstName}` : 'Dashboard'}
        description="Here is what is happening with your portfolios."
        actions={newButton}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={FolderKanban}
          label="Portfolios"
          value={`${count} / ${limit}`}
          loading={isPending}
        />
        <StatCard icon={Globe} label="Published" value={published} loading={isPending} />
        <StatCard icon={PencilLine} label="Drafts" value={drafts} loading={isPending} />
        <StatCard
          icon={MessageSquare}
          label="Unread messages"
          value={unreadMessages}
          loading={isPending}
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
            <Card className="border-warning/40 bg-warning/5 flex items-start gap-3 p-5">
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
          <RecentMessages titles={titles} />
          <RecentNotifications />
        </div>
      </div>
    </>
  )
}
