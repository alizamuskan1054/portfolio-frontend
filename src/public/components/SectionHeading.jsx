import { cn } from '@/lib/utils'
import { useSectionTone } from './Section'

// eyebrow (chhota blue label) + serif title + description + optional action (jaise "View all" link)
// Navy section ke andar khud inverted ho jata hai (gold eyebrow, light text).
export function SectionHeading({ eyebrow, title, description, action, align = 'left', inverted, className }) {
  const tone = useSectionTone()
  const onNavy = inverted ?? tone.inverted
  const centered = align === 'center'

  return (
    <div
      className={cn(
        'mb-8 flex flex-wrap items-end justify-between gap-4',
        centered && 'flex-col items-center text-center',
        className,
      )}
    >
      <div className={cn('max-w-2xl', centered && 'mx-auto')}>
        {eyebrow && (
          <p
            className={cn(
              'mb-1.5 text-xs font-semibold tracking-widest uppercase',
              onNavy ? 'text-accent' : 'text-primary',
            )}
          >
            {eyebrow}
          </p>
        )}
        <h2 className={cn('text-2xl sm:text-3xl', onNavy && 'text-on-navy')}>{title}</h2>
        {description && (
          <p className={cn('mt-2 text-base', onNavy ? 'text-on-navy/80' : 'text-muted')}>{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
