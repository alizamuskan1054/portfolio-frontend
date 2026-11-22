import { Link } from 'react-router-dom'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PORTFOLIO_STEPS } from './portfolioSteps'

// Admin wizard jaisa progress bar. hrefFor(step) = step ka link; na de to steps click nahi hote
// (naya portfolio banate waqt baaki steps band rehte hain).
export function PortfolioStepper({ current, hrefFor, className }) {
  const steps = PORTFOLIO_STEPS
  return (
    <nav aria-label="Progress" className={cn('mb-6', className)}>
      {/* Mobile: compact */}
      <div className="sm:hidden">
        <div className="flex items-center justify-between text-sm">
          <span className="text-heading font-medium">{steps[current].label}</span>
          <span className="text-muted">
            Step {current + 1} of {steps.length}
          </span>
        </div>
        <div className="bg-line mt-2 h-1.5 overflow-hidden rounded-full">
          <div
            className="bg-primary h-full rounded-full transition-all"
            style={{ width: `${((current + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Desktop: full */}
      <ol className="hidden items-center sm:flex">
        {steps.map((step, i) => {
          const done = i < current
          const active = i === current
          const href = hrefFor?.(step)
          const content = (
            <>
              <span
                className={cn(
                  'flex size-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold transition-colors',
                  active && 'border-primary bg-primary text-on-primary',
                  done && 'border-primary bg-primary-soft text-primary',
                  !active && !done && 'border-line bg-card text-muted',
                )}
              >
                {done ? <Check className="size-4" /> : i + 1}
              </span>
              <span
                className={cn(
                  'hidden text-sm whitespace-nowrap lg:block',
                  active ? 'text-heading font-medium' : 'text-muted',
                )}
              >
                {step.label}
              </span>
            </>
          )
          return (
            <li
              key={step.key}
              className={cn('flex items-center', i < steps.length - 1 && 'flex-1')}
            >
              {href ? (
                <Link
                  to={href}
                  aria-current={active ? 'step' : undefined}
                  className="group flex items-center gap-2"
                >
                  {content}
                </Link>
              ) : (
                <span
                  aria-current={active ? 'step' : undefined}
                  className="flex items-center gap-2"
                >
                  {content}
                </span>
              )}
              {i < steps.length - 1 && (
                <span
                  className={cn(
                    'mx-3 h-px flex-1',
                    i < current ? 'bg-primary' : 'bg-line',
                  )}
                  aria-hidden="true"
                />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
