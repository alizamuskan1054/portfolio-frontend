import { useQuery } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import { authApi } from '@/api/endpoints'
import { ErrorState } from '@/components/shared/ErrorState'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { paths } from '@/routes/paths'

// Email ka link: /admin/verify-email?uid=...&token=...
// useQuery: dev mein StrictMode double-run ke bawajood request ek hi baar jati hai
export function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const uid = searchParams.get('uid')
  const token = searchParams.get('token')

  const verify = useQuery({
    queryKey: ['verify-email', uid, token],
    queryFn: () => authApi.verifyEmail({ uid, token }),
    enabled: Boolean(uid && token),
    retry: false,
    staleTime: Infinity,
    gcTime: 0,
  })

  if (!uid || !token || verify.isError) {
    return (
      <div className="space-y-4">
        <ErrorState
          title="Verification failed"
          message={
            verify.isError
              ? verify.error.message
              : 'This verification link is incomplete. Open the link from your email again.'
          }
        />
        <Button as={Link} to={paths.adminSignup} variant="secondary" className="w-full">
          Back to signup
        </Button>
      </div>
    )
  }

  if (verify.isSuccess) {
    return (
      <div className="space-y-5 text-center">
        <span className="bg-success/15 text-success mx-auto flex size-16 items-center justify-center rounded-full">
          <CheckCircle2 className="size-8" />
        </span>
        <div>
          <h1 className="text-3xl">Email verified</h1>
          <p className="text-muted mt-2">Your account is active. You can log in now.</p>
        </div>
        <Button as={Link} to={paths.adminLogin} size="lg" className="w-full">
          Go to login
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-3 py-10 text-center" role="status">
      <Spinner className="size-8" />
      <p className="text-muted">Verifying your email...</p>
    </div>
  )
}
