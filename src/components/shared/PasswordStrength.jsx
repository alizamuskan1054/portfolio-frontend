import { Check, Circle } from 'lucide-react'
import { PASSWORD_RULES, STRENGTH_LEVELS, passwordStrength } from '@/lib/password'
import { cn } from '@/lib/utils'

const toneBar = {
  danger: 'bg-danger',
  warning: 'bg-warning',
  primary: 'bg-primary',
  success: 'bg-success',
}
const toneText = {
  danger: 'text-danger',
  warning: 'text-warning',
  primary: 'text-primary',
  success: 'text-success',
}

// Password field ke neeche: strength bar + requirements checklist.
// Sirf tab dikhta hai jab user type karna shuru kare.
//   <PasswordStrength value={watch('password')} />
export function PasswordStrength({ value = '', className }) {
  if (!value) return null

  const score = passwordStrength(value)
  const level = STRENGTH_LEVELS[score]

  return (
    <div className={cn('space-y-2.5', className)}>
      <div className="flex items-center gap-3">
        <div className="grid flex-1 grid-cols-4 gap-1.5" aria-hidden="true">
          {[1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className={cn(
                'h-1.5 rounded-full transition-colors duration-300',
                score >= i ? toneBar[level.tone] : 'bg-line',
              )}
            />
          ))}
        </div>
        <span
          aria-live="polite"
          className={cn('w-16 text-right text-xs font-medium', toneText[level.tone])}
        >
          {level.label}
        </span>
      </div>

      <ul className="grid gap-1 sm:grid-cols-2" aria-label="Password requirements">
        {PASSWORD_RULES.map((rule) => {
          const ok = rule.test(value)
          return (
            <li
              key={rule.key}
              className={cn(
                'flex items-center gap-1.5 text-xs transition-colors',
                ok ? 'text-success' : 'text-muted',
              )}
            >
              {ok ? (
                <Check className="size-3.5 shrink-0" />
              ) : (
                <Circle className="size-3.5 shrink-0 opacity-50" />
              )}
              <span>
                {rule.label}
                <span className="sr-only">{ok ? ' (met)' : ' (not met yet)'}</span>
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
