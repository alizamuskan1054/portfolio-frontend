import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Calendar, Download, FolderSearch, FolderOpen, Layers, Mail, MessageCircle, Star, TrendingUp } from 'lucide-react'
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
//     Pehle: custom hero, 7xl title, bari padding, rotating rings.
//   * Cards rounded-xl, featured/CTA rounded-2xl (pehle 3xl), headings 1.5rem, chhoti paddings.
//
//   1. Hero            PageHero + animated glow + dot grid + sheen line, chips (counts)
//   2. Filter bar      sticky: status (sliding indicator) + research-area chips
//   3. Featured        ek spotlight card (sirf jab filter off ho)
//   4. Grid            6 at a time, scroll par stagger reveal, hover lift
//   5. Collaboration   light card (neighbouring navy sections se alag)
//
// v3: (1) Hero title/subtitle ab backend ke page_intros (page "projects": title + intro) se aate hain,
//     na hon to default text. (2) Cards/featured mein image poori dikhti hai (crop nahi), peeche usi ka blur.
// prefers-reduced-motion par sab band, content seedha dikhta hai.
// =====================================================================================

const PAGE_SIZE = 6

const PAGE_CSS = `
@keyframes pj-rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
@keyframes pj-float { 0%, 100% { transform: translate3d(0, 0, 0) scale(1); } 50% { transform: translate3d(0, -28px, 0) scale(1.06); } }
@keyframes pj-sheen { 0% { background-position: 0% 50%; } 100% { background-position: 200% 50%; } }
@keyframes pj-pop { 0% { opacity: 0; transform: scale(.96) translateY(10px); } 100% { opacity: 1; transform: none; } }
.pj-rise { animation: pj-rise .6s cubic-bezier(.2,.7,.2,1) both; }
.pj-float { animation: pj-float 10s ease-in-out infinite; }
.pj-float-slow { animation: pj-float 14s ease-in-out infinite reverse; }
.pj-pop { animation: pj-pop .5s cubic-bezier(.2,.7,.2,1) both; }
.pj-hero { position: relative; overflow: hidden; }
.pj-chips { display: flex; flex-wrap: wrap; gap: .5rem; list-style: none; margin: 0; padding: 0; }
.pj-sheen { position: absolute; left: 0; right: 0; bottom: 0; height: 2px; z-index: 2; pointer-events: none;
  background: linear-gradient(90deg, transparent, var(--c-primary), var(--c-accent), transparent);
  background-size: 200% 100%; animation: pj-sheen 6s linear infinite; }
@media (prefers-reduced-motion: reduce) {
  .pj-rise, .pj-float, .pj-float-slow, .pj-pop, .pj-sheen { animation: none !important; }
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

function ProjectCard({ project, to, index }) {
  return (
    <Link
      to={to}
      className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-line bg-card shadow-xs transition-all duration-500 hover:-translate-y-1 hover:border-primary/50 hover:shadow-lg"
    >
      <div className="relative">
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
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="truncate text-xs font-semibold tracking-widest text-primary uppercase">
            {project.category || 'Project'}
          </p>
          <span className="font-serif text-base text-muted/50 tabular-nums" aria-hidden="true">
            {String(index).padStart(2, '0')}
          </span>
        </div>

        <h3 className="mt-2 text-lg leading-snug transition-colors duration-300 group-hover:text-primary">
          {project.title}
        </h3>
        {project.short_description && (
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-body">{project.short_description}</p>
        )}

        <div className="mt-auto flex items-center justify-between pt-5">
          <span className="text-sm font-medium text-heading transition-colors group-hover:text-primary">View project</span>
          <span className="inline-flex size-8 items-center justify-center rounded-full border border-line text-primary transition-all duration-300 group-hover:border-primary group-hover:bg-primary group-hover:text-on-primary">
            <ArrowRight className="size-4 transition-transform duration-300 group-hover:-rotate-45" aria-hidden="true" />
          </span>
        </div>
      </div>

      {/* hover par neeche se blue line */}
      <span
        className="absolute inset-x-0 bottom-0 h-1 origin-left scale-x-0 bg-primary transition-transform duration-500 group-hover:scale-x-100"
        aria-hidden="true"
      />
    </Link>
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
          <p className="mt-3 text-base leading-relaxed text-body">{project.short_description}</p>
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

// Shared PageHero (baqi pages jaisa size, rectangle) + decoration overlay. Chips counts dikhate hain.
function Hero({ total, areas, ongoing }) {
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
        eyebrow="Projects"
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
      </div>
      <span className="pj-sheen" aria-hidden="true" />
    </div>
  )
}

// ---------- 2. Filter bar ----------

// Equal-width segments + ek sliding indicator (translateX). Measurement ki zaroorat nahi.
function StatusSwitch({ options, value, onChange }) {
  const active = Math.max(0, options.findIndex((o) => o.value === value))

  return (
    <div role="group" aria-label="Filter by status" className="relative grid max-w-full auto-cols-fr grid-flow-col overflow-x-auto rounded-full border border-line bg-card p-1 shadow-xs [scrollbar-width:none]">
      <span
        className="absolute inset-y-1 left-1 rounded-full bg-primary shadow-sm transition-transform duration-300 ease-out motion-reduce:transition-none"
        style={{ width: `calc((100% - 0.5rem) / ${options.length})`, transform: `translateX(${active * 100}%)` }}
        aria-hidden="true"
      />
      {options.map((opt) => {
        const on = opt.value === value
        return (
          <button
            key={opt.value || 'all'}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(opt.value)}
            className={cn(
              'relative z-10 inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors duration-300 sm:px-4',
              on ? 'text-on-primary' : 'text-body hover:text-primary',
            )}
          >
            {opt.label}
            <span className={cn('text-xs tabular-nums', on ? 'opacity-80' : 'text-muted')}>{opt.count}</span>
          </button>
        )
      })}
    </div>
  )
}

function AreaChips({ categories, value, onChange }) {
  const chip = (on) =>
    cn(
      'shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium whitespace-nowrap transition-all duration-300',
      on
        ? 'border-primary bg-primary-soft text-primary'
        : 'border-line bg-card text-body hover:-translate-y-0.5 hover:border-primary hover:text-primary',
    )

  return (
    // Hamesha ek line (bar tall na ho): zyada chips hon to side scroll
    <div role="group" aria-label="Filter by research area" className="-mx-4 flex min-w-0 gap-2 overflow-x-auto px-4 py-1 [scrollbar-width:none] sm:mx-0 sm:px-0 lg:flex-1">
      <button type="button" aria-pressed={value === ''} onClick={() => onChange('')} className={chip(value === '')}>
        All areas
      </button>
      {categories.map((c) => (
        <button key={c} type="button" aria-pressed={value === c} onClick={() => onChange(c)} className={chip(value === c)}>
          {c}
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

// ---------- 2-4. Filters + featured + grid ----------

function ProjectsBrowser({ projects }) {
  const { slug } = usePublicSite()
  const [status, setStatus] = useState('')
  const [category, setCategory] = useState('')
  const [visible, setVisible] = useState(PAGE_SIZE)

  const statuses = uniqueValues(projects, 'status')
  const categories = uniqueValues(projects, 'category')

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
        <div className="sticky top-16 z-30 border-b border-line/60 bg-background/85 backdrop-blur-md">
          <Container className="flex flex-col gap-2.5 py-2.5 lg:flex-row lg:items-center lg:justify-between">
            {statuses.length > 1 && (
              <div className="w-full sm:w-fit lg:shrink-0">
                <StatusSwitch options={statusOptions} value={status} onChange={changeStatus} />
              </div>
            )}
            {categories.length > 1 && <AreaChips categories={categories} value={category} onChange={changeCategory} />}
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
                <div className="mb-5 flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
                  <div>
                    <p className="text-sm font-semibold text-primary">{filtering ? 'Filtered' : 'Browse'}</p>
                    <h2 id="projects-grid-heading" className="mt-1 text-2xl">
                      {filtering ? 'Matching projects' : featured ? 'More projects' : 'All projects'}
                    </h2>
                  </div>
                  <p className="text-xs text-muted" aria-live="polite">
                    Showing {shown.length} of {list.length}
                  </p>
                </div>

                {/* key badalte hi grid dobara mount hota hai: filter badalne par stagger animation phir chalti hai */}
                <div key={`${status}|${category}`} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {shown.map((project, i) => (
                    <Reveal key={project.id} delay={(i % 3) * 90} className="h-full">
                      <ProjectCard
                        project={project}
                        to={paths.siteProject(slug, project.id)}
                        index={i + (featured ? 2 : 1)}
                      />
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
      <Hero total={projects.length} areas={areas} ongoing={ongoing} />
      {body}
      {!query.isPending && !query.isError && <CollaborationCta />}
    </>
  )
}
