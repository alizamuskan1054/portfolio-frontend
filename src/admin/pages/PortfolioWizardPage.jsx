import { useEffect, useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, ArrowRight, Eye, Globe } from 'lucide-react'
import { clientsResource, portfoliosResource, templatesResource } from '@/api/endpoints'
import { applyServerErrors } from '@/api/errors'
import { ErrorState } from '@/components/shared/ErrorState'
import { FormField } from '@/components/shared/FormField'
import { PageHeader } from '@/components/shared/PageHeader'
import { ProgressSteps } from '@/components/shared/ProgressSteps'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import { Skeleton } from '@/components/ui/Skeleton'
import {
  BasicFields,
  TemplatePicker,
  VisibilityEditor,
} from '@/features/portfolio/PortfolioFields'
import {
  FIELDS,
  buildPayload,
  schema,
  toDefaults,
  toList,
} from '@/features/portfolio/portfolioForm'
import { SectionTabs } from './PortfolioSections'
import { notify } from '@/lib/notify'
import { VISIBILITY_GROUPS, normalizeVisibility } from '@/lib/visibility'
import { paths } from '@/routes/paths'

// === Steps ==================================================================
const STEPS = [
  { key: 'setup', label: 'Client & template' },
  { key: 'basic', label: 'Basic info' },
  { key: 'academic', label: 'Academic' },
  { key: 'content', label: 'Website content' },
  { key: 'visibility', label: 'Visibility' },
  { key: 'review', label: 'Review & publish' },
]

// === Stepper =================================================================
function Stepper({ current, maxReached, onSelect }) {
  return (
    <ProgressSteps
      steps={STEPS}
      current={current}
      maxReached={maxReached}
      onSelect={onSelect}
    />
  )
}

// === Step 1 + 2: form =======================================================
function SetupStep({ form, isEdit }) {
  const {
    register,
    formState: { errors },
  } = form
  const clients = useQuery({
    queryKey: clientsResource.keys.list({ all: true }),
    queryFn: () => clientsResource.list({ page_size: 100 }),
  })
  return (
    <Card>
      <CardHeader
        title="Client & template"
        description="Who is this portfolio for, and which design should it use?"
      />
      <CardContent className="space-y-6">
        <FormField label="Client" error={errors.client?.message} required>
          <Select
            placeholder={clients.isLoading ? 'Loading clients...' : 'Select a client'}
            disabled={isEdit}
            {...register('client')}
          >
            {toList(clients.data).map((c) => (
              <option key={c.id} value={c.id}>
                {c.full_name}
                {c.email ? ` — ${c.email}` : ''}
              </option>
            ))}
          </Select>
        </FormField>

        <TemplatePicker form={form} />
      </CardContent>
    </Card>
  )
}

// === Step 3 / 4: backend-synced sections (portfolio save hone ke baad) ======
function SectionsStep({ title, description, group, portfolioId }) {
  return (
    <Card>
      <CardHeader title={title} description={description} />
      <CardContent className="space-y-5">
        <SectionTabs group={group} portfolioId={portfolioId} />
      </CardContent>
    </Card>
  )
}

// === Step 5: visibility ======================================================
// === Step 6: review ==========================================================
function ReviewStep({ portfolio, visibility, templateName, clientName }) {
  const hiddenCount = Object.entries(VISIBILITY_GROUPS).flatMap(([groupKey, group]) =>
    Object.keys(group.items).filter((itemKey) => visibility[groupKey][itemKey] === false),
  ).length
  const rows = [
    ['Client', clientName],
    ['Template', templateName],
    ['Title', portfolio.title],
    ['Public link', `/${portfolio.slug}`],
    ['Name', [portfolio.full_name, portfolio.designation].filter(Boolean).join(' · ')],
    ['Hidden sections', hiddenCount ? `${hiddenCount} hidden` : 'None'],
  ]
  return (
    <Card>
      <CardHeader
        title="Review"
        description="Check the details, then publish when you are ready."
        action={
          <Badge variant={portfolio.status === 'published' ? 'success' : 'warning'} dot>
            {portfolio.status === 'published' ? 'Published' : 'Draft'}
          </Badge>
        }
      />
      <CardContent>
        <dl className="divide-line divide-y">
          {rows.map(([label, value]) => (
            <div key={label} className="flex flex-col gap-0.5 py-3 sm:flex-row sm:gap-6">
              <dt className="text-muted w-40 shrink-0 text-sm">{label}</dt>
              <dd className="text-heading min-w-0 text-sm break-words">{value || '—'}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  )
}

// === Page ====================================================================
export function PortfolioWizardPage() {
  const { id: routeId } = useParams()
  const isEdit = Boolean(routeId)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()

  const detail = useQuery({
    queryKey: portfoliosResource.keys.detail(routeId),
    queryFn: () => portfoliosResource.get(routeId),
    enabled: isEdit,
  })

  if (isEdit && detail.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64" />
      </div>
    )
  }
  if (isEdit && detail.isError) {
    return <ErrorState error={detail.error} onRetry={detail.refetch} />
  }

  // key: data aane/badalne par form fresh state se bane
  return (
    <WizardBody
      key={detail.data?.id ?? 'new'}
      portfolio={detail.data}
      presetClient={searchParams.get('client')}
      step={Math.min(
        Math.max(Number(searchParams.get('step') || 1) - 1, 0),
        STEPS.length - 1,
      )}
      setStep={(i) =>
        setSearchParams(
          (prev) => {
            const next = new URLSearchParams(prev)
            next.set('step', String(i + 1))
            return next
          },
          { replace: true },
        )
      }
      navigate={navigate}
      queryClient={queryClient}
    />
  )
}

function WizardBody({ portfolio, presetClient, step, setStep, navigate, queryClient }) {
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: toDefaults(portfolio, presetClient),
  })
  const [visibility, setVisibility] = useState(() =>
    normalizeVisibility(portfolio?.section_visibility),
  )
  const [saved, setSaved] = useState(portfolio ?? null) // backend se aaya aakhri portfolio
  const [maxReached, setMaxReached] = useState(portfolio ? STEPS.length - 1 : 0)

  const saveMutation = useMutation({
    mutationFn: (payload) =>
      saved
        ? portfoliosResource.update(saved.id, payload)
        : portfoliosResource.create(payload),
  })
  const publishMutation = useMutation({
    mutationFn: ({ id, action }) => portfoliosResource[action](id),
  })

  const refreshLists = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: portfoliosResource.keys.all }),
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
    ])

  const goTo = (i) => {
    setMaxReached((m) => Math.max(m, i))
    setStep(i)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Step 1: sirf validate. Step 2: portfolio save (create ya PATCH)
  const next = async () => {
    if (step === 0) {
      if (await form.trigger(['client', 'template'])) goTo(1)
      return
    }
    if (step === 1) {
      const ok = await form.trigger()
      if (!ok) return
      await saveBasics()
      return
    }
    if (step === 4) {
      await saveVisibility()
      return
    }
    goTo(step + 1)
  }

  const saveBasics = async () => {
    const values = form.getValues()
    try {
      const result = await saveMutation.mutateAsync(buildPayload(values, saved))
      setSaved(result)
      form.reset({
        ...toDefaults(result),
        profile_photo: result.profile_photo ?? null,
        logo: result.logo ?? null,
        favicon: result.favicon ?? null,
        cv_file: result.cv_file ?? null,
      })
      await refreshLists()
      notify.success(saved ? 'Changes saved.' : 'Portfolio created as draft.')
      if (!saved) {
        // URL ko edit mode par le jao taake refresh par bhi yahin rahe
        navigate(`${paths.adminPortfolioEdit(result.id)}?step=3`, { replace: true })
        return
      }
      goTo(2)
    } catch (error) {
      if (error?.errors) {
        if (applyServerErrors(error, form.setError, { fields: FIELDS })) {
          const fieldHit = Object.keys(error.errors).some((k) =>
            ['client', 'template'].includes(k),
          )
          if (fieldHit) setStep(0)
        }
      } else {
        notify.error(error)
      }
    }
  }

  const saveVisibility = async () => {
    try {
      const result = await saveMutation.mutateAsync({ section_visibility: visibility })
      setSaved(result)
      notify.success('Visibility saved.')
      goTo(5)
    } catch (error) {
      notify.error(error)
    }
  }

  const togglePublish = async (action) => {
    try {
      await publishMutation.mutateAsync({ id: saved.id, action })
      setSaved((s) => ({
        ...s,
        status: action === 'publish' ? 'published' : 'unpublished',
      }))
      await refreshLists()
      notify.success(
        action === 'publish' ? 'Portfolio published.' : 'Portfolio unpublished.',
      )
    } catch (error) {
      notify.error(error)
    }
  }

  // Review ke liye naam
  const clients = useQuery({
    queryKey: clientsResource.keys.list({ all: true }),
    queryFn: () => clientsResource.list({ page_size: 100 }),
  })
  const templates = useQuery({
    queryKey: templatesResource.keys.list({}),
    queryFn: () => templatesResource.list(),
  })
  const values = useWatch({ control: form.control })
  const clientName = useMemo(
    () => toList(clients.data).find((c) => String(c.id) === values.client)?.full_name,
    [clients.data, values.client],
  )
  const templateName = useMemo(
    () => toList(templates.data).find((t) => String(t.id) === values.template)?.name,
    [templates.data, values.template],
  )

  // Unsaved changes par tab close warning
  useEffect(() => {
    const handler = (e) => {
      if (form.formState.isDirty) e.preventDefault()
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [form.formState.isDirty])

  const busy = saveMutation.isPending
  const isLast = step === STEPS.length - 1
  const nextLabel =
    step === 1
      ? saved
        ? 'Save & continue'
        : 'Create & continue'
      : step === 4
        ? 'Save & continue'
        : 'Next'

  return (
    <>
      <PageHeader
        title={portfolio ? 'Edit portfolio' : 'Create portfolio'}
        description={
          portfolio ? portfolio.title : 'Set up a new portfolio website in a few steps.'
        }
        actions={
          <Button as={Link} to={paths.adminPortfolios} variant="secondary">
            <ArrowLeft className="size-4" /> Back
          </Button>
        }
      />

      <Stepper
        current={step}
        maxReached={saved ? STEPS.length - 1 : maxReached}
        onSelect={(i) => {
          // Step 3+ ke liye portfolio save hona zaroori hai
          if (i >= 2 && !saved) return
          goTo(i)
        }}
      />

      <form
        onSubmit={(e) => {
          e.preventDefault()
          e.stopPropagation()
        }}
        noValidate
      >
        {form.formState.errors.root?.server && (
          <p
            role="alert"
            className="bg-danger/10 text-danger mb-4 rounded-lg px-3 py-2 text-sm"
          >
            {form.formState.errors.root.server.message}
          </p>
        )}

        {/* Step 1 aur 2 form ke fields hain, isliye hamesha mounted rehne dete hain (hidden) */}
        <div hidden={step !== 0}>
          <SetupStep form={form} isEdit={Boolean(saved)} />
        </div>
        <div hidden={step !== 1}>
          <BasicFields form={form} portfolio={saved} />
        </div>
        {step === 2 && saved && (
          <SectionsStep
            title="Academic"
            description="Education, experience, research interests, expertise, awards and memberships. Changes save instantly."
            group="academic"
            portfolioId={saved.id}
          />
        )}
        {step === 3 && saved && (
          <SectionsStep
            title="Website content"
            description="Services, projects, publications, blogs, testimonials, contact details and more. Changes save instantly."
            group="content"
            portfolioId={saved.id}
          />
        )}
        {step === 4 && <VisibilityEditor value={visibility} onChange={setVisibility} />}
        {step === 5 && saved && (
          <ReviewStep
            portfolio={saved}
            visibility={visibility}
            templateName={templateName}
            clientName={clientName}
          />
        )}

        <div className="bg-background/90 border-line sm:bg-card sticky bottom-0 -mx-4 mt-6 flex flex-col-reverse gap-3 border-t px-4 py-3 backdrop-blur sm:mx-0 sm:flex-row sm:items-center sm:justify-between sm:rounded-xl sm:border sm:px-4">
          <Button
            variant="secondary"
            disabled={step === 0 || busy}
            onClick={() => goTo(step - 1)}
          >
            <ArrowLeft className="size-4" /> Previous
          </Button>

          {isLast ? (
            <div className="flex flex-col gap-3 sm:flex-row">
              {saved?.status === 'published' && (
                <>
                  <Button
                    variant="secondary"
                    onClick={() =>
                      window.open(paths.site(saved.slug), '_blank', 'noopener')
                    }
                  >
                    <Eye className="size-4" /> View site
                  </Button>
                  <Button
                    variant="secondary"
                    loading={publishMutation.isPending}
                    onClick={() => togglePublish('unpublish')}
                  >
                    Unpublish
                  </Button>
                </>
              )}
              {saved?.status !== 'published' && (
                <Button
                  loading={publishMutation.isPending}
                  onClick={() => togglePublish('publish')}
                >
                  <Globe className="size-4" /> Publish
                </Button>
              )}
              <Button as={Link} to={paths.adminPortfolios} variant="soft">
                Done
              </Button>
            </div>
          ) : (
            <Button onClick={next} loading={busy}>
              {nextLabel} <ArrowRight className="size-4" />
            </Button>
          )}
        </div>
      </form>
    </>
  )
}
