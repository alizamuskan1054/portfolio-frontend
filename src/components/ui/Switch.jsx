import { Description, Field, Label, Switch as HeadlessSwitch } from '@headlessui/react'
import { cn } from '@/lib/utils'

// Controlled: <Switch checked={v} onChange={setV} label="Show blogs" />
// React Hook Form ke saath <Controller> mein use hoga.
export function Switch({ checked, onChange, label, description, disabled, className }) {
  return (
    <Field
      disabled={disabled}
      className={cn('flex items-center justify-between gap-4', className)}
    >
      {(label || description) && (
        <span className="min-w-0">
          {label && (
            <Label className="block text-sm font-medium text-heading">{label}</Label>
          )}
          {description && (
            <Description className="block text-sm text-muted">{description}</Description>
          )}
        </span>
      )}
      <HeadlessSwitch
        checked={checked}
        onChange={onChange}
        aria-label={label ? undefined : 'Toggle'}
        className="group relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full bg-muted/40 transition-colors data-checked:bg-success data-disabled:cursor-not-allowed data-disabled:opacity-60"
      >
        <span className="inline-block size-5 translate-x-0.5 rounded-full bg-white shadow transition-transform group-data-checked:translate-x-5.5" />
      </HeadlessSwitch>
    </Field>
  )
}
