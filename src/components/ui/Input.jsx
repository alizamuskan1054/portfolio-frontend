import { forwardRef, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { fieldClass } from './field-styles'

const PICKER_TYPES = ['date', 'month', 'time', 'datetime-local']

export const Input = forwardRef(function Input(
  { type = 'text', invalid = false, icon: Icon, className, onClick, ...props },
  ref,
) {
  const field = (
    <input
      ref={ref}
      type={type}
      aria-invalid={invalid || undefined}
      className={fieldClass(invalid, cn('h-10 py-2', Icon && 'pl-10', className))}
      onClick={(e) => {
        onClick?.(e)
        // Date/time input: poore field par click se calendar khule (sirf chhote icon par nahi)
        if (PICKER_TYPES.includes(type)) {
          try {
            e.currentTarget.showPicker?.()
          } catch {
            /* browser na khol sake to native icon se khulta hai */
          }
        }
      }}
      {...props}
    />
  )
  if (!Icon) return field
  return (
    <div className="group relative">
      <Icon
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute top-1/2 left-3 size-[17px] -translate-y-1/2 transition-colors',
          invalid ? 'text-danger' : 'text-muted group-focus-within:text-primary',
        )}
      />
      {field}
    </div>
  )
})

export const PasswordInput = forwardRef(function PasswordInput(
  { icon, className, ...props },
  ref,
) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="relative">
      <Input
        ref={ref}
        type={visible ? 'text' : 'password'}
        icon={icon}
        className={cn('pr-11', className)}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted transition-colors hover:text-primary"
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  )
})
