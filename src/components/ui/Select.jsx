import { forwardRef } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { fieldClass } from './field-styles'

// Native <select>: mobile par best, accessibility built-in, React Hook Form ke saath seedha chalta hai.
export const Select = forwardRef(function Select(
  { invalid = false, placeholder, className, children, ...props },
  ref,
) {
  return (
    <div className="relative">
      <select
        ref={ref}
        aria-invalid={invalid || undefined}
        className={fieldClass(invalid, cn('h-10 appearance-none py-2 pr-9', className))}
        {...props}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted" />
    </div>
  )
})
