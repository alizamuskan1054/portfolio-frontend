import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ArrowUpRight, Mail, MessageCircle, Phone, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import { paths } from '@/routes/paths'
import { Container } from '@/public/components/Container'
import { PageHero } from '@/public/components/PageHero'
import { IconTile } from '@/public/components/IconTile'
import { Reveal } from '@/public/components/Reveal'
import { Section } from '@/public/components/Section'
import { SectionHeading } from '@/public/components/SectionHeading'
import { useServices } from '@/public/hooks/usePublicData'
import { usePublicSite } from '@/public/hooks/usePublicSite'

// =====================================================================================
// SERVICES PAGE (v2): hero, service cards, How I Work (4 steps), Contact CTA band.
// Hero ab shared <PageHero> hai (rectangle, curve nahi), isliye size baqi saare pages jaisa hi rehta hai.
// Cards/headings ke sizes aur radius bhi baqi pages ke barabar kiye gaye (rounded-xl cards, chhoti headings).
// Yeh poore site ka akela page hai jahan call-to-action band hai.
//
// Order aur backgrounds:  navy hero -> background (featured + cards) -> blue-tint (How I Work)
//                         -> background (CTA gradient card) -> navy footer (layout ka hissa)
//
// Visibility (section_visibility.services):
//   how_i_work   -> process steps section (steps na hon to bhi hide)
//   contact_cta  -> bottom CTA band
//
// Animations: index.css ke `sv-*` classes + <Reveal>. prefers-reduced-motion mein sab band.
// Layout (grids) inline style mein hain (auto-fit) taake breakpoints ke bina bhi responsive rahen.
// =====================================================================================

// Is page ki saari CSS (animations, gradients) yahin hai: alag CSS file ya index.css mein kuch add nahi karna.
const SERVICES_CSS = `
/* =====================================================================================
   SERVICES PAGE (sv-*): animations, gradients, glass.
   Sab colors theme variables (--c-*) se aate hain, isliye light/dark dono mein theme ke saath chalte hain.
   @layer components mein hain taake Tailwind utilities zaroorat par override kar saken.
   ===================================================================================== */
:root {
  /* navy se royal blue ke beech ka gehra gradient stop */
  --sv-deep: color-mix(in srgb, var(--c-primary) 88%, var(--c-navy));
  --sv-icon-end: var(--c-navy);
}
.dark {
  /* dark mode mein primary halka hota hai: cream text ke liye gradient ko gehra rakho */
  --sv-deep: color-mix(in srgb, var(--c-primary) 38%, var(--c-navy));
  --sv-icon-end: color-mix(in srgb, var(--c-primary) 45%, var(--c-on-navy));
}

@keyframes sv-drift {
  0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
  33% { transform: translate3d(36px, -26px, 0) scale(1.12); }
  66% { transform: translate3d(-28px, 22px, 0) scale(0.94); }
}
@keyframes sv-float {
  0%, 100% { transform: translate3d(0, 0, 0) rotate(0deg); }
  50% { transform: translate3d(0, -14px, 0) rotate(1.5deg); }
}
@keyframes sv-gradient {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}
@keyframes sv-spin {
  to { transform: rotate(360deg); }
}
@keyframes sv-ping {
  0% { transform: scale(1); opacity: 0.7; }
  80%, 100% { transform: scale(2.6); opacity: 0; }
}
@keyframes sv-shine {
  to { transform: translateX(380%) skewX(-20deg); }
}
@keyframes sv-draw {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}
@keyframes sv-sheen {
  0% { background-position: 0% 50%; }
  100% { background-position: 200% 50%; }
}
@keyframes sv-rise {
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: none; }
}
@keyframes sv-twinkle {
  0%, 100% { opacity: 0.25; transform: scale(0.8) rotate(0deg); }
  50% { opacity: 1; transform: scale(1.15) rotate(20deg); }
}

@layer components {
  /* ---- scroll reveal ---- */
  .sv-reveal {
    opacity: 0;
    transform: translate3d(0, 28px, 0) scale(0.98);
    transition:
      opacity 0.8s cubic-bezier(0.2, 0.7, 0.2, 1) var(--sv-delay, 0ms),
      transform 0.8s cubic-bezier(0.2, 0.7, 0.2, 1) var(--sv-delay, 0ms);
  }
  .sv-reveal.is-in {
    opacity: 1;
    transform: none;
  }

  /* ---- hero (shared PageHero + decoration, rectangle) ---- */
  .sv-hero-wrap {
    position: relative;
    overflow: hidden;
    color: var(--c-on-navy);
  }
  .sv-hero-wrap .sv-blob {
    z-index: 1;
    pointer-events: none;
  }
  .sv-hero-wrap .sv-dots {
    z-index: 1;
    opacity: 0.5;
    pointer-events: none;
    background-image: radial-gradient(color-mix(in srgb, var(--c-on-navy) 28%, transparent) 1px, transparent 1px);
    -webkit-mask-image: linear-gradient(180deg, #000, transparent 85%);
    mask-image: linear-gradient(180deg, #000, transparent 85%);
  }
  .sv-sheen {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 2px;
    z-index: 2;
    pointer-events: none;
    background: linear-gradient(90deg, transparent, var(--c-primary), var(--c-accent), transparent);
    background-size: 200% 100%;
    animation: sv-sheen 6s linear infinite;
  }
  .sv-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .sv-chip-in {
    animation: sv-rise 0.6s cubic-bezier(0.2, 0.7, 0.2, 1) both;
    animation-delay: calc(var(--i, 0) * 100ms + 150ms);
  }
  .sv-blob {
    position: absolute;
    border-radius: 9999px;
    filter: blur(70px);
    animation: sv-drift 24s ease-in-out infinite;
  }
  .sv-dots {
    position: absolute;
    inset: 0;
    opacity: 0.08;
    background-image: radial-gradient(currentColor 1px, transparent 1px);
    background-size: 26px 26px;
    -webkit-mask-image: radial-gradient(ellipse at 50% 35%, #000 25%, transparent 75%);
    mask-image: radial-gradient(ellipse at 50% 35%, #000 25%, transparent 75%);
  }
  .sv-glass {
    border: 1px solid color-mix(in srgb, var(--c-on-navy) 18%, transparent);
    background: color-mix(in srgb, var(--c-on-navy) 8%, transparent);
    -webkit-backdrop-filter: blur(10px);
    backdrop-filter: blur(10px);
  }
  .sv-float {
    animation: sv-float 7s ease-in-out infinite;
    animation-delay: var(--sv-delay, 0s);
  }
  .sv-dot-live {
    position: relative;
    display: inline-block;
    width: 7px;
    height: 7px;
    border-radius: 9999px;
    background: var(--c-accent);
  }
  .sv-dot-live::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 9999px;
    background: var(--c-accent);
    animation: sv-ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
  }
  .sv-twinkle {
    animation: sv-twinkle 3.6s ease-in-out infinite;
    animation-delay: var(--sv-delay, 0s);
  }

  /* ---- shine sweep (buttons) ---- */
  .sv-shine {
    position: relative;
    overflow: hidden;
  }
  .sv-shine::after {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    width: 28%;
    transform: translateX(-160%) skewX(-20deg);
    background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--c-on-navy) 55%, transparent), transparent);
    pointer-events: none;
  }
  .sv-shine:hover::after,
  .sv-shine:focus-visible::after {
    animation: sv-shine 0.9s ease;
  }

  /* ---- featured card: animated gradient border ---- */
  .sv-gborder {
    padding: 1.5px;
    border-radius: 1rem;
    background: linear-gradient(120deg, var(--c-primary), var(--c-accent), var(--c-primary), var(--c-accent));
    background-size: 300% 300%;
    animation: sv-gradient 12s ease-in-out infinite;
    box-shadow: 0 30px 60px -28px color-mix(in srgb, var(--c-navy) 70%, transparent);
  }
  .sv-gborder-inner {
    overflow: hidden;
    border-radius: calc(1rem - 1.5px);
    background: var(--c-card);
  }
  .sv-visual {
    position: relative;
    isolation: isolate;
    overflow: hidden;
    color: var(--c-on-navy);
    /* hero jaisa wahi navy (PageHero ka bg-navy), glow upar blobs se aata hai */
    background: var(--c-navy);
  }
  .sv-ring {
    border: 1.5px dashed color-mix(in srgb, var(--c-on-navy) 38%, transparent);
    border-radius: 9999px;
    animation: sv-spin 30s linear infinite;
  }
  .sv-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    border-radius: 9999px;
    padding: 0.3rem 0.85rem;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--c-primary);
    background: linear-gradient(90deg, var(--c-primary-soft), color-mix(in srgb, var(--c-accent) 18%, var(--c-primary-soft)));
    border: 1px solid color-mix(in srgb, var(--c-primary) 22%, transparent);
  }

  /* ---- service cards: spotlight + lift ---- */
  .sv-card {
    position: relative;
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
    border-radius: 0.75rem;
    border: 1px solid var(--c-line);
    background: var(--c-card);
    box-shadow: 0 1px 2px color-mix(in srgb, var(--c-navy) 8%, transparent);
    transition:
      transform 0.35s cubic-bezier(0.2, 0.7, 0.2, 1),
      border-color 0.3s,
      box-shadow 0.35s;
  }
  .sv-card::before {
    content: '';
    position: absolute;
    inset: 0;
    opacity: 0;
    pointer-events: none;
    background: radial-gradient(
      20rem circle at var(--mx, 50%) var(--my, 0%),
      color-mix(in srgb, var(--c-primary) 16%, transparent),
      transparent 65%
    );
    transition: opacity 0.35s;
  }
  .sv-card::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    transform: scaleX(0);
    transform-origin: left;
    background: linear-gradient(90deg, var(--c-primary), var(--c-accent));
    transition: transform 0.45s cubic-bezier(0.2, 0.7, 0.2, 1);
  }
  .sv-card:focus-visible,
  .sv-card:hover {
    border-color: color-mix(in srgb, var(--c-primary) 55%, var(--c-line));
    box-shadow: 0 26px 50px -24px color-mix(in srgb, var(--c-primary) 55%, transparent);
  }
  .sv-card:hover {
    transform: translateY(-6px);
  }
  .sv-card:hover::before,
  .sv-card:focus-visible::before {
    opacity: 1;
  }
  .sv-card:hover::after,
  .sv-card:focus-visible::after {
    transform: scaleX(1);
  }

  /* gradient icon tile (IconTile variant="gradient") */
  .sv-icon-gradient {
    color: var(--c-on-primary);
    background: linear-gradient(135deg, var(--c-primary), var(--sv-icon-end));
    box-shadow: 0 10px 22px -8px color-mix(in srgb, var(--c-primary) 70%, transparent);
    transition: transform 0.4s cubic-bezier(0.2, 0.7, 0.2, 1);
  }
  .group:hover .sv-icon-gradient {
    transform: rotate(-7deg) scale(1.1);
  }
  .sv-icon-glass {
    color: var(--c-on-navy);
    border: 1px solid color-mix(in srgb, var(--c-on-navy) 28%, transparent);
    background: color-mix(in srgb, var(--c-on-navy) 12%, transparent);
    -webkit-backdrop-filter: blur(8px);
    backdrop-filter: blur(8px);
  }

  .sv-num-ghost {
    font-family: var(--f-heading);
    font-weight: 600;
    line-height: 1;
    color: transparent;
    -webkit-text-stroke: 1.5px color-mix(in srgb, var(--c-primary) 28%, transparent);
    user-select: none;
  }

  /* ---- process steps ---- */
  .sv-step {
    position: relative;
    overflow: hidden;
    border-radius: 0.75rem;
    border: 1px solid var(--c-line);
    background: var(--c-card);
    transition: transform 0.35s cubic-bezier(0.2, 0.7, 0.2, 1), border-color 0.3s, box-shadow 0.35s;
  }
  .sv-step:hover {
    transform: translateY(-5px);
    border-color: color-mix(in srgb, var(--c-primary) 55%, var(--c-line));
    box-shadow: 0 24px 48px -26px color-mix(in srgb, var(--c-primary) 55%, transparent);
  }
  .sv-step-bar {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    transform: scaleX(0);
    transform-origin: left;
    background: linear-gradient(90deg, var(--c-primary), var(--c-accent));
  }
  .is-in .sv-step-bar {
    animation: sv-draw 1s cubic-bezier(0.2, 0.7, 0.2, 1) calc(var(--sv-delay, 0ms) + 250ms) forwards;
  }
  .sv-step-num {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2.75rem;
    height: 2.75rem;
    border-radius: 9999px;
    font-family: var(--f-heading);
    font-size: 1rem;
    font-weight: 600;
    color: var(--c-on-primary);
    background: linear-gradient(135deg, var(--c-primary), var(--sv-icon-end));
    box-shadow:
      0 0 0 6px color-mix(in srgb, var(--c-primary) 14%, transparent),
      0 10px 20px -8px color-mix(in srgb, var(--c-primary) 70%, transparent);
  }

  /* ---- CTA band ---- */
  .sv-cta {
    position: relative;
    isolation: isolate;
    overflow: hidden;
    border-radius: 1rem;
    color: var(--c-on-navy);
    /* hero jaisa wahi navy (PageHero ka bg-navy), glow upar blobs se aata hai */
    background: var(--c-navy);
    box-shadow: 0 40px 80px -36px color-mix(in srgb, var(--c-navy) 85%, transparent);
  }
  .sv-btn-light {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    height: 2.75rem;
    padding: 0 1.375rem;
    border-radius: 0.75rem;
    font-weight: 600;
    white-space: nowrap;
    color: var(--c-navy);
    background: var(--c-on-navy);
    box-shadow: 0 14px 30px -12px color-mix(in srgb, var(--c-on-navy) 55%, transparent);
    transition: transform 0.25s, background-color 0.25s, box-shadow 0.25s;
  }
  .sv-btn-light:hover {
    transform: translateY(-2px);
    background: color-mix(in srgb, var(--c-accent) 70%, var(--c-on-navy));
  }
  .sv-btn-glass {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    height: 2.75rem;
    padding: 0 1.375rem;
    border-radius: 0.75rem;
    font-weight: 500;
    white-space: nowrap;
    color: var(--c-on-navy);
    border: 1px solid color-mix(in srgb, var(--c-on-navy) 32%, transparent);
    background: color-mix(in srgb, var(--c-on-navy) 8%, transparent);
    transition: transform 0.25s, border-color 0.25s, background-color 0.25s;
  }
  .sv-btn-glass:hover {
    transform: translateY(-2px);
    border-color: var(--c-accent);
    background: color-mix(in srgb, var(--c-on-navy) 14%, transparent);
  }
}

/* Motion band karne walon ke liye: sab animation off, content seedha dikhe */
@media (prefers-reduced-motion: reduce) {
  .sv-reveal {
    opacity: 1 !important;
    transform: none !important;
    transition: none !important;
  }
  .sv-blob,
  .sv-sheen,
  .sv-chip-in,
  .sv-float,
  .sv-gborder,
  .sv-ring,
  .sv-cta,
  .sv-twinkle,
  .sv-dot-live::after {
    animation: none !important;
  }
  .sv-step-bar {
    transform: scaleX(1) !important;
    animation: none !important;
  }
  .sv-card,
  .sv-step,
  .sv-btn-light,
  .sv-btn-glass {
    transition: none !important;
  }
  .sv-card:hover,
  .sv-step:hover,
  .sv-btn-light:hover,
  .sv-btn-glass:hover {
    transform: none !important;
  }
}
`

const pad = (n) => String(n).padStart(2, '0')

// Contact page par jao; service ka naam subject ke taur par (contact form baad mein prefill kar sakta hai)
const toContact = (slug, subject) => ({
  pathname: paths.siteContact(slug),
  search: subject ? `?subject=${encodeURIComponent(subject)}` : '',
})

// Admin ne "featured" mark kiya ho to wo; warna 3+ services par pehli ko highlight (design fallback)
function pickFeatured(services) {
  return services.find((s) => s.is_featured) ?? (services.length >= 3 ? services[0] : null)
}

// ---------- 1. Hero ----------

const chipClass = 'border-on-navy/20 bg-on-navy/10 text-on-navy/85 inline-flex items-center rounded-full border'
const chipStyle = { gap: '0.375rem', padding: '0.375rem 0.75rem', fontSize: '0.75rem' }
const chipLink = `${chipClass} transition-colors hover:border-accent hover:text-accent`

function Hero({ services, stepCount, showProcess }) {
  const { slug, pageIntros } = usePublicSite()
  const intro = pageIntros?.services
  const title = intro?.title || 'Services'
  const subtitle = intro?.subtitle || 'Ways we can work together, from first conversation to final delivery.'

  const pills = [
    services.length > 0 && `${services.length} service ${services.length === 1 ? 'area' : 'areas'}`,
    showProcess && stepCount > 0 && `${stepCount}-step process`,
  ].filter(Boolean)

  const links = 1 + (showProcess ? 1 : 0)

  return (
    <div className="sv-hero-wrap">
      <PageHero eyebrow="Services" title={title} subtitle={subtitle}>
        <ul className="sv-chips">
          {pills.map((text, i) => (
            <li key={text} className={`sv-chip-in ${chipClass}`} style={{ ...chipStyle, '--i': i }}>
              <Sparkles className="text-accent" width={13} height={13} aria-hidden="true" />
              {text}
            </li>
          ))}
          <li className="sv-chip-in" style={{ '--i': pills.length }}>
            <Link to={toContact(slug)} className={chipLink} style={chipStyle}>
              Get in touch
              <ArrowRight className="text-accent" width={13} height={13} aria-hidden="true" />
            </Link>
          </li>
          {showProcess && (
            <li className="sv-chip-in" style={{ '--i': pills.length + links - 1 }}>
              <a href="#process" className={chipLink} style={chipStyle}>
                See how I work
                <ArrowUpRight className="text-accent" width={13} height={13} aria-hidden="true" />
              </a>
            </li>
          )}
        </ul>
      </PageHero>

      {/* decoration: overlay, clicks nahi rokta */}
      <span
        aria-hidden="true"
        className="sv-blob bg-primary"
        style={{ top: '-8rem', right: '-4rem', width: '22rem', height: '22rem', opacity: 0.38 }}
      />
      <span
        aria-hidden="true"
        className="sv-blob bg-accent"
        style={{ bottom: '-9rem', left: '-3rem', width: '18rem', height: '18rem', opacity: 0.26, animationDuration: '30s' }}
      />
      <span aria-hidden="true" className="sv-dots" />
      <span aria-hidden="true" className="sv-sheen" />
    </div>
  )
}

// ---------- 2. Featured service ----------

function FeaturedService({ service, slug }) {
  return (
    <Reveal className="sv-gborder">
      <article
        className="sv-gborder-inner"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 22rem), 1fr))' }}
      >
        {/* Visual panel */}
        <div className="sv-visual flex items-center justify-center" style={{ minHeight: '15rem' }}>
          {service.image && (
            <img
              src={service.image}
              alt=""
              loading="lazy"
              className="absolute inset-0 -z-10 size-full object-cover opacity-70 mix-blend-luminosity"
            />
          )}
          <span
            aria-hidden="true"
            className="sv-blob bg-primary"
            style={{ top: '-4rem', right: '-4rem', width: '16rem', height: '16rem', opacity: 0.38 }}
          />
          <span
            aria-hidden="true"
            className="sv-blob bg-accent"
            style={{ bottom: '-5rem', left: '-3rem', width: '14rem', height: '14rem', opacity: 0.26, animationDuration: '28s' }}
          />
          <span aria-hidden="true" className="sv-dots" />

          <div className="relative flex items-center justify-center" style={{ width: '11rem', height: '11rem' }}>
            <span className="sv-ring absolute inset-0" aria-hidden="true" />
            <span className="sv-ring absolute" style={{ inset: '1.5rem', animationDirection: 'reverse', animationDuration: '22s' }} aria-hidden="true" />
            <IconTile name={service.icon} variant="glass" size="xl" className="sv-float relative size-20 rounded-2xl" />
          </div>

          <span className="sv-glass absolute bottom-4 left-4 rounded-full px-3 py-1 text-xs font-semibold tracking-widest text-on-navy uppercase">
            Primary service
          </span>
        </div>

        {/* Content panel */}
        <div className="flex flex-col justify-center p-6 sm:p-8">
          <span className="sv-badge self-start">
            <Sparkles className="size-3.5" aria-hidden="true" />
            Featured service
          </span>
          <h2 className="mt-4 text-2xl sm:text-3xl">{service.title}</h2>
          {service.short_description && (
            <p className="mt-3 leading-relaxed text-body">{service.short_description}</p>
          )}
          <span className="mt-5 block h-px w-full bg-linear-to-r from-primary/40 via-accent/40 to-transparent" aria-hidden="true" />
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button
              as={Link}
              to={toContact(slug, service.title)}
              className="sv-shine group shadow-lg shadow-primary/30"
            >
              Enquire about this service
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </article>
    </Reveal>
  )
}

// ---------- 3. Service cards ----------

// Mouse ke saath chalne wali halki blue roshni (CSS variables --mx / --my)
function onSpotlightMove(event) {
  const node = event.currentTarget
  const rect = node.getBoundingClientRect()
  node.style.setProperty('--mx', `${event.clientX - rect.left}px`)
  node.style.setProperty('--my', `${event.clientY - rect.top}px`)
}

function ServiceTile({ service, index, slug }) {
  return (
    <Reveal delay={(index % 3) * 90} style={{ height: '100%' }}>
      <Link
        to={toContact(slug, service.title)}
        onPointerMove={onSpotlightMove}
        className="sv-card group"
        aria-label={`${service.title}: enquire about this service`}
      >
        {service.image && (
          <div className="relative aspect-video overflow-hidden bg-primary-soft">
            <img
              src={service.image}
              alt=""
              loading="lazy"
              className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <span className="absolute inset-0 bg-linear-to-t from-navy/50 to-transparent" aria-hidden="true" />
          </div>
        )}

        <div className="relative flex flex-1 flex-col p-5 sm:p-6">
          <span
            className="sv-num-ghost absolute top-4 right-5 text-4xl"
            aria-hidden="true"
          >
            {pad(index + 1)}
          </span>

          {!service.image && <IconTile name={service.icon} variant="gradient" size="lg" className="mb-5" />}
          <p className="text-xs font-semibold tracking-widest text-primary uppercase">Service {pad(index + 1)}</p>
          <h3 className="mt-2 text-lg sm:text-xl">{service.title}</h3>
          {service.short_description && (
            <p className="mt-3 flex-1 leading-relaxed text-body">{service.short_description}</p>
          )}

          <div className="mt-5 flex items-center justify-between border-t border-line pt-4 text-sm font-semibold text-primary">
            <span>Discuss this service</span>
            <span className="inline-flex size-8 items-center justify-center rounded-full bg-primary-soft transition-colors group-hover:bg-primary group-hover:text-on-primary">
              <ArrowRight
                className="size-4 transition-transform duration-300 group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </span>
          </div>
        </div>
      </Link>
    </Reveal>
  )
}

function ServicesLoading() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-72 rounded-2xl" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 19rem), 1fr))', gap: '1.5rem' }}>
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-64 rounded-xl" />
        ))}
      </div>
    </div>
  )
}

// ---------- 4. How I Work ----------

function HowIWork({ steps }) {
  return (
    <Section tone="blue-tint" id="process" className="relative scroll-mt-16 overflow-hidden">
      {/* soft glow, sirf decoration */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <span
          className="sv-blob bg-primary"
          style={{ top: '-6rem', right: '-6rem', width: '20rem', height: '20rem', opacity: 0.12 }}
        />
        <span
          className="sv-blob bg-accent"
          style={{ bottom: '-8rem', left: '-5rem', width: '20rem', height: '20rem', opacity: 0.1, animationDuration: '30s' }}
        />
      </div>

      <div className="relative">
        <Reveal>
          <SectionHeading
            align="center"
            eyebrow="Process"
            title="How I Work"
            description="A clear, collaborative path from the first conversation to the final hand-over."
          />
        </Reveal>

        <ol
          className="list-none"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 14.5rem), 1fr))',
            gap: '1.25rem',
            margin: 0,
            padding: 0,
          }}
        >
          {steps.map((step, i) => (
            <Reveal as="li" key={step.id ?? i} delay={i * 110} style={{ height: '100%' }}>
              <div className="sv-step h-full p-5 sm:p-6">
                <span className="sv-step-bar" aria-hidden="true" />
                <span className="sv-num-ghost absolute top-3 right-4 text-4xl" aria-hidden="true">
                  {pad(i + 1)}
                </span>
                <div className="relative">
                  <span className="sv-step-num" aria-hidden="true">
                    {pad(i + 1)}
                  </span>
                  <h3 className="mt-4 text-lg sm:text-xl">
                    <span className="sr-only">Step {i + 1}: </span>
                    {step.title}
                  </h3>
                  {step.description && <p className="mt-2 leading-relaxed text-body">{step.description}</p>}
                </div>
              </div>
            </Reveal>
          ))}
        </ol>
      </div>
    </Section>
  )
}

// ---------- 5. Contact CTA band ----------

function ContactCta() {
  const { slug, contact } = usePublicSite()
  // WhatsApp: contact.whatsapp (ya phone), sirf digits country code ke saath (Footer jaisa)
  const waDigits = String(contact?.whatsapp || contact?.phone || '').replace(/\D/g, '')
  const hasChips = Boolean(contact?.email || contact?.phone)

  return (
    <Section tone="background" id="get-in-touch" className="scroll-mt-16">
      <Reveal className="sv-cta">
        {/* decoration */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
          <span
            className="sv-blob bg-primary"
            style={{ top: '-7rem', left: '-5rem', width: '24rem', height: '24rem', opacity: 0.38 }}
          />
          <span
            className="sv-blob bg-accent"
            style={{ bottom: '-9rem', right: '-4rem', width: '22rem', height: '22rem', opacity: 0.26, animationDuration: '29s' }}
          />
          <span className="sv-dots" />
          <Sparkles className="sv-twinkle absolute top-8 right-10 size-6 text-accent" style={{ '--sv-delay': '0s' }} />
          <Sparkles className="sv-twinkle absolute bottom-10 left-12 size-4 text-accent" style={{ '--sv-delay': '1.2s' }} />
          <Sparkles className="sv-twinkle absolute top-1/2 left-6 hidden size-3 text-on-navy sm:block" style={{ '--sv-delay': '2.1s' }} />
        </div>

        <div className="relative mx-auto max-w-2xl px-6 py-10 text-center sm:px-10 sm:py-14">
          <p className="sv-glass inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold tracking-widest text-accent uppercase">
            <span className="sv-dot-live" aria-hidden="true" />
            Direct inquiries welcome
          </p>

          <h2 className="mt-5 text-2xl text-on-navy sm:text-4xl">Let&rsquo;s work together</h2>
          <p className="mx-auto mt-3 max-w-xl leading-relaxed text-on-navy/80 sm:text-lg">
            Have a project, a question or an idea? Tell me a little about it and we will find the right way to work
            together.
          </p>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <Link to={toContact(slug)} className="sv-btn-light sv-shine group">
              Contact me
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Link>
            {waDigits && (
              <a href={`https://wa.me/${waDigits}`} target="_blank" rel="noopener noreferrer" className="sv-btn-glass">
                <MessageCircle className="size-4 text-accent" aria-hidden="true" />
                Chat on WhatsApp
              </a>
            )}
          </div>

          {hasChips && (
            <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-on-navy/80">
              {contact.email && (
                <li>
                  <a
                    href={`mailto:${contact.email}`}
                    className="inline-flex items-center gap-2 transition-colors hover:text-accent"
                  >
                    <Mail className="size-4 text-accent" aria-hidden="true" />
                    <span className="break-all">{contact.email}</span>
                  </a>
                </li>
              )}
              {contact.phone && (
                <li>
                  <a
                    href={`tel:${String(contact.phone).replace(/[^\d+]/g, '')}`}
                    className="inline-flex items-center gap-2 transition-colors hover:text-accent"
                  >
                    <Phone className="size-4 text-accent" aria-hidden="true" />
                    {contact.phone}
                  </a>
                </li>
              )}
            </ul>
          )}
        </div>
      </Reveal>
    </Section>
  )
}

// ---------- Page ----------

export function ServicesPage() {
  const { slug, vis, processSteps } = usePublicSite()
  const query = useServices(slug)

  // is_visible=false wali services public par nahi aati
  const services = useMemo(() => (query.data ?? []).filter((s) => s.is_visible !== false), [query.data])
  const featured = pickFeatured(services)
  const cards = featured ? services.filter((s) => s.id !== featured.id) : services

  const showProcess = vis.isVisible('services', 'how_i_work', processSteps.length > 0)
  const showCta = vis.isEnabled('services', 'contact_cta')

  return (
    <>
      <style>{SERVICES_CSS}</style>
      <Hero services={services} stepCount={processSteps.length} showProcess={showProcess} />

      {/* Featured + cards: hero ke neeche, baqi pages jaisi spacing */}
      <div className="bg-background">
        {query.isPending && (
          <Container className="py-16 sm:py-20">
            <ServicesLoading />
          </Container>
        )}

        {query.isError && (
          <Container className="py-16 sm:py-20">
            <ErrorState
              title="Could not load services"
              message={query.error?.message}
              onRetry={() => query.refetch()}
            />
          </Container>
        )}

        {query.isSuccess && services.length === 0 && (
          <Container className="py-16 sm:py-20">
            <EmptyState
              icon={Sparkles}
              title="Services are coming soon"
              description="Details of what is on offer will appear here. In the meantime, feel free to get in touch."
              action={
                <Button as={Link} to={toContact(slug)}>
                  Get in touch
                </Button>
              }
            />
          </Container>
        )}

        {featured && (
          <Container className="pt-10 sm:pt-12">
            <FeaturedService service={featured} slug={slug} />
          </Container>
        )}

        {cards.length > 0 && (
          <Section tone="background">
            <Reveal>
              <SectionHeading
                eyebrow="What I offer"
                title="Services & Engagements"
                description="Choose the kind of support that fits your goals. Every engagement starts with a conversation."
              />
            </Reveal>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 19rem), 1fr))',
                gap: '1.5rem',
              }}
            >
              {cards.map((service, i) => (
                <ServiceTile key={service.id} service={service} index={i} slug={slug} />
              ))}
            </div>
          </Section>
        )}
      </div>

      {showProcess && <HowIWork steps={processSteps} />}
      {showCta && <ContactCta />}
    </>
  )
}