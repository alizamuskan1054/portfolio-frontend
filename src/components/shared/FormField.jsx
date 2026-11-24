import { Children, cloneElement, isValidElement, useId } from 'react'
import { useFormLayout } from '@/components/ui/modal-context'
import { inferFieldIcon, prettyLabel } from './field-icons'
import { cn } from '@/lib/utils'

// Label + error + hint wrapper. Child (Input/Select/Textarea...) ko id, invalid aur aria khud mil jate hain.
//   <FormField label="Email" error={errors.email?.message} required>
//     <Input {...register('email')} />
//   </FormField>
// layout: 'row' (label side mein, default) | 'stack' (label upar). Auth pages stack dete hain.
export function FormField({
  label,
  icon,
  error,
  hint,
  required,
  layout,
  className,
  children,
}) {
  const contextLayout = useFormLayout()
  const row = (layout ?? contextLayout ?? 'row') === 'row'
  // icon={false}: koi icon nahi; na diya ho to label se khud chunta hai
  const Icon = icon === false ? null : (icon ?? inferFieldIcon(label))
  const text = prettyLabel(label)
  const generatedId = useId()
  const child = Children.only(children)
  const id = (isValidElement(child) && child.props.id) || generatedId
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined

  const control = isValidElement(child)
    ? cloneElement(child, {
        id,
        invalid: Boolean(error),
        'aria-describedby': describedBy,
      })
    : child

  const labelEl = label && (
    <label
      htmlFor={id}
      className={cn('block text-sm font-medium text-heading', row && 'sm:pt-2.5')}
    >
      <span className="inline-flex items-center gap-2">
        {Icon && <Icon aria-hidden="true" className="size-4 shrink-0" />}
        {text}
      </span>
      {required && !row && (
        <span className="ml-0.5 text-danger" aria-hidden="true">
          *
        </span>
      )}
    </label>
  )

  const message = error ? (
    <p id={`${id}-error`} role="alert" className="text-xs text-danger">
      {error}
    </p>
  ) : (
    hint && (
      <p id={`${id}-hint`} className="text-xs text-muted">
        {hint}
      </p>
    )
  )

  if (row) {
    return (
      <div
        className={cn(
          'grid gap-x-4 gap-y-1.5',
          label ? 'sm:grid-cols-[7rem_minmax(0,1fr)]' : 'sm:grid-cols-1',
          className,
        )}
      >
        {labelEl}
        <div className="min-w-0 space-y-1.5">
          {control}
          {message}
        </div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-1.5', className)}>
      {labelEl}
      {control}
      {message}
    </div>
  )
}
