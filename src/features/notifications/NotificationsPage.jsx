import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Bell, CheckCheck, FolderKanban, MessageSquare } from 'lucide-react'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { toList } from '@/admin/sections'
import { formatRelative } from '@/lib/format'
import { notify } from '@/lib/notify'
import { cn } from '@/lib/utils'
import { notificationsApi, notificationsResource } from './api'
import { NOTIF_COUNT_KEY } from './useUnreadNotifications'

// portfolio sirf id ho ya { id, title, slug } object: dono chalte hain
const portfolioTitleOf = (n) =>
  n.portfolio_title ?? (typeof n.portfolio === 'object' ? n.portfolio?.title : undefined)
const portfolioIdOf = (n) =>
  typeof n.portfolio === 'object' ? n.portfolio?.id : n.portfolio
const isMessage = (n) => /message/i.test(String(n.kind ?? n.type ?? ''))

// portfolioPath(id, title): portfolio ka page (admin ya portal ka). messagesPath: sirf portal mein hai.
export function NotificationsPage({ portfolioPath, messagesPath }) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const query = useQuery({
    queryKey: notificationsResource.keys.list({}),
    queryFn: () => notificationsResource.list({ page_size: 50 }),
    retry: false,
  })

  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: notificationsResource.keys.all }),
      queryClient.invalidateQueries({ queryKey: NOTIF_COUNT_KEY }),
    ])

  const markRead = useMutation({
    mutationFn: (n) => notificationsApi.markRead(n.id),
    onSuccess: refresh,
  })
  const markAll = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: refresh,
    onError: (e) => notify.error(e),
  })

  const open = (n) => {
    if (n.is_read === false) markRead.mutate(n)
    if (isMessage(n) && messagesPath) navigate(messagesPath)
    else if (portfolioIdOf(n) && portfolioPath)
      navigate(portfolioPath(portfolioIdOf(n), portfolioTitleOf(n)))
  }

  // Endpoint abhi backend mein na ho (404) to khali dikhao, error nahi
  const notFound = query.isError && query.error?.status === 404
  const items = notFound ? [] : toList(query.data)
  const unread = items.filter((n) => n.is_read === false).length

  return (
    <>
      <PageHeader
        title="Notifications"
        description="Updates about your portfolios and messages."
        actions={
          unread > 0 && (
            <Button
              variant="secondary"
              onClick={() => markAll.mutate()}
              loading={markAll.isPending}
            >
              <CheckCheck className="size-4" /> Mark all as read
            </Button>
          )
        }
      />

      {query.isPending ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : query.isError && !notFound ? (
        <ErrorState error={query.error} onRetry={query.refetch} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications"
          description="You are all caught up. New activity shows up here."
        />
      ) : (
        <div className="space-y-3">
          {items.map((n) => {
            const unreadItem = n.is_read === false
            const Icon = isMessage(n) ? MessageSquare : FolderKanban
            return (
              <Card key={n.id} className={cn(unreadItem && 'border-primary/40')}>
                <button
                  type="button"
                  onClick={() => open(n)}
                  className="hover:bg-primary-soft/40 flex w-full items-start gap-3 rounded-xl p-4 text-left transition-colors"
                >
                  <span className="bg-primary-soft text-primary flex size-9 shrink-0 items-center justify-center rounded-lg">
                    <Icon className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className={cn('text-heading block', unreadItem && 'font-semibold')}
                    >
                      {n.title ?? n.message}
                    </span>
                    {n.body && <span className="text-muted block text-sm">{n.body}</span>}
                    <span className="text-muted mt-1 block text-xs">
                      {formatRelative(n.created_at)}
                    </span>
                  </span>
                  {unreadItem && (
                    <span
                      className="bg-primary mt-2 size-2.5 shrink-0 rounded-full"
                      aria-label="Unread"
                    />
                  )}
                </button>
              </Card>
            )
          })}
        </div>
      )}
    </>
  )
}
