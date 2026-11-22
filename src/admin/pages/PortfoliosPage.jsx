import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Copy,
  ExternalLink,
  EyeOff,
  FolderKanban,
  Globe,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react'
import { dashboardApi, portfoliosResource, templatesResource } from '@/api/endpoints'
import { useCrud } from '@/hooks/useCrud'
import { useDebounce } from '@/hooks/useDebounce'
import { usePagination } from '@/hooks/usePagination'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { DataTable } from '@/components/shared/DataTable'
import { EmptyState } from '@/components/shared/EmptyState'
import { FilterBar } from '@/components/shared/FilterBar'
import { PageHeader } from '@/components/shared/PageHeader'
import { SearchInput } from '@/components/shared/SearchInput'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { DropdownMenu } from '@/components/ui/DropdownMenu'
import { FilterTabs } from '@/components/ui/Tabs'
import { formatDate } from '@/lib/format'
import { notify } from '@/lib/notify'
import { paths } from '@/routes/paths'

const STATUS_BADGE = {
  published: { variant: 'success', label: 'Published' },
  draft: { variant: 'warning', label: 'Draft' },
  unpublished: { variant: 'danger', label: 'Unpublished' },
}

const toList = (data) => (Array.isArray(data) ? data : (data?.results ?? []))

function StatusBadge({ status }) {
  const badge = STATUS_BADGE[status]
  if (!badge) return <Badge>{status || '—'}</Badge>
  return (
    <Badge variant={badge.variant} dot>
      {badge.label}
    </Badge>
  )
}

export function PortfoliosPage() {
  const queryClient = useQueryClient()
  // Notification se aaye: ?highlight=<id>&q=<title> (us portfolio ka row highlight hota hai)
  const [searchParams] = useSearchParams()
  const highlightId = searchParams.get('highlight')
  const [search, setSearch] = useState(searchParams.get('q') ?? '')
  const debouncedSearch = useDebounce(search, 400)
  const [status, setStatus] = useState('')
  const { page, setPage, reset, pageSize } = usePagination()
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [unpublishTarget, setUnpublishTarget] = useState(null)

  // Server ko search/status bhejte hain; agar server ignore kare to neeche local filter bhi lagta hai
  const params = useMemo(
    () => ({
      page,
      search: debouncedSearch || undefined,
      status: status || undefined,
    }),
    [page, debouncedSearch, status],
  )
  const crud = useCrud(portfoliosResource, { params, label: 'Portfolio' })

  const rows = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase()
    return crud.items.filter((p) => {
      if (status && p.status !== status) return false
      if (!q) return true
      return [p.title, p.full_name, p.slug, p.designation].some((v) =>
        v?.toLowerCase().includes(q),
      )
    })
  }, [crud.items, status, debouncedSearch])

  // Template ka naam (portfolio mein sirf id aati hai)
  const templatesQuery = useQuery({
    queryKey: templatesResource.keys.list({}),
    queryFn: () => templatesResource.list(),
    retry: false,
  })
  const templateName = useMemo(
    () => Object.fromEntries(toList(templatesQuery.data).map((t) => [t.id, t.name])),
    [templatesQuery.data],
  )

  // Tab counts dashboard stats se
  const stats = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: dashboardApi.getStats,
  })
  const total = stats.data?.total_portfolios
  const published = stats.data?.published_portfolios
  const draft = stats.data?.draft_portfolios
  const hasStats = stats.isSuccess
  const tabs = [
    { value: '', label: 'All', count: total },
    { value: 'published', label: 'Published', count: published },
    { value: 'draft', label: 'Draft', count: draft },
    {
      value: 'unpublished',
      label: 'Unpublished',
      count: hasStats ? Math.max(0, total - published - draft) : undefined,
    },
  ]

  const statusMutation = useMutation({
    mutationFn: ({ id, action }) => portfoliosResource[action](id),
    onSuccess: (_, { action }) => {
      notify.success(
        action === 'publish' ? 'Portfolio published.' : 'Portfolio unpublished.',
      )
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: portfoliosResource.keys.all }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      ])
    },
    onError: (error) => notify.error(error),
  })
  const busyId = statusMutation.isPending ? statusMutation.variables?.id : null

  const confirmUnpublish = async () => {
    try {
      await statusMutation.mutateAsync({ id: unpublishTarget.id, action: 'unpublish' })
      setUnpublishTarget(null)
    } catch {
      /* toast onError mein */
    }
  }

  const confirmDelete = async () => {
    try {
      await crud.remove(deleteTarget.id)
      setDeleteTarget(null)
    } catch {
      /* toast useCrud ne dikha diya */
    }
  }

  const copyLink = async (p) => {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}${paths.site(p.slug)}`,
      )
      notify.success('Link copied.')
    } catch {
      notify.error('Could not copy the link.')
    }
  }

  const columns = useMemo(
    () => [
      {
        key: 'title',
        header: 'Portfolio',
        mobile: 'title',
        className: 'w-full max-w-0', // lamba text truncate ho, table chaura na ho
        cell: (p) => (
          <div className="flex min-w-0 items-center gap-3">
            <Avatar name={p.full_name || p.title} src={p.profile_photo} />
            <div className="min-w-0">
              <Link
                to={paths.adminPortfolioEdit(p.id)}
                className="text-heading hover:text-primary block truncate font-medium"
              >
                {p.title || p.full_name}
              </Link>
              <p className="text-muted truncate text-xs">
                {[p.full_name, p.designation].filter(Boolean).join(' · ')}
              </p>
            </div>
          </div>
        ),
      },
      {
        key: 'slug',
        header: 'Public link',
        cell: (p) => (
          <code className="bg-surface text-muted block max-w-44 truncate rounded px-1.5 py-0.5 text-xs">
            /{p.slug}
          </code>
        ),
      },
      {
        key: 'template',
        header: 'Template',
        className: 'hidden xl:table-cell',
        headerClassName: 'hidden xl:table-cell',
        cell: (p) => templateName[p.template] ?? '—',
      },
      { key: 'status', header: 'Status', cell: (p) => <StatusBadge status={p.status} /> },
      {
        key: 'published_at',
        header: 'Published',
        className: 'whitespace-nowrap text-muted',
        cell: (p) => formatDate(p.published_at),
      },
      {
        key: 'actions',
        header: '',
        align: 'right',
        cell: (p) => {
          const isPublished = p.status === 'published'
          return (
            <DropdownMenu
              label={`Actions for ${p.title || p.full_name}`}
              items={[
                { label: 'Edit', icon: Pencil, to: paths.adminPortfolioEdit(p.id) },
                ...(isPublished
                  ? [
                      {
                        label: 'View site',
                        icon: ExternalLink,
                        onClick: () =>
                          window.open(paths.site(p.slug), '_blank', 'noopener'),
                      },
                      { label: 'Copy link', icon: Copy, onClick: () => copyLink(p) },
                      {
                        label: 'Unpublish',
                        icon: EyeOff,
                        onClick: () => setUnpublishTarget(p),
                      },
                    ]
                  : [
                      {
                        label: busyId === p.id ? 'Publishing...' : 'Publish',
                        icon: Globe,
                        onClick: () =>
                          statusMutation.mutate({ id: p.id, action: 'publish' }),
                      },
                    ]),
                {
                  label: 'Delete',
                  icon: Trash2,
                  danger: true,
                  onClick: () => setDeleteTarget(p),
                },
              ]}
            />
          )
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [templateName, busyId],
  )

  const filtered = Boolean(status || debouncedSearch)
  const newButton = (
    <Button as={Link} to={paths.adminPortfolioNew}>
      <Plus className="size-4" /> Create portfolio
    </Button>
  )

  return (
    <>
      <PageHeader
        title="Portfolios"
        description="Build, publish and manage portfolio websites."
        actions={newButton}
      />

      <FilterTabs
        className="mb-4"
        options={tabs}
        value={status}
        onChange={(value) => {
          setStatus(value)
          reset()
        }}
      />

      <FilterBar>
        <SearchInput
          value={search}
          onChange={(value) => {
            setSearch(value)
            reset()
          }}
          placeholder="Search title, name or link..."
          className="sm:max-w-sm"
        />
      </FilterBar>

      <DataTable
        columns={columns}
        data={rows}
        loading={crud.isLoading}
        fetching={crud.isFetching}
        error={crud.isError ? crud.error : null}
        onRetry={crud.refetch}
        highlightId={highlightId}
        pagination={{ page, count: crud.count, pageSize, onPageChange: setPage }}
        empty={
          <EmptyState
            icon={FolderKanban}
            title={filtered ? 'No portfolios found' : 'No portfolios yet'}
            description={
              filtered
                ? 'Try a different search or status.'
                : 'Create the first portfolio website.'
            }
            action={filtered ? null : newButton}
          />
        }
      />

      <ConfirmDialog
        open={Boolean(unpublishTarget)}
        onClose={() => setUnpublishTarget(null)}
        onConfirm={confirmUnpublish}
        loading={statusMutation.isPending}
        title="Unpublish portfolio?"
        description={
          unpublishTarget
            ? `"${unpublishTarget.title || unpublishTarget.full_name}" will go offline. Visitors will no longer see /${unpublishTarget.slug}.`
            : ''
        }
        confirmLabel="Unpublish"
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        loading={crud.isDeleting}
        title="Delete portfolio?"
        description={
          deleteTarget
            ? `"${deleteTarget.title || deleteTarget.full_name}" and all its content will be permanently removed.`
            : ''
        }
        confirmLabel="Delete"
      />
    </>
  )
}
