import { useEffect, useMemo } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { GraduationCap, Moon, Sun } from 'lucide-react'
import { configApi } from '@/api/endpoints'
import { applyServerErrors } from '@/api/errors'
import { ErrorState } from '@/components/shared/ErrorState'
import { FormField } from '@/components/shared/FormField'
import { ImageUploader } from '@/components/shared/ImageUploader'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Skeleton } from '@/components/ui/Skeleton'
import { buildFilePayload } from '@/lib/formData'
import { notify } from '@/lib/notify'
import { cn } from '@/lib/utils'

const FIELDS = ['platform_name', 'logo', 'default_theme', 'default_typography']

const FALLBACK_THEMES = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
]
const FALLBACK_FONTS = [
  'inter',
  'poppins',
  'roboto',
  'lato',
  'merriweather',
  'playfair-display',
].map((v) => ({ value: v, label: prettify(v) }))

function prettify(value) {
  return String(value)
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

// DRF OPTIONS se choices (nahi mile to fallback). Current value hamesha list mein rakhte hain.
function choicesFor(meta, name, fallback, current) {
  const fromApi =
    meta?.actions?.PUT?.[name]?.choices ?? meta?.actions?.PATCH?.[name]?.choices
  const list = fromApi?.length
    ? fromApi.map((c) => ({ value: c.value, label: c.display_name }))
    : fallback
  if (current && !list.some((o) => o.value === current)) {
    return [{ value: current, label: prettify(current) }, ...list]
  }
  return list
}

function SettingsForm({ settings, meta }) {
  const queryClient = useQueryClient()
  const {
    register,
    control,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm({
    defaultValues: {
      platform_name: settings.platform_name ?? '',
      logo: settings.logo ?? null,
      default_theme: settings.default_theme ?? 'light',
      default_typography: settings.default_typography ?? '',
    },
  })

  const themes = choicesFor(
    meta,
    'default_theme',
    FALLBACK_THEMES,
    settings.default_theme,
  )
  const fonts = choicesFor(
    meta,
    'default_typography',
    FALLBACK_FONTS,
    settings.default_typography,
  )
  const name = useWatch({ control, name: 'platform_name' })
  const logo = useWatch({ control, name: 'logo' })

  const save = useMutation({
    mutationFn: (values) => {
      return configApi.updateSettings(buildFilePayload(values, ['logo'], settings))
    },
  })

  const onSubmit = handleSubmit(async (values) => {
    try {
      const result = await save.mutateAsync(values)
      reset({
        platform_name: result?.platform_name ?? values.platform_name,
        logo: result?.logo ?? (values.logo instanceof File ? null : values.logo),
        default_theme: result?.default_theme ?? values.default_theme,
        default_typography: result?.default_typography ?? values.default_typography,
      })
      // Sidebar / login ka brand naam aur logo foran update ho
      await queryClient.invalidateQueries({ queryKey: ['config'] })
      notify.success('Settings saved.')
    } catch (error) {
      if (error?.errors) applyServerErrors(error, setError, { fields: FIELDS })
      else notify.error(error)
    }
  })

  // Unsaved changes par tab close warning
  useEffect(() => {
    const handler = (e) => {
      if (isDirty) e.preventDefault()
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty])

  const previewLogo = useMemo(
    () => (logo instanceof File ? URL.createObjectURL(logo) : logo),
    [logo],
  )
  useEffect(
    () => () => {
      if (previewLogo?.startsWith('blob:')) URL.revokeObjectURL(previewLogo)
    },
    [previewLogo],
  )

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      {errors.root?.server && (
        <p role="alert" className="bg-danger/10 text-danger rounded-lg px-3 py-2 text-sm">
          {errors.root.server.message}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader
              title="Brand"
              description="Shown in the sidebar, login pages and emails."
            />
            <CardContent className="space-y-5">
              <FormField
                label="Platform name"
                required
                error={errors.platform_name?.message}
              >
                <Input
                  autoComplete="off"
                  placeholder="Portfolio Builder"
                  {...register('platform_name', {
                    required: 'Platform name is required',
                    maxLength: { value: 100, message: 'Max 100 characters' },
                  })}
                />
              </FormField>

              <Controller
                name="logo"
                control={control}
                render={({ field }) => (
                  <ImageUploader
                    label="Logo"
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.logo?.message}
                  />
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader
              title="Defaults for new portfolios"
              description="New public websites start with these. Each portfolio can still be changed later."
            />
            <CardContent className="space-y-5">
              <div>
                <p className="text-heading mb-2 text-sm font-medium">Default theme</p>
                <Controller
                  name="default_theme"
                  control={control}
                  render={({ field }) => (
                    <div role="radiogroup" className="grid grid-cols-2 gap-3 sm:max-w-md">
                      {themes.map((t) => {
                        const selected = field.value === t.value
                        const Icon = t.value === 'dark' ? Moon : Sun
                        return (
                          <button
                            key={t.value}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            onClick={() => field.onChange(t.value)}
                            className={cn(
                              'flex items-center gap-3 rounded-xl border p-3 text-left transition-colors',
                              selected
                                ? 'border-primary bg-primary-soft ring-primary/30 ring-2'
                                : 'border-line bg-card hover:border-primary',
                            )}
                          >
                            <span className="bg-surface text-primary flex size-9 items-center justify-center rounded-lg">
                              <Icon className="size-4" />
                            </span>
                            <span className="text-heading text-sm font-medium">
                              {t.label}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                />
                {errors.default_theme && (
                  <p role="alert" className="text-danger mt-1.5 text-xs">
                    {errors.default_theme.message}
                  </p>
                )}
              </div>

              <FormField
                label="Default typography"
                error={errors.default_typography?.message}
                hint="Font family used on public websites."
              >
                <Select placeholder="Select a font" {...register('default_typography')}>
                  {fonts.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </Select>
              </FormField>
            </CardContent>
          </Card>
        </div>

        {/* Live preview */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <Card>
            <CardHeader
              title="Preview"
              description="How your brand looks in the sidebar."
            />
            <CardContent>
              <div className="bg-navy flex items-center gap-3 rounded-xl p-4">
                {previewLogo ? (
                  <img
                    src={previewLogo}
                    alt=""
                    className="size-9 rounded-lg bg-white object-contain"
                  />
                ) : (
                  <span className="bg-primary text-on-primary flex size-9 items-center justify-center rounded-lg">
                    <GraduationCap className="size-5" />
                  </span>
                )}
                <span className="text-on-navy truncate font-serif text-lg font-semibold">
                  {name || 'Portfolio Builder'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="bg-background/90 border-line sm:bg-card sticky bottom-0 -mx-4 flex flex-col-reverse gap-3 border-t px-4 py-3 backdrop-blur sm:mx-0 sm:flex-row sm:items-center sm:justify-between sm:rounded-xl sm:border">
        <p className="text-muted text-sm">
          {isDirty ? 'You have unsaved changes.' : 'All changes saved.'}
        </p>
        <div className="flex flex-col-reverse gap-3 sm:flex-row">
          <Button
            variant="secondary"
            disabled={!isDirty || isSubmitting}
            onClick={() => reset()}
          >
            Discard
          </Button>
          <Button type="submit" loading={isSubmitting} disabled={!isDirty}>
            Save settings
          </Button>
        </div>
      </div>
    </form>
  )
}

export function SettingsPage() {
  const settings = useQuery({
    queryKey: ['config', 'settings'],
    queryFn: configApi.getSettings,
  })
  const meta = useQuery({
    queryKey: ['config', 'settings-meta'],
    queryFn: () => configApi.getSettingsMeta().catch(() => null),
    staleTime: Infinity,
    retry: false,
  })

  return (
    <>
      <PageHeader
        title="Settings"
        description="Platform brand and defaults for new portfolios."
      />
      {settings.isLoading ? (
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-96 lg:col-span-2" />
          <Skeleton className="h-40" />
        </div>
      ) : settings.isError ? (
        <ErrorState error={settings.error} onRetry={settings.refetch} />
      ) : (
        <SettingsForm
          key={settings.dataUpdatedAt}
          settings={settings.data ?? {}}
          meta={meta.data}
        />
      )}
    </>
  )
}
