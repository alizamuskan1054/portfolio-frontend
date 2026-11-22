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
    <Card>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <CardHeader
          title="Change password"
          description="Use a strong password you do not use anywhere else."
        />
        <CardContent className="space-y-5">
          {errors.root?.server && (
            <p
              role="alert"
              className="bg-danger/10 text-danger rounded-lg px-3 py-2 text-sm"
            >
              {errors.root.server.message}
            </p>
          )}

          <FormField
            label="Current password"
            error={errors.old_password?.message}
            required
          >
            <PasswordInput
              autoComplete="current-password"
              {...register('old_password')}
            />
          </FormField>

          <div className="grid gap-5 sm:grid-cols-2">
            <FormField label="New password" error={errors.new_password?.message} required>
              <PasswordInput autoComplete="new-password" {...register('new_password')} />
            </FormField>
            <FormField
              label="Confirm new password"
              error={errors.confirm_password?.message}
              required
            >
              <PasswordInput
                autoComplete="new-password"
                {...register('confirm_password')}
              />
            </FormField>
          </div>
          <PasswordStrength value={newPassword} />
        </CardContent>
        <CardFooter>
          <Button type="submit" loading={isSubmitting}>
            Update password
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

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
      <PageHeader title="Profile" description="Manage your account details." />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="h-fit">
          <CardContent className="flex flex-col items-center p-8 text-center">
            <Avatar name={user?.full_name} src={user?.profile_photo} size="xl" />
            <h2 className="mt-4 text-2xl">{user?.full_name}</h2>
            <p className="text-muted text-sm">
              {roleOf(user) === 'client' ? 'Client' : 'Administrator'}
            </p>

            <dl className="border-line mt-6 w-full space-y-3 border-t pt-5 text-left text-sm">
              <div className="flex items-center gap-3">
                <Mail className="text-muted size-4 shrink-0" />
                <dd className="text-heading min-w-0 truncate">{user?.email}</dd>
              </div>
              <div className="flex items-center gap-3">
                <CalendarDays className="text-muted size-4 shrink-0" />
                <dd className="text-heading">
                  Member since {formatDate(user?.created_at)}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          <Card>
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <CardHeader
                title="Edit profile"
                description="Update your name and photo."
              />
              <CardContent className="space-y-5">
                {errors.root?.server && (
                  <p
                    role="alert"
                    className="bg-danger/10 text-danger rounded-lg px-3 py-2 text-sm"
                  >
                    {errors.root.server.message}
                  </p>
                )}

                <Controller
                  name="profile_photo"
                  control={control}
                  render={({ field }) => (
                    <ImageUploader
                      label="Profile photo"
                      shape="circle"
                      value={field.value}
                      onChange={field.onChange}
                      error={errors.profile_photo?.message}
                    />
                  )}
                />

                <FormField label="Full name" error={errors.full_name?.message} required>
                  <Input autoComplete="name" {...register('full_name')} />
                </FormField>

                <FormField label="Email" hint="Email cannot be changed here.">
                  <Input value={user?.email ?? ''} disabled readOnly />
                </FormField>
              </CardContent>
              <CardFooter>
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
