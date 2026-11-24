import { Link } from 'react-router-dom'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

// Admin wizard aur client portal dono ka stepper: ek row, chhote circles, navy gradient.
// steps: [{ key, label }]. Click ke liye ya to onSelect(index) (+ maxReached) ya hrefFor(step).
export function ProgressSteps({
  steps,
  current,
  maxReached = steps.length - 1,
  onSelect,
  hrefFor,
  className,
}) {
  return (
    <nav aria-label="Progress" className={cn('mb-6', className)}>
      <div>
        <ol className="flex items-center">
          {steps.map((step, i) => {
            const done = i < current
            const active = i === current
            const href = hrefFor?.(step)
            const clickable = href ? true : Boolean(onSelect) && i <= maxReached

            const content = (
              <>
                <span className="flex size-5 shrink-0 items-center justify-center">
                  {done ? (
                    <span className="from-navy to-primary flex size-5 items-center justify-center rounded-full bg-linear-to-br text-white shadow-sm">
                      <Check className="size-3" strokeWidth={3} />
                    </span>
                  ) : active ? (
                    <span className="border-primary bg-card flex size-5 items-center justify-center rounded-full border-2">
                      <span className="from-navy to-primary size-2 rounded-full bg-linear-to-br" />
                    </span>
                  ) : (
                    <span className="bg-line size-2 rounded-full" />
                  )}
                </span>
                <span
                  className={cn(
                    'text-xs whitespace-nowrap transition-colors',
                    !active && 'hidden md:inline',
                    active
                      ? 'text-heading font-semibold'
                      : done
                        ? 'text-heading'
                        : 'text-muted',
                  )}
                >
                  {step.label}
                </span>
              </>
            )

            const common = {
              'aria-current': active ? 'step' : undefined,
              className: cn(
                'flex shrink-0 items-center gap-1.5 rounded-md',
                clickable ? 'hover:text-primary cursor-pointer' : 'cursor-default',
              ),
            }

            return (
              <li
                key={step.key}
                className={cn('flex items-center', i < steps.length - 1 ? 'flex-1' : 'shrink-0')}
              >
                {href ? (
                  <Link to={href} {...common}>
                    {content}
                  </Link>
                ) : onSelect ? (
                  <button
                    type="button"
                    disabled={!clickable}
                    onClick={() => onSelect(i)}
                    {...common}
                  >
                    {content}
                  </button>
                ) : (
                  <span {...common}>{content}</span>
                )}
                {i < steps.length - 1 && (
                  <span
                    aria-hidden="true"
                    className={cn(
                      'mx-1.5 h-0.5 min-w-1.5 flex-1 rounded-full',
                      i < current ? 'from-navy to-primary bg-linear-to-r' : 'bg-line',
                    )}
                  />
                )}
              </li>
            )
          })}
        </ol>
      </div>
    </nav>
  )
}