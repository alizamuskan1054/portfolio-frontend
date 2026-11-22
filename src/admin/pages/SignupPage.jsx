// Signup + "check your email" panel + 5 minute resend timer (browser mein save, refresh par reset nahi).
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { MailCheck } from 'lucide-react'
import { authApi } from '@/api/endpoints'
import { applyServerErrors } from '@/api/errors'
import { FormField } from '@/components/shared/FormField'
import { PasswordStrength } from '@/components/shared/PasswordStrength'
import { Button } from '@/components/ui/Button'
import { Input, PasswordInput } from '@/components/ui/Input'
import { notify } from '@/lib/notify'
import { passwordField } from '@/lib/password'
import { paths } from '@/routes/paths'

// Countdown jo page refresh ke baad bhi chalta rehta hai (expiry time localStorage mein).
//   const { remaining, start } = useCooldown('pp-resend-a@b.com', 5 * 60 * 1000)
//   remaining = baqi seconds (0 = dobara allowed), start() = naya countdown shuru

function writeCooldown(storageKey, durationMs) {
  const expiresAt = Date.now() + durationMs
  try {
    localStorage.setItem(storageKey, String(expiresAt))
  } catch {
    /* storage blocked: countdown sirf is page tak chalega */
  }
  return expiresAt
}

function readCooldown(storageKey) {
  try {
    const value = Number(localStorage.getItem(storageKey))
    return Number.isFinite(value) ? value : 0
  } catch {
    return 0
  }
}

function useCooldown(storageKey, durationMs) {
  const [expiresAt, setExpiresAt] = useState(() => readCooldown(storageKey))
  const [now, setNow] = useState(() => Date.now())
  const active = expiresAt > now

  useEffect(() => {
    if (!active) return undefined
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [active])

  const start = useCallback(() => {
    setExpiresAt(writeCooldown(storageKey, durationMs))
    setNow(Date.now())
  }, [storageKey, durationMs])

  return { remaining: Math.max(0, Math.ceil((expiresAt - now) / 1000)), start }
}

function formatCountdown(totalSeconds) {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

const RESEND_COOLDOWN_MS = 5 * 60 * 1000 // 5 minute
const resendKey = (email) => `pp-resend-${email.trim().toLowerCase()}`

// Signup ke baad: "email check karo" + 5 minute baad Resend
function CheckEmailPanel({ email, onChangeEmail }) {
  const { remaining, start } = useCooldown(resendKey(email), RESEND_COOLDOWN_MS)
  const [sending, setSending] = useState(false)

  const resend = async () => {
    setSending(true)
    try {
      await authApi.resendVerification({ email })
      notify.success('Verification email sent again.')
      start()
    } catch (error) {
      notify.error(error)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-5 text-center">
      <span className="bg-primary-soft text-primary mx-auto flex size-16 items-center justify-center rounded-full">
        <MailCheck className="size-8" />
      </span>
      <div>
        <h1 className="text-3xl">Check your email</h1>
        <p className="text-muted mt-2">
          We sent a verification link to{' '}
          <span className="text-heading font-medium">{email}</span>. Click it to activate
          your account.
        </p>
      </div>

      <div className="border-line bg-card rounded-xl border p-4 text-sm">
        <p className="text-muted">Did not get it? Check your spam folder first.</p>
        <Button
          variant="secondary"
          className="mt-3 w-full"
          onClick={resend}
          loading={sending}
          disabled={remaining > 0}
        >
          {remaining > 0
            ? `Resend email in ${formatCountdown(remaining)}`
            : 'Resend email'}
        </Button>
      </div>

      <div className="flex flex-col gap-2 text-sm">
        <Button as={Link} to={paths.adminLogin} size="lg" className="w-full">
          Back to login
        </Button>
        <button
          type="button"
          onClick={onChangeEmail}
          className="text-primary font-medium hover:underline"
        >
          Wrong email? Use a different one
        </button>
      </div>
    </div>
  )
}

// NOTE: request fields (full_name, email, password, confirm_password) abhi andaaza hain.
// Backend signup serializer se match karke sirf SIGNUP_FIELDS aur schema badalna hoga.
const SIGNUP_FIELDS = ['full_name', 'email', 'password', 'confirm_password']

const signupSchema = z
  .object({
    full_name: z.string().trim().min(1, 'Full name is required').max(255, 'Too long'),
    email: z.string().trim().min(1, 'Email is required').email('Enter a valid email'),
    password: passwordField('Password'),
    confirm_password: z.string().min(1, 'Please confirm your password'),
  })
  .refine((v) => v.password === v.confirm_password, {
    path: ['confirm_password'],
    message: 'Passwords do not match',
  })

export function SignupPage() {
  const [sentTo, setSentTo] = useState(null)
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(signupSchema),
    defaultValues: { full_name: '', email: '', password: '', confirm_password: '' },
  })

  const password = useWatch({ control, name: 'password' })

  const onSubmit = async (values) => {
    try {
      await authApi.signup(values)
      writeCooldown(resendKey(values.email), RESEND_COOLDOWN_MS) // pehli email abhi gayi: 5 min baad resend
      setSentTo(values.email)
    } catch (error) {
      applyServerErrors(error, setError, { fields: SIGNUP_FIELDS })
    }
  }

  if (sentTo)
    return <CheckEmailPanel email={sentTo} onChangeEmail={() => setSentTo(null)} />

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <div>
        <h1 className="text-3xl">Create your account</h1>
        <p className="text-muted mt-1">
          Start building portfolio websites for researchers.
        </p>
      </div>

      {errors.root?.server && (
        <p role="alert" className="bg-danger/10 text-danger rounded-lg px-3 py-2 text-sm">
          {errors.root.server.message}
        </p>
      )}

      <FormField label="Full name" error={errors.full_name?.message} required>
        <Input
          autoComplete="name"
          placeholder="Your full name"
          {...register('full_name')}
        />
      </FormField>

      <FormField label="Email" error={errors.email?.message} required>
        <Input
          type="email"
          autoComplete="email"
          placeholder="admin@example.com"
          {...register('email')}
        />
      </FormField>

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
        Create account
      </Button>

      <p className="text-muted text-center text-sm">
        Already have an account?{' '}
        <Link to={paths.adminLogin} className="text-primary font-medium hover:underline">
          Login
        </Link>
      </p>
    </form>
  )
}
