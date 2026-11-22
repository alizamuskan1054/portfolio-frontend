import { forwardRef } from 'react'
import { cn } from '@/lib/utils'
import { fieldClass } from './field-styles'

export const Textarea = forwardRef(function Textarea(
  { invalid = false, rows = 4, className, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      aria-invalid={invalid || undefined}
      className={fieldClass(invalid, cn('resize-y py-2', className))}
      {...props}
    />
  )
})
