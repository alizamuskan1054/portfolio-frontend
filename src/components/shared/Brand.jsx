import { GraduationCap } from 'lucide-react'
import { usePlatformSettings } from '@/hooks/usePlatformSettings'
import { cn } from '@/lib/utils'

// inverted: navy background ke upar (sidebar, auth panel)
export function Brand({ inverted = false, compact = false, className }) {
  const { name, logo } = usePlatformSettings()

  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      {logo ? (
        <img src={logo} alt="" className="size-9 rounded-lg object-contain" />
      ) : (
        <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-on-primary">
          <GraduationCap className="size-5" />
        </span>
      )}
      {!compact && (
        <span
          className={cn(
            'font-serif text-lg font-semibold',
            inverted ? 'text-on-navy' : 'text-heading',
          )}
        >
          {name}
        </span>
      )}
    </div>
  )
}
