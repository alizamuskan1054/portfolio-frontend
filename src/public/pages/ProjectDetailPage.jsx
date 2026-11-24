import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft, ArrowRight, Award, Calendar, Check, ChevronLeft, ChevronRight, Code, ExternalLink,
  FileText, FlaskConical, Lightbulb, Mail, Maximize2, Star, Tag, X,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/shared/ErrorState'
import { paths } from '@/routes/paths'
import { cn } from '@/lib/utils'
import { Container } from '@/public/components/Container'
import { PublicNotFound } from '@/public/components/PublicNotFound'
import { Section } from '@/public/components/Section'
import { useProject, useProjects } from '@/public/hooks/usePublicData'
import { usePublicSite } from '@/public/hooks/usePublicSite'

// =====================================================================================
// PROJECT DETAIL PAGE  /:slug/projects/:id   (poora code isi file mein)
// Planning doc: title, main image, category, year, status, description, objectives,
// methodology, outcomes, gallery, Back link.
//
//   1. Hero (navy)         back link, title, summary, status/year, buttons  |  main image (chhoti, framed, click par zoom)
//   2. Article + sidebar   Overview, Objectives, Methodology, Outcomes, Gallery (lightbox)
//                          sidebar: project info + contact (desktop par sticky)
//   3. More projects       surface section, max 3 cards
// Jo section khali ho wo dikhta hi nahi. Sab kuch backend ke data se (kuch hardcoded nahi).
// Optional backend fields: live_url, repo_url, paper_url (naam alag hon to normalizeProject mein fix).
//
// v2: IMAGES POORI DIKHTI HAIN (crop nahi): foreground object-contain, peeche usi ka blur.
// v3: MAIN IMAGE chhoti: ab hero ke andar (right side) gradient frame mein, bari full-width image nahi.
//     Click par poori image lightbox mein. Gallery uniform grid, hover par zoom icon.
//     Hero mein aurora + sheen, headings par gradient tile + line, objectives/outcomes/sidebar cards ka naya style.
// =====================================================================================

const PAGE_CSS = `
@keyframes pj-rise { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: none; } }
@keyframes pj-float { 0%, 100% { transform: translate3d(0, 0, 0) scale(1); } 50% { transform: translate3d(0, -28px, 0) scale(1.06); } }
@keyframes pj-spin { to { transform: rotate(360deg); } }
@keyframes pj-pop { 0% { opacity: 0; transform: scale(.97); } 100% { opacity: 1; transform: none; } }
@keyframes pj-sheen { 0% { background-position: 0% 50%; } 100% { background-position: 200% 50%; } }
@keyframes pj-bob { 0%, 100% { transform: translate3d(0, 0, 0); } 50% { transform: translate3d(0, -8px, 0); } }
.pj-rise { animation: pj-rise .85s cubic-bezier(.2,.7,.2,1) both; }
.pj-float { animation: pj-float 10s ease-in-out infinite; }
.pj-float-slow { animation: pj-float 14s ease-in-out infinite reverse; }
.pj-spin { animation: pj-spin 90s linear infinite; }
.pj-pop { animation: pj-pop .45s cubic-bezier(.2,.7,.2,1) both; }
.pj-bob { animation: pj-bob 7s ease-in-out infinite; }
.pj-aurora { position: absolute; left: 50%; top: 50%; width: 64rem; height: 64rem; margin: -32rem 0 0 -32rem; border-radius: 9999px;
  opacity: .28; filter: blur(80px); pointer-events: none;
  background: conic-gradient(from 0deg, transparent 0deg, var(--c-primary) 70deg, transparent 140deg, var(--c-accent) 230deg, transparent 300deg);
  animation: pj-spin 46s linear infinite; }
.pj-sheen { position: absolute; left: 0; right: 0; bottom: 0; height: 2px; pointer-events: none;
  background: linear-gradient(90deg, transparent, var(--c-primary), var(--c-accent), transparent);
  background-size: 200% 100%; animation: pj-sheen 6s linear infinite; }
@media (prefers-reduced-motion: reduce) {
  .pj-rise, .pj-float, .pj-float-slow, .pj-spin, .pj-pop, .pj-bob, .pj-aurora, .pj-sheen { animation: none !important; }
}
`

const GRADIENT = 'linear-gradient(135deg, var(--c-primary), var(--c-accent))'
const GRADIENT_DEEP = 'linear-gradient(135deg, var(--c-primary), color-mix(in srgb, var(--c-primary) 65%, var(--c-navy)))'

// ---------- Data helpers ----------

const asText = (v) => (v === undefined || v === null || typeof v === 'object' ? '' : String(v).trim())

function categoryName(p) {
  if (p.category_name) return asText(p.category_name)
  if (p.category && typeof p.category === 'object') return asText(p.category.name ?? p.category.title)
  return typeof p.category === 'number' ? '' : asText(p.category)
}

function statusLabel(value) {
  const text = asText(value).replace(/[_-]+/g, ' ')
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : ''
}

// Array of strings / array of {text|title|description} / newline-separated string -> string[]
function toStringList(value) {
  const items = Array.isArray(value) ? value : typeof value === 'string' ? value.split(/\r?\n/) : []
  return items
    .map((item) => (typeof item === 'object' && item ? asText(item.text ?? item.title ?? item.description) : asText(item)))
    .map((s) => s.replace(/^[-*•]\s*/, ''))
    .filter(Boolean)
}

// Sirf http(s) links: javascript: jaise URL kabhi button/href nahi ban sakte
function safeUrl(value) {
  const url = asText(value)
  return /^https?:\/\//i.test(url) ? url : ''
}

function toGallery(value) {
  return (Array.isArray(value) ? value : [])
    .map((item, i) => ({ id: item?.id ?? i, image: typeof item === 'string' ? item : item?.image ?? item?.url ?? '' }))
    .filter((item) => item.image)
}

function normalizeProject(p) {
  return {
    ...p,
    category: categoryName(p),
    status: statusLabel(p.status),
    year: p.year ?? p.start_year ?? null,
    thumbnail: p.thumbnail ?? p.image ?? p.cover_image ?? null,
    short_description: asText(p.short_description),
    description: typeof p.description === 'string' ? p.description : '',
    methodology: typeof p.methodology === 'string' ? p.methodology : '',
    objectives: toStringList(p.objectives),
    outcomes: toStringList(p.outcomes),
    gallery: toGallery(p.gallery_images ?? p.gallery),
    is_featured: Boolean(p.is_featured ?? p.featured),
    live_url: safeUrl(p.live_url ?? p.website_url ?? p.project_url),
    repo_url: safeUrl(p.repo_url ?? p.github_url ?? p.code_url),
    paper_url: safeUrl(p.paper_url ?? p.publication_url),
  }
}

function statusTone(status) {
  const s = String(status ?? '').toLowerCase()
  if (/ongoing|active|progress|current/.test(s)) return 'ongoing'
  if (/complete|done|finished/.test(s)) return 'completed'
  return 'other'
}

const DOT = { ongoing: 'bg-primary', completed: 'bg-success', other: 'bg-muted' }

// ---------- HTML sanitizer ----------
// Backend description/methodology HTML bhejta hai (rich text editor). Render se pehle allowlist se saaf karte hain:
// script/style/iframe/on*-handlers/javascript: links sab nikal jate hain. Sirf yeh tags aur attributes bachte hain.

const ALLOWED_TAGS = new Set([
  'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'ul', 'ol', 'li', 'h2', 'h3', 'h4',
  'blockquote', 'code', 'pre', 'a', 'span', 'hr', 'sub', 'sup',
])
const DROP_TAGS = new Set(['script', 'style', 'iframe', 'object', 'embed', 'link', 'meta', 'svg', 'math', 'form', 'noscript'])

function sanitizeHtml(html) {
  if (!html || typeof DOMParser === 'undefined') return ''
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html')
  const out = document.createElement('div')

  const walk = (node, target) => {
    node.childNodes.forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        target.appendChild(document.createTextNode(child.textContent))
        return
      }
      if (child.nodeType !== Node.ELEMENT_NODE) return
      const tag = child.tagName.toLowerCase()
      if (DROP_TAGS.has(tag)) return
      if (!ALLOWED_TAGS.has(tag)) {
        walk(child, target) // tag hatao, andar ka text rakho
        return
      }
      const el = document.createElement(tag)
      if (tag === 'a') {
        const raw = (child.getAttribute('href') || '').trim()
        const href = safeUrl(raw) || (/^mailto:/i.test(raw) ? raw : '')
        if (href) {
          el.setAttribute('href', href)
          el.setAttribute('target', '_blank')
          el.setAttribute('rel', 'noopener noreferrer')
        }
      }
      walk(child, el)
      target.appendChild(el)
    })
  }
  walk(doc.body, out)
  return out.innerHTML
}

const RICH_TEXT =
  'text-sm leading-relaxed text-body sm:text-base [&_a]:font-medium [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4 [&_blockquote]:mt-5 [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_blockquote]:text-muted [&_code]:rounded [&_code]:bg-surface [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[0.9em] [&_h2]:mt-6 [&_h2]:text-xl [&_h3]:mt-5 [&_h3]:text-lg [&_h4]:mt-4 [&_h4]:text-base [&_li]:mt-2 [&_ol]:mt-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mt-3 [&_p:first-child]:mt-0 [&_pre]:mt-4 [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:bg-surface [&_pre]:p-4 [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:pl-6 break-words'

function RichText({ html }) {
  const clean = useMemo(() => sanitizeHtml(html), [html])
  if (!clean) return null
  return <div className={RICH_TEXT} dangerouslySetInnerHTML={{ __html: clean }} />
}

// ---------- Small building blocks ----------

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
        shown ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0',
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
    <span className={cn('inline-flex items-center gap-1.5 rounded-full bg-card/95 px-3 py-1 text-xs font-semibold text-heading shadow-sm backdrop-blur', className)}>
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

// Poori image: foreground object-contain, peeche usi ka blur (khali patti dull na lage)
const BLUR_BG_STYLE = { filter: 'blur(18px) saturate(1.2)', transform: 'scale(1.15)', opacity: 0.55 }

const VARIANTS = [
  'from-primary/40 via-primary-soft to-blue-tint',
  'from-primary/25 via-blue-tint to-accent/25',
  'from-navy/35 via-primary/20 to-primary-soft',
]

// Image ho to poori (object-contain + blur backdrop); na ho / fail ho to gradient + bara letter (khali box nahi)
function ProjectVisual({ project, large = false, className, imgClassName }) {
  const [failed, setFailed] = useState(false)
  const variant = (Number(project.id) || 0) % VARIANTS.length
  const initial = (project.title || '?').trim().charAt(0).toUpperCase()

  return (
    <div className={cn('relative overflow-hidden bg-primary-soft', className)}>
      {project.thumbnail && !failed ? (
        <>
          <img
            src={project.thumbnail}
            alt=""
            aria-hidden="true"
            draggable={false}
            className="absolute inset-0 size-full object-cover"
            style={BLUR_BG_STYLE}
          />
          <img
            src={project.thumbnail}
            alt={project.title}
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
          <span className="absolute -top-16 -left-16 size-56 rounded-full border border-primary/25 transition-transform duration-700 group-hover:scale-110" />
          <span className="absolute top-8 left-8 size-24 rounded-full border border-dashed border-primary/25" />
          <span
            className={cn(
              'absolute -right-3 -bottom-[18%] font-serif leading-none font-semibold text-primary/25 transition-transform duration-700 select-none group-hover:-translate-x-3 group-hover:scale-110',
              large ? 'text-[9rem] sm:text-[11rem]' : 'text-[7rem]',
            )}
          >
            {initial}
          </span>
        </div>
      )}
    </div>
  )
}

// Section ka heading: gradient icon tile + title + patli line
function BlockTitle({ icon: Icon, title, id }) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <span
        className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-on-primary shadow-md"
        style={{ background: GRADIENT_DEEP, boxShadow: '0 8px 18px -10px var(--c-primary)' }}
      >
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <h2 id={id} className="text-xl sm:text-2xl">
        {title}
      </h2>
      <span className="ml-1 hidden h-px flex-1 bg-gradient-to-r from-primary/30 to-transparent sm:block" aria-hidden="true" />
    </div>
  )
}

// ---------- Lightbox (gallery + main image) ----------

function Lightbox({ images, index, onClose, onChange }) {
  const closeRef = useRef(null)
  const touchX = useRef(null)
  const count = images.length

  // Body scroll lock + focus (sirf mount par)
  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    return () => {
      document.body.style.overflow = previous
    }
  }, [])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowRight') onChange((index + 1) % count)
      else if (e.key === 'ArrowLeft') onChange((index - 1 + count) % count)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [index, count, onClose, onChange])

  const go = (step) => onChange((index + step + count) % count)
  const btn =
    'inline-flex size-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/25 focus-visible:outline-2 focus-visible:outline-white'

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Project gallery"
      className="pj-pop fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
      onClick={onClose}
      onTouchStart={(e) => {
        touchX.current = e.touches[0].clientX
      }}
      onTouchEnd={(e) => {
        if (touchX.current === null) return
        const diff = e.changedTouches[0].clientX - touchX.current
        touchX.current = null
        if (Math.abs(diff) > 50 && count > 1) go(diff < 0 ? 1 : -1)
      }}
    >
      <button ref={closeRef} type="button" aria-label="Close gallery" className={cn(btn, 'absolute top-4 right-4')} onClick={onClose}>
        <X className="size-5" />
      </button>

      {count > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous image"
            className={cn(btn, 'absolute top-1/2 left-3 -translate-y-1/2 sm:left-6')}
            onClick={(e) => {
              e.stopPropagation()
              go(-1)
            }}
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            aria-label="Next image"
            className={cn(btn, 'absolute top-1/2 right-3 -translate-y-1/2 sm:right-6')}
            onClick={(e) => {
              e.stopPropagation()
              go(1)
            }}
          >
            <ChevronRight className="size-5" />
          </button>
        </>
      )}

      <img
        key={images[index].id}
        src={images[index].image}
        alt={`Image ${index + 1} of ${count}`}
        className="pj-pop max-h-[85vh] max-w-full rounded-lg object-contain"
        onClick={(e) => e.stopPropagation()}
      />
      {count > 1 && (
        <p className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-sm text-white tabular-nums backdrop-blur">
          {index + 1} / {count}
        </p>
      )}
    </div>
  )
}

function Gallery({ images }) {
  const [open, setOpen] = useState(null)
  const close = useCallback(() => setOpen(null), [])

  return (
    <>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        {images.map((img, i) => (
          <li key={img.id}>
            <button
              type="button"
              aria-label={`Open image ${i + 1} of ${images.length}`}
              onClick={() => setOpen(i)}
              className="group relative block aspect-[4/3] w-full overflow-hidden rounded-xl border border-line bg-primary-soft shadow-xs transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg"
            >
              {/* poori image (crop nahi) + peeche usi ka blur */}
              <img
                src={img.image}
                alt=""
                aria-hidden="true"
                loading="lazy"
                draggable={false}
                className="absolute inset-0 size-full object-cover"
                style={BLUR_BG_STYLE}
              />
              <img
                src={img.image}
                alt=""
                loading="lazy"
                draggable={false}
                className="relative size-full object-contain transition-transform duration-700 group-hover:scale-105"
              />
              <span
                className="absolute inset-0 flex items-center justify-center bg-navy/0 transition-colors duration-300 group-hover:bg-navy/30"
                aria-hidden="true"
              >
                <span className="inline-flex size-9 scale-90 items-center justify-center rounded-full bg-white/90 text-navy opacity-0 transition-all duration-300 group-hover:scale-100 group-hover:opacity-100">
                  <Maximize2 className="size-4" />
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      {open !== null && <Lightbox images={images} index={open} onClose={close} onChange={setOpen} />}
    </>
  )
}

// ---------- 1. Hero ----------

// Main image: chhoti, gradient frame mein, hero ke right side. Click par poori image lightbox mein.
function HeroImage({ project }) {
  const [zoom, setZoom] = useState(false)
  const close = useCallback(() => setZoom(false), [])
  const canZoom = Boolean(project.thumbnail)

  const visual = (
    <span className="relative block rounded-2xl p-1.5 shadow-2xl" style={{ background: GRADIENT }}>
      <span className="group block overflow-hidden rounded-[0.875rem] bg-card">
        <ProjectVisual
          large
          project={project}
          className="aspect-[4/3] max-h-[16rem] w-full sm:max-h-[19rem]"
          imgClassName="transition-transform duration-700 group-hover:scale-[1.03]"
        />
      </span>
      {canZoom && (
        <span className="absolute right-4 bottom-4 inline-flex items-center gap-1.5 rounded-full bg-navy/80 px-3 py-1.5 text-xs font-semibold text-on-navy shadow-md backdrop-blur">
          <Maximize2 className="size-3.5" aria-hidden="true" />
          View full image
        </span>
      )}
    </span>
  )

  return (
    <div className="pj-rise relative mx-auto w-full max-w-md lg:max-w-none" style={{ animationDelay: '260ms' }}>
      <div className="pj-float-slow pointer-events-none absolute -top-8 -right-8 -z-10 size-40 rounded-full bg-accent/25 blur-3xl" aria-hidden="true" />
      <div className="pj-bob">
        {canZoom ? (
          <button type="button" onClick={() => setZoom(true)} aria-label="View full image" className="block w-full text-left">
            {visual}
          </button>
        ) : (
          visual
        )}
      </div>
      {zoom && (
        <Lightbox images={[{ id: 'cover', image: project.thumbnail }]} index={0} onClose={close} onChange={() => {}} />
      )}
    </div>
  )
}

function Hero({ project, slug }) {
  const links = [
    project.live_url && { href: project.live_url, label: 'Visit live project', icon: ExternalLink, primary: true },
    project.repo_url && { href: project.repo_url, label: 'View code', icon: Code },
    project.paper_url && { href: project.paper_url, label: 'Read paper', icon: FileText },
  ].filter(Boolean)

  return (
    <header className="relative isolate overflow-hidden bg-navy text-on-navy">
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
        <div className="pj-aurora" />
        <div className="pj-float absolute -top-40 -left-32 size-[30rem] rounded-full bg-primary/30 blur-[90px]" />
        <div className="pj-float-slow absolute top-1/3 -right-40 size-[26rem] rounded-full bg-primary/20 blur-[90px]" />
        <div
          className="absolute inset-0 text-on-navy opacity-[0.06]"
          style={{ backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)', backgroundSize: '26px 26px' }}
        />
        <div className="absolute top-1/2 -right-32 hidden w-[20rem] -translate-y-1/2 md:block">
          <svg viewBox="0 0 400 400" fill="none" stroke="currentColor" className="pj-spin text-on-navy/15">
            <circle cx="200" cy="200" r="190" strokeWidth="1" />
            <circle cx="200" cy="200" r="140" strokeWidth="1" strokeDasharray="4 8" />
            <circle cx="200" cy="200" r="90" strokeWidth="1" />
            <circle cx="200" cy="10" r="6" fill="currentColor" className="text-accent" />
          </svg>
        </div>
      </div>

      <Container className="pt-8 pb-14 sm:pt-10 sm:pb-16 lg:pb-20">
        <Link
          to={paths.siteProjects(slug)}
          className="pj-rise group inline-flex items-center gap-2 rounded-full border border-on-navy/20 px-3.5 py-1.5 text-sm font-medium text-on-navy transition-colors hover:border-accent hover:text-accent"
        >
          <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" aria-hidden="true" />
          All projects
        </Link>

        <div className="mt-6 grid items-center gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:gap-12">
          <div className="min-w-0">
            <div className="pj-rise flex flex-wrap items-center gap-2" style={{ animationDelay: '100ms' }}>
              {project.category && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-[11px] font-semibold tracking-widest text-accent uppercase">
                  <Tag className="size-3.5" aria-hidden="true" />
                  {project.category}
                </span>
              )}
              {project.is_featured && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-xs font-semibold tracking-wider text-navy uppercase">
                  <Star className="size-3.5" aria-hidden="true" />
                  Featured
                </span>
              )}
            </div>

            <h1
              className="pj-rise mt-4 text-3xl leading-tight text-on-navy sm:text-4xl xl:text-5xl"
              style={{ animationDelay: '180ms' }}
            >
              {project.title}
            </h1>
            <span className="pj-rise mt-4 block h-1 w-14 rounded-full bg-accent" style={{ animationDelay: '260ms' }} aria-hidden="true" />

            {project.short_description && (
              <p className="pj-rise mt-4 max-w-2xl text-sm leading-relaxed text-on-navy/80 sm:text-base" style={{ animationDelay: '340ms' }}>
                {project.short_description}
              </p>
            )}

            <div className="pj-rise mt-6 flex flex-wrap items-center gap-3" style={{ animationDelay: '420ms' }}>
              <StatusPill status={project.status} />
              {project.year && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-on-navy/20 px-3 py-1 text-xs font-medium text-on-navy/90">
                  <Calendar className="size-3.5" aria-hidden="true" />
                  {project.year}
                </span>
              )}
            </div>

            {links.length > 0 && (
              <div className="pj-rise mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap" style={{ animationDelay: '500ms' }}>
                {links.map(({ href, label, icon: Icon, primary }) =>
                  primary ? (
                    <Button key={label} as="a" href={href} target="_blank" rel="noopener noreferrer" className="group">
                      <Icon className="size-4" aria-hidden="true" />
                      {label}
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                    </Button>
                  ) : (
                    <a
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-on-navy/30 px-5 text-sm font-medium text-on-navy transition-colors hover:border-accent hover:text-accent"
                    >
                      <Icon className="size-4" aria-hidden="true" />
                      {label}
                    </a>
                  ),
                )}
              </div>
            )}
          </div>

          <HeroImage project={project} />
        </div>
      </Container>
      <span className="pj-sheen" aria-hidden="true" />
    </header>
  )
}

// ---------- 2. Article ----------

function Article({ project }) {
  const hasDescription = Boolean(sanitizeHtml(project.description))
  const hasMethodology = Boolean(sanitizeHtml(project.methodology))

  return (
    <div className="flex flex-col gap-10 sm:gap-12">
      {hasDescription && (
        <Reveal>
          <section aria-labelledby="overview-heading">
            <BlockTitle icon={Lightbulb} title="Overview" id="overview-heading" />
            <RichText html={project.description} />
          </section>
        </Reveal>
      )}

      {project.objectives.length > 0 && (
        <section aria-labelledby="objectives-heading">
          <Reveal>
            <BlockTitle icon={Star} title="Objectives" id="objectives-heading" />
          </Reveal>
          <ol className="grid gap-3">
            {project.objectives.map((text, i) => (
              <li key={`${i}-${text}`}>
                <Reveal delay={Math.min(i, 4) * 80}>
                  <div className="relative flex gap-3 overflow-hidden rounded-xl border border-line bg-card p-4 pl-5 shadow-xs transition-all duration-300 before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-gradient-to-b before:from-primary before:to-accent before:content-[''] hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md">
                    <span
                      className="inline-flex size-8 shrink-0 items-center justify-center rounded-full font-serif text-sm font-semibold text-on-primary"
                      style={{ background: GRADIENT_DEEP, boxShadow: '0 8px 16px -8px var(--c-primary)' }}
                    >
                      {i + 1}
                    </span>
                    <p className="pt-1 text-sm leading-relaxed text-body sm:text-base">{text}</p>
                  </div>
                </Reveal>
              </li>
            ))}
          </ol>
        </section>
      )}

      {hasMethodology && (
        <Reveal>
          <section aria-labelledby="method-heading">
            <BlockTitle icon={FlaskConical} title="Methodology" id="method-heading" />
            <RichText html={project.methodology} />
          </section>
        </Reveal>
      )}

      {project.outcomes.length > 0 && (
        <section aria-labelledby="outcomes-heading">
          <Reveal>
            <BlockTitle icon={Award} title="Outcomes" id="outcomes-heading" />
          </Reveal>
          <ul className="grid gap-3 sm:grid-cols-2">
            {project.outcomes.map((text, i) => (
              <li key={`${i}-${text}`}>
                <Reveal delay={Math.min(i, 4) * 80} className="h-full">
                  <div className="flex h-full gap-3 rounded-xl border border-primary/10 bg-blue-tint p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md">
                    <span className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
                      <Check className="size-4" aria-hidden="true" />
                    </span>
                    <p className="text-sm leading-relaxed text-body sm:text-base">{text}</p>
                  </div>
                </Reveal>
              </li>
            ))}
          </ul>
        </section>
      )}

      {project.gallery.length > 0 && (
        <section aria-labelledby="gallery-heading">
          <Reveal>
            <BlockTitle icon={Star} title="Gallery" id="gallery-heading" />
            <Gallery images={project.gallery} />
          </Reveal>
        </section>
      )}
    </div>
  )
}

function Sidebar({ project, slug }) {
  const rows = [
    project.status && { label: 'Status', value: <StatusPill status={project.status} className="border border-line bg-surface shadow-none" /> },
    project.year && { label: 'Year', value: <span className="font-medium text-heading">{project.year}</span> },
    project.category && { label: 'Focus area', value: <span className="font-medium text-heading">{project.category}</span> },
  ].filter(Boolean)

  return (
    <aside className="flex flex-col gap-5 lg:sticky lg:top-24" aria-label="Project information">
      {rows.length > 0 && (
        <div className="relative overflow-hidden rounded-2xl border border-line bg-card p-5 shadow-sm">
          <span className="absolute inset-x-0 top-0 h-1" style={{ background: GRADIENT }} aria-hidden="true" />
          <h2 className="text-base">Project info</h2>
          <dl className="mt-3 divide-y divide-line">
            {rows.map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between gap-4 py-2.5 text-sm first:pt-0 last:pb-0">
                <dt className="text-xs font-semibold tracking-widest text-muted uppercase">{label}</dt>
                <dd className="text-right">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      <div className="relative isolate overflow-hidden rounded-2xl bg-navy p-5 text-on-navy shadow-lg">
        <div className="pj-float pointer-events-none absolute -top-16 -right-12 -z-10 size-48 rounded-full bg-primary/40 blur-3xl" aria-hidden="true" />
        <div className="pj-float-slow pointer-events-none absolute -bottom-20 -left-12 -z-10 size-44 rounded-full bg-accent/25 blur-3xl" aria-hidden="true" />
        <div
          className="pointer-events-none absolute inset-0 -z-10 text-on-navy opacity-[0.08]"
          style={{ backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)', backgroundSize: '20px 20px' }}
          aria-hidden="true"
        />
        <h2 className="text-lg text-on-navy">Interested in this work?</h2>
        <p className="mt-2 text-sm leading-relaxed text-on-navy/80">
          Questions, collaboration ideas or want to know more? Let&apos;s talk.
        </p>
        <Button as={Link} to={paths.siteContact(slug)} className="group mt-4 w-full">
          <Mail className="size-4" aria-hidden="true" />
          Get in touch
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
        </Button>
      </div>
    </aside>
  )
}

// ---------- 3. More projects ----------

function MoreProjects({ currentId, category, slug }) {
  const query = useProjects(slug)
  const items = useMemo(() => {
    const others = (query.data ?? []).filter((p) => String(p.id) !== String(currentId)).map(normalizeProject)
    // Same category pehle
    return [...others.filter((p) => p.category === category), ...others.filter((p) => p.category !== category)].slice(0, 3)
  }, [query.data, currentId, category])

  if (items.length === 0) return null

  return (
    <Section tone="surface">
      <Reveal>
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-2 text-sm font-semibold tracking-widest text-primary uppercase">
              <span className="h-px w-8" style={{ background: GRADIENT }} aria-hidden="true" />
              Keep exploring
            </p>
            <h2 className="mt-1 text-2xl sm:text-3xl">More projects</h2>
          </div>
          <Link to={paths.siteProjects(slug)} className="group inline-flex items-center gap-2 font-medium text-primary">
            View all
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </Link>
        </div>
      </Reveal>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((p, i) => (
          <Reveal key={p.id} delay={i * 90} className="h-full">
            <Link
              to={paths.siteProject(slug, p.id)}
              className="group flex h-full flex-col overflow-hidden rounded-xl border border-line bg-card shadow-xs transition-all duration-500 hover:-translate-y-1 hover:border-primary/50 hover:shadow-lg"
            >
              <div className="relative">
                <ProjectVisual project={p} className="aspect-[16/10]" imgClassName="transition-transform duration-700 group-hover:scale-105" />
                <StatusPill status={p.status} className="absolute top-3 left-3" />
                {p.year && (
                  <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-card/95 px-2.5 py-1 text-xs font-medium text-muted shadow-sm backdrop-blur">
                    <Calendar className="size-3" aria-hidden="true" />
                    {p.year}
                  </span>
                )}
              </div>
              <div className="flex flex-1 flex-col p-4">
                {p.category && <p className="text-xs font-semibold tracking-widest text-primary uppercase">{p.category}</p>}
                <h3 className="mt-2 text-base leading-snug transition-colors group-hover:text-primary">{p.title}</h3>
                <span className="mt-auto inline-flex items-center gap-1.5 pt-4 text-sm font-medium text-primary">
                  View project
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </span>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </Section>
  )
}

// ---------- Loading ----------

function DetailSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading project">
      <div className="bg-navy">
        <Container className="pt-8 pb-14 sm:pt-10 sm:pb-16 lg:pb-20">
          <Skeleton className="h-10 w-36 rounded-full bg-on-navy/10" />
          <div className="mt-6 grid items-center gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:gap-12">
            <div>
              <Skeleton className="h-6 w-32 rounded-full bg-on-navy/10" />
              <Skeleton className="mt-4 h-10 max-w-xl rounded-xl bg-on-navy/10" />
              <Skeleton className="mt-6 h-5 max-w-xl rounded bg-on-navy/10" />
            </div>
            <Skeleton className="h-56 rounded-2xl bg-on-navy/10" />
          </div>
        </Container>
      </div>
      <Container className="pt-10 pb-12 sm:pt-12">
        <div className="grid gap-10 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-4/5" />
          </div>
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </Container>
    </div>
  )
}

// ---------- Page ----------

export function ProjectDetailPage() {
  const { id } = useParams()
  const { slug, portfolio } = usePublicSite()
  const query = useProject(slug, id)
  const project = useMemo(() => (query.data ? normalizeProject(query.data) : null), [query.data])

  // Browser tab: "Project | Researcher"
  const title = project?.title
  const fullName = portfolio.full_name
  useEffect(() => {
    if (!title) return undefined
    const previous = document.title
    document.title = fullName ? `${title} | ${fullName}` : title
    return () => {
      document.title = previous
    }
  }, [title, fullName])

  if (query.isPending) {
    return (
      <>
        <style>{PAGE_CSS}</style>
        <DetailSkeleton />
      </>
    )
  }

  if (query.isError) {
    if (query.error?.status === 404) {
      return (
        <PublicNotFound
          homeTo={paths.siteProjects(slug)}
          title="Project not found"
          message="This project does not exist or is no longer available."
        />
      )
    }
    return (
      <Container className="py-20">
        <ErrorState message={query.error?.message} onRetry={query.refetch} />
      </Container>
    )
  }

  return (
    <>
      <style>{PAGE_CSS}</style>
      <Hero project={project} slug={slug} />

      <div className="bg-background pb-12 sm:pb-16">
        <Container className="pt-10 sm:pt-12">
          <div className="grid gap-10 lg:grid-cols-3 lg:gap-12">
            <div className="min-w-0 lg:col-span-2">
              <Article project={project} />
            </div>
            <div className="lg:col-span-1">
              <Sidebar project={project} slug={slug} />
            </div>
          </div>
        </Container>
      </div>

      <MoreProjects currentId={project.id} category={project.category} slug={slug} />
    </>
  )
}