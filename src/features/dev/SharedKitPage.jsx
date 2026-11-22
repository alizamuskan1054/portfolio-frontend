// DEV-ONLY: /dev/shared. Shared components + useCrud ka LIVE test (real /clients/ API).
import { useMemo, useState } from 'react'
import { FileText, FolderOpen, Globe, Plus, Trash2, Users } from 'lucide-react'
import { useCrud } from '@/hooks/useCrud'
import { useDebounce } from '@/hooks/useDebounce'
import { usePagination } from '@/hooks/usePagination'
import { clientsResource } from '@/api/endpoints'
import { formatDate, formatRelative } from '@/lib/format'
import { notify } from '@/lib/notify'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { CopyButton } from '@/components/shared/CopyButton'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { FilterBar } from '@/components/shared/FilterBar'
import { ImageUploader } from '@/components/shared/ImageUploader'
import { PageHeader } from '@/components/shared/PageHeader'
import { Pagination } from '@/components/shared/Pagination'
import { SearchInput } from '@/components/shared/SearchInput'
import { StatCard } from '@/components/shared/StatCard'
import { paths } from '@/routes/paths'

// Module level: render ke dauran impure call nahi (react-hooks lint rule)
const THREE_HOURS_AGO = new Date(Date.now() - 3 * 3600 * 1000)

function Section({ title, children }) {
  return (
    <section className="space-y-4">
      <h2 className="text-2xl">{title}</h2>
      {children}
    </section>
  )
}

function LiveClients() {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 400)
  const { page, setPage, reset, pageSize } = usePagination()
  const [target, setTarget] = useState(null)

  const params = useMemo(() => ({ search: debouncedSearch || undefined, page }), [debouncedSearch, page])
  const crud = useCrud(clientsResource, { params, label: 'Client' })

  const addDemo = () =>
    crud
      .create({
        full_name: `Demo Client ${Math.floor(Math.random() * 1000)}`,
        email: `demo${Date.now()}@example.com`,
        profession: 'Researcher',
      })
      .catch((error) => {
        // Field validation errors toast nahi hote: demo mein yahin dikha dete hain
        if (error.errors) notify.error(JSON.stringify(error.errors))
      })

  const confirmDelete = async () => {
    try {
      await crud.remove(target.id)
      setTarget(null)
    } catch {
      /* toast useCrud ne dikha diya */
    }
  }

  return (
    <>
      <FilterBar>
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v)
            reset()
          }}
          placeholder="Search clients..."
        />
        <Button className="sm:ml-auto" onClick={addDemo} loading={crud.isCreating}>
          <Plus className="size-4" /> Add demo client
        </Button>
      </FilterBar>

      {crud.isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : crud.isError ? (
        <ErrorState message={crud.error?.message} onRetry={crud.refetch} />
      ) : crud.items.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No clients found"
          description={debouncedSearch ? 'Try a different search.' : 'Add your first client to get started.'}
        />
      ) : (
        <Card className={crud.isFetching ? 'opacity-70 transition-opacity' : 'transition-opacity'}>
          <ul className="divide-y divide-line">
            {crud.items.map((client) => (
              <li key={client.id} className="flex items-center gap-4 p-4">
                <Avatar name={client.full_name} src={client.photo ?? client.profile_photo} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-heading">{client.full_name}</p>
                  <p className="truncate text-sm text-muted">{client.email}</p>
                </div>
                {client.portfolio_status && (
                  <Badge variant={client.portfolio_status === 'published' ? 'success' : 'warning'} dot>
                    {client.portfolio_status}
                  </Badge>
                )}
                <span className="hidden text-sm text-muted sm:block">{formatDate(client.created_at)}</span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Delete ${client.full_name}`}
                  onClick={() => setTarget(client)}
                >
                  <Trash2 className="size-4 text-danger" />
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Pagination page={page} count={crud.count} pageSize={pageSize} onPageChange={setPage} className="mt-4" />

      <ConfirmDialog
        open={Boolean(target)}
        onClose={() => setTarget(null)}
        onConfirm={confirmDelete}
        loading={crud.isDeleting}
        title="Delete client?"
        description={target ? `${target.full_name} will be permanently removed.` : ''}
        confirmLabel="Delete"
      />
    </>
  )
}

export default function SharedKitPage() {
  const [photo, setPhoto] = useState(null)
  const [cover, setCover] = useState(null)
  const [showLoading, setShowLoading] = useState(false)

  return (
    <main className="mx-auto max-w-5xl space-y-12 px-6 py-10">
      <PageHeader
        title="Shared components"
        description="Dev-only page. Neeche Clients wala section real backend se chalta hai."
        backTo={paths.admin}
        backLabel="Back to dashboard"
        actions={
          <Button variant="secondary" onClick={() => setShowLoading((v) => !v)}>
            Toggle stat loading
          </Button>
        }
      />

      <Section title="Stat cards">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Users} label="Clients" value={1240} loading={showLoading} />
          <StatCard icon={FolderOpen} label="Portfolios" value={8} loading={showLoading} />
          <StatCard icon={Globe} label="Published" value={5} hint="2 this month" loading={showLoading} />
          <StatCard icon={FileText} label="Draft" value={3} loading={showLoading} />
        </div>
      </Section>

      <Section title="Empty, Error, Copy, Dates">
        <div className="grid gap-4 md:grid-cols-2">
          <EmptyState
            title="No portfolios yet"
            description="Create your first portfolio to see it here."
            action={<Button><Plus className="size-4" /> Create Portfolio</Button>}
          />
          <ErrorState onRetry={() => notify.info('Retry clicked')} />
        </div>
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <code className="rounded bg-surface px-2 py-1">https://site.com/dr-ahmad</code>
          <CopyButton text="https://site.com/dr-ahmad" />
          <CopyButton text="https://site.com/dr-ahmad" label="Copy URL" variant="secondary" />
          <span className="text-muted">
            {formatDate('2024-05-20T10:00:00Z')} · {formatRelative(THREE_HOURS_AGO)}
          </span>
        </div>
      </Section>

      <Section title="Image uploader">
        <div className="flex flex-wrap items-start gap-10">
          <ImageUploader shape="circle" label="Profile photo" value={photo} onChange={setPhoto} />
          <ImageUploader shape="wide" label="Cover image" value={cover} onChange={setCover} />
        </div>
        <p className="text-sm text-muted">
          Selected: {photo ? photo.name : 'none'} / {cover ? cover.name : 'none'}
        </p>
      </Section>

      <Section title="LIVE: useCrud + Pagination + Search (/api/clients/)">
        <LiveClients />
      </Section>
    </main>
  )
}