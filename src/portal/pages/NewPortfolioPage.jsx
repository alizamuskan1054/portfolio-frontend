import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { portfoliosResource } from '@/api/endpoints'
import { applyServerErrors } from '@/api/errors'
import { EmptyState } from '@/components/shared/EmptyState'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { BasicFields, TemplatePicker } from '@/features/portfolio/PortfolioFields'
import {
  FIELDS,
  buildPortalPayload,
  portalSchema,
  toDefaults,
} from '@/features/portfolio/portfolioForm'
import { notify } from '@/lib/notify'
import { PORTAL_ME_KEY, usePortalMe } from '@/portal/hooks/usePortalMe'
import { useAuth } from '@/admin/auth'
import { paths } from '@/routes/paths'
import { PortfolioStepper } from '@/portal/PortfolioStepper'

function Form({ limit, clientId }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [saving, setSaving] = useState(false)
  const form = useForm({
    resolver: zodResolver(portalSchema),
    defaultValues: toDefaults(null),
  })

  // Beech mein page chhodne par unsaved warning
  const dirty = form.formState.isDirty
  useEffect(() => {
    const handler = (e) => {
      if (dirty && !saving) e.preventDefault()
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [dirty, saving])

  const onSubmit = form.handleSubmit(async (values) => {
    setSaving(true)
    try {
      const created = await portfoliosResource.create(
        buildPortalPayload(values, null, { clientId }),
      )
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: PORTAL_ME_KEY }),
        queryClient.invalidateQueries({ queryKey: portfoliosResource.keys.all }),
      ])
      notify.success('Portfolio created as a draft. Now add your details.')
      navigate(paths.portalPortfolioPart(created.id, 'academic'), { replace: true })
    } catch (error) {
      setSaving(false)
      if (error?.status === 403) {
        notify.error(`You can create up to ${limit} portfolios.`)
      } else if (error?.errors) {
        applyServerErrors(error, form.setError, { fields: FIELDS })
      } else {
        notify.error(error)
      }
    }
  })

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      {form.formState.errors.root?.server && (
        <p role="alert" className="bg-danger/10 text-danger rounded-lg px-3 py-2 text-sm">
          {form.formState.errors.root.server.message}
        </p>
      )}

      <Card>
        <CardHeader
          title="Choose a template"
          description="This is the design of your public website. You can change it later."
        />
        <CardContent>
          <TemplatePicker form={form} hideLabel />
        </CardContent>
      </Card>

      <BasicFields form={form} portfolio={null} />

      <div className="bg-background/90 border-line sm:bg-card sticky bottom-0 -mx-4 flex flex-col-reverse gap-3 border-t px-4 py-3 backdrop-blur sm:mx-0 sm:flex-row sm:justify-end sm:rounded-xl sm:border">
        <Button
          as={Link}
          to={paths.portalPortfolios}
          variant="secondary"
          disabled={saving}
        >
          Cancel
        </Button>
        <Button type="submit" loading={saving}>
          Create portfolio
        </Button>
      </div>
    </form>
  )
}

export function NewPortfolioPage() {
  const { data, isPending } = usePortalMe()
  const { user } = useAuth()
  const clientId = user?.client_id ?? data?.client?.id
  const limit = data?.portfolio_limit ?? 5
  const full = data && data.portfolio_count >= limit

  return (
    <>
      <PageHeader
        backTo={paths.portalPortfolios}
        backLabel="My portfolios"
        title="New portfolio"
        description="Pick a template and add your basic details. You can fill in the rest afterwards."
      />
      <PortfolioStepper current={0} />
      {isPending ? (
        <Skeleton className="h-64" />
      ) : full ? (
        <EmptyState
          icon={Plus}
          title="Portfolio limit reached"
          description={`You can have up to ${limit} portfolios. Delete one to create a new one.`}
          action={
            <Button as={Link} to={paths.portalPortfolios} variant="secondary">
              Back to my portfolios
            </Button>
          }
        />
      ) : (
        <Form limit={limit} clientId={clientId} />
      )}
    </>
  )
}
