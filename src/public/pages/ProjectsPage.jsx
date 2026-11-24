import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Calendar, ChevronDown, Download, FolderSearch, FolderOpen, Layers, Mail, MessageCircle, Star, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { paths } from '@/routes/paths'
import { cn } from '@/lib/utils'
import { Container } from '@/public/components/Container'
import { PageHero } from '@/public/components/PageHero'
import { Section } from '@/public/components/Section'
import { useProjects } from '@/public/hooks/usePublicData'
import { usePublicSite } from '@/public/hooks/usePublicSite'
import { uniqueValues } from '@/public/lib/filters'

// =====================================================================================
// PROJECTS PAGE  /:slug/projects   (poora code isi file mein, koi aur file change nahi)
//
// v2: SIZING baqi pages (Blog, Contact, Services, Home) ke barabar:
//   * Hero ab shared <PageHero> hai (rectangle), isliye size khud ba khud same rehta hai.
//   * Cards rounded-xl, featured/CTA rounded-2xl, headings 1.5rem, chhoti paddings.
//
//   1. Hero            PageHero + animated glow + dot grid + sheen line, chips (counts)
//   2. Filter bar      sticky: status (sliding indicator) + research-area chips
//   3. Featured        ek spotlight card (sirf jab filter off ho)
//   4. Grid            6 at a time, scroll par stagger reveal, hover lift
//   5. Collaboration   light card (neighbouring navy sections se alag)
//
// v3: (1) Hero title/subtitle backend ke page_intros se. (2) Cards/featured mein image poori dikhti hai.
// v4: PROJECT CARDS hover par khulte hain (dark navy frame, overlay title, chevron pill, tech tags...).
//
// v5 (HERO improve, baqi sab kuch v4 jaisa):
//   - Eyebrow "Projects" aur title "Projects" ek jaise the: eyebrow ab "Selected work".
//   - Aurora glow, moving grid, floating particles, shimmer title.
//   - Right side par asli projects ka auto-rotating showcase (featured pehle, max 3):
//     thumbnail, category, title, status, year. Sirf xl+ screens par; chhoti screens par baqi animation.
// prefers-reduced-motion par sab band, content seedha dikhta hai.
// =====================================================================================

const PAGE_SIZE = 6

// Hero ke floating particles: [left, top, delay(s), duration(s)]
const PARTICLES = [
  ['7%', '26%', 0, 9],
  ['23%', '74%', 1.4, 11],
  ['43%', '14%', 2.6, 8],
  ['58%', '72%', 0.8, 10],
  ['74%', '12%', 3.2, 12],
  ['91%', '64%', 2, 9],
]

const PAGE_CSS = `
@keyframes pj-rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
@keyframes pj-float { 0%, 100% { transform: translate3d(0, 0, 0) scale(1); } 50% { transform: translate3d(0, -28px, 0) scale(1.06); } }
@keyframes pj-sheen { 0% { background-position: 0% 50%; } 100% { background-position: 200% 50%; } }
@keyframes pj-pop { 0% { opacity: 0; transform: scale(.96) translateY(10px); } 100% { opacity: 1; transform: none; } }
@keyframes pj-spin { to { transform: rotate(360deg); } }
@keyframes pj-text { from { background-position: 120% 0; } to { background-position: -120% 0; } }
@keyframes pj-grid { to { background-position: 44px 44px, 44px 44px; } }
@keyframes pj-particle { 0%, 100% { transform: translate3d(0, 0, 0); opacity: .2; } 50% { transform: translate3d(10px, -22px, 0); opacity: .9; } }
@keyframes pj-bob { 0%, 100% { transform: translate3d(0, 0, 0); } 50% { transform: translate3d(0, -10px, 0); } }
.pj-rise { animation: pj-rise .6s cubic-bezier(.2,.7,.2,1) both; }
.pj-float { animation: pj-float 10s ease-in-out infinite; }
.pj-float-slow { animation: pj-float 14s ease-in-out infinite reverse; }
.pj-pop { animation: pj-pop .5s cubic-bezier(.2,.7,.2,1) both; }
.pj-hero { position: relative; overflow: hidden; }
.pj-chips { display: flex; flex-wrap: wrap; gap: .5rem; list-style: none; margin: 0; padding: 0; }
.pj-sheen { position: absolute; left: 0; right: 0; bottom: 0; height: 2px; z-index: 2; pointer-events: none;
  background: linear-gradient(90deg, transparent, var(--c-primary), var(--c-accent), transparent);
  background-size: 200% 100%; animation: pj-sheen 6s linear infinite; }

/* ---- hero decoration (v5) ---- */
.pj-aurora { position: absolute; z-index: 0; left: 50%; top: 50%; width: 70rem; height: 70rem; margin: -35rem 0 0 -35rem;
  border-radius: 9999px; opacity: .3; filter: blur(80px); pointer-events: none;
  background: conic-gradient(from 0deg, transparent 0deg, var(--c-primary) 70deg, transparent 140deg, var(--c-accent) 230deg, transparent 300deg);
  animation: pj-spin 46s linear infinite; }
.pj-gridbg { position: absolute; inset: 0; pointer-events: none; opacity: .5;
  background-image: linear-gradient(color-mix(in srgb, var(--c-on-navy) 7%, transparent) 1px, transparent 1px),
    linear-gradient(90deg, color-mix(in srgb, var(--c-on-navy) 7%, transparent) 1px, transparent 1px);
  background-size: 44px 44px;
  -webkit-mask-image: radial-gradient(ellipse at 78% 50%, #000 10%, transparent 70%);
  mask-image: radial-gradient(ellipse at 78% 50%, #000 10%, transparent 70%);
  animation: pj-grid 14s linear infinite; }
.pj-particle { position: absolute; width: 4px; height: 4px; border-radius: 9999px; pointer-events: none; background: var(--c-on-navy);
  animation: pj-particle var(--dur, 8s) ease-in-out infinite; animation-delay: var(--delay, 0s); }
.pj-hero :is(h1, h2) { color: transparent; -webkit-background-clip: text; background-clip: text;
  background-image: linear-gradient(100deg, var(--c-on-navy) 0%, var(--c-on-navy) 42%, var(--c-accent) 50%, var(--c-on-navy) 58%, var(--c-on-navy) 100%);
  background-size: 250% 100%; background-position: 120% 0; animation: pj-text 7s ease-in-out infinite; }

/* project showcase: asli projects, ek ek karke aage aata hai (xl+) */
/* stage hero ki poori height leta hai; andar sab kuch cqh mein, isliye hero chhota ho to bhi cards kat'te nahi */
.pj-stage { position: absolute; z-index: 1; right: 3rem; top: 0; bottom: 0; width: 19rem; container-type: size; pointer-events: none; }
.pj-deck { position: absolute; inset: 0; animation: pj-bob 8s ease-in-out infinite; }
.pj-slide { position: absolute; left: 0; top: 16cqh; width: 16rem; overflow: hidden; border-radius: 1rem; color: var(--c-on-navy);
  border: 1px solid color-mix(in srgb, var(--c-on-navy) 18%, transparent);
  background: color-mix(in srgb, var(--c-navy) 72%, transparent);
  -webkit-backdrop-filter: blur(12px); backdrop-filter: blur(12px);
  box-shadow: 0 22px 44px -24px rgba(0, 0, 0, .65);
  transition: transform .8s cubic-bezier(.2,.7,.2,1), opacity .8s, filter .8s; }
.pj-slide[data-pos="0"] { transform: translate3d(0, 0, 0) scale(1); opacity: 1; z-index: 3; }
.pj-slide[data-pos="1"] { transform: translate3d(1.4rem, 6cqh, 0) scale(.94); opacity: .8; z-index: 2; filter: brightness(.85); }
.pj-slide[data-pos="2"] { transform: translate3d(2.8rem, 12cqh, 0) scale(.88); opacity: .55; z-index: 1; filter: brightness(.7); }
.pj-slide::before { content: ""; position: absolute; left: 0; top: 0; width: 100%; height: 2px; z-index: 2;
  background: linear-gradient(90deg, var(--c-primary), var(--c-accent)); }
.pj-slide-img { position: relative; height: max(4rem, 26cqh); overflow: hidden;
  background: linear-gradient(135deg, color-mix(in srgb, var(--c-primary) 55%, var(--c-navy)), color-mix(in srgb, var(--c-accent) 30%, var(--c-navy))); }
.pj-slide-img img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.pj-slide-img::after { content: ""; position: absolute; inset: 0; background: linear-gradient(to top, rgba(8,12,40,.55), transparent 60%); }
.pj-slide-initial { position: absolute; right: .75rem; bottom: -.9rem; font-family: var(--f-heading, serif); font-weight: 600; font-size: 5.5rem; line-height: 1;
  color: transparent; -webkit-text-stroke: 1.5px color-mix(in srgb, var(--c-on-navy) 35%, transparent); }
.pj-slide-body { padding: .75rem .95rem .9rem; }
.pj-slide-cat { display: block; font-size: .625rem; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: var(--c-accent);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.pj-slide-title { margin: .3rem 0 0; font-family: var(--f-heading, inherit); font-weight: 600; font-size: .9375rem; line-height: 1.3;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.pj-slide-meta { display: flex; align-items: center; gap: .4rem; margin-top: .5rem; font-size: .6875rem; opacity: .75; }
.pj-slide-dot { width: 6px; height: 6px; border-radius: 9999px; background: var(--c-accent); }
.pj-deck-dots { position: absolute; left: 0; bottom: 9cqh; display: flex; gap: .375rem; }
.pj-deck-dots i { display: block; width: .375rem; height: .375rem; border-radius: 9999px; background: color-mix(in srgb, var(--c-on-navy) 35%, transparent);
  transition: width .4s, background-color .4s; }
.pj-deck-dots i[data-on="true"] { width: 1.25rem; background: var(--c-accent); }

.pj-card { position: relative; padding: 6px; border-radius: 1.125rem; background: var(--c-navy); color: var(--c-on-navy);
  border: 1px solid color-mix(in srgb, var(--c-on-navy) 12%, transparent); box-shadow: 0 14px 30px -18px rgba(0,0,0,.55);
  transition: transform .3s cubic-bezier(.2,.7,.2,1), box-shadow .3s, border-color .3s; }
.pj-card[data-open="true"] { border-color: color-mix(in srgb, var(--c-accent) 45%, transparent);
  box-shadow: 0 24px 48px -22px color-mix(in srgb, var(--c-primary) 75%, black); }
.pj-img { position: relative; display: block; overflow: hidden; border-radius: .875rem; }
.pj-cap { position: absolute; left: 0; right: 0; bottom: 0; padding: 2.75rem 1rem .875rem; pointer-events: none;
  background: linear-gradient(to top, rgba(8,12,40,.94), rgba(8,12,40,.6) 55%, transparent); }
.pj-chev { display: flex; align-items: center; justify-content: center; width: 9rem; max-width: 70%; height: 2.25rem; margin: 6px auto 0;
  border: 0; border-radius: 9999px; cursor: pointer; color: var(--c-on-navy);
  background: color-mix(in srgb, var(--c-on-navy) 10%, transparent); transition: background-color .2s; }
.pj-chev:hover { background: color-mix(in srgb, var(--c-on-navy) 18%, transparent); }
.pj-chev:focus-visible { outline: 2px solid var(--c-accent); outline-offset: 2px; }
.pj-chev svg { transition: transform .35s cubic-bezier(.2,.7,.2,1); }
.pj-reveal { display: grid; grid-template-rows: 0fr; transition: grid-template-rows .45s cubic-bezier(.2,.7,.2,1); }
.pj-reveal > div { min-height: 0; overflow: hidden; visibility: hidden; transition: visibility 0s linear .45s; }
.pj-panel { margin-top: 6px; padding: 1rem; border-radius: .875rem; background: rgba(4,6,24,.55);
  border: 1px solid color-mix(in srgb, var(--c-on-navy) 12%, transparent); }
.pj-tag { display: inline-flex; align-items: center; padding: .1875rem .625rem; border-radius: 9999px; font-size: .75rem; font-weight: 500;
  color: var(--c-accent); border: 1px solid color-mix(in srgb, var(--c-accent) 35%, transparent);
  background: color-mix(in srgb, var(--c-accent) 10%, transparent); }
.pj-view { display: inline-flex; align-items: center; gap: .375rem; padding: .4375rem .875rem; border-radius: .5rem; font-size: .75rem; font-weight: 600;
  color: #fff; text-decoration: none; background: linear-gradient(135deg, var(--c-primary), var(--c-accent)); transition: filter .2s, transform .2s; }
.pj-view:hover { filter: brightness(1.1); transform: translateY(-1px); }
.pj-view:focus-visible { outline: 2px solid var(--c-accent); outline-offset: 2px; }
/* khulna: tap/click (data-open), keyboard focus, ya hover (sirf hover wali devices par) */
.pj-card[data-open="true"] .pj-reveal, .pj-card:has(:focus-visible) .pj-reveal { grid-template-rows: 1fr; }
.pj-card[data-open="true"] .pj-reveal > div, .pj-card:has(:focus-visible) .pj-reveal > div { visibility: visible; transition-delay: 0s; }
.pj-card[data-open="true"] .pj-chev svg, .pj-card:has(:focus-visible) .pj-chev svg { transform: rotate(180deg); }
@media (hover: hover) and (pointer: fine) {
  .pj-card:hover { border-color: color-mix(in srgb, var(--c-accent) 45%, transparent);
    box-shadow: 0 24px 48px -22px color-mix(in srgb, var(--c-primary) 75%, black); }
  .pj-card:hover .pj-reveal { grid-template-rows: 1fr; }
  .pj-card:hover .pj-reveal > div { visibility: visible; transition-delay: 0s; }
  .pj-card:hover .pj-chev svg { transform: rotate(180deg); }
}
@media (prefers-reduced-motion: reduce) {
  .pj-card, .pj-chev, .pj-chev svg, .pj-reveal, .pj-reveal > div, .pj-view, .pj-slide, .pj-deck-dots i { transition: none !important; }
}
@media (prefers-reduced-motion: reduce) {
  .pj-rise, .pj-float, .pj-float-slow, .pj-pop, .pj-sheen, .pj-aurora, .pj-gridbg, .pj-particle, .pj-deck,
  .pj-hero :is(h1, h2) { animation: none !important; }
  .pj-hero :is(h1, h2) { background-position: 0 0 !important; }
}
`

// ---------- Data helpers ----------

// Backend ke shape ka farq yahin sambhalte hain (category object/id/string, status lowercase...),
// taake galat shape se React crash na kare.
const asText = (v) => (v === undefined || v === null || typeof v === 'object' ? '' : String(v).trim())

// page_intros array ho ya { projects: {...} } map, dono chalte hain
function getPageIntro(pageIntros, page) {
  if (Array.isArray(pageIntros)) return pageIntros.find((p) => p?.page === page) ?? null
  return pageIntros?.[page] ?? null
}

// Backend "intro" bhejta hai; kuch jagah "subtitle"/"description" naam se bhi aa sakta hai
const introText = (item) => asText(item?.subtitle) || asText(item?.intro) || asText(item?.description)

function categoryName(p) {
  if (p.category_name) return asText(p.category_name)
  if (p.category && typeof p.category === 'object') return asText(p.category.name ?? p.category.title)
  return typeof p.category === 'number' ? '' : asText(p.category)
}

function statusLabel(value) {
  const text = asText(value).replace(/[_-]+/g, ' ')
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : ''
}

function normalizeProject(p) {
  return {
    ...p,
    category: categoryName(p),
    status: statusLabel(p.status),
    year: p.year ?? p.start_year ?? null,
    thumbnail: p.thumbnail ?? p.image ?? p.cover_image ?? null,
    short_description: asText(p.short_description),
    is_featured: Boolean(p.is_featured ?? p.featured),
  }
}

// Tech tags: tags | technologies | tech_stack (array, objects ya comma string), max 5
function tagsOf(project) {
  const raw = project.tags ?? project.technologies ?? project.tech_stack ?? []
  return (Array.isArray(raw) ? raw : String(raw).split(','))
    .map((t) => asText(typeof t === 'object' && t ? (t.name ?? t.title ?? '') : t))
    .filter(Boolean)
    .slice(0, 5)
}

// Rich-text description (HTML) -> saaf plain text (card ke panel ke liye)
function plainText(html) {
  const text = String(html ?? '')
  if (!text.trim()) return ''
  if (typeof DOMParser === 'undefined') return text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  const doc = new DOMParser().parseFromString(text, 'text/html')
  return (doc.body.textContent ?? '').replace(/\s+/g, ' ').trim()
}

// Status ko 3 tone mein baantte hain: dot colour isi par chalta hai
function statusTone(status) {
  const s = String(status ?? '').toLowerCase()
  if (/ongoing|active|progress|current/.test(s)) return 'ongoing'
  if (/complete|done|finished/.test(s)) return 'completed'
  return 'other'
}

const DOT = { ongoing: 'bg-primary', completed: 'bg-success', other: 'bg-muted' }

// ---------- Small building blocks ----------

// Scroll par neeche se uthta hai. Wrapper par delay, hover effects andar wale element par (delay hover ko slow na kare).
function Reveal({ children, delay = 0, className }) {
  const ref = useRef(null)
  const [shown, setShown] = useState(
    () => typeof IntersectionObserver === 'undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  useEffect(() => {
    if (shown) return undefined
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' },
    )
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [shown])

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={cn(
        'transition-[opacity,transform] duration-700 ease-out',
        shown ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0',
        className,
      )}
    >
      {children}
    </div>
  )
}

function StatusPill({ status, className }) {
  if (!status) return null
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full bg-card/95 px-3 py-1 text-xs font-semibold text-heading shadow-sm backdrop-blur',
        className,
      )}
    >
      <span className="relative flex size-1.5" aria-hidden="true">
        {statusTone(status) === 'ongoing' && (
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60 motion-reduce:hidden" />
        )}
        <span className={cn('relative inline-flex size-1.5 rounded-full', DOT[statusTone(status)])} />
      </span>
      {status}
    </span>
  )
}

const VARIANTS = [
  'from-primary/40 via-primary-soft to-blue-tint',
  'from-primary/25 via-blue-tint to-accent/25',
  'from-navy/35 via-primary/20 to-primary-soft',
]

// Image ho to poori (object-contain + blur backdrop); na ho ya fail ho to gradient + bara letter + dots (khali grey box nahi dikhta)
function ProjectVisual({ project, large = false, className, imgClassName }) {
  const [failed, setFailed] = useState(false)
  const variant = (Number(project.id) || 0) % VARIANTS.length
  const initial = (project.title || '?').trim().charAt(0).toUpperCase()

  return (
    <div className={cn('relative overflow-hidden bg-primary-soft', className)}>
      {project.thumbnail && !failed ? (
        <>
          {/* peeche usi image ka blur: khali patti dull na lage */}
          <img
            src={project.thumbnail}
            alt=""
            aria-hidden="true"
            loading="lazy"
            draggable={false}
            className="absolute inset-0 size-full object-cover"
            style={{ filter: 'blur(18px) saturate(1.2)', transform: 'scale(1.15)', opacity: 0.55 }}
          />
          {/* asli image poori dikhti hai (object-contain), crop nahi */}
          <img
            src={project.thumbnail}
            alt={project.title}
            loading="lazy"
            draggable={false}
            onError={() => setFailed(true)}
            className={cn('relative size-full object-contain', imgClassName)}
          />
        </>
      ) : (
        <div className={cn('absolute inset-0 bg-gradient-to-br', VARIANTS[variant])} aria-hidden="true">
          <div
            className="absolute inset-0 text-primary opacity-[0.14]"
            style={{ backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)', backgroundSize: '22px 22px' }}
          />
          {/* do halki rings: khali image par bhi "designed" dikhe */}
          <span className="absolute -top-16 -left-16 size-56 rounded-full border border-primary/25 transition-transform duration-700 group-hover:scale-110" />
          <span className="absolute top-8 left-8 size-24 rounded-full border border-dashed border-primary/25" />
          <span
            className={cn(
              'absolute -right-3 -bottom-[18%] font-serif leading-none font-semibold text-primary/25 transition-transform duration-700 select-none group-hover:-translate-x-3 group-hover:scale-110',
              large ? 'text-[14rem]' : 'text-[9rem]',
            )}
          >
            {initial}
          </span>
        </div>
      )}
    </div>
  )
}

// ---------- Project cards ----------

function ProjectCard({ project, to }) {
  const [open, setOpen] = useState(false)
  const panelId = useId()
  const tags = tagsOf(project)
  const intro = project.short_description
  const overview = plainText(project.description)
  // short intro aur overview ek jaisa ho to dohrana nahi
  const showOverview = overview && overview !== intro

  return (
    <article className="pj-card group" data-open={open}>
      <Link to={to} className="pj-img" aria-label={`Open project: ${project.title}`}>
        <ProjectVisual
          project={project}
          className="aspect-[16/10]"
          imgClassName="transition-transform duration-700 group-hover:scale-105"
        />
        <StatusPill status={project.status} className="absolute top-3 left-3" />
        {project.year && (
          <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-card/95 px-2.5 py-1 text-xs font-medium text-muted shadow-sm backdrop-blur">
            <Calendar className="size-3" aria-hidden="true" />
            {project.year}
          </span>
        )}
        <span className="pj-cap">
          <span className="block text-lg leading-snug font-semibold text-on-navy" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {project.title}
          </span>
          {project.category && (
            <span className="mt-0.5 block truncate text-sm font-medium text-on-navy/70">{project.category}</span>
          )}
        </span>
      </Link>

      <button
        type="button"
        className="pj-chev"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? 'Hide project details' : 'Show project details'}
        onClick={() => setOpen((v) => !v)}
      >
        <ChevronDown className="size-4" aria-hidden="true" />
      </button>

      <div id={panelId} className="pj-reveal">
        <div>
          <div className="pj-panel">
            {intro && <p className="text-base leading-snug font-semibold text-on-navy">{intro}</p>}

            {tags.length > 0 && (
              <span className="mt-3 flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <span key={tag} className="pj-tag">
                    {tag}
                  </span>
                ))}
              </span>
            )}

            {showOverview && (
              <p className="mt-3 line-clamp-4 border-t border-on-navy/10 pt-3 text-justify [hyphens:auto] [text-align-last:left] text-sm leading-relaxed text-on-navy/75">
                {overview}
              </p>
            )}

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-on-navy/10 pt-3">
              <span className="text-xs font-medium text-on-navy/60">
                {[project.status, project.year].filter(Boolean).join(' · ')}
              </span>
              <Link to={to} className="pj-view">
                View project
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}

function FeaturedProjectCard({ project, to }) {
  return (
    <Link
      to={to}
      className="group relative grid overflow-hidden rounded-2xl border border-line bg-card shadow-md transition-all duration-500 hover:border-primary/40 hover:shadow-xl lg:grid-cols-5"
    >
      <div className="relative min-h-56 sm:min-h-64 lg:col-span-3 lg:min-h-[22rem]">
        <ProjectVisual
          large
          project={project}
          className="absolute inset-0"
          imgClassName="transition-transform duration-700 group-hover:scale-105"
        />
        {/* text/badge ke liye halka shade, sirf asli photo par */}
        {project.thumbnail && (
          <div className="absolute inset-0 bg-gradient-to-t from-navy/40 via-transparent to-transparent" aria-hidden="true" />
        )}
        <span className="absolute top-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-navy/85 px-3 py-1 text-xs font-semibold tracking-wider text-accent uppercase backdrop-blur">
          <Star className="size-3.5" aria-hidden="true" />
          Featured
        </span>
      </div>

      <div className="flex flex-col justify-center p-5 sm:p-7 lg:col-span-2 lg:p-8">
        {project.category && (
          <p className="text-xs font-semibold tracking-widest text-primary uppercase">{project.category}</p>
        )}
        <h3 className="mt-2 text-2xl leading-tight transition-colors duration-300 group-hover:text-primary sm:text-3xl">
          {project.title}
        </h3>
        {project.short_description && (
          <p className="mt-3 line-clamp-[6] text-justify [hyphens:auto] [text-align-last:left] text-base leading-relaxed text-body">{project.short_description}</p>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <StatusPill status={project.status} className="border border-line bg-surface shadow-none" />
          {project.year && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium text-muted">
              <Calendar className="size-3" aria-hidden="true" />
              {project.year}
            </span>
          )}
        </div>

        <span className="mt-6 inline-flex w-fit items-center gap-3 text-sm font-medium text-primary">
          Explore project
          <span className="inline-flex size-9 items-center justify-center rounded-full bg-primary text-on-primary transition-transform duration-300 group-hover:translate-x-1.5">
            <ArrowRight className="size-4" aria-hidden="true" />
          </span>
        </span>
      </div>
    </Link>
  )
}

// ---------- 1. Hero ----------

const chipClass = 'border-on-navy/20 bg-on-navy/10 text-on-navy/85 inline-flex items-center rounded-full border'
const chipStyle = { gap: '0.375rem', padding: '0.375rem 0.75rem', fontSize: '0.75rem' }

// Right side showcase: asli projects (featured pehle, max 3) ek ek karke aage aate hain. Sirf decoration (aria-hidden).
function HeroDeck({ projects }) {
  const items = useMemo(
    () => [...projects].sort((a, b) => Number(b.is_featured) - Number(a.is_featured)).slice(0, 3),
    [projects],
  )
  const [active, setActive] = useState(0)

  useEffect(() => {
    if (items.length < 2) return undefined
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined
    const timer = setInterval(() => setActive((a) => (a + 1) % items.length), 3800)
    return () => clearInterval(timer)
  }, [items.length])

  if (!items.length) return null

  return (
    <div className="pj-stage hidden min-[1280px]:block" aria-hidden="true">
      <div className="pj-deck">
      {items.map((p, i) => {
        const pos = (i - active + items.length) % items.length
        return (
          <div key={p.id} className="pj-slide" data-pos={pos}>
            <div className="pj-slide-img">
              {p.thumbnail ? (
                <img src={p.thumbnail} alt="" loading="lazy" draggable={false} />
              ) : (
                <span className="pj-slide-initial">{(p.title || '?').trim().charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className="pj-slide-body">
              {p.category && <span className="pj-slide-cat">{p.category}</span>}
              <p className="pj-slide-title">{p.title}</p>
              {(p.status || p.year) && (
                <span className="pj-slide-meta">
                  <span className="pj-slide-dot" />
                  {[p.status, p.year].filter(Boolean).join(' · ')}
                </span>
              )}
            </div>
          </div>
        )
      })}
      {items.length > 1 && (
        <span className="pj-deck-dots">
          {items.map((p, i) => (
            <i key={p.id} data-on={i === active} />
          ))}
        </span>
      )}
      </div>
    </div>
  )
}

// Shared PageHero (baqi pages jaisa size, rectangle) + decoration overlay. Chips counts dikhate hain.
function Hero({ total, areas, ongoing, projects }) {
  const { pageIntros } = usePublicSite()
  const intro = getPageIntro(pageIntros, 'projects')

  const chips = [
    total > 0 && { icon: FolderOpen, label: `${total} ${total === 1 ? 'project' : 'projects'}` },
    areas > 0 && { icon: Layers, label: `${areas} research ${areas === 1 ? 'area' : 'areas'}` },
    ongoing > 0 && { icon: TrendingUp, label: `${ongoing} ongoing` },
  ].filter(Boolean)

  return (
    <div className="pj-hero">
      <PageHero
        eyebrow="Selected work"
        title={asText(intro?.title) || 'Projects'}
        subtitle={introText(intro) || 'Selected research initiatives and applied work.'}
      >
        {chips.length > 0 && (
          <ul className="pj-chips">
            {chips.map(({ icon: Icon, label }, i) => (
              <li
                key={label}
                className={cn('pj-rise', chipClass)}
                style={{ ...chipStyle, animationDelay: `${150 + i * 100}ms` }}
              >
                <Icon className="text-accent" width={13} height={13} aria-hidden="true" />
                {label}
              </li>
            ))}
          </ul>
        )}
      </PageHero>

      {/* decoration: overlay, clicks nahi rokta */}
      <div className="pointer-events-none absolute inset-0 z-[1]" aria-hidden="true">
        <div className="pj-aurora" />
        <div className="pj-gridbg" />
        <div className="pj-float absolute -top-32 -right-16 size-[22rem] rounded-full bg-primary/40 blur-[70px]" />
        <div className="pj-float-slow absolute -bottom-36 -left-12 size-[18rem] rounded-full bg-accent/25 blur-[70px]" />
        <div
          className="absolute inset-0 text-on-navy opacity-[0.12]"
          style={{
            backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)',
            backgroundSize: '22px 22px',
            WebkitMaskImage: 'linear-gradient(180deg, #000, transparent 85%)',
            maskImage: 'linear-gradient(180deg, #000, transparent 85%)',
          }}
        />
        {PARTICLES.map(([left, top, delay, dur], i) => (
          <span key={i} className="pj-particle" style={{ left, top, '--delay': `${delay}s`, '--dur': `${dur}s` }} />
        ))}
      </div>

      <HeroDeck projects={projects} />
      <span className="pj-sheen" aria-hidden="true" />
    </div>
  )
}

// ---------- 2. Filter bar ----------

// Equal-width segments + ek sliding indicator (translateX). Measurement ki zaroorat nahi.
function StatusSwitch({ options, value, onChange }) {
  const active = Math.max(0, options.findIndex((o) => o.value === value))

  return (
    <div role="group" aria-label="Filter by status" className="relative grid max-w-full auto-cols-fr grid-flow-col overflow-x-auto rounded-full border border-line bg-card p-1 shadow-sm [scrollbar-width:none]">
      <span
        className="absolute inset-y-1 left-1 rounded-full transition-transform duration-300 ease-out motion-reduce:transition-none"
        style={{
          width: `calc((100% - 0.5rem) / ${options.length})`,
          transform: `translateX(${active * 100}%)`,
          background: 'linear-gradient(135deg, var(--c-primary), color-mix(in srgb, var(--c-primary) 65%, var(--c-navy)))',
          boxShadow: '0 8px 18px -8px var(--c-primary)',
        }}
        aria-hidden="true"
      />
      {options.map((opt) => {
        const on = opt.value === value
        const tone = opt.value ? statusTone(opt.value) : null
        return (
          <button
            key={opt.value || 'all'}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(opt.value)}
            className={cn(
              'relative z-10 inline-flex items-center justify-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium whitespace-nowrap transition-colors duration-300 sm:px-5',
              on ? 'text-on-primary' : 'text-body hover:text-primary',
            )}
          >
            {tone && (
              <span className="relative flex size-1.5" aria-hidden="true">
                {tone === 'ongoing' && !on && (
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60 motion-reduce:hidden" />
                )}
                <span className={cn('relative inline-flex size-1.5 rounded-full', on ? 'bg-on-primary' : DOT[tone])} />
              </span>
            )}
            {opt.label}
            <span
              className={cn(
                'rounded-full px-1.5 py-px text-[0.6875rem] font-semibold tabular-nums transition-colors duration-300',
                on ? 'bg-on-primary/20 text-on-primary' : 'bg-primary-soft text-primary',
              )}
            >
              {opt.count}
            </span>
          </button>
        )
      })}
    </div>
  )
}

function AreaChips({ categories, counts, total, value, onChange }) {
  const chip = (on) =>
    cn(
      'inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium whitespace-nowrap transition-all duration-300',
      on
        ? 'border-transparent text-on-primary'
        : 'border-line bg-card text-body hover:-translate-y-0.5 hover:border-primary hover:text-primary',
    )
  const activeStyle = (on) =>
    on
      ? {
          background: 'linear-gradient(135deg, var(--c-primary), color-mix(in srgb, var(--c-primary) 65%, var(--c-navy)))',
          boxShadow: '0 8px 18px -8px var(--c-primary)',
        }
      : undefined
  const count = (on, n) => (
    <span className={cn('text-xs tabular-nums', on ? 'opacity-80' : 'text-muted')}>{n}</span>
  )

  return (
    // Hamesha ek line (bar tall na ho): zyada chips hon to side scroll
    <div role="group" aria-label="Filter by research area" className="-mx-4 flex min-w-0 gap-2 overflow-x-auto px-4 py-1 [scrollbar-width:none] sm:mx-0 sm:px-0 lg:flex-1">
      <button type="button" aria-pressed={value === ''} onClick={() => onChange('')} className={chip(value === '')} style={activeStyle(value === '')}>
        All areas
        {count(value === '', total)}
      </button>
      {categories.map((c) => (
        <button key={c} type="button" aria-pressed={value === c} onClick={() => onChange(c)} className={chip(value === c)} style={activeStyle(value === c)}>
          {c}
          {count(value === c, counts[c] ?? 0)}
        </button>
      ))}
    </div>
  )
}

// ---------- Loading ----------

function PageSkeleton() {
  return (
    <Container className="py-10 sm:py-12" aria-busy="true" aria-label="Loading projects">
      <div className="flex gap-3">
        <Skeleton className="h-10 w-72 rounded-full" />
        <Skeleton className="hidden h-10 w-24 rounded-full sm:block" />
        <Skeleton className="hidden h-10 w-24 rounded-full sm:block" />
      </div>
      <Skeleton className="mt-6 h-72 rounded-2xl" />
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-72 rounded-xl" />
        ))}
      </div>
    </Container>
  )
}

// Grid ka header: eyebrow (gradient line), title, gradient accent bar, hint, aur "shown of total" pill
function GridHeader({ eyebrow, title, shown, total }) {
  const gradient = { background: 'linear-gradient(90deg, var(--c-primary), var(--c-accent))' }
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
      <div className="min-w-0">
        <p className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest text-primary uppercase">
          <span className="h-px w-8" style={gradient} aria-hidden="true" />
          {eyebrow}
        </p>
        <h2 id="projects-grid-heading" className="mt-2 text-2xl sm:text-3xl">
          {title}
        </h2>
        <span className="mt-3 block h-1 w-14 rounded-full" style={gradient} aria-hidden="true" />
        <p className="mt-3 max-w-xl text-sm text-muted">
          Hover over a card, or tap its arrow, to see the overview and tech stack.
        </p>
      </div>
      <p
        className="inline-flex items-center gap-1.5 rounded-full border border-line bg-card px-3 py-1 text-xs font-medium text-muted"
        aria-live="polite"
      >
        <span className="font-semibold text-heading tabular-nums">{shown}</span> of
        <span className="tabular-nums">{total}</span>
      </p>
    </div>
  )
}

// ---------- 2-4. Filters + featured + grid ----------

function ProjectsBrowser({ projects }) {
  const { slug } = usePublicSite()
  const [status, setStatus] = useState('')
  const [category, setCategory] = useState('')
  const [visible, setVisible] = useState(PAGE_SIZE)

  const statuses = uniqueValues(projects, 'status')
  const categories = uniqueValues(projects, 'category')
  const areaCounts = Object.fromEntries(categories.map((c) => [c, projects.filter((p) => p.category === c).length]))

  const filtering = Boolean(status || category)
  const filtered = projects.filter(
    (p) => (!status || p.status === status) && (!category || p.category === category),
  )

  // Featured sirf jab koi filter na ho (filter lagne par wo bhi grid mein normal card ban kar aata hai)
  const featured = filtering ? null : projects.find((p) => p.is_featured)
  const list = featured ? filtered.filter((p) => p.id !== featured.id) : filtered
  const shown = list.slice(0, visible)

  const statusOptions = [
    { value: '', label: 'All', count: projects.length },
    ...statuses.map((s) => ({ value: s, label: s, count: projects.filter((p) => p.status === s).length })),
  ]

  const changeStatus = (value) => {
    setStatus(value)
    setVisible(PAGE_SIZE)
  }
  const changeCategory = (value) => {
    setCategory(value)
    setVisible(PAGE_SIZE)
  }
  const clear = () => {
    setStatus('')
    setCategory('')
    setVisible(PAGE_SIZE)
  }

  const hasFilters = statuses.length > 1 || categories.length > 1

  return (
    <>
      {hasFilters && (
        <div className="sticky top-16 z-30 border-b border-line/60 bg-background/90 shadow-[0_12px_28px_-24px_rgba(8,12,40,0.55)] backdrop-blur-md">
          <Container className="flex flex-col gap-3 py-3 lg:flex-row lg:items-center lg:gap-4">
            {statuses.length > 1 && (
              <div className="w-full sm:w-fit lg:shrink-0">
                <StatusSwitch options={statusOptions} value={status} onChange={changeStatus} />
              </div>
            )}
            {statuses.length > 1 && categories.length > 1 && (
              <span className="hidden h-6 w-px shrink-0 bg-line lg:block" aria-hidden="true" />
            )}
            {categories.length > 1 && (
              <AreaChips
                categories={categories}
                counts={areaCounts}
                total={projects.length}
                value={category}
                onChange={changeCategory}
              />
            )}
          </Container>
        </div>
      )}

      <div className="bg-background pb-12 sm:pb-16">
        <Container className="pt-8 sm:pt-10">
          {featured && (
            <Reveal>
              <FeaturedProjectCard project={featured} to={paths.siteProject(slug, featured.id)} />
            </Reveal>
          )}

          {filtered.length === 0 ? (
            <EmptyState
              icon={FolderSearch}
              title="No projects match these filters"
              description="Try a different status or research area."
              action={
                <Button variant="secondary" onClick={clear}>
                  Clear filters
                </Button>
              }
            />
          ) : (
            list.length > 0 && (
              <section className={featured ? 'mt-10 sm:mt-12' : undefined} aria-labelledby="projects-grid-heading">
                <GridHeader
                  eyebrow={filtering ? 'Filtered' : 'Browse'}
                  title={filtering ? 'Matching projects' : featured ? 'More projects' : 'All projects'}
                  shown={shown.length}
                  total={list.length}
                />

                {/* key badalte hi grid dobara mount hota hai: filter badalne par stagger animation phir chalti hai */}
                <div key={`${status}|${category}`} className="grid items-start gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {shown.map((project, i) => (
                    <Reveal key={project.id} delay={(i % 3) * 90}>
                      <ProjectCard project={project} to={paths.siteProject(slug, project.id)} />
                    </Reveal>
                  ))}
                </div>

                {shown.length < list.length && (
                  <div className="mt-8 text-center">
                    <Button variant="secondary" className="group" onClick={() => setVisible((v) => v + PAGE_SIZE)}>
                      Show more projects
                      <span className="text-muted tabular-nums">({list.length - shown.length})</span>
                    </Button>
                  </div>
                )}
              </section>
            )
          )}
        </Container>
      </div>
    </>
  )
}

// ---------- 5. Call to action ----------

function CollaborationCta() {
  const { slug, portfolio, contact } = usePublicSite()
  // ASSUMPTION: backend contact object mein `whatsapp` field aayegi (e.g. "+92 300 1234567"). wa.me ko sirf digits chahiye.
  const whatsapp = String(contact?.whatsapp ?? '').replace(/\D/g, '')

  return (
    <Section tone="blue-tint">
      <Reveal>
        <div className="relative isolate overflow-hidden rounded-2xl border border-line bg-card p-6 shadow-md sm:p-8 lg:p-10">
          <div className="pj-float pointer-events-none absolute -top-24 -right-20 -z-10 size-72 rounded-full bg-primary/15 blur-3xl" aria-hidden="true" />
          <div className="pj-float-slow pointer-events-none absolute -bottom-28 -left-16 -z-10 size-64 rounded-full bg-accent/20 blur-3xl" aria-hidden="true" />

          <div className="grid items-center gap-6 lg:grid-cols-[1.4fr_1fr] lg:gap-10">
            <div>
              <p className="text-sm font-semibold text-primary">Let&apos;s work together</p>
              <h2 className="mt-2 text-2xl sm:text-3xl">Interested in collaborating?</h2>
              <p className="mt-3 max-w-xl text-base leading-relaxed text-body">
                Whether you want to sponsor a research track, propose a joint project or explore supervision
                opportunities, I would be glad to hear from you.
              </p>
              {contact?.email && (
                <p className="mt-4 text-sm text-muted">
                  Or write to{' '}
                  <a href={`mailto:${contact.email}`} className="font-medium break-all text-primary underline-offset-4 hover:underline">
                    {contact.email}
                  </a>
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2.5">
              <Button as={Link} to={paths.siteContact(slug)} className="group">
                <Mail className="size-4" aria-hidden="true" />
                Contact me
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </Button>
              {whatsapp && (
                <Button as="a" href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer" variant="secondary">
                  <MessageCircle className="size-4" aria-hidden="true" />
                  Chat on WhatsApp
                </Button>
              )}
              {portfolio?.cv_url && (
                <Button as="a" href={portfolio.cv_url} target="_blank" rel="noreferrer" variant="secondary">
                  <Download className="size-4" aria-hidden="true" />
                  Download CV
                </Button>
              )}
            </div>
          </div>
        </div>
      </Reveal>
    </Section>
  )
}

// ---------- Page ----------

export function ProjectsPage() {
  const { slug } = usePublicSite()
  const query = useProjects(slug)
  const projects = useMemo(() => (query.data ?? []).map(normalizeProject), [query.data])

  const areas = useMemo(() => new Set(projects.map((p) => p.category).filter(Boolean)).size, [projects])
  const ongoing = useMemo(() => projects.filter((p) => statusTone(p.status) === 'ongoing').length, [projects])

  let body
  if (query.isPending) {
    body = <PageSkeleton />
  } else if (query.isError) {
    body = (
      <Container className="py-12">
        <ErrorState message={query.error?.message} onRetry={query.refetch} />
      </Container>
    )
  } else if (projects.length === 0) {
    body = (
      <Container className="py-12">
        <EmptyState
          icon={FolderSearch}
          title="No projects yet"
          description="Projects will appear here once they are published."
        />
      </Container>
    )
  } else {
    body = <ProjectsBrowser projects={projects} />
  }

  return (
    <>
      <style>{PAGE_CSS}</style>
      <Hero total={projects.length} areas={areas} ongoing={ongoing} projects={projects} />
      {body}
      {!query.isPending && !query.isError && <CollaborationCta />}
    </>
  )
}