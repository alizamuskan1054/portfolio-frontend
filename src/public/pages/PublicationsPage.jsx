import { useEffect, useMemo, useRef, useState } from 'react'
import { BookOpen, Check, Copy, ExternalLink, Quote, SearchX, TrendingUp } from 'lucide-react'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { SearchInput } from '@/components/shared/SearchInput'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Skeleton } from '@/components/ui/Skeleton'
import { FilterTabs } from '@/components/ui/Tabs'
import { formatNumber } from '@/lib/format'
import { cn } from '@/lib/utils'
import { PageHero } from '@/public/components/PageHero'
import { Section } from '@/public/components/Section'
import { usePublications } from '@/public/hooks/usePublicData'
import { usePublicSite } from '@/public/hooks/usePublicSite'
import { filterBy, uniqueValues } from '@/public/lib/filters'

// =====================================================================================
// PUBLICATIONS PAGE (v2): logic wahi, sizing baqi pages (Blog, Contact, Projects, Services, Home)
// ke barabar, aur wohi "ingredients" (animations) jo baqi pages mein hain.
//
// Sizing:
//   * Hero metrics compact (pehle 5xl numbers + bare cards hero ko bohat lamba kar dete thay)
//   * Cards rounded-xl, chhoti paddings, year 3xl/4xl, toolbar patla
// Ingredients (baqi pages jaise):
//   * Hero: animated glow + dot grid + sheen line, metrics count-up (scroll mein aane par)
//   * Year groups scroll par halka reveal, cards par hover lift + gradient side-bar
//   * prefers-reduced-motion par sab band
// v3: (1) Hero mein ab "papers per year" mini bar chart (data se), (2) hero title/subtitle backend ke
//     page_intros ("publications") se, na ho to default, (3) "View paper" button har us paper par jiska
//     koi bhi link ho (url/link/pdf_url/doi), Home page jaisa, (4) publication ki image ho to poori dikhti hai
//     (crop nahi), na ho to kuch nahi dikhta. Optional image fields: image | thumbnail | cover_image.
// NOTE: gradient classes Tailwind v4 ki hain (bg-linear-to-*). Agar project Tailwind v3 par ho
//       to "bg-linear-to-" ko "bg-gradient-to-" se replace kar dein.
// =====================================================================================

const PAGE_SIZE = 10

const PAGE_CSS = `
@keyframes pb-float { 0%, 100% { transform: translate3d(0, 0, 0) scale(1); } 50% { transform: translate3d(0, -28px, 0) scale(1.06); } }
@keyframes pb-sheen { 0% { background-position: 0% 50%; } 100% { background-position: 200% 50%; } }
@keyframes pb-rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
@keyframes pb-grow { from { transform: scaleY(0); } to { transform: scaleY(1); } }
.pb-hero { position: relative; overflow: hidden; }
.pb-float { animation: pb-float 10s ease-in-out infinite; }
.pb-float-slow { animation: pb-float 14s ease-in-out infinite reverse; }
.pb-rise { animation: pb-rise .6s cubic-bezier(.2,.7,.2,1) both; }
.pb-metrics { display: flex; flex-wrap: wrap; gap: .75rem; margin: 0; }
.pb-herorow { display: flex; flex-wrap: wrap; align-items: stretch; gap: .75rem; }
.pb-bar { transform-origin: bottom; animation: pb-grow .7s cubic-bezier(.2,.7,.2,1) both; animation-delay: calc(var(--i, 0) * 45ms + 350ms); }
.pb-sheen { position: absolute; left: 0; right: 0; bottom: 0; height: 2px; z-index: 2; pointer-events: none;
  background: linear-gradient(90deg, transparent, var(--c-primary), var(--c-accent), transparent);
  background-size: 200% 100%; animation: pb-sheen 6s linear infinite; }
.pb-btn { display: inline-flex; align-items: center; gap: .375rem; padding: .4375rem .875rem; border-radius: .5rem; font-size: .75rem; font-weight: 600; line-height: 1.2;
  border: 1px solid var(--c-line); background: transparent; color: inherit; cursor: pointer; text-decoration: none;
  transition: border-color .2s, color .2s, filter .2s, transform .2s; }
.pb-btn:hover { border-color: var(--c-primary); color: var(--c-primary); }
.pb-btn:focus-visible { outline: 2px solid var(--c-primary); outline-offset: 2px; }
.pb-btn-primary { color: #fff; border-color: transparent; background: linear-gradient(135deg, var(--c-primary), var(--c-accent)); }
.pb-btn-primary:hover { color: #fff; border-color: transparent; filter: brightness(1.08); transform: translateY(-1px); }
@media (prefers-reduced-motion: reduce) {
  .pb-btn { transition: none; }
  .pb-btn-primary:hover { transform: none; }
}
@media (prefers-reduced-motion: reduce) {
  .pb-float, .pb-float-slow, .pb-rise, .pb-sheen, .pb-bar { animation: none !important; }
}
`

// ---------- Helpers ----------

const asText = (v) => (v === undefined || v === null || typeof v === 'object' ? '' : String(v).trim())

// page_intros array ho ya { publications: {...} } map, dono chalte hain
function getPageIntro(pageIntros, page) {
  if (Array.isArray(pageIntros)) return pageIntros.find((p) => p?.page === page) ?? null
  return pageIntros?.[page] ?? null
}

// Backend "intro" bhejta hai; kuch jagah "subtitle"/"description" naam se bhi aa sakta hai
const introText = (item) => asText(item?.subtitle) || asText(item?.intro) || asText(item?.description)

// Paper ka link: Home page wali hi chain (url, link, pdf_url, external_url, phir doi)
function linkOf(p) {
  const direct = asText(p.url) || asText(p.link) || asText(p.pdf_url) || asText(p.external_url)
  if (direct) return direct
  if (p.doi) return `https://doi.org/${String(p.doi).replace(/^https?:\/\/(dx\.)?doi\.org\//, '')}`
  return ''
}

function citationText(p) {
  const head = [p.authors, p.year && `(${p.year})`].filter(Boolean).join(' ')
  const tail = [p.title, p.journal].filter(Boolean).join('. ')
  const doi = p.doi ? ` https://doi.org/${p.doi}` : ''
  return `${head ? head + '. ' : ''}${tail}.${doi}`
}

async function copyText(text) {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text)
  const area = document.createElement('textarea')
  area.value = text
  area.style.cssText = 'position:fixed;opacity:0'
  document.body.appendChild(area)
  area.select()
  const ok = document.execCommand('copy')
  area.remove()
  if (!ok) throw new Error('copy failed')
}

function matchesSearch(p, term) {
  if (!term) return true
  const haystack = [p.title, p.authors, p.journal, p.year, p.doi, p.type].filter(Boolean).join(' ').toLowerCase()
  return term
    .toLowerCase()
    .split(/\s+/)
    .every((word) => haystack.includes(word))
}

// [{ year, items }] naya saal pehle; saal ke baghair wale aakhir mein
function groupByYear(items) {
  const map = new Map()
  items.forEach((p) => {
    const key = p.year ?? ''
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(p)
  })
  return [...map.entries()]
    .sort(([a], [b]) => (a === '' ? 1 : b === '' ? -1 : Number(b) - Number(a)))
    .map(([year, rows]) => ({ year, items: rows }))
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Ek baar viewport mein aaye to true
function useInView(ref) {
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') {
      setSeen(true)
      return undefined
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true)
          io.disconnect()
        }
      },
      { threshold: 0.2 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [ref])
  return seen
}

// 0 se target tak ginta hai (reduced-motion par seedha target)
function useCountUp(target, active, duration = 1000) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!active) return undefined
    if (prefersReducedMotion() || !target) {
      setValue(target)
      return undefined
    }
    let frame
    const start = performance.now()
    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1)
      setValue(target * (1 - Math.pow(1 - t, 3)))
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, active, duration])
  return value
}

// Scroll par halka sa uthta hai
function Reveal({ children, delay = 0, className }) {
  const ref = useRef(null)
  const [shown, setShown] = useState(
    () => typeof IntersectionObserver === 'undefined' || prefersReducedMotion(),
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
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' },
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

// ---------- 1. Metrics (hero ke andar, compact) ----------

function Metric({ label, value, icon: Icon, index }) {
  const ref = useRef(null)
  const seen = useInView(ref)
  const numeric = Number(value)
  const isNumber = Number.isFinite(numeric)
  const counted = useCountUp(isNumber ? numeric : 0, seen && isNumber)

  return (
    <div
      ref={ref}
      className="pb-rise relative flex min-w-[9.5rem] flex-1 items-center gap-3 overflow-hidden rounded-xl bg-on-navy/10 px-4 py-2.5 ring-1 ring-on-navy/20 backdrop-blur-md sm:flex-none sm:pr-6"
      style={{ animationDelay: `${150 + index * 100}ms` }}
    >
      {/* upar gold-se-safed patli gradient line */}
      <span className="absolute inset-x-0 top-0 h-0.5 bg-linear-to-r from-accent via-on-navy/60 to-transparent" aria-hidden="true" />
      <span
        className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-accent/30 to-on-navy/10 text-accent ring-1 ring-on-navy/15"
        aria-hidden="true"
      >
        <Icon className="size-4.5" />
      </span>
      <div className="min-w-0">
        <dd className="bg-linear-to-br from-on-navy via-on-navy to-accent bg-clip-text font-serif text-2xl leading-tight font-semibold text-transparent sm:text-3xl">
          {isNumber ? formatNumber(Math.round(counted)) : String(value)}
        </dd>
        <dt className="text-[11px] tracking-wide text-on-navy/70 uppercase">{label}</dt>
      </div>
    </div>
  )
}

// Data se "papers per year" mini bar chart (aakhri 12 saal jin mein paper hai)
function YearSpark({ items }) {
  const data = useMemo(() => {
    const counts = new Map()
    items.forEach((p) => {
      const y = Number(p.year)
      if (Number.isFinite(y) && y > 0) counts.set(y, (counts.get(y) ?? 0) + 1)
    })
    return [...counts.keys()]
      .sort((a, b) => a - b)
      .slice(-12)
      .map((year) => ({ year, count: counts.get(year) }))
  }, [items])

  if (data.length < 2) return null
  const max = Math.max(...data.map((d) => d.count))
  const first = data[0].year
  const last = data[data.length - 1].year

  return (
    <figure
      className="pb-rise m-0 flex min-w-[13rem] flex-1 flex-col justify-between gap-1.5 overflow-hidden rounded-xl bg-on-navy/10 px-4 py-2.5 ring-1 ring-on-navy/20 backdrop-blur-md sm:w-72 sm:flex-none"
      style={{ animationDelay: '450ms' }}
    >
      <figcaption className="text-[11px] tracking-wide text-on-navy/70 uppercase">Papers per year</figcaption>
      <div
        className="flex h-9 items-end gap-1"
        role="img"
        aria-label={`Papers per year, ${first} to ${last}. Most in a year: ${max}.`}
      >
        {data.map((d, i) => (
          <span
            key={d.year}
            title={`${d.year}: ${d.count} ${d.count === 1 ? 'paper' : 'papers'}`}
            className="pb-bar flex-1 rounded-t-sm bg-linear-to-t from-primary to-accent"
            style={{ '--i': i, height: `${Math.max(14, (d.count / max) * 100)}%`, opacity: i === data.length - 1 ? 1 : 0.7 }}
          />
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-on-navy/60 tabular-nums" aria-hidden="true">
        <span>{first}</span>
        <span>{last}</span>
      </div>
    </figure>
  )
}

function HeroMetrics({ total, citations, hIndex }) {
  const items = [
    { label: 'Publications', value: total, icon: BookOpen },
    { label: 'Citations', value: citations, icon: Quote },
    { label: 'h-index', value: hIndex, icon: TrendingUp },
  ].filter((m) => m.value !== null && m.value !== undefined)

  if (items.length === 0) return null

  return (
    <dl className="pb-metrics">
      {items.map((m, i) => (
        <Metric key={m.label} {...m} index={i} />
      ))}
    </dl>
  )
}

// ---------- 2. Toolbar ----------

function Toolbar({ search, onSearch, types, typeCounts, type, onType, years, year, onYear, total, shown, onClear, filtered }) {
  const typeOptions = [
    { value: '', label: `All (${total})` },
    ...types.map((t) => ({ value: t, label: `${t} (${typeCounts[t] ?? 0})` })),
  ]

  return (
    <div className="relative overflow-hidden rounded-xl border border-line bg-card/90 p-3.5 shadow-md shadow-primary/5 backdrop-blur sm:p-4">
      {/* gradient strip */}
      <span className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-primary via-accent to-primary" aria-hidden="true" />

      <div className="space-y-3.5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="min-w-0 w-full sm:flex-1 [&>*]:w-full [&>*]:max-w-none">
            <SearchInput value={search} onChange={onSearch} placeholder="Search title, author or journal" className="w-full max-w-none" />
          </div>
          {years.length > 1 && (
            <div className="sm:w-40">
              <Select aria-label="Filter by year" value={year} onChange={(e) => onYear(e.target.value)} placeholder="All years">
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </Select>
            </div>
          )}
        </div>

        {types.length > 1 && <FilterTabs options={typeOptions} value={type} onChange={onType} />}

        <div className="flex items-center justify-between gap-3 border-t border-line pt-3 text-sm text-muted" aria-live="polite">
          <p>
            {filtered ? `${shown} of ${total}` : total} {total === 1 ? 'publication' : 'publications'}
          </p>
          {filtered && (
            <button type="button" onClick={onClear} className="rounded-full bg-primary-soft px-3 py-1 font-medium text-primary transition-opacity hover:opacity-80">
              Clear filters
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ---------- 3. List ----------

function CiteButton({ publication }) {
  const [copied, setCopied] = useState(false)
  const timer = useRef(null)
  useEffect(() => () => clearTimeout(timer.current), [])

  const handle = async () => {
    try {
      await copyText(citationText(publication))
      setCopied(true)
      clearTimeout(timer.current)
      timer.current = setTimeout(() => setCopied(false), 2000)
    } catch {
      // copy na ho to chup rehna theek hai (user link se bhi kaam chala sakta hai)
    }
  }

  const Icon = copied ? Check : Copy
  return (
    <button
      type="button"
      onClick={handle}
      className="pb-btn"
      aria-label={`Copy citation for ${publication.title}`}
      aria-live="polite"
    >
      <Icon width={13} height={13} aria-hidden="true" />
      {copied ? 'Copied' : 'Copy citation'}
    </button>
  )
}

// Publication ki image ho to poori (crop nahi), peeche usi ka blur. Na ho to kuch nahi.
function PubImage({ src, alt }) {
  const [failed, setFailed] = useState(false)
  if (!src || failed) return null
  return (
    <span className="relative block size-16 shrink-0 overflow-hidden rounded-lg border border-line bg-primary-soft sm:size-24">
      <img
        src={src}
        alt=""
        aria-hidden="true"
        loading="lazy"
        draggable={false}
        className="absolute inset-0 size-full object-cover"
        style={{ filter: 'blur(12px) saturate(1.2)', transform: 'scale(1.15)', opacity: 0.55 }}
      />
      <img
        src={src}
        alt={alt}
        loading="lazy"
        draggable={false}
        onError={() => setFailed(true)}
        className="relative size-full object-contain"
      />
    </span>
  )
}

function PublicationRow({ publication: p }) {
  const href = linkOf(p)
  const doiUrl = p.doi ? `https://doi.org/${p.doi}` : null
  const image = asText(p.image) || asText(p.thumbnail) || asText(p.cover_image) || asText(p.cover)

  return (
    <li
      className={`group relative overflow-hidden rounded-xl border p-4 pl-5 shadow-xs transition duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/10 motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:p-5 sm:pl-6 ${
        p.is_featured
          ? 'border-accent/40 bg-linear-to-br from-accent/10 via-card to-primary/5'
          : 'border-line bg-card hover:border-primary/40'
      }`}
    >
      {/* left gradient bar: featured par hamesha, baaqi par hover par */}
      <span
        className={`absolute inset-y-0 left-0 w-1 bg-linear-to-b from-primary to-accent transition-opacity duration-300 ${
          p.is_featured ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}
        aria-hidden="true"
      />

      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          {(p.type || p.is_featured) && (
            <div className="mb-2 flex flex-wrap items-center gap-2">
              {p.type && <Badge variant="primary">{p.type}</Badge>}
              {p.is_featured && <Badge variant="accent">Featured</Badge>}
            </div>
          )}
          <h3 className="text-lg leading-snug transition-colors group-hover:text-primary">{p.title}</h3>
          {p.authors && <p className="mt-1.5 text-sm text-body sm:text-base">{p.authors}</p>}
          {p.journal && <p className="mt-0.5 text-sm text-muted italic">{p.journal}</p>}
        </div>
        <PubImage src={image} alt={p.title} />
      </div>

      <p className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-3.5">
        {href && (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="pb-btn pb-btn-primary"
          >
            View paper <ExternalLink width={13} height={13} aria-hidden="true" />
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        )}
        {doiUrl && (
          <a
            href={doiUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="pb-btn max-w-full break-all"
          >
            DOI: {p.doi}
            <ExternalLink width={13} height={13} aria-hidden="true" />
          </a>
        )}
        <CiteButton publication={p} />
      </p>
    </li>
  )
}

function YearGroup({ year, items }) {
  return (
    <section
      aria-label={year ? `Publications from ${year}` : 'Undated publications'}
      className="grid gap-3 lg:grid-cols-[6.5rem_1fr] lg:gap-6"
    >
      {/* year: gradient number, desktop par scroll ke saath sticky */}
      <div className="lg:sticky lg:top-24 lg:self-start">
        <h2 className="bg-linear-to-br from-primary to-accent bg-clip-text font-serif text-3xl font-bold text-transparent sm:text-4xl">
          {year || 'Other'}
        </h2>
        <span className="mt-1.5 block h-1 w-10 rounded-full bg-linear-to-r from-accent to-transparent" aria-hidden="true" />
        <p className="mt-1.5 text-xs text-muted">
          {items.length} {items.length === 1 ? 'paper' : 'papers'}
        </p>
      </div>
      <ul className="min-w-0 space-y-3">
        {items.map((p) => (
          <PublicationRow key={p.id} publication={p} />
        ))}
      </ul>
    </section>
  )
}

function ListSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading publications">
      {[0, 1, 2].map((i) => (
        <div key={i} className="grid gap-3 lg:grid-cols-[6.5rem_1fr] lg:gap-6">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      ))}
    </div>
  )
}

// ---------- Page ----------

export function PublicationsPage() {
  const { slug, portfolio, pageIntros } = usePublicSite()
  const intro = getPageIntro(pageIntros, 'publications')
  const query = usePublications(slug)
  const all = query.data ?? []

  const [search, setSearch] = useState('')
  const [type, setType] = useState('')
  const [year, setYear] = useState('')
  const [limit, setLimit] = useState(PAGE_SIZE)

  // Filter badalte hi list wapas shuru se
  const change = (setter) => (value) => {
    setter(value)
    setLimit(PAGE_SIZE)
  }
  const clear = () => {
    setSearch('')
    setType('')
    setYear('')
    setLimit(PAGE_SIZE)
  }

  const types = useMemo(() => uniqueValues(all, 'type'), [all])
  const years = useMemo(() => uniqueValues(all, 'year', 'desc'), [all])
  const typeCounts = useMemo(() => Object.fromEntries(types.map((t) => [t, all.filter((p) => p.type === t).length])), [all, types])

  const filtered = useMemo(
    () => filterBy(filterBy(all, 'type', type), 'year', year).filter((p) => matchesSearch(p, search.trim())),
    [all, type, year, search],
  )
  const visible = filtered.slice(0, limit)
  const groups = useMemo(() => groupByYear(visible), [visible])
  const isFiltered = Boolean(search.trim() || type || year)

  const metrics = portfolio?.metrics ?? {
    publications: portfolio?.total_publications,
    citations: portfolio?.citations,
    h_index: portfolio?.h_index,
  }
  const total = metrics.publications ?? (query.data ? all.length : null)

  return (
    <>
      <style>{PAGE_CSS}</style>

      <div className="pb-hero">
        <PageHero
          eyebrow="Research"
          title={asText(intro?.title) || 'Publications'}
          subtitle={introText(intro) || 'Peer-reviewed papers, books and conference talks.'}
        >
          <div className="pb-herorow">
            <HeroMetrics total={total} citations={metrics.citations} hIndex={metrics.h_index} />
            <YearSpark items={all} />
          </div>
        </PageHero>

        {/* decoration: overlay, clicks nahi rokta */}
        <div className="pointer-events-none absolute inset-0 z-[1]" aria-hidden="true">
          <div className="pb-float absolute -top-32 -right-16 size-[22rem] rounded-full bg-primary/40 blur-[70px]" />
          <div className="pb-float-slow absolute -bottom-36 -left-12 size-[18rem] rounded-full bg-accent/25 blur-[70px]" />
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
        <span className="pb-sheen" aria-hidden="true" />
      </div>

      <Section tone="background">
        {/* soft dot grid, sirf background decoration */}
        <div className="relative">
          <div
            className="pointer-events-none absolute inset-0 text-primary/10 [mask-image:linear-gradient(to_bottom,black,transparent_40%)]"
            style={{ backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)', backgroundSize: '24px 24px' }}
            aria-hidden="true"
          />

          <div className="relative">
            {query.isPending && <ListSkeleton />}

            {query.isError && <ErrorState message={query.error?.message} onRetry={query.refetch} />}

            {query.isSuccess && all.length === 0 && (
              <EmptyState icon={BookOpen} title="No publications yet" description="Published work will appear here." />
            )}

            {query.isSuccess && all.length > 0 && (
              <div className="mx-auto max-w-5xl">
                <Toolbar
                  search={search}
                  onSearch={change(setSearch)}
                  types={types}
                  typeCounts={typeCounts}
                  type={type}
                  onType={change(setType)}
                  years={years}
                  year={year}
                  onYear={change(setYear)}
                  total={all.length}
                  shown={filtered.length}
                  onClear={clear}
                  filtered={isFiltered}
                />

                <div className="mt-8">
                  {filtered.length === 0 ? (
                    <EmptyState
                      icon={SearchX}
                      title="No matching publications"
                      description="Try a different keyword or clear the filters."
                      action={
                        <Button variant="secondary" onClick={clear}>
                          Clear filters
                        </Button>
                      }
                    />
                  ) : (
                    <>
                      <div className="space-y-8">
                        {groups.map((g) => (
                          <Reveal key={g.year || 'other'}>
                            <YearGroup year={g.year} items={g.items} />
                          </Reveal>
                        ))}
                      </div>

                      {filtered.length > visible.length && (
                        <div className="mt-8 flex justify-center">
                          <Button variant="secondary" onClick={() => setLimit((n) => n + PAGE_SIZE)}>
                            Show more ({filtered.length - visible.length} remaining)
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </Section>
    </>
  )
}
