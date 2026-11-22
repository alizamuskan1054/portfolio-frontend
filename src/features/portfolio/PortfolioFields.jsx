// Portfolio form ke shared UI pieces: template chunna, basic info, visibility toggles.
// Admin wizard aur client portal dono yahin se lete hain.

import { Controller, useWatch } from 'react-hook-form'
import { useQuery } from '@tanstack/react-query'
import { CheckCircle2, Loader2, XCircle } from 'lucide-react'
import { portfoliosResource, templatesResource } from '@/api/endpoints'
import { FileUploader } from '@/components/shared/FileUploader'
import { FormField } from '@/components/shared/FormField'
import { ImageUploader } from '@/components/shared/ImageUploader'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import { Switch } from '@/components/ui/Switch'
import { Textarea } from '@/components/ui/Textarea'
import { useDebounce } from '@/hooks/useDebounce'
import { cn } from '@/lib/utils'
import { VISIBILITY_GROUPS } from '@/lib/visibility'
import { RESERVED_SLUGS } from '@/routes/paths'
import { slugify, toList } from './portfolioForm'

// hideLabel: card ka title pehle se "Template" ho to dobara "Template *" na dikhao
export function TemplatePicker({ form, hideLabel = false }) {
  const templates = useQuery({
    queryKey: templatesResource.keys.list({}),
    queryFn: () => templatesResource.list(),
  })
  const template = useWatch({ control: form.control, name: 'template' })
  const { errors } = form.formState

  return (
    <div>
      {!hideLabel && (
        <p className="text-heading mb-2 text-sm font-medium">
          Template <span className="text-danger">*</span>
        </p>
      )}
      {templates.isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
  )
}

export function SlugField({ form, savedSlug }) {
  const { register, control, formState } = form
  const slug = useWatch({ control, name: 'slug' })
  const debounced = useDebounce(slug, 500)
  const unchanged = Boolean(savedSlug) && debounced === savedSlug
  const valid = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(debounced || '')
  const reserved = RESERVED_SLUGS.includes(debounced)

  const check = useQuery({
    queryKey: ['portfolios', 'check-slug', debounced],
    queryFn: () => portfoliosResource.checkSlug(debounced),
    enabled: valid && !reserved && !unchanged,
    retry: false,
    staleTime: 10_000,
  })

  let hint = 'Your public page will live at this link.'
  if (savedSlug && slug && slug !== savedSlug)
    hint = `Changing the link means the old address (/${savedSlug}) will stop working once you save.`
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

export function BasicFields({ form, portfolio }) {
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
        <CardHeader title="Photo, logo, favicon & CV" />
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
            name="favicon"
            control={control}
            render={({ field }) => (
              <ImageUploader
                label="Favicon (optional)"
                value={field.value}
                onChange={field.onChange}
                error={errors.favicon?.message}
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

export function VisibilityEditor({ value, onChange }) {
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
