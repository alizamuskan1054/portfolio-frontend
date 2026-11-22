import { Container } from './Container'
import { cn } from '@/lib/utils'

// Andar ke pages (Services, Projects, Publications, Blogs, Contact) ka navy header.
// children: hero ke neeche extra cheez (metrics, filters). Home ka bara Hero alag component hai.
export function PageHero({ eyebrow, title, subtitle, children, className }) {
  return (
    <header className={cn('bg-navy text-on-navy', className)}>
      <Container className="py-10 sm:py-14">
        {eyebrow && (
          <p className="mb-2 text-xs font-semibold tracking-widest text-accent uppercase">{eyebrow}</p>
        )}
        <h1 className="max-w-3xl text-3xl text-on-navy sm:text-4xl">{title}</h1>
        {/* patli gold line: gold sirf chhota detail */}
        <span className="mt-4 block h-0.5 w-14 bg-accent" aria-hidden="true" />
        {subtitle && <p className="mt-4 max-w-2xl text-base text-on-navy/80 sm:text-lg">{subtitle}</p>}
        {children && <div className="mt-8">{children}</div>}
      </Container>
    </header>
  )
}
