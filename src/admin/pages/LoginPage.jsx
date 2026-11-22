import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { applyServerErrors } from '@/api/errors'
import { FormField } from '@/components/shared/FormField'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Checkbox'
import { Input, PasswordInput } from '@/components/ui/Input'
import { notify } from '@/lib/notify'
import { paths } from '@/routes/paths'
import { useAuth } from '@/admin/auth'

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
  remember: z.boolean(),
})

export function LoginPage() {
  const { login } = useAuth()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', remember: true },
  })

  const onSubmit = async (values) => {
    try {
      await login(values)
      notify.success('Welcome back!')
      // Redirect GuestRoute khud kar deta hai
    } catch (error) {
      applyServerErrors(error, setError, { fields: ['email', 'password'] })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <div>
        <h1 className="text-3xl">Welcome back</h1>
        <p className="text-muted mt-1">Sign in to manage your portfolios.</p>
      </div>

      {errors.root?.server && (
        <p role="alert" className="bg-danger/10 text-danger rounded-lg px-3 py-2 text-sm">
          {errors.root.server.message}
        </p>
      )}

      <FormField label="Email" error={errors.email?.message} required>
        <Input
          type="email"
          autoComplete="email"
          placeholder="admin@example.com"
          {...register('email')}
        />
      </FormField>

      <FormField label="Password" error={errors.password?.message} required>
        <PasswordInput autoComplete="current-password" {...register('password')} />
      </FormField>

      <div className="flex items-center justify-between text-sm">
        <Checkbox label="Remember me" {...register('remember')} />
        <Link
          to={paths.adminForgotPassword}
          className="text-primary font-medium hover:underline"
        >
          Forgot password?
        </Link>
      </div>

      <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
        Login
      </Button>

      <p className="text-muted text-center text-sm">
        Don&apos;t have an account?{' '}
        <Link to={paths.adminSignup} className="text-primary font-medium hover:underline">
          Create account
        </Link>
      </p>
    </form>
  )
}
