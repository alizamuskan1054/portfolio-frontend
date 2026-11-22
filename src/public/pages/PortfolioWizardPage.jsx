import { useEffect, useMemo, useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Eye,
  Globe,
  Loader2,
  XCircle,
} from 'lucide-react'
import { clientsResource, portfoliosResource, templatesResource } from '@/api/endpoints'
import { applyServerErrors } from '@/api/errors'
import { ErrorState } from '@/components/shared/ErrorState'
import { FormField } from '@/components/shared/FormField'
import { FileUploader } from '@/components/shared/FileUploader'
import { ImageUploader } from '@/components/shared/ImageUploader'
import { PageHeader } from '@/components/shared/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Skeleton } from '@/components/ui/Skeleton'
import { Switch } from '@/components/ui/Switch'
import { Textarea } from '@/components/ui/Textarea'
import { SectionTabs } from './PortfolioSections'
import { useDebounce } from '@/hooks/useDebounce'
import { buildFilePayload } from '@/lib/formData'
import { notify } from '@/lib/notify'
import { cn } from '@/lib/utils'
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

const FIELDS = [
  'client',
  'template',
  'title',
  'slug',
  'full_name',
  'designation',
  'short_intro',
  'biography',
  'profile_photo',
  'logo',
  'cv_file',
  'total_publications',
  'citations',
  'h_index',
]

const toList = (data) => (Array.isArray(data) ? data : (data?.results ?? []))

const slugify = (text) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const optionalCount = z
  .union([z.string(), z.number()])
  .optional()
  .refine(
    (v) => v === undefined || v === '' || /^\d+$/.test(String(v)),
    'Enter a whole number',
  )

const schema = z.object({
  client: z.string().min(1, 'Select a client'),
  template: z.string().min(1, 'Select a template'),
  title: z.string().trim().min(1, 'Title is required').max(255, 'Too long'),
  slug: z
    .string()
    .trim()
    .min(1, 'Public link is required')
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Use lowercase letters, numbers and dashes only',
    ),
  full_name: z.string().trim().min(1, 'Full name is required').max(255, 'Too long'),
  designation: z.string().trim().optional(),
  short_intro: z.string().trim().max(300, 'Keep it under 300 characters').optional(),
  biography: z.string().trim().optional(),
  profile_photo: z.any().optional(),
  logo: z.any().optional(),
  cv_file: z.any().optional(),
  total_publications: optionalCount,
  citations: optionalCount,
  h_index: optionalCount,
})

const toDefaults = (p, presetClient) => ({
  client: String(p?.client ?? presetClient ?? ''),
  template: String(p?.template ?? ''),
  title: p?.title ?? '',
  slug: p?.slug ?? '',
  full_name: p?.full_name ?? '',
  designation: p?.designation ?? '',
  short_intro: p?.short_intro ?? '',
  biography: p?.biography ?? '',
  profile_photo: p?.profile_photo ?? null,
  logo: p?.logo ?? null,
  cv_file: p?.cv_file ?? null,
  total_publications: p?.total_publications ?? '',
  citations: p?.citations ?? '',
  h_index: p?.h_index ?? '',
})

// Naya File ho to multipart; warna JSON (purani file ka URL wapas nahi bhejte, warna PATCH fail hota hai)
function buildPayload(values, original) {
  const { profile_photo, logo, cv_file, ...rest } = values
  const data = { ...rest }
  ;['total_publications', 'citations', 'h_index'].forEach((key) => {
    if (data[key] === '' || data[key] === undefined) delete data[key]
    else data[key] = Number(data[key])
  })
  return buildFilePayload(
    { ...data, profile_photo, logo, cv_file },
    ['profile_photo', 'logo', 'cv_file'],
    original,
  )
}

// === Stepper =================================================================
function Stepper({ current, maxReached, onSelect }) {
  return (
    <nav aria-label="Progress" className="mb-6">
      {/* Mobile: compact */}
      <div className="sm:hidden">
        <div className="flex items-center justify-between text-sm">
          <span className="text-heading font-medium">{STEPS[current].label}</span>
          <span className="text-muted">
            Step {current + 1} of {STEPS.length}
          </span>
        </div>
        <div className="bg-line mt-2 h-1.5 overflow-hidden rounded-full">
          <div
            className="bg-primary h-full rounded-full transition-all"
            style={{ width: `${((current + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Desktop: full */}
      <ol className="hidden items-center sm:flex">
        {STEPS.map((step, i) => {
          const done = i < current
          const active = i === current
          const reachable = i <= maxReached
          return (
            <li
              key={step.key}
              className={cn('flex items-center', i < STEPS.length - 1 && 'flex-1')}
            >
              <button
                type="button"
                disabled={!reachable}
                onClick={() => onSelect(i)}
                aria-current={active ? 'step' : undefined}
                className="group flex items-center gap-2 disabled:cursor-not-allowed"
              >
                <span
                  className={cn(
                    'flex size-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold transition-colors',
                    active && 'border-primary bg-primary text-on-primary',
                    done && 'border-primary bg-primary-soft text-primary',
                    !active && !done && 'border-line bg-card text-muted',
                  )}
                >
                  {done ? <Check className="size-4" /> : i + 1}
                </span>
                <span
                  className={cn(
                    'hidden text-sm whitespace-nowrap lg:block',
                    active ? 'text-heading font-medium' : 'text-muted',
                  )}
                >
                  {step.label}
                </span>
              </button>
              {i < STEPS.length - 1 && (
                <span
                  className={cn(
                    'mx-3 h-px flex-1',
                    i < current ? 'bg-primary' : 'bg-line',
                  )}
                  aria-hidden="true"
                />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
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
  const templates = useQuery({
    queryKey: templatesResource.keys.list({}),
    queryFn: () => templatesResource.list(),
  })
  const template = useWatch({ control: form.control, name: 'template' })

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

        <div>
          <p className="text-heading mb-2 text-sm font-medium">
            Template <span className="text-danger">*</span>
          </p>
          {templates.isLoading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          ) : (
            <div role="radiogroup" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {toList(templates.data)
                .filter((t) => t.is_active !== false || String(t.id) === template)
                .map((t) => {
                  const selected = String(t.id) === template
                  return (
                    <button
                      key={t.id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() =>
                        form.setValue('template', String(t.id), {
                          shouldValidate: true,
                          shouldDirty: true,
                        })
                      }
                      className={cn(
                        'flex flex-col items-start gap-1 rounded-xl border p-4 text-left transition-colors',
                        selected
                          ? 'border-primary bg-primary-soft ring-primary/30 ring-2'
                          : 'border-line bg-card hover:border-primary',
                      )}
                    >
                      <span className="flex w-full items-center justify-between gap-2">
                        <span className="text-heading font-medium">{t.name}</span>
                        {selected && (
                          <CheckCircle2 className="text-primary size-5 shrink-0" />
                        )}
                      </span>
                      <span className="text-muted line-clamp-2 text-sm">
                        {t.description || t.key || 'Portfolio template'}
                      </span>
                    </button>
                  )
                })}
            </div>
          )}
          {errors.template && (
            <p role="alert" className="text-danger mt-1.5 text-xs">
              {errors.template.message}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function SlugField({ form, savedSlug }) {
  const { register, control, formState } = form
  const slug = useWatch({ control, name: 'slug' })
  const debounced = useDebounce(slug, 500)
  const unchanged = Boolean(savedSlug) && debounced === savedSlug
  const valid = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(debounced || '')

  const check = useQuery({
    queryKey: ['portfolios', 'check-slug', debounced],
    queryFn: () => portfoliosResource.checkSlug(debounced),
    enabled: valid && !unchanged,
    retry: false,
    staleTime: 10_000,
  })

  let hint = 'Your public page will live at this link.'
  let status = null
  if (valid && !unchanged && slug === debounced) {
    if (check.isFetching) status = 'checking'
    else if (check.isSuccess) {
      const available = check.data?.available ?? check.data?.is_available
      if (available === true) status = 'available'
      else if (available === false) status = 'taken'
    }
  }

  return (
    <FormField
      label="Public link"
      error={formState.errors.slug?.message}
      hint={hint}
      required
    >
      <div className="relative">
        <Input
          className="pr-10"
          autoComplete="off"
          placeholder="dr-ahmad"
          {...register('slug')}
        />
        <span className="absolute top-1/2 right-3 -translate-y-1/2">
          {status === 'checking' && (
            <Loader2 className="text-muted size-4 animate-spin" />
          )}
          {status === 'available' && <CheckCircle2 className="text-success size-4" />}
          {status === 'taken' && <XCircle className="text-danger size-4" />}
        </span>
        {status === 'taken' && (
          <p role="alert" className="text-danger mt-1.5 text-xs">
            This link is already taken. Try another.
          </p>
        )}
        {status === 'available' && (
          <p className="text-success mt-1.5 text-xs">This link is available.</p>
        )}
      </div>
    </FormField>
  )
}

function BasicStep({ form, portfolio }) {
  const {
    register,
    control,
    setValue,
    formState: { errors, dirtyFields },
  } = form
  const isEdit = Boolean(portfolio)

  // Naye portfolio mein title/slug naam se bante hain (jab tak user khud na badle)
  const onNameChange = (e) => {
    const name = e.target.value
    if (!isEdit && !dirtyFields.title) setValue('title', name ? `${name} Portfolio` : '')
    if (!isEdit && !dirtyFields.slug) setValue('slug', slugify(name))
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Basic information"
          description="This appears in the hero of the site."
        />
        <CardContent className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Full name" error={errors.full_name?.message} required>
              <Input
                autoComplete="off"
                placeholder="Dr. Ahmad"
                {...register('full_name', { onChange: onNameChange })}
              />
            </FormField>
            <FormField label="Designation" error={errors.designation?.message}>
              <Input placeholder="Researcher" {...register('designation')} />
            </FormField>
            <FormField label="Portfolio title" error={errors.title?.message} required>
              <Input autoComplete="off" {...register('title')} />
            </FormField>
            <SlugField form={form} savedSlug={portfolio?.slug} />
          </div>

          <FormField
            label="Short intro"
            error={errors.short_intro?.message}
            hint="One line shown under the name."
          >
            <Input placeholder="AI researcher" {...register('short_intro')} />
          </FormField>

          <FormField label="Biography" error={errors.biography?.message}>
            <Textarea rows={6} {...register('biography')} />
          </FormField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Photo, logo & CV" />
        <CardContent className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Controller
            name="profile_photo"
            control={control}
            render={({ field }) => (
              <ImageUploader
                shape="circle"
                label="Profile photo"
                value={field.value}
                onChange={field.onChange}
                error={errors.profile_photo?.message}
              />
            )}
          />
          <Controller
            name="logo"
            control={control}
            render={({ field }) => (
              <ImageUploader
                label="Logo (optional)"
                value={field.value}
                onChange={field.onChange}
                error={errors.logo?.message}
              />
            )}
          />
          <Controller
            name="cv_file"
            control={control}
            render={({ field }) => (
              <div>
                <p className="text-heading mb-2 text-sm font-medium">CV (PDF)</p>
                <FileUploader
                  label="Upload CV"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.cv_file?.message}
                />
              </div>
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader
          title="Academic metrics"
          description="Shown as counters on the home page."
        />
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <FormField label="Publications" error={errors.total_publications?.message}>
            <Input
              inputMode="numeric"
              placeholder="0"
              {...register('total_publications')}
            />
          </FormField>
          <FormField label="Citations" error={errors.citations?.message}>
            <Input inputMode="numeric" placeholder="0" {...register('citations')} />
          </FormField>
          <FormField label="h-index" error={errors.h_index?.message}>
            <Input inputMode="numeric" placeholder="0" {...register('h_index')} />
          </FormField>
        </CardContent>
      </Card>
    </div>
  )
}

// === Step 3 / 4: backend-synced sections (portfolio save hone ke baad) ======
function SectionsStep({ title, description, group, portfolioId }) {
  return (
    <Card>
      <CardHeader title={title} description={description} />
      <CardContent>
        <SectionTabs group={group} portfolioId={portfolioId} />
      </CardContent>
    </Card>
  )
}

// === Step 5: visibility ======================================================
function VisibilityStep({ value, onChange }) {
  return (
    <div className="space-y-6">
      <p className="text-muted text-sm">
        Turn sections off to hide them on the public site. Your data is never deleted.
        Home, About and Contact pages are always visible.
      </p>
      <div className="grid gap-6 lg:grid-cols-2">
        {Object.entries(VISIBILITY_GROUPS).map(([groupKey, group]) => (
          <Card key={groupKey}>
            <CardHeader title={group.label} />
            <CardContent className="space-y-4">
              {Object.entries(group.items).map(([itemKey, itemLabel]) => (
                <Switch
                  key={itemKey}
                  label={itemLabel}
                  checked={value[groupKey][itemKey]}
                  onChange={(checked) =>
                    onChange({
                      ...value,
                      [groupKey]: { ...value[groupKey], [itemKey]: checked },
                    })
                  }
                />
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

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
          <BasicStep form={form} portfolio={saved} />
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
        {step === 4 && <VisibilityStep value={visibility} onChange={setVisibility} />}
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