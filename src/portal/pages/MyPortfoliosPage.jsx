import { Link } from 'react-router-dom'
import { ExternalLink, FolderKanban, Plus } from 'lucide-react'
import { ErrorState } from '@/components/shared/ErrorState'
import { EmptyState } from '@/components/shared/EmptyState'
import { PageHeader } from '@/components/shared/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { usePortalMe } from '@/portal/hooks/usePortalMe'
import { paths } from '@/routes/paths'

function PortfolioCard({ portfolio }) {
  const published = portfolio.status === 'published'
  return (
    <Card hoverable className="flex flex-col gap-3 p-5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="min-w-0 truncate text-xl">{portfolio.title || 'Untitled'}</h3>
        <Badge variant={published ? 'success' : 'warning'} dot>
          {published ? 'Published' : 'Draft'}
        </Badge>
      </div>
      <p className="text-muted truncate text-sm">/{portfolio.slug}</p>
      <div className="mt-auto flex flex-wrap gap-2 pt-2">
        <Button as={Link} to={paths.portalPortfolio(portfolio.id)} size="sm">
          Manage
        </Button>
        {published && (
          <Button
            as="a"
            href={paths.site(portfolio.slug)}
            target="_blank"
            rel="noreferrer"
            variant="secondary"
            size="sm"
          >
            <ExternalLink className="size-4" />
            View site
          </Button>
        )}
      </div>
    </Card>
  )
}

export function MyPortfoliosPage() {
  const { data, isPending, isError, refetch } = usePortalMe()

  if (isError) return <ErrorState onRetry={refetch} />

  const portfolios = data?.portfolios ?? []
  const limit = data?.portfolio_limit ?? 5
  const count = data?.portfolio_count ?? portfolios.length
  const full = count >= limit

  return (
    <>
      <PageHeader
        title="My portfolios"
        description={
          data
            ? `You have ${count} of ${limit} portfolios.`
            : 'Create and manage your portfolio websites.'
        }
        actions={
          full ? (
            <Button disabled title={`You can create up to ${limit} portfolios.`}>
              <Plus className="size-4" />
              New portfolio
            </Button>
          ) : (
            <Button as={Link} to={paths.portalPortfolioNew}>
              <Plus className="size-4" />
              New portfolio
            </Button>
          )
        }
      />

      {isPending ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      ) : portfolios.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No portfolios yet"
          description="Create your first portfolio to get started."
          action={
            <Button as={Link} to={paths.portalPortfolioNew}>
              <Plus className="size-4" />
              New portfolio
            </Button>
          }
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {portfolios.map((p) => (
            <PortfolioCard key={p.id} portfolio={p} />
          ))}
        </div>
      )}
    </>
  )
}
