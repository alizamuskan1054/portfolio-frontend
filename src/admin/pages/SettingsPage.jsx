import { useEffect, useMemo } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { GraduationCap } from 'lucide-react'
import { configApi } from '@/api/endpoints'
import { applyServerErrors } from '@/api/errors'
import { ErrorState } from '@/components/shared/ErrorState'
import { FormField } from '@/components/shared/FormField'
import { ImageUploader } from '@/components/shared/ImageUploader'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import { buildFilePayload } from '@/lib/formData'
import { notify } from '@/lib/notify'
import { cn } from '@/lib/utils'

const FIELDS = ['platform_name', 'logo']
const DEFAULT_NAME = 'Portfolio Builder'
const GRADIENT = 'linear-gradient(90deg, var(--c-primary), var(--c-accent))'

// Card ke upar patli gradient line
function TopBar() {
  return <span className="absolute inset-x-0 top-0 h-1" style={{ background: GRADIENT }} aria-hidden="true" />
}

// Logo (ya default icon) + naam: preview dono jagah isi se banta hai
function BrandMark({ logo, name }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      {logo ? (
        // koi background nahi: safed logo navy par saaf dikhta hai
        <img src={logo} alt="" className="size-10 shrink-0 object-contain" />
      ) : (
        <span className="bg-primary text-on-primary flex size-9 shrink-0 items-center justify-center rounded-lg">
          <GraduationCap className="size-5" />
        </span>
      )}
      <span className="text-on-navy truncate font-serif text-lg font-semibold">
        {name || DEFAULT_NAME}
      </span>
    </div>
  )
}

function SettingsForm({ settings }) {
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
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {errors.root?.server && (
        <p role="alert" className="bg-danger/10 text-danger rounded-lg px-3 py-2 text-sm">
          {errors.root.server.message}
        </p>
      )}

      <div className="grid items-start gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card className="relative overflow-hidden">
            <TopBar />
            <CardHeader
              className="p-4"
              title="Brand"
              description="Shown in the sidebar, login pages and emails."
            />
            <CardContent className="space-y-4 p-4">
              <FormField
                label="Name"
                required
                error={errors.platform_name?.message}
              >
                <Input
                  autoComplete="off"
                  placeholder={DEFAULT_NAME}
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
        </div>

        {/* Live preview: sidebar (dark) aur login/email (light) */}
        <div className="lg:sticky lg:top-24">
          <Card className="relative overflow-hidden">
            <TopBar />
            <CardHeader
              className="p-4"
              title="Preview"
              description="How your brand looks in the sidebar."
            />
            <CardContent className="p-4">
              <div className="bg-navy rounded-xl p-4">
                <BrandMark logo={previewLogo} name={name} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="bg-background/90 border-line sm:bg-card sticky bottom-0 -mx-4 flex flex-col-reverse gap-3 border-t px-4 py-3 backdrop-blur sm:mx-0 sm:flex-row sm:items-center sm:justify-between sm:rounded-xl sm:border sm:shadow-sm">
        <p className="text-muted flex items-center gap-2 text-sm" role="status">
          <span
            className={cn('size-2 rounded-full', isDirty ? 'bg-accent' : 'bg-success')}
            aria-hidden="true"
          />
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
  return (
    <>
      <PageHeader
        className="mb-4"
        title="Settings"
        description="Platform name and logo."
      />
      {settings.isLoading ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-80 lg:col-span-2" />
          <Skeleton className="h-64" />
        </div>
      ) : settings.isError ? (
        <ErrorState error={settings.error} onRetry={settings.refetch} />
      ) : (
        <SettingsForm
          key={settings.dataUpdatedAt}
          settings={settings.data ?? {}}
        />
      )}
    </>
  )
}