import { useEffect, useId, useState } from 'react'
import { ArrowUp } from 'lucide-react'
import { cn } from '@/lib/utils'

// Floating "back to top" button. Admin aur public dono layouts mein ek baar lagao:
//   <ScrollToTop />
//
// Look: gehra navy circle, upar gradient (primary -> accent) progress ring jo scroll ke saath bharti hai,
// halka glow, hover par lift + arrow uchhalta hai. Page ke end par ring poori ho kar accent glow deti hai.
// Neeche scroll karne par nichay se scale + fade ke saath aata hai. Phone par safe-area (notch/home bar)
// ka khayal rakha gaya hai. prefers-reduced-motion par animation band.
const SHOW_AFTER = 300 // px
const SIZE = 44 // touch-friendly
const STROKE = 3
const RADIUS = (SIZE - STROKE) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export function ScrollToTop({ className }) {
  const gradientId = useId().replace(/:/g, '')
  const [progress, setProgress] = useState(0) // 0..1
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      const max = document.documentElement.scrollHeight - window.innerHeight
      const y = window.scrollY
      setVisible(y > SHOW_AFTER)
      setProgress(max > 0 ? Math.min(1, Math.max(0, y / max)) : 0)
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  const goTop = () => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })
  }

  const done = progress >= 0.98
  const percent = Math.round(progress * 100)

  return (
    <button
      type="button"
      onClick={goTop}
      aria-label={`Back to top (${percent}% scrolled)`}
      title="Back to top"
      tabIndex={visible ? 0 : -1}
      aria-hidden={!visible}
      className={cn(
        'group bg-navy text-on-navy fixed z-40 flex items-center justify-center rounded-full',
        'shadow-navy/40 shadow-lg ring-1 ring-white/10',
        'transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-xl',
        'focus-visible:ring-accent/60 focus-visible:ring-4 focus-visible:outline-none',
        'motion-reduce:transition-none motion-reduce:hover:translate-y-0',
        visible ? 'translate-y-0 scale-100 opacity-100' : 'pointer-events-none translate-y-4 scale-75 opacity-0',
        className,
      )}
      style={{
        width: SIZE,
        height: SIZE,
        right: 'max(0.75rem, env(safe-area-inset-right))',
        bottom: 'max(0.75rem, env(safe-area-inset-bottom))',
        boxShadow: done ? '0 0 0 4px color-mix(in srgb, var(--c-accent) 25%, transparent), 0 10px 24px -8px var(--c-accent)' : undefined,
      }}
    >
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="absolute inset-0 -rotate-90" aria-hidden="true">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: 'var(--c-primary)' }} />
            <stop offset="100%" style={{ stopColor: 'var(--c-accent)' }} />
          </linearGradient>
        </defs>
        {/* track */}
        <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none" stroke="currentColor" strokeOpacity="0.18" strokeWidth={STROKE} />
        {/* progress */}
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
          style={{ transition: 'stroke-dashoffset 120ms linear' }}
        />
      </svg>

      {/* andar ka halka gradient disc: ring aur arrow ke beech depth */}
      <span
        aria-hidden="true"
        className="absolute rounded-full"
        style={{
          inset: STROKE + 3,
          background: 'radial-gradient(circle at 30% 25%, color-mix(in srgb, var(--c-primary) 55%, transparent), transparent 70%)',
        }}
      />

      <ArrowUp
        className={cn(
          'relative size-[1.125rem] transition-all duration-300 group-hover:-translate-y-0.5',
          done ? 'text-accent' : 'text-on-navy',
        )}
        strokeWidth={2.5}
      />
    </button>
  )
}
