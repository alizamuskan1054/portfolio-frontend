import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Spinner({ className }) {
  return <Loader2 className={cn('size-5 animate-spin text-primary', className)} aria-hidden="true" />
}

export function FullPageSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background" role="status">
      <Spinner className="size-8" />
      <span className="sr-only">Loading</span>
    </div>
  )
}
