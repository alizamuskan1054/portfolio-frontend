import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Building2,
  ExternalLink,
  FolderKanban,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Trash2,
  UserRound,
} from 'lucide-react'
import { clientsResource, portfoliosResource } from '@/api/endpoints'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { PageHeader } from '@/components/shared/PageHeader'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatDate } from '@/lib/format'
import { notify } from '@/lib/notify'
import { paths } from '@/routes/paths'
import { ClientFormModal } from './ClientsPage'
import { PortalAccessCard } from './PortalAccessCard'

const STATUS = {
  published: { variant: 'success', label: 'Published' },
  draft: { variant: 'warning', label: 'Draft' },
  unpublished: { variant: 'danger', label: 'Unpublished' },
}

const toList = (data) => (Array.isArray(data) ? data : (data?.results ?? []))

function InfoRow({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start gap-3 py-3">
      <span className="bg-primary-soft text-primary flex size-9 shrink-0 items-center justify-center rounded-lg">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="text-muted text-xs">{label}</p>
        <div className="text-heading text-sm break-words">{children || '—'}</div>
      </div>
    </div>
  )
}

export function ClientDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const client = useQuery({
    queryKey: clientsResource.keys.detail(id),
    queryFn: () => clientsResource.get(id),
  })

  // Server `client` filter na bhi kare to neeche local filter lagta hai
  const portfolios = useQuery({
    queryKey: portfoliosResource.keys.list({ client: id }),
    queryFn: () => portfoliosResource.list({ client: id }),
  })
  const myPortfolios = useMemo(
    () => toList(portfolios.data).filter((p) => String(p.client) === String(id)),
    [portfolios.data, id],
  )

  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: clientsResource.keys.all }),
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
    ])

  const update = useMutation({
    mutationFn: (payload) => clientsResource.update(id, payload),
    onSuccess: () => {
      notify.success('Client updated.')
      return refresh()
    },
  })
  const remove = useMutation({
    mutationFn: () => clientsResource.remove(id),
    onSuccess: async () => {
      notify.success('Client deleted.')
      await refresh()
      navigate(paths.adminClients, { replace: true })
    },
    onError: (e) => notify.error(e),
  })

  if (client.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-80" />
          <Skeleton className="h-80 lg:col-span-2" />
        </div>
      </div>
    )
  }
  if (client.isError) return <ErrorState error={client.error} onRetry={client.refetch} />

  const c = client.data
  const newPortfolio = `${paths.adminPortfolioNew}?client=${c.id}`

  return (
    <>
      <PageHeader
        backTo={paths.adminClients}
        backLabel="Back to clients"
        title={c.full_name}
        description={[c.profession, c.organization].filter(Boolean).join(' · ')}
        actions={
          <>
            <Button variant="secondary" onClick={() => setEditing(true)}>
              <Pencil className="size-4" /> Edit
            </Button>
            <Button variant="danger" onClick={() => setDeleting(true)}>
              <Trash2 className="size-4" /> Delete
            </Button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6">
          <PortalAccessCard client={c} />
          <Card className="h-fit">
            <CardContent>
              <div className="flex flex-col items-center gap-3 pb-4 text-center">
                <Avatar
                  name={c.full_name}
                  src={c.profile_photo}
                  size="lg"
                  className="size-24 text-2xl"
                />
                <div>
                  <p className="text-heading text-lg font-semibold">{c.full_name}</p>
                  <p className="text-muted text-sm">Added {formatDate(c.created_at)}</p>
                </div>
              </div>
              <div className="divide-line border-line divide-y border-t">
                <InfoRow icon={Mail} label="Email">
                  {c.email && (
                    <a
                      href={`mailto:${c.email}`}
                      className="text-primary hover:underline"
                    >
                      {c.email}
                    </a>
                  )}
                </InfoRow>
                <InfoRow icon={Phone} label="Phone">
                  {c.phone}
                </InfoRow>
                <InfoRow icon={UserRound} label="Profession">
                  {c.profession}
                </InfoRow>
                <InfoRow icon={Building2} label="Organization">
                  {c.organization}
                </InfoRow>
                <InfoRow icon={MapPin} label="Location">
                  {c.location}
                </InfoRow>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="lg:col-span-2">
          <CardHeader
            title="Portfolios"
            description="Websites built for this client."
            action={
              <Button as={Link} to={newPortfolio} size="sm">
                <Plus className="size-4" /> New portfolio
              </Button>
            }
          />
          <CardContent>
            {portfolios.isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
              </div>
            ) : portfolios.isError ? (
              <ErrorState error={portfolios.error} onRetry={portfolios.refetch} />
            ) : myPortfolios.length === 0 ? (
              <EmptyState
                icon={FolderKanban}
                title="No portfolio yet"
                description="Create a portfolio website for this client."
                action={
                  <Button as={Link} to={newPortfolio}>
                    <Plus className="size-4" /> Create portfolio
                  </Button>
                }
              />
            ) : (
              <ul className="space-y-3">
                {myPortfolios.map((p) => {
                  const st = STATUS[p.status]
                  return (
                    <li
                      key={p.id}
                      className="border-line flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4"
                    >
                      <div className="min-w-0">
                        <Link
                          to={paths.adminPortfolioEdit(p.id)}
                          className="text-heading hover:text-primary block truncate font-medium"
                        >
                          {p.title || p.full_name}
                        </Link>
                        <p className="text-muted truncate text-xs">
                          /{p.slug}
                          {p.published_at && ` · Published ${formatDate(p.published_at)}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {st && (
                          <Badge variant={st.variant} dot>
                            {st.label}
                          </Badge>
                        )}
                        {p.status === 'published' && (
                          <Button
                            as="a"
                            href={paths.site(p.slug)}
                            target="_blank"
                            rel="noreferrer"
                            variant="ghost"
                            size="icon-sm"
                            aria-label="View site"
                          >
                            <ExternalLink className="size-4" />
                          </Button>
                        )}
                        <Button
                          as={Link}
                          to={paths.adminPortfolioEdit(p.id)}
                          variant="secondary"
                          size="sm"
                        >
                          Edit
                        </Button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <ClientFormModal
        open={editing}
        client={c}
        onClose={() => setEditing(false)}
        saving={update.isPending}
        onSubmit={async (payload) => {
          await update.mutateAsync(payload)
          setEditing(false)
        }}
      />

      <ConfirmDialog
        open={deleting}
        onClose={() => setDeleting(false)}
        onConfirm={() => remove.mutate()}
        loading={remove.isPending}
        title="Delete client?"
        description={`${c.full_name} and linked data will be permanently removed.`}
        confirmLabel="Delete"
      />
    </>
  )
}
