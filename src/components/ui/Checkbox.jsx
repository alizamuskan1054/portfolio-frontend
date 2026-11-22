import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export const Checkbox = forwardRef(function Checkbox(
  { label, description, className, ...props },
  ref,
) {
  return (
    <label className={cn('flex cursor-pointer items-start gap-3', className)}>
      <input
        ref={ref}
        type="checkbox"
        className="mt-0.5 size-4 shrink-0 cursor-pointer rounded border-line accent-primary"
        {...props}
      />
      {(label || description) && (
        <span className="text-sm">
          {label && <span className="font-medium text-heading">{label}</span>}
          {description && <span className="block text-muted">{description}</span>}
        </span>
      )}
    </label>
  )
})
