import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { applyServerErrors } from '@/api/errors'
import { ErrorState } from '@/components/shared/ErrorState'
import { FormField } from '@/components/shared/FormField'
import { PasswordStrength } from '@/components/shared/PasswordStrength'
import { Button } from '@/components/ui/Button'
import { PasswordInput } from '@/components/ui/Input'
import { notify } from '@/lib/notify'
import { passwordField } from '@/lib/password'
import { portalApi } from '@/portal/api'
import { paths } from '@/routes/paths'

const schema = z
  .object({
    password: passwordField('Password'),
    confirm_password: z.string().min(1, 'Please confirm your password'),
  })
  .refine((v) => v.password === v.confirm_password, {
    path: ['confirm_password'],
    message: 'Passwords do not match',
  })

// Invite email ka link: /portal/accept-invite?uid=...&token=...
export function AcceptInvitePage() {
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
    resolver: zodResolver(schema),
    defaultValues: { password: '', confirm_password: '' },
  })
  const password = useWatch({ control, name: 'password' })

  if (!uid || !token) {
    return (
      <div className="space-y-4">
        <ErrorState
          title="Invalid invite link"
          message="This invite link is incomplete or has expired. Ask your admin to send a new invite."
        />
        <Button as={Link} to={paths.login} variant="secondary" className="w-full">
          Go to login
        </Button>
      </div>
    )
  }

  const onSubmit = async (values) => {
    try {
      await portalApi.acceptInvite({ uid, token, ...values })
      notify.success('Password set. Please log in.')
      navigate(paths.login, { replace: true })
    } catch (error) {
      applyServerErrors(error, setError, { fields: ['password', 'confirm_password'] })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <div>
        <h1 className="text-3xl">Welcome aboard</h1>
        <p className="text-muted mt-1">
          Set a password to activate your account and start building your portfolio.
        </p>
      </div>

      {errors.root?.server && (
        <p role="alert" className="bg-danger/10 text-danger rounded-lg px-3 py-2 text-sm">
          {errors.root.server.message}
        </p>
      )}

      <FormField label="Password" error={errors.password?.message} required>
        <PasswordInput autoComplete="new-password" {...register('password')} />
      </FormField>
      <PasswordStrength value={password} className="-mt-2" />

      <FormField
        label="Confirm password"
        error={errors.confirm_password?.message}
        required
      >
        <PasswordInput autoComplete="new-password" {...register('confirm_password')} />
      </FormField>

      <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
        Activate account
      </Button>

      <p className="text-center text-sm">
        <Link to={paths.login} className="text-primary font-medium hover:underline">
          Already have an account? Login
        </Link>
      </p>
    </form>
  )
}
