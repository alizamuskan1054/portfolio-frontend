import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { portfoliosResource } from '@/api/endpoints'
import { applyServerErrors } from '@/api/errors'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { BasicFields, TemplatePicker } from '@/features/portfolio/PortfolioFields'
import {
  FIELDS,
  buildPortalPayload,
  portalSchema,
  toDefaults,
} from '@/features/portfolio/portfolioForm'
import { notify } from '@/lib/notify'
import { PORTAL_ME_KEY } from '@/portal/hooks/usePortalMe'
import { usePortfolio } from '@/portal/usePortfolio'

const toFormValues = (p) => ({
  ...toDefaults(p),
  profile_photo: p.profile_photo ?? null,
  logo: p.logo ?? null,
  favicon: p.favicon ?? null,
  cv_file: p.cv_file ?? null,
})

function BasicForm({ portfolio }) {
  const queryClient = useQueryClient()
  const [saving, setSaving] = useState(false)
  const [pendingValues, setPendingValues] = useState(null) // slug badalne ki confirmation ke liye
  const form = useForm({
    resolver: zodResolver(portalSchema),
    defaultValues: toFormValues(portfolio),
  })

  const save = async (values) => {
    setSaving(true)
    try {
      const result = await portfoliosResource.update(
        portfolio.id,
        buildPortalPayload(values, portfolio),
      )
      queryClient.setQueryData(
        portfoliosResource.keys.detail(String(portfolio.id)),
        result,
      )
      form.reset(toFormValues(result))
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: portfoliosResource.keys.all }),
        queryClient.invalidateQueries({ queryKey: PORTAL_ME_KEY }),
      ])
      notify.success('Changes saved.')
    } catch (error) {
      if (error?.errors) applyServerErrors(error, form.setError, { fields: FIELDS })
      else notify.error(error)
    } finally {
      setSaving(false)
      setPendingValues(null)
    }
  }

  const onSubmit = form.handleSubmit(async (values) => {
    const slugChanged = values.slug !== portfolio.slug
    if (slugChanged && portfolio.status === 'published') {
      setPendingValues(values) // pehle poochho: live link badal raha hai
      return
    }
    await save(values)
  })

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      {form.formState.errors.root?.server && (
        <p role="alert" className="bg-danger/10 text-danger rounded-lg px-3 py-2 text-sm">
          {form.formState.errors.root.server.message}
        </p>
      )}

      <Card>
        <CardHeader title="Template" description="The design of your public website." />
        <CardContent>
          <TemplatePicker form={form} hideLabel />
        </CardContent>
      </Card>

      <BasicFields form={form} portfolio={portfolio} />

      <div className="bg-background/90 border-line sm:bg-card sticky bottom-0 -mx-4 flex flex-col-reverse gap-3 border-t px-4 py-3 backdrop-blur sm:mx-0 sm:flex-row sm:justify-end sm:rounded-xl sm:border">
        <Button
          variant="secondary"
          disabled={!form.formState.isDirty || saving}
          onClick={() => form.reset(toFormValues(portfolio))}
        >
          Discard changes
        </Button>
        <Button type="submit" loading={saving} disabled={!form.formState.isDirty}>
          Save changes
        </Button>
      </div>

      <ConfirmDialog
        open={Boolean(pendingValues)}
        onClose={() => setPendingValues(null)}
        onConfirm={() => save(pendingValues)}
        loading={saving}
        title="Change your public link?"
        description={`Your live site address will change from /${portfolio.slug} to /${pendingValues?.slug}. The old link will stop working.`}
        confirmLabel="Change link"
        variant="primary"
      />
    </form>
  )
}

export function BasicInfoPage() {
  const { portfolio } = usePortfolio()
  // key: server se naya data aane par form dobara bane
  return (
    <BasicForm
      key={`${portfolio.id}-${portfolio.updated_at ?? ''}`}
      portfolio={portfolio}
    />
  )
}
