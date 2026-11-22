import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronDown, Mail, MessageSquare } from 'lucide-react'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { PageHeader } from '@/components/shared/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import { FilterTabs } from '@/components/ui/Tabs'
import { Skeleton } from '@/components/ui/Skeleton'
import { toList } from '@/admin/sections'
import { formatDateTime, formatRelative } from '@/lib/format'
import { notify } from '@/lib/notify'
import { cn } from '@/lib/utils'
import { messagesResource } from '@/portal/api'
import { PORTAL_ME_KEY, usePortalMe } from '@/portal/hooks/usePortalMe'

// Backend ke field names thore alag ho sakte hain: pehla jo mile wahi
const pick = (m, keys) =>
  keys.map((k) => m[k]).find((v) => v !== undefined && v !== null && v !== '')
const senderOf = (m) => pick(m, ['name', 'sender_name', 'full_name']) || 'Anonymous'
const emailOf = (m) => pick(m, ['email', 'sender_email'])
const bodyOf = (m) => pick(m, ['message', 'body', 'content']) || ''

function MessageCard({ message, portfolioTitle, onOpen }) {
  const [open, setOpen] = useState(false)
  const unread = message.is_read === false
  const email = emailOf(message)

  return (
    <Card className={cn('overflow-hidden', unread && 'border-primary/40')}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => {
          setOpen((o) => !o)
          if (!open && unread) onOpen(message)
        }}
        className="hover:bg-primary-soft/40 flex w-full items-start gap-3 p-4 text-left transition-colors"
      >
        <span
          className={cn(
            'mt-1.5 size-2.5 shrink-0 rounded-full',
            unread ? 'bg-primary' : 'bg-transparent',
          )}
          aria-label={unread ? 'Unread' : undefined}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className={cn('text-heading truncate', unread && 'font-semibold')}>
              {senderOf(message)}
            </span>
            {portfolioTitle && (
              <Badge variant="neutral" size="sm">
                {portfolioTitle}
              </Badge>
            )}
            <span
              className="text-muted ml-auto text-xs"
              title={formatDateTime(message.created_at)}
            >
              {formatRelative(message.created_at)}
            </span>
          </div>
          {message.subject && (
            <p className={cn('text-body truncate text-sm', unread && 'font-medium')}>
              {message.subject}
            </p>
          )}
          {!open && <p className="text-muted truncate text-sm">{bodyOf(message)}</p>}
        </div>
        <ChevronDown
          className={cn(
            'text-muted mt-1 size-4 shrink-0 transition-transform',
            open && 'rotate-180',
          )}
        />
      </button>

      {open && (
        <div className="border-line space-y-3 border-t px-4 py-4 pl-9">
          <p className="text-body text-sm whitespace-pre-wrap">{bodyOf(message)}</p>
          {email && (
            <a
              href={`mailto:${email}${message.subject ? `?subject=Re: ${encodeURIComponent(message.subject)}` : ''}`}
              className="text-primary inline-flex items-center gap-2 text-sm font-medium hover:underline"
            >
              <Mail className="size-4" /> Reply to {email}
            </a>
          )}
        </div>
      )}
    </Card>
  )
}

export function MessagesPage() {
  const queryClient = useQueryClient()
  const me = usePortalMe()
  const [portfolio, setPortfolio] = useState('')
  const [filter, setFilter] = useState('all')

  const params = { page_size: 100, ...(portfolio ? { portfolio } : {}) }
  const query = useQuery({
    queryKey: messagesResource.keys.list(params),
    queryFn: () => messagesResource.list(params),
  })

  const titles = useMemo(
    () =>
      Object.fromEntries((me.data?.portfolios ?? []).map((p) => [String(p.id), p.title])),
    [me.data],
  )

  const markRead = useMutation({
    mutationFn: (m) => messagesResource.update(m.id, { is_read: true }),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: messagesResource.keys.all }),
        queryClient.invalidateQueries({ queryKey: PORTAL_ME_KEY }), // bell ka count
      ]),
    onError: (e) => notify.error(e),
  })

  const all = toList(query.data)
  const unreadCount = all.filter((m) => m.is_read === false).length
  const shown = all.filter((m) => filter === 'all' || m.is_read === false)

  return (
    <>
      <PageHeader
        title="Messages"
        description="Messages sent through the contact form on your websites."
        actions={
          (me.data?.portfolios?.length ?? 0) > 1 && (
            <div className="w-56">
              <Select
                aria-label="Filter by portfolio"
                value={portfolio}
                onChange={(e) => setPortfolio(e.target.value)}
                placeholder="All portfolios"
              >
                {me.data.portfolios.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </Select>
            </div>
          )
        }
      />

      <FilterTabs
        className="mb-5"
        value={filter}
        onChange={setFilter}
        options={[
          { value: 'all', label: 'All' },
          { value: 'unread', label: unreadCount ? `Unread (${unreadCount})` : 'Unread' },
        ]}
      />

      {query.isPending ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={query.refetch} />
      ) : shown.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title={filter === 'unread' ? 'No unread messages' : 'No messages yet'}
          description="When a visitor contacts you through your website, the message shows up here."
        />
      ) : (
        <div className="space-y-3">
          {shown.map((m) => (
            <MessageCard
              key={m.id}
              message={m}
              portfolioTitle={
                me.data?.portfolios?.length > 1 ? titles[String(m.portfolio)] : null
              }
              onOpen={(msg) => markRead.mutate(msg)}
            />
          ))}
        </div>
      )}
    </>
  )
}
