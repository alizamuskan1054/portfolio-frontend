import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CalendarDays, Mail } from 'lucide-react'
import { authApi } from '@/api/endpoints'
import { applyServerErrors } from '@/api/errors'
import { roleOf, useAuth } from '@/admin/auth'
import { FormField } from '@/components/shared/FormField'
import { ImageUploader } from '@/components/shared/ImageUploader'
import { PasswordStrength } from '@/components/shared/PasswordStrength'
import { PageHeader } from '@/components/shared/PageHeader'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/Card'
import { Input, PasswordInput } from '@/components/ui/Input'
import { formatDate } from '@/lib/format'
import { buildFilePayload } from '@/lib/formData'
import { notify } from '@/lib/notify'
import { passwordField } from '@/lib/password'

const profileSchema = z.object({
  full_name: z.string().trim().min(1, 'Full name is required').max(255, 'Too long'),
  profile_photo: z.any().optional(),
})

const passwordSchema = z
  .object({
    old_password: z.string().min(1, 'Current password is required'),
    new_password: passwordField('New password'),
    confirm_password: z.string().min(1, 'Please confirm the new password'),
  })
  .refine((v) => v.new_password === v.confirm_password, {
    path: ['confirm_password'],
    message: 'Passwords do not match',
  })
  .refine((v) => v.new_password !== v.old_password, {
    path: ['new_password'],
    message: 'New password must be different from the current one',
  })

// NOTE: endpoint aur fields (old_password, new_password, confirm_password) API doc mein nahi,
// backend se confirm karne hain. Badlav sirf yahan aur api/endpoints.js mein.
const PASSWORD_FIELDS = ['old_password', 'new_password', 'confirm_password']

const GRADIENT = 'linear-gradient(90deg, var(--c-primary), var(--c-accent))'

// Card ke upar patli gradient line
function TopBar() {
  return <span className="absolute inset-x-0 top-0 h-1" style={{ background: GRADIENT }} aria-hidden="true" />
}

// ---------- Summary strip (ek hi row, chhota) ----------

function InfoChip({ icon: Icon, children }) {
  return (
    <span className="border-line bg-surface text-heading inline-flex min-w-0 items-center gap-2 rounded-full border px-3 py-1.5 text-sm">
      <Icon className="text-primary size-4 shrink-0" aria-hidden="true" />
      <span className="truncate">{children}</span>
    </span>
  )
}

function ProfileSummary({ user }) {
  const role = roleOf(user) === 'client' ? 'Client' : 'Administrator'

  return (
    <section
      className="border-line bg-card relative flex flex-wrap items-center gap-x-5 gap-y-3 overflow-hidden rounded-2xl border p-4 shadow-sm sm:px-5"
      aria-label="Account summary"
    >
      <TopBar />

      <div className="flex min-w-0 items-center gap-4">
        <span className="ring-primary/20 shrink-0 rounded-full ring-2 ring-offset-2 ring-offset-[var(--c-card)]">
          <Avatar name={user?.full_name} src={user?.profile_photo} size="lg" />
        </span>
        <div className="min-w-0">
          <h2 className="truncate text-xl sm:text-2xl">{user?.full_name}</h2>
          <p className="text-muted mt-0.5 flex items-center gap-2 text-sm">
            <span className="bg-accent size-1.5 rounded-full" aria-hidden="true" />
            {role}
          </p>
        </div>
      </div>

      <div className="flex min-w-0 flex-wrap items-center gap-2 sm:ml-auto">
        <InfoChip icon={Mail}>{user?.email ?? '-'}</InfoChip>
        <InfoChip icon={CalendarDays}>Member since {formatDate(user?.created_at)}</InfoChip>
      </div>
    </section>
  )
}

// ---------- Change password ----------

function ChangePasswordCard() {
  const {
    register,
    control,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: { old_password: '', new_password: '', confirm_password: '' },
  })
  const newPassword = useWatch({ control, name: 'new_password' })

  const onSubmit = async (values) => {
    try {
      await authApi.changePassword(values)
      notify.success('Password changed.')
      reset()
    } catch (error) {
      applyServerErrors(error, setError, { fields: PASSWORD_FIELDS })
    }
  }

  return (
    <Card className="relative flex flex-col overflow-hidden">
      <TopBar />
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="flex flex-1 flex-col"
      >
        <CardHeader
          className="p-4"
          title="Change password"
          description="Use a strong password you do not use anywhere else."
        />
        <CardContent className="flex-1 space-y-3 p-4">
          {errors.root?.server && (
            <p
              role="alert"
              className="bg-danger/10 text-danger rounded-lg px-3 py-2 text-sm"
            >
              {errors.root.server.message}
            </p>
          )}
          <FormField label="Current" error={errors.old_password?.message}>
            <PasswordInput
              autoComplete="current-password"
              {...register('old_password')}
            />
          </FormField>
          <FormField label="New" error={errors.new_password?.message}>
            <PasswordInput autoComplete="new-password" {...register('new_password')} />
          </FormField>
          <FormField label="Confirm" error={errors.confirm_password?.message}>
            <PasswordInput autoComplete="new-password" {...register('confirm_password')} />
          </FormField>
          <PasswordStrength value={newPassword} />
        </CardContent>
        <CardFooter className="p-4">
          <Button type="submit" loading={isSubmitting}>
            Update password
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

// ---------- Page ----------

export function ProfilePage() {
  const { user, setUser } = useAuth()

  const {
    register,
    control,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: user?.full_name ?? '',
      profile_photo: user?.profile_photo ?? null,
    },
  })

  const onSubmit = async ({ full_name, profile_photo }) => {
    try {
      // Naya File chuna ho to multipart, warna normal JSON (purani photo ka URL wapas nahi bhejte)
      const payload = buildFilePayload(
        { full_name, profile_photo },
        ['profile_photo'],
        user,
      )
      const updated = await authApi.updateProfile(payload)
      const next = { ...user, ...updated }
      setUser(next)
      reset({ full_name: next.full_name, profile_photo: next.profile_photo ?? null })
      notify.success('Profile updated.')
    } catch (error) {
      applyServerErrors(error, setError, { fields: ['full_name', 'profile_photo'] })
    }
  }

  return (
    <>
      <PageHeader
        className="mb-4"
        title="Profile"
        description={
          roleOf(user) === 'client'
            ? 'Manage your account details.'
            : 'Manage your admin account details.'
        }
      />

      <div className="space-y-4">
        <ProfileSummary user={user} />

        <div className="grid items-stretch gap-4 lg:grid-cols-2">
          <Card className="relative flex flex-col overflow-hidden">
            <TopBar />
            <form
              onSubmit={handleSubmit(onSubmit)}
              noValidate
              className="flex flex-1 flex-col"
            >
              <CardHeader
                className="p-4"
                title="Edit profile"
                description="Update your name and photo."
              />
              <CardContent className="flex-1 space-y-3 p-4">
                {errors.root?.server && (
                  <p
                    role="alert"
                    className="bg-danger/10 text-danger rounded-lg px-3 py-2 text-sm"
                  >
                    {errors.root.server.message}
                  </p>
                )}

                {/* photo aur fields ek row mein (chhoti screen par stack) */}
                <div className="grid gap-4 sm:grid-cols-[auto_1fr] sm:items-center">
                  <div className="flex justify-center">
                    <Controller
                      name="profile_photo"
                      control={control}
                      render={({ field }) => (
                        <ImageUploader
                          label="Profile photo"
                          shape="circle-sm"
                          showHint={false}
                          value={field.value}
                          onChange={field.onChange}
                          error={errors.profile_photo?.message}
                        />
                      )}
                    />
                  </div>
                  <div className="min-w-0 space-y-3">
                    <FormField label="Full name" error={errors.full_name?.message}>
                      <Input autoComplete="name" {...register('full_name')} />
                    </FormField>
                    <FormField label="Email">
                      <Input value={user?.email ?? ''} disabled readOnly />
                    </FormField>
                  </div>
                </div>

                {isDirty && (
                  <p className="text-primary flex items-center gap-2 text-xs font-medium" role="status">
                    <span className="bg-accent size-1.5 rounded-full" aria-hidden="true" />
                    You have unsaved changes
                  </p>
                )}
              </CardContent>
              <CardFooter className="p-4">
                <Button
                  variant="secondary"
                  disabled={!isDirty || isSubmitting}
                  onClick={() => reset()}
                >
                  Reset
                </Button>
                <Button type="submit" loading={isSubmitting} disabled={!isDirty}>
                  Save changes
                </Button>
              </CardFooter>
            </form>
          </Card>

          <ChangePasswordCard />
        </div>
      </div>
    </>
  )
}