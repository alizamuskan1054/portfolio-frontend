import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { authApi } from '@/api/endpoints'
import { applyServerErrors } from '@/api/errors'
import { ErrorState } from '@/components/shared/ErrorState'
import { FormField } from '@/components/shared/FormField'
import { PasswordStrength } from '@/components/shared/PasswordStrength'
import { Button } from '@/components/ui/Button'
import { PasswordInput } from '@/components/ui/Input'
import { notify } from '@/lib/notify'
import { passwordField } from '@/lib/password'
import { paths } from '@/routes/paths'

const resetSchema = z
  .object({
    new_password: passwordField('Password'),
    confirm_password: z.string().min(1, 'Please confirm your password'),
  })
  .refine((v) => v.new_password === v.confirm_password, {
    path: ['confirm_password'],
    message: 'Passwords do not match',
  })

// Email ka link aisa hona chahiye: /admin/reset-password?uid=...&token=...
export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const uid = searchParams.get('uid')
  const token = searchParams.get('token')

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(resetSchema),
    defaultValues: { new_password: '', confirm_password: '' },
  })
  const newPassword = useWatch({ control, name: 'new_password' })

  if (!uid || !token) {
    return (
      <ErrorState
        title="Invalid reset link"
        message="This password reset link is incomplete or has expired. Request a new one."
        onRetry={() => navigate(paths.adminForgotPassword)}
      />
    )
  }

  const onSubmit = async (values) => {
    try {
      await authApi.resetPassword({ uid, token, ...values })
      notify.success('Password reset successful. You can now log in.')
      navigate(paths.adminLogin, { replace: true })
    } catch (error) {
      applyServerErrors(error, setError, { fields: ['new_password', 'confirm_password'] })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <div>
        <h1 className="text-3xl">Reset password</h1>
        <p className="text-muted mt-1">Choose a new password for your account.</p>
      </div>

      {errors.root?.server && (
        <p role="alert" className="bg-danger/10 text-danger rounded-lg px-3 py-2 text-sm">
          {errors.root.server.message}
        </p>
      )}

      <FormField label="New password" error={errors.new_password?.message} required>
        <PasswordInput autoComplete="new-password" {...register('new_password')} />
      </FormField>
      <PasswordStrength value={newPassword} className="-mt-2" />

      <FormField
        label="Confirm password"
        error={errors.confirm_password?.message}
        required
      >
        <PasswordInput autoComplete="new-password" {...register('confirm_password')} />
      </FormField>

      <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
        Reset password
      </Button>

      <p className="text-center text-sm">
        <Link to={paths.adminLogin} className="text-primary font-medium hover:underline">
          Back to login
        </Link>
      </p>
    </form>
  )
}
