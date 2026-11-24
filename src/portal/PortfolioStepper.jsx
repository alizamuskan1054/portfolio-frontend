import { ProgressSteps } from '@/components/shared/ProgressSteps'
import { PORTFOLIO_STEPS } from './portfolioSteps'

// hrefFor(step) = step ka link; na de to steps click nahi hote
// (naya portfolio banate waqt baaki steps band rehte hain).
export function PortfolioStepper({ current, hrefFor, className }) {
  return (
    <ProgressSteps
      steps={PORTFOLIO_STEPS}
      current={current}
      hrefFor={hrefFor}
      className={className}
    />
  )
}
