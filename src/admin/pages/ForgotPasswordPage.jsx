import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, MailCheck } from 'lucide-react'
import { authApi } from '@/api/endpoints'
import { applyServerErrors } from '@/api/errors'
import { FormField } from '@/components/shared/FormField'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { paths } from '@/routes/paths'

const forgotSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
})

function BackToLogin() {
  return (
    <Link
      to={paths.adminLogin}
      className="text-muted hover:text-primary inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
    >
      <ArrowLeft className="size-4" />
      Back to login
    </Link>
  )
}

export function ForgotPasswordPage() {
  const [sentTo, setSentTo] = useState(null)
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(forgotSchema), defaultValues: { email: '' } })

  const onSubmit = async ({ email }) => {
    try {
      await authApi.forgotPassword({ email })
      setSentTo(email)
    } catch (error) {
      applyServerErrors(error, setError, { fields: ['email'] })
    }
  }

  if (sentTo) {
    return (
      <div className="space-y-5 text-center">
        <span className="bg-primary-soft text-primary mx-auto flex size-14 items-center justify-center rounded-full">
          <MailCheck className="size-7" />
        </span>
        <h1 className="text-3xl">Check your email</h1>
        <p className="text-muted">
          If an account exists for <strong className="text-heading">{sentTo}</strong>, a
          password reset link has been sent.
        </p>
        <BackToLogin />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <BackToLogin />
      <div>
        <h1 className="text-3xl">Forgot password?</h1>
        <p className="text-muted mt-1">
          Enter your email and we will send you a reset link.
        </p>
      </div>

      {errors.root?.server && (
        <p role="alert" className="bg-danger/10 text-danger rounded-lg px-3 py-2 text-sm">
          {errors.root.server.message}
        </p>
      )}

      <FormField label="Email" error={errors.email?.message} required>
        <Input type="email" autoComplete="email" {...register('email')} />
      </FormField>

      <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
        Send reset link
      </Button>
    </form>
  )
}
