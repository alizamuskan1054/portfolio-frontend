import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  CalendarDays,
  Clock,
  Download,
  FileText,
  LayoutGrid,
  List,
  Mail,
  Search,
  Share2,
  Tag,
  Timer,
} from 'lucide-react'
import { ErrorState } from '@/components/shared/ErrorState'
import { EmptyState } from '@/components/shared/EmptyState'
import { SearchInput } from '@/components/shared/SearchInput'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatDate } from '@/lib/format'
import { notify } from '@/lib/notify'
import { cn } from '@/lib/utils'
import { paths } from '@/routes/paths'
import { Container } from '@/public/components/Container'
import { PageHero } from '@/public/components/PageHero'
import { useBlogs } from '@/public/hooks/usePublicData'
import { usePublicSite } from '@/public/hooks/usePublicSite'

// =====================================================================================
// BLOGS PAGE (v4): poora code isi file mein. Route: /:slug/blogs
// API (sirf yehi): useBlogs(slug) -> GET /api/public/{slug}/blogs/
//                  usePublicSite() -> GET /api/public/{slug}/  (portfolio, page_intros)
//
// v4 changes (baqi sab kuch v3 jaisa, data wahi dynamic backend se):
//   - Hero: aurora glow, moving grid, floating particles, shimmer title, aur right side par
//     latest 3 articles ke glass cards (real title/category/date, sirf xl+ screens par).
//   - Stats ribbon: cards ab beech (center) mein, bina icon ke, bara gradient number + label.
//     Cards ki tadaad kuch bhi ho (2, 3, 4) hamesha center rehte hain, mobile par 2 columns.
//   - Author section: mobile par stack + center, tablet par wrap, desktop par buttons ek column mein.
//
// Gradient colors ek hi jagah set hain: .bp-root { --bp-a, --bp-b }.
// Animations "prefers-reduced-motion" ko respect karti hain.
// =====================================================================================

const PER_PAGE = 6

const SORTS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'quick', label: 'Quickest read' },
]

// Hero ke floating particles: [left, top, delay(s), duration(s)]
const PARTICLES = [
  ['8%', '24%', 0, 9],
  ['24%', '72%', 1.4, 11],
  ['44%', '16%', 2.6, 8],
  ['60%', '70%', 0.8, 10],
  ['76%', '12%', 3.2, 12],
  ['92%', '60%', 2, 9],
]

const PAGE_CSS = `
.bp-root{--bp-a:var(--c-primary,#2563eb);--bp-b:var(--c-accent,#f59e0b)}

/* ---------- keyframes ---------- */
@keyframes bp-float-a{0%,100%{transform:translate3d(0,0,0) scale(1)}50%{transform:translate3d(40px,24px,0) scale(1.12)}}
@keyframes bp-float-b{0%,100%{transform:translate3d(0,0,0) scale(1)}50%{transform:translate3d(-48px,-18px,0) scale(1.08)}}
@keyframes bp-gradient{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
@keyframes bp-rise{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
@keyframes bp-spin{to{transform:rotate(360deg)}}
@keyframes bp-text{from{background-position:120% 0}to{background-position:-120% 0}}
@keyframes bp-grid{to{background-position:44px 44px,44px 44px}}
@keyframes bp-particle{0%,100%{transform:translate3d(0,0,0);opacity:.2}50%{transform:translate3d(10px,-22px,0);opacity:.9}}
@keyframes bp-sheen{0%{background-position:0% 50%}100%{background-position:200% 50%}}
@keyframes bp-doc{0%,100%{transform:translate3d(0,0,0) rotate(var(--r,0deg))}50%{transform:translate3d(0,-12px,0) rotate(calc(var(--r,0deg) + 1deg))}}

/* ---------- hero decoration ---------- */
.bp-hero{position:relative;overflow:hidden}
.bp-glow{position:absolute;pointer-events:none;border-radius:9999px;filter:blur(70px);opacity:.38;z-index:1}
.bp-glow-a{width:22rem;height:22rem;top:-8rem;right:-4rem;background:var(--bp-a);animation:bp-float-a 14s ease-in-out infinite}
.bp-glow-b{width:18rem;height:18rem;bottom:-9rem;left:-3rem;background:var(--bp-b);opacity:.28;animation:bp-float-b 18s ease-in-out infinite}
.bp-dots{position:absolute;inset:0;pointer-events:none;z-index:1;opacity:.5;
  background-image:radial-gradient(rgba(255,255,255,.14) 1px,transparent 1px);background-size:22px 22px;
  -webkit-mask-image:linear-gradient(180deg,#000,transparent 85%);mask-image:linear-gradient(180deg,#000,transparent 85%)}
.bp-chips{display:flex;flex-wrap:wrap;gap:.5rem;list-style:none;margin:0;padding:0}

/* slowly rotating aurora */
.bp-aurora{position:absolute;z-index:0;left:50%;top:50%;width:70rem;height:70rem;margin:-35rem 0 0 -35rem;pointer-events:none;
  border-radius:9999px;opacity:.3;filter:blur(80px);
  background:conic-gradient(from 0deg,transparent 0deg,var(--bp-a) 70deg,transparent 140deg,var(--bp-b) 230deg,transparent 300deg);
  animation:bp-spin 46s linear infinite}
/* moving grid */
.bp-grid-bg{position:absolute;inset:0;z-index:1;pointer-events:none;opacity:.5;
  background-image:linear-gradient(rgba(255,255,255,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.06) 1px,transparent 1px);
  background-size:44px 44px;
  -webkit-mask-image:radial-gradient(ellipse at 78% 50%,#000 10%,transparent 70%);mask-image:radial-gradient(ellipse at 78% 50%,#000 10%,transparent 70%);
  animation:bp-grid 14s linear infinite}
.bp-particle{position:absolute;z-index:1;width:4px;height:4px;border-radius:9999px;pointer-events:none;background:#fff;
  animation:bp-particle var(--dur,8s) ease-in-out infinite;animation-delay:var(--delay,0s)}
.bp-sheen{position:absolute;left:0;right:0;bottom:0;height:2px;z-index:2;pointer-events:none;
  background:linear-gradient(90deg,transparent,var(--bp-a),var(--bp-b),transparent);background-size:200% 100%;animation:bp-sheen 6s linear infinite}

/* hero title shimmer */
.bp-hero :is(h1,h2){color:transparent;
  background-image:linear-gradient(100deg,var(--c-on-navy,#fff) 0%,var(--c-on-navy,#fff) 42%,var(--bp-b) 50%,var(--c-on-navy,#fff) 58%,var(--c-on-navy,#fff) 100%);
  background-size:250% 100%;background-position:120% 0;-webkit-background-clip:text;background-clip:text;animation:bp-text 7s ease-in-out infinite}

/* latest articles: floating glass cards (xl+) */
.bp-stack{position:absolute;z-index:1;right:3rem;top:50%;width:19rem;height:15rem;margin-top:-9rem;pointer-events:none}
.bp-doc{position:absolute;left:calc(var(--i) * 2.25rem);top:calc(var(--i) * 4.5rem);width:15.5rem;padding:.8rem .95rem;overflow:hidden;
  border-radius:.875rem;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.09);
  -webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);box-shadow:0 18px 40px -22px rgba(0,0,0,.6);
  color:var(--c-on-navy,#fff);animation:bp-doc 7s ease-in-out infinite;animation-delay:calc(var(--i) * -2.3s)}
.bp-doc::before{content:"";position:absolute;left:0;top:0;width:100%;height:2px;background:linear-gradient(90deg,var(--bp-a),var(--bp-b))}
.bp-doc-cat{display:inline-block;font-size:.625rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--bp-b)}
.bp-doc-title{margin:.3rem 0 0;font-family:var(--f-heading,inherit);font-weight:600;font-size:.875rem;line-height:1.35;
  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.bp-doc-meta{margin:.4rem 0 0;font-size:.6875rem;opacity:.7}

/* ---------- stats ribbon (cards hamesha beech mein) ---------- */
.bp-stats{position:relative;z-index:2;display:flex;flex-wrap:wrap;justify-content:center;gap:.75rem;margin-top:-2.25rem}
/* size wahi purane 4-column grid wala: har card ek column ke barabar, bas ab beech mein */
.bp-stat{position:relative;overflow:hidden;flex:0 0 calc(50% - .375rem);padding:1rem 1.125rem;animation:bp-rise .6s cubic-bezier(.2,.7,.2,1) both;animation-delay:var(--d,0ms)}
.bp-stat::before{content:"";position:absolute;left:0;top:0;height:3px;width:100%;background:linear-gradient(90deg,var(--bp-a),var(--bp-b))}
@media (min-width:768px){.bp-stat{flex:0 0 calc(25% - .5625rem)}}
.bp-stat-ico{display:inline-flex;align-items:center;justify-content:center;width:2.25rem;height:2.25rem;border-radius:.625rem;color:#fff;
  background:linear-gradient(135deg,var(--bp-a),var(--bp-b));flex-shrink:0}

/* ---------- toolbar ---------- */
.bp-bar{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:.75rem 1rem;padding:1.5rem 0 1.25rem}
.bp-pills{display:flex;flex-wrap:wrap;gap:.5rem}
.bp-tools{display:flex;flex-wrap:wrap;align-items:center;gap:.5rem;width:100%}
.bp-search{flex:1 1 12rem;min-width:0}
.bp-search input{height:2.25rem;font-size:.8125rem}
.bp-select{height:2.25rem;padding:0 .75rem;border-radius:.5rem;font-size:.8125rem;cursor:pointer;
  border:1px solid var(--c-line);background:transparent;color:inherit}
.bp-select:focus-visible,.bp-seg button:focus-visible{outline:2px solid var(--bp-a);outline-offset:2px}
.bp-seg{display:inline-flex;border:1px solid var(--c-line);border-radius:.5rem;overflow:hidden}
.bp-seg button{display:inline-flex;align-items:center;justify-content:center;width:2.25rem;height:2.25rem;background:transparent;color:inherit;border:0;cursor:pointer;transition:background .2s,color .2s}
.bp-seg button[aria-pressed="true"]{background:linear-gradient(135deg,var(--bp-a),var(--bp-b));color:#fff}
@media (min-width:768px){.bp-tools{width:auto}.bp-search{flex:0 0 15rem}}

.bp-body{padding:.5rem 0 4rem}
.bp-divider{height:1px;border:0;margin:0;background:linear-gradient(90deg,transparent,var(--c-line),transparent)}

/* ---------- pills ---------- */
.bp-pill{transition:transform .2s,box-shadow .2s,background-color .2s,color .2s,border-color .2s}
.bp-pill:hover{transform:translateY(-1px)}
.bp-pill[aria-pressed="true"]{background-image:linear-gradient(135deg,var(--bp-a),var(--bp-b));border-color:transparent;color:#fff;
  box-shadow:0 6px 16px -8px var(--bp-a)}

/* ---------- featured ---------- */
.bp-fwrap{padding:1.5px;border-radius:1.125rem;background:linear-gradient(120deg,var(--bp-a),var(--bp-b),var(--bp-a));
  background-size:220% 220%;animation:bp-gradient 7s ease infinite}
.bp-feature{display:grid;overflow:hidden;height:100%}
.bp-feature-img{display:block;position:relative;height:100%;overflow:hidden}
.bp-cover{aspect-ratio:auto!important;height:100%;min-height:14rem}
.bp-zoom{overflow:hidden}
/* poori image (crop nahi): foreground contain, peeche usi ka blur */
.bp-img{position:relative;aspect-ratio:16/10;overflow:hidden;background:color-mix(in srgb,var(--c-line) 45%,transparent)}
.bp-img-bg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;filter:blur(18px) saturate(1.2);transform:scale(1.15);opacity:.55}
.bp-img-fg{position:relative;display:block;width:100%;height:100%;object-fit:contain;transition:transform .7s cubic-bezier(.2,.7,.2,1)}
.bp-img-empty{display:flex;align-items:center;justify-content:center;color:var(--bp-a);
  background:linear-gradient(135deg,color-mix(in srgb,var(--bp-a) 14%,transparent),color-mix(in srgb,var(--bp-b) 14%,transparent))}
.bp-zoom:hover .bp-img-fg,.bp-card:hover .bp-zoom .bp-img-fg,.bp-fwrap:hover .bp-zoom .bp-img-fg{transform:scale(1.04)}
@media (min-width:1024px){.bp-feature{grid-template-columns:1.05fr 1fr}.bp-cover{min-height:21rem}}

/* ---------- topics ---------- */
.bp-topics{display:grid;gap:.875rem;grid-template-columns:1fr}
.bp-topic{position:relative;overflow:hidden;display:flex;flex-direction:column;gap:.75rem;text-align:left;padding:1.125rem;cursor:pointer;width:100%;
  transition:transform .3s,border-color .3s,box-shadow .3s;color:inherit}
.bp-topic:hover{transform:translateY(-3px);box-shadow:0 14px 28px -16px var(--bp-a)}
.bp-topic:focus-visible{outline:2px solid var(--bp-a);outline-offset:2px}
.bp-meter{height:.3125rem;border-radius:9999px;background:var(--c-line);overflow:hidden}
.bp-meter>i{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,var(--bp-a),var(--bp-b));transition:width .8s cubic-bezier(.2,.7,.2,1)}
@media (min-width:640px){.bp-topics{grid-template-columns:1fr 1fr}}
@media (min-width:1024px){.bp-topics{grid-template-columns:repeat(3,1fr)}}

/* ---------- articles ---------- */
.bp-grid{display:grid;gap:1.25rem;grid-template-columns:1fr}
.bp-list{display:grid;gap:1rem;grid-template-columns:1fr}
@media (min-width:640px){.bp-grid{grid-template-columns:1fr 1fr}}
@media (min-width:1024px){.bp-grid{grid-template-columns:repeat(3,1fr)}}

.bp-item{animation:bp-rise .55s cubic-bezier(.2,.7,.2,1) both;animation-delay:var(--d,0ms);height:100%}
.bp-card{position:relative;transition:transform .3s,box-shadow .3s,border-color .3s}
.bp-card::after{content:"";position:absolute;left:0;bottom:0;height:3px;width:100%;transform:scaleX(0);transform-origin:left;
  background:linear-gradient(90deg,var(--bp-a),var(--bp-b));transition:transform .45s cubic-bezier(.2,.7,.2,1)}
.bp-card:hover{transform:translateY(-4px);box-shadow:0 16px 32px -18px var(--bp-a)}
.bp-card:hover::after{transform:scaleX(1)}
.bp-card:focus-visible{outline:2px solid var(--bp-a);outline-offset:2px}
@media (min-width:640px){
  .bp-row{flex-direction:row!important}
  .bp-row .bp-thumb{width:15rem;flex-shrink:0}
  .bp-row .bp-cover{min-height:100%}
}
.bp-row .bp-cover{min-height:10rem}

/* ---------- author + cta (responsive) ---------- */
.bp-author{position:relative;overflow:hidden;display:grid;gap:1.25rem;padding:1.25rem}
.bp-author::before{content:"";position:absolute;inset:0;pointer-events:none;opacity:.07;
  background:linear-gradient(120deg,var(--bp-a),var(--bp-b))}
.bp-author>*{position:relative}
.bp-avatar{display:inline-flex;overflow:hidden;flex-shrink:0;align-items:center;justify-content:center;width:4rem;height:4rem;border-radius:9999px;color:#fff;font-weight:700;font-size:1.25rem;
  background:linear-gradient(135deg,var(--bp-a),var(--bp-b));box-shadow:0 10px 24px -10px var(--bp-a)}
.bp-author-main{display:flex;flex-wrap:wrap;align-items:center;gap:1rem}
.bp-author-text{min-width:0;flex:1 1 14rem}
.bp-socials{display:flex;flex-wrap:wrap;gap:.5rem;margin-top:.75rem}
.bp-author-actions{display:flex;flex-wrap:wrap;gap:.625rem}
.bp-author-actions>*{flex:1 1 auto;justify-content:center}
@media (max-width:479px){
  .bp-author-main{flex-direction:column;text-align:center}
  .bp-author-text{flex:0 1 auto;width:100%}
  .bp-socials{justify-content:center}
  .bp-author-actions>*{flex:1 1 100%}
}
@media (min-width:768px){
  .bp-author{grid-template-columns:1fr auto;align-items:center;padding:2rem;gap:1.75rem}
  .bp-author-actions{flex-direction:column;align-items:stretch;min-width:12.5rem}
}

/* ---------- reduced motion ---------- */
@media (prefers-reduced-motion:reduce){
  .bp-glow,.bp-fwrap,.bp-aurora,.bp-grid-bg,.bp-particle,.bp-sheen,.bp-doc,.bp-hero :is(h1,h2){animation:none!important}
  .bp-hero :is(h1,h2){background-position:0 0!important}
  .bp-item,.bp-stat{animation:none!important;opacity:1!important;transform:none!important}
  .bp-card,.bp-topic,.bp-img-fg,.bp-pill,.bp-stat{transition:none!important}
  .bp-card:hover,.bp-topic:hover{transform:none}
  .bp-stat:hover{translate:none}
}
`

const clamp = (lines) => ({
  display: '-webkit-box',
  WebkitLineClamp: lines,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
})

// ---------- Data helpers ----------

const asText = (value) =>
  value && typeof value === 'object' ? (value.name ?? value.title ?? value.full_name ?? '') : (value ?? '')

// Backend ke field names badlein to sirf yahan fix hoga
function normalizeBlog(blog) {
  return {
    id: blog.id,
    slug: blog.slug ?? String(blog.id),
    title: blog.title ?? '',
    excerpt: blog.excerpt ?? blog.summary ?? blog.short_description ?? '',
    category: asText(blog.category),
    cover_image: blog.cover_image ?? blog.thumbnail ?? blog.image ?? null,
    author: asText(blog.author),
    published_at: blog.published_at ?? blog.created_at ?? null,
    reading_time: blog.reading_time ?? null,
    is_featured: Boolean(blog.is_featured),
  }
}

const byNewest = (a, b) => new Date(b.published_at ?? 0) - new Date(a.published_at ?? 0)
const byOldest = (a, b) => new Date(a.published_at ?? 0) - new Date(b.published_at ?? 0)
const byQuick = (a, b) => (a.reading_time ?? Infinity) - (b.reading_time ?? Infinity)
const SORTERS = { newest: byNewest, oldest: byOldest, quick: byQuick }

function initialsOf(name = '') {
  const parts = name.replace(/^(dr|prof)\.?\s+/i, '').trim().split(/\s+/).filter(Boolean)
  return parts.length ? (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase() : '?'
}

// Share: phone par native share sheet, warna link copy
async function shareLink(url, title) {
  try {
    if (navigator.share) {
      await navigator.share({ title, url })
      return
    }
    await navigator.clipboard.writeText(url)
    notify.success('Link copied to clipboard')
  } catch (error) {
    if (error?.name !== 'AbortError') notify.error('Could not share. Please copy the link manually.')
  }
}

// Number 0 se target tak ginta hai (reduced-motion par seedha target)
function useCountUp(target, duration = 900) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduce || !target) {
      setValue(target)
      return undefined
    }
    let frame
    const start = performance.now()
    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1)
      setValue(Math.round(target * (1 - Math.pow(1 - t, 3))))
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, duration])
  return value
}

// page_intros array ho ya { blogs: {...} } map, dono chalte hain
function getPageIntro(pageIntros, ...pages) {
  for (const page of pages) {
    const found = Array.isArray(pageIntros) ? pageIntros.find((p) => p?.page === page) : pageIntros?.[page]
    if (found) return found
  }
  return null
}

// Backend "intro" bhejta hai; kuch jagah "subtitle"/"description" naam se bhi aa sakta hai
const introText = (item) => String(item?.subtitle || item?.intro || item?.description || '').trim()

const lastNameOf = (name = '') =>
  String(name).replace(/^(dr|prof)\.?\s+/i, '').trim().split(/\s+/).pop()?.toLowerCase() ?? ''

// Cover image poori (object-contain) + peeche usi ka blur. Na ho ya fail ho to gradient placeholder.
function CardImage({ src, alt = '', className }) {
  const [failed, setFailed] = useState(false)

  if (!src || failed) {
    return (
      <div className={cn('bp-img bp-img-empty', className)} aria-hidden="true">
        <FileText width={34} height={34} />
      </div>
    )
  }

  return (
    <div className={cn('bp-img', className)}>
      <img className="bp-img-bg" src={src} alt="" aria-hidden="true" loading="lazy" draggable={false} />
      <img className="bp-img-fg" src={src} alt={alt} loading="lazy" draggable={false} onError={() => setFailed(true)} />
    </div>
  )
}

// Backend wali photo/logo; na ho to initials
function Avatar({ src, name, size = '4rem', fontSize = '1.25rem' }) {
  const [failed, setFailed] = useState(false)
  return (
    <span className="bp-avatar" style={{ width: size, height: size, fontSize }} aria-hidden="true">
      {src && !failed ? (
        <img
          src={src}
          alt=""
          draggable={false}
          onError={() => setFailed(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 20%' }}
        />
      ) : (
        initialsOf(name)
      )}
    </span>
  )
}

// ---------- Small pieces ----------

function Meta({ blog }) {
  return (
    <p className="text-muted" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.25rem 0.75rem', fontSize: '0.75rem' }}>
      {blog.published_at && <time dateTime={blog.published_at}>{formatDate(blog.published_at)}</time>}
      {blog.reading_time && (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
          <Clock width={12} height={12} aria-hidden="true" />
          {blog.reading_time} min read
        </span>
      )}
    </p>
  )
}

function Pill({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'bp-pill rounded-full border font-medium',
        !active && 'border-line bg-card text-body hover:border-primary hover:text-primary',
      )}
      style={{ padding: '0.3125rem 0.8125rem', fontSize: '0.75rem' }}
    >
      {children}
    </button>
  )
}

function SectionTitle({ eyebrow, title, right }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: '0.5rem 1rem', marginBottom: '1rem' }}>
      <div>
        <p className="text-primary font-semibold" style={{ fontSize: '0.8125rem' }}>
          {eyebrow}
        </p>
        <h2 style={{ fontSize: '1.5rem', lineHeight: 1.25, marginTop: '0.25rem' }}>{title}</h2>
      </div>
      {right && (
        <p className="text-muted" style={{ fontSize: '0.75rem' }}>
          {right}
        </p>
      )}
    </div>
  )
}

function HeroChips({ items }) {
  return (
    <ul className="bp-chips">
      {items.map(({ icon: Icon, label }) => (
        <li
          key={label}
          className="border-on-navy/20 bg-on-navy/10 text-on-navy/85 inline-flex items-center rounded-full border"
          style={{ gap: '0.375rem', padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}
        >
          <Icon className="text-accent" width={13} height={13} aria-hidden="true" />
          {label}
        </li>
      ))}
    </ul>
  )
}

// Hero ke right side par latest articles ke glass cards (sirf decoration, real data)
function HeroStack({ blogs }) {
  if (!blogs.length) return null
  const tilt = ['-2deg', '1.5deg', '-1deg']
  return (
    <div className="bp-stack hidden min-[1280px]:block" aria-hidden="true">
      {blogs.map((b, i) => (
        <div key={b.id} className="bp-doc" style={{ '--i': i, '--r': tilt[i % tilt.length] }}>
          {b.category && <span className="bp-doc-cat">{b.category}</span>}
          <p className="bp-doc-title">{b.title}</p>
          <p className="bp-doc-meta">
            {[b.published_at && formatDate(b.published_at), b.reading_time && `${b.reading_time} min read`]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
      ))}
    </div>
  )
}

// ---------- Stats ribbon (purana design, cards beech mein) ----------

function Stat({ icon: Icon, value, suffix = '', text, label, delay }) {
  const counted = useCountUp(typeof value === 'number' ? value : 0)
  return (
    <div className="bp-stat border-line bg-card rounded-xl border shadow-xs" style={{ '--d': `${delay}ms` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span className="bp-stat-ico">
          <Icon width={17} height={17} aria-hidden="true" />
        </span>
        <div style={{ minWidth: 0 }}>
          <p className="text-heading font-semibold" style={{ fontSize: '1.25rem', lineHeight: 1.2 }}>
            {text ?? `${counted}${suffix}`}
          </p>
          <p className="text-muted" style={{ fontSize: '0.75rem' }}>
            {label}
          </p>
        </div>
      </div>
    </div>
  )
}

function StatsRibbon({ blogs, categories }) {
  const minutes = blogs.reduce((sum, b) => sum + (Number(b.reading_time) || 0), 0)
  const latest = blogs.map((b) => b.published_at).filter(Boolean).sort().pop()

  return (
    <div className="bp-stats">
      <Stat icon={FileText} value={blogs.length} label={blogs.length === 1 ? 'Article' : 'Articles'} delay={0} />
      {categories.length > 0 && (
        <Stat icon={Tag} value={categories.length} label={categories.length === 1 ? 'Topic' : 'Topics'} delay={80} />
      )}
      {minutes > 0 && <Stat icon={Timer} value={minutes} suffix=" min" label="Total reading time" delay={160} />}
      {latest && <Stat icon={CalendarDays} text={formatDate(latest)} label="Latest post" delay={240} />}
    </div>
  )
}

// ---------- Featured ----------

function FeaturedArticle({ blog, to, fallbackAuthor, photo, onShare }) {
  const author = blog.author || fallbackAuthor
  // Photo sirf tab jab article ka author portfolio ka malik ho
  const isOwner = !blog.author || !fallbackAuthor || String(blog.author).toLowerCase().includes(lastNameOf(fallbackAuthor))

  return (
    <div className="bp-fwrap">
      <article className="bp-feature bg-card" style={{ borderRadius: 'calc(1.125rem - 1.5px)' }}>
        <Link to={to} className="bp-feature-img bp-zoom" aria-label={blog.title} tabIndex={-1}>
          <CardImage src={blog.cover_image} alt="" className="bp-cover" />
        </Link>

        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0.875rem', padding: '1.75rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem' }}>
            <Badge variant="accent" size="sm">
              Featured
            </Badge>
            {blog.category && (
              <Badge variant="primary" size="sm">
                {blog.category}
              </Badge>
            )}
          </div>

          <h3 style={{ fontSize: 'clamp(1.375rem, 2.4vw, 1.875rem)', lineHeight: 1.2 }}>
            <Link to={to} className="hover:text-primary transition-colors">
              {blog.title}
            </Link>
          </h3>

          <Meta blog={blog} />

          {blog.excerpt && (
            <p className="text-body" style={{ fontSize: '0.9375rem', lineHeight: 1.7, textAlign: 'justify', hyphens: 'auto', textAlignLast: 'left', ...clamp(4) }}>
              {blog.excerpt}
            </p>
          )}

          {author && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <Avatar src={isOwner ? photo : null} name={author} size="2.125rem" fontSize="0.6875rem" />
              <p className="text-heading font-medium" style={{ fontSize: '0.8125rem' }}>
                {author}
              </p>
            </div>
          )}

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.625rem', marginTop: '0.25rem' }}>
            <Button as={Link} to={to} size="sm">
              Read article
              <ArrowRight width={14} height={14} aria-hidden="true" />
            </Button>
            <Button variant="secondary" size="sm" onClick={onShare}>
              <Share2 width={14} height={14} aria-hidden="true" />
              Share
            </Button>
          </div>
        </div>
      </article>
    </div>
  )
}

// ---------- Topics ----------

function TopicCards({ categories, total, onPick }) {
  return (
    <div className="bp-topics">
      {categories.map(({ name, count }, i) => (
        <button
          key={name}
          type="button"
          onClick={() => onPick(name)}
          className="bp-topic bp-item border-line bg-card rounded-xl border shadow-xs hover:border-primary"
          style={{ '--d': `${i * 70}ms`, height: 'auto' }}
          aria-label={`${name}: ${count} ${count === 1 ? 'article' : 'articles'}`}
        >
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.625rem', minWidth: 0 }}>
              <span className="bp-stat-ico" style={{ width: '2rem', height: '2rem' }}>
                <Tag width={14} height={14} aria-hidden="true" />
              </span>
              <span className="text-heading font-semibold" style={{ fontSize: '0.9375rem', ...clamp(1) }}>
                {name}
              </span>
            </span>
            <ArrowRight className="text-primary" width={15} height={15} aria-hidden="true" />
          </span>
          <span className="bp-meter" aria-hidden="true">
            <i style={{ width: `${Math.max(8, Math.round((count / total) * 100))}%` }} />
          </span>
          <span className="text-muted" style={{ fontSize: '0.75rem' }}>
            {count} {count === 1 ? 'article' : 'articles'}
          </span>
        </button>
      ))}
    </div>
  )
}

// ---------- Card ----------

function ArticleCard({ blog, to, row, index }) {
  return (
    <div className="bp-item" style={{ '--d': `${Math.min(index % PER_PAGE, 5) * 70}ms` }}>
      <Link
        to={to}
        className={cn('bp-card group border-line bg-card hover:border-primary flex h-full flex-col overflow-hidden rounded-xl border shadow-xs', row && 'bp-row')}
      >
        <div className="bp-zoom bp-thumb" style={{ position: 'relative' }}>
          <CardImage src={blog.cover_image} alt="" className={row ? 'bp-cover' : undefined} />
          {blog.category && (
            <span style={{ position: 'absolute', top: '0.625rem', left: '0.625rem' }}>
              <Badge variant="primary" size="sm" className="bg-card/90 backdrop-blur-sm">
                {blog.category}
              </Badge>
            </span>
          )}
        </div>

        <div style={{ display: 'flex', flex: 1, flexDirection: 'column', padding: '1rem 1.125rem 1.125rem' }}>
          <Meta blog={blog} />
          <h3
            className="group-hover:text-primary transition-colors"
            style={{ fontSize: '1.125rem', lineHeight: 1.35, marginTop: '0.5rem', ...clamp(2) }}
          >
            {blog.title}
          </h3>
          {blog.excerpt && (
            <p className="text-muted" style={{ fontSize: '0.8125rem', lineHeight: 1.65, marginTop: '0.5rem', textAlign: 'justify', hyphens: 'auto', textAlignLast: 'left', ...clamp(row ? 2 : 3) }}>
              {blog.excerpt}
            </p>
          )}
          <span
            className="text-primary font-semibold"
            style={{ marginTop: 'auto', paddingTop: '0.875rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8125rem' }}
          >
            Read more
            <ArrowRight className="transition-transform group-hover:translate-x-0.5" width={14} height={14} aria-hidden="true" />
          </span>
        </div>
      </Link>
    </div>
  )
}

// ---------- Author + CTA ----------

function AuthorCta({ portfolio, photo, contactTo }) {
  const name = portfolio?.full_name
  if (!name) return null
  const socials = Array.isArray(portfolio.social_links) ? portfolio.social_links.filter((s) => s?.url) : []

  return (
    <section aria-label="About the author" style={{ marginTop: '3rem' }}>
      <div className="bp-author border-line bg-card rounded-2xl border shadow-xs">
        <div className="bp-author-main">
          <Avatar src={photo} name={name} />
          <div className="bp-author-text">
            <p className="text-muted" style={{ fontSize: '0.75rem' }}>
              Written by
            </p>
            <h3 style={{ fontSize: '1.25rem', lineHeight: 1.25 }}>{name}</h3>
            {portfolio.designation && (
              <p className="text-body" style={{ fontSize: '0.875rem', marginTop: '0.125rem' }}>
                {portfolio.designation}
              </p>
            )}
            {socials.length > 0 && (
              <div className="bp-socials">
                {socials.map((s) => (
                  <a
                    key={s.url}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border-line text-body hover:border-primary hover:text-primary rounded-full border transition-colors"
                    style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem', textTransform: 'capitalize' }}
                  >
                    {s.platform}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bp-author-actions">
          <Button as={Link} to={contactTo} size="sm">
            <Mail width={14} height={14} aria-hidden="true" />
            Suggest a topic
          </Button>
          {portfolio.cv_url && (
            <Button as="a" href={portfolio.cv_url} target="_blank" rel="noopener noreferrer" variant="secondary" size="sm">
              <Download width={14} height={14} aria-hidden="true" />
              Download CV
            </Button>
          )}
        </div>
      </div>
    </section>
  )
}

// ---------- Loading ----------

function LoadingState() {
  return (
    <div aria-busy="true" aria-label="Loading articles" style={{ paddingTop: '1.5rem' }}>
      <Skeleton style={{ height: '19rem', borderRadius: '1.125rem' }} />
      <div className="bp-grid" style={{ marginTop: '2rem' }}>
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} style={{ height: '19rem', borderRadius: '0.75rem' }} />
        ))}
      </div>
    </div>
  )
}

// ---------- Page ----------

export function BlogsPage() {
  const { slug, portfolio, pageIntros } = usePublicSite()
  const intro = getPageIntro(pageIntros, 'blogs', 'blog')
  const query = useBlogs(slug)

  const [category, setCategory] = useState('')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('newest')
  const [view, setView] = useState('grid')
  const [limit, setLimit] = useState(PER_PAGE)
  const listRef = useRef(null)

  // blogs = hamesha newest-first (hero chips + featured isi se)
  const blogs = useMemo(() => (query.data ?? []).map(normalizeBlog).sort(byNewest), [query.data])

  const categories = useMemo(() => {
    const counts = new Map()
    blogs.forEach((b) => {
      if (b.category) counts.set(b.category, (counts.get(b.category) ?? 0) + 1)
    })
    return [...counts.entries()].map(([name, count]) => ({ name, count }))
  }, [blogs])

  const term = search.trim().toLowerCase()
  const filtering = Boolean(category || term)

  const filtered = useMemo(
    () =>
      blogs
        .filter((b) => {
          if (category && b.category !== category) return false
          if (!term) return true
          return [b.title, b.excerpt, b.category, b.author].some((v) => v?.toLowerCase().includes(term))
        })
        .sort(SORTERS[sort]),
    [blogs, category, term, sort],
  )

  // Featured sirf bina filter ke: is_featured wala, warna sabse naya
  const featured = !filtering && blogs.length > 0 ? (blogs.find((b) => b.is_featured) ?? blogs[0]) : null
  const list = featured ? filtered.filter((b) => b.id !== featured.id) : filtered
  const shown = list.slice(0, limit)

  const changeCategory = (value) => {
    setCategory(value)
    setLimit(PER_PAGE)
  }
  const changeSearch = (value) => {
    setSearch(value)
    setLimit(PER_PAGE)
  }
  const clearFilters = () => {
    setCategory('')
    setSearch('')
    setLimit(PER_PAGE)
  }
  const pickTopic = (name) => {
    changeCategory(name)
    requestAnimationFrame(() => listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  // Backend se: profile photo, na ho to logo (dono portfolio ke fields hain)
  const photo = portfolio?.photo ?? portfolio?.profile_photo ?? portfolio?.logo ?? null
  const blogUrl = (blog) => paths.siteBlog(slug, blog.slug)
  const contactTo = paths.siteContact?.(slug) ?? `/${slug}/contact`
  const share = (blog) => shareLink(`${window.location.origin}${blogUrl(blog)}`, blog.title)

  const heroChips = blogs.length
    ? [
        { icon: FileText, label: `${blogs.length} published ${blogs.length === 1 ? 'article' : 'articles'}` },
        ...(categories.length ? [{ icon: Tag, label: `${categories.length} ${categories.length === 1 ? 'topic' : 'topics'}` }] : []),
        ...(blogs[0].published_at ? [{ icon: CalendarDays, label: `Latest: ${formatDate(blogs[0].published_at)}` }] : []),
      ]
    : []

  let content
  if (query.isPending) {
    content = <LoadingState />
  } else if (query.isError) {
    content = <ErrorState message={query.error?.message} onRetry={query.refetch} />
  } else if (blogs.length === 0) {
    content = (
      <EmptyState
        icon={FileText}
        title="No articles yet"
        description="New articles will appear here as soon as they are published."
      />
    )
  } else if (filtered.length === 0) {
    content = (
      <EmptyState
        icon={Search}
        title="No articles found"
        description="Try a different keyword or choose another topic."
        action={
          <Button variant="secondary" onClick={clearFilters}>
            Clear filters
          </Button>
        }
      />
    )
  } else {
    content = (
      <>
        {featured && (
          <section aria-label="Featured article" style={{ marginBottom: '2.75rem' }}>
            <SectionTitle eyebrow="Featured article" title="Editor's pick" />
            <FeaturedArticle
              blog={featured}
              to={blogUrl(featured)}
              fallbackAuthor={portfolio?.full_name}
              photo={photo}
              onShare={() => share(featured)}
            />
          </section>
        )}

        {!filtering && categories.length > 1 && (
          <section aria-label="Browse by topic" style={{ marginBottom: '2.75rem' }}>
            <SectionTitle eyebrow="Explore" title="Browse by topic" right="Pick a topic to filter articles" />
            <TopicCards categories={categories} total={blogs.length} onPick={pickTopic} />
          </section>
        )}

        {list.length > 0 && (
          <section aria-label="Articles" ref={listRef} style={{ scrollMarginTop: '5rem' }}>
            <SectionTitle
              eyebrow={featured ? 'Latest writing' : category ? category : 'Search results'}
              title={featured ? 'All articles' : 'Matching articles'}
              right={`Showing ${shown.length} of ${list.length} ${list.length === 1 ? 'article' : 'articles'}`}
            />
            {/* key badalne par animation dobara chalti hai (filter/sort/view change) */}
            <div key={`${view}-${sort}-${category}-${term}`} className={view === 'list' ? 'bp-list' : 'bp-grid'}>
              {shown.map((blog, i) => (
                <ArticleCard key={blog.id} blog={blog} to={blogUrl(blog)} row={view === 'list'} index={i} />
              ))}
            </div>

            {shown.length < list.length && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.75rem' }}>
                <Button variant="secondary" onClick={() => setLimit((n) => n + PER_PAGE)}>
                  Load more articles
                </Button>
              </div>
            )}
          </section>
        )}
      </>
    )
  }

  const showToolbar = !query.isPending && !query.isError && blogs.length > 0

  return (
    <div className="bp-root">
      <style>{PAGE_CSS}</style>

      <div className="bp-hero">
        <PageHero
          eyebrow="Blog"
          title={String(intro?.title ?? '').trim() || 'Articles & Insights'}
          subtitle={introText(intro) || 'Notes on research, teaching and academic life.'}
        >
          {heroChips.length > 0 && <HeroChips items={heroChips} />}
        </PageHero>
        <span className="bp-aurora" aria-hidden="true" />
        <span className="bp-grid-bg" aria-hidden="true" />
        <span className="bp-glow bp-glow-a" aria-hidden="true" />
        <span className="bp-glow bp-glow-b" aria-hidden="true" />
        <span className="bp-dots" aria-hidden="true" />
        {PARTICLES.map(([left, top, delay, dur], i) => (
          <span
            key={i}
            className="bp-particle"
            aria-hidden="true"
            style={{ left, top, '--delay': `${delay}s`, '--dur': `${dur}s` }}
          />
        ))}
        <HeroStack blogs={blogs.slice(0, 3)} />
        <span className="bp-sheen" aria-hidden="true" />
      </div>

      <div className="bg-background">
        <Container>
          {showToolbar && <StatsRibbon blogs={blogs} categories={categories} />}

          {showToolbar && (
            <div className="bp-bar">
              {categories.length > 1 ? (
                <div className="bp-pills" role="group" aria-label="Filter by topic">
                  <Pill active={!category} onClick={() => changeCategory('')}>
                    All ({blogs.length})
                  </Pill>
                  {categories.map(({ name, count }) => (
                    <Pill key={name} active={category === name} onClick={() => changeCategory(name)}>
                      {name} ({count})
                    </Pill>
                  ))}
                </div>
              ) : (
                <span />
              )}

              <div className="bp-tools">
                <div className="bp-search">
                  <SearchInput value={search} onChange={changeSearch} placeholder="Search articles..." />
                </div>
                <select
                  className="bp-select"
                  value={sort}
                  onChange={(e) => {
                    setSort(e.target.value)
                    setLimit(PER_PAGE)
                  }}
                  aria-label="Sort articles"
                >
                  {SORTS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
                <div className="bp-seg" role="group" aria-label="Layout">
                  <button type="button" aria-pressed={view === 'grid'} aria-label="Grid view" onClick={() => setView('grid')}>
                    <LayoutGrid width={15} height={15} aria-hidden="true" />
                  </button>
                  <button type="button" aria-pressed={view === 'list'} aria-label="List view" onClick={() => setView('list')}>
                    <List width={15} height={15} aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {showToolbar && <hr className="bp-divider" />}

          <div className="bp-body" style={{ paddingTop: showToolbar ? '1.75rem' : undefined }}>
            {content}
            {showToolbar && <AuthorCta portfolio={portfolio} photo={photo} contactTo={contactTo} />}
          </div>
        </Container>
      </div>
    </div>
  )
}