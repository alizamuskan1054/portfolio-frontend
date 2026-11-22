// /portal/portfolios/:id/* ka common frame: portfolio load karta hai, header + sub-nav dikhata hai,
// aur children ko portfolio deta hai (useOutletContext). Portfolio kisi aur ka ho to error aata hai.

import { Link, Outlet, useLocation, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { portfoliosResource } from '@/api/endpoints'
import { ErrorState } from '@/components/shared/ErrorState'
import { PageHeader } from '@/components/shared/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { PortfolioScopeProvider, portalScope } from '@/features/portfolio/scope'
import { paths } from '@/routes/paths'
import { PortfolioStepper } from './PortfolioStepper'
import { PORTFOLIO_STEPS, stepIndexFor } from './portfolioSteps'

const STATUS_BADGE = {
  published: { variant: 'success', label: 'Published' },
  draft: { variant: 'warning', label: 'Draft' },
  unpublished: { variant: 'danger', label: 'Unpublished' },
}

export function PortfolioLayout() {
  const { id } = useParams()
  const { pathname } = useLocation()
  const query = useQuery({
    queryKey: portfoliosResource.keys.detail(id),
    queryFn: () => portfoliosResource.get(id),
    retry: false,
  })

  if (query.isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64" />
      </div>
    )
  }
  if (query.isError) {
    const missing = [403, 404].includes(query.error?.status)
    return (
      <div className="space-y-4">
        <ErrorState
          title={missing ? 'Portfolio not found' : undefined}
          message={
            missing
              ? 'This portfolio does not exist or you do not have access to it.'
              : query.error?.message
          }
          onRetry={missing ? undefined : query.refetch}
        />
        <Button as={Link} to={paths.portalPortfolios} variant="secondary">
          Back to my portfolios
        </Button>
      </div>
    )
  }

  const portfolio = query.data
  const st = STATUS_BADGE[portfolio.status]
  const current = stepIndexFor(pathname, id)
  const hrefFor = (step) =>
    step.part ? paths.portalPortfolioPart(id, step.part) : paths.portalPortfolio(id)
  const isItemPage = pathname.includes('/items/')
  const prev = PORTFOLIO_STEPS[current - 1]
  const next = PORTFOLIO_STEPS[current + 1]

  return (
    <PortfolioScopeProvider scope={portalScope}>
      <PageHeader
        backTo={paths.portalPortfolios}
        backLabel="My portfolios"
        title={portfolio.title || portfolio.full_name}
        description={`/${portfolio.slug}`}
        actions={
          st && (
            <Badge variant={st.variant} dot>
              {st.label}
            </Badge>
          )
        }
        className="mb-5"
      />

      <PortfolioStepper current={current} hrefFor={hrefFor} />

      <Outlet context={{ portfolio }} />

      {!isItemPage && (prev || next) && (
        <div className="mt-8 flex items-center justify-between gap-3">
          {prev ? (
            <Button as={Link} to={hrefFor(prev)} variant="secondary">
              <ArrowLeft className="size-4" /> {prev.label}
            </Button>
          ) : (
            <span />
          )}
          {next && (
            <Button as={Link} to={hrefFor(next)}>
              {next.label} <ArrowRight className="size-4" />
            </Button>
          )}
        </div>
      )}
    </PortfolioScopeProvider>
  )
}
