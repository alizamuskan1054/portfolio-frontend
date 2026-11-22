import { cn } from '@/lib/utils'
import { useReveal } from '@/public/hooks/useReveal'

// Scroll par fade + rise animation. delay (ms) se cards ek ek karke aate hain (stagger).
//   <Reveal as="li" delay={index * 80}>...</Reveal>
// CSS: index.css (.sv-reveal). prefers-reduced-motion mein animation nahi hoti.
export function Reveal({ as: Comp = 'div', delay = 0, className, style, children, ...props }) {
  const [ref, shown] = useReveal()

  return (
    <Comp
      ref={ref}
      className={cn('sv-reveal', shown && 'is-in', className)}
      style={{ '--sv-delay': `${delay}ms`, ...style }}
      {...props}
    >
      {children}
    </Comp>
  )
}
