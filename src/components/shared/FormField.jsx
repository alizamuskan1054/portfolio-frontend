import { Children, cloneElement, isValidElement, useId } from 'react'
import { cn } from '@/lib/utils'

// Label + error + hint wrapper. Child (Input/Select/Textarea...) ko id, invalid aur aria khud mil jate hain.
//   <FormField label="Email" error={errors.email?.message} required>
//     <Input {...register('email')} />
//   </FormField>
export function FormField({ label, error, hint, required, className, children }) {
  const generatedId = useId()
  const child = Children.only(children)
  const id = (isValidElement(child) && child.props.id) || generatedId
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined

  const control = isValidElement(child)
    ? cloneElement(child, { id, invalid: Boolean(error), 'aria-describedby': describedBy })
    : child

  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-heading">
          {label}
          {required && (
            <span className="ml-0.5 text-danger" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}
      {control}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-xs text-danger">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="text-xs text-muted">
            {hint}
          </p>
        )
      )}
    </div>
  )
}
