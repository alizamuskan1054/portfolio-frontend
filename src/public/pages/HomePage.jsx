import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Award,
  BadgeCheck,
  BookOpen,
  CalendarDays,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  Download,
  ExternalLink,
  FileText,
  FolderOpen,
  MapPin,
  Quote,
  Sparkles,
  Star,
  TrendingUp,
  Users,
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatDate } from '@/lib/format'
import { notify } from '@/lib/notify'
import { paths } from '@/routes/paths'
import { cn } from '@/lib/utils'
import { Container } from '@/public/components/Container'
import { Section } from '@/public/components/Section'
import { SectionHeading } from '@/public/components/SectionHeading'
import { SocialLinks } from '@/public/components/SocialLinks'
import {
  useAcademic,
  useBlogs,
  useProjects,
  usePublications,
  useTestimonials,
} from '@/public/hooks/usePublicData'
import { usePublicSite } from '@/public/hooks/usePublicSite'


// Backend se home intro na aaye to yehi dikhega
const DEFAULT_INTRO =
  'Welcome to my academic portfolio. Explore my research, projects, publications and writing.'

// ---------- Styles ----------

function HomeStyles() {
  return (
    <style>{`
      .home-root{--h-a:var(--c-primary,#2563eb);--h-b:var(--c-accent,#f59e0b)}

      @keyframes homeWord { to { transform: translateY(0); } }
      @keyframes homeRise { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
      @keyframes homeGrow { from { transform: scaleX(0); } to { transform: scaleX(1); } }
      @keyframes homeFloat { 0%,100% { transform: translate3d(0,0,0); } 50% { transform: translate3d(0,-12px,0); } }
      @keyframes homeDrift { 0%,100% { transform: translate3d(0,0,0) scale(1); } 50% { transform: translate3d(40px,30px,0) scale(1.08); } }
      @keyframes homeSheen { 0% { background-position: 0% 50%; } 100% { background-position: 200% 50%; } }
      @keyframes homeSpin { to { transform: rotate(360deg); } }
      @keyframes homeShine { to { transform: translateX(380%) skewX(-20deg); } }
      @keyframes hpShimmer { to { background-position: -200% 0; } }
      @keyframes hpFill { from { transform: scaleX(0); } to { transform: scaleX(1); } }

      .home-word { display: inline-block; transform: translateY(110%);
        animation: homeWord .9s cubic-bezier(.2,.7,.2,1) forwards; animation-delay: var(--d, 0ms); }
      .home-grad { background: linear-gradient(100deg, var(--c-on-navy, #fff) 0%, var(--h-b) 90%);
        -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; color: transparent; }
      .home-rise { opacity: 0; animation: homeRise .8s cubic-bezier(.2,.7,.2,1) forwards; animation-delay: var(--d, 0ms); }
      .home-grow { transform-origin: left; transform: scaleX(0);
        animation: homeGrow .7s cubic-bezier(.2,.7,.2,1) forwards; animation-delay: var(--d, 0ms); }
      .home-float { animation: homeFloat 6s ease-in-out infinite; animation-delay: var(--d, 0ms); }
      .home-drift { animation: homeDrift 16s ease-in-out infinite; }

      /* ---------- Hero layout ---------- */
      .home-hero-grid { display: grid; gap: 1.75rem; align-items: center; justify-content: center; }
      .home-hero-photo { order: -1; justify-self: center; width: 100%; }
      .home-photo-wrap { position: relative; width: 100%; max-width: 12.5rem; margin: 0 auto; }
      @media (min-width: 900px) {
        .home-hero-grid { grid-template-columns: minmax(0, 36rem) 16.5rem; gap: 3rem; }
        .home-hero-photo { order: 0; justify-self: start; }
        .home-photo-wrap { max-width: 16rem; margin: 0; }
      }
      @media (min-width: 1200px) {
        .home-hero-grid { grid-template-columns: minmax(0, 38rem) 17.5rem; gap: 3.5rem; }
        .home-photo-wrap { max-width: 17rem; }
      }

      .home-sheen { position: absolute; left: 0; right: 0; bottom: 0; height: 2px; pointer-events: none;
        background: linear-gradient(90deg, transparent, currentColor, transparent); background-size: 200% 100%;
        animation: homeSheen 6s linear infinite; }

      /* cursor ke peeche halki roshni */
      .home-spot { position: absolute; inset: 0; pointer-events: none;
        background: radial-gradient(420px circle at var(--hx, 72%) var(--hy, 30%), color-mix(in srgb, var(--h-b) 15%, transparent), transparent 62%); }

      /* role chips (designation) */
      .home-roles { display: flex; flex-wrap: wrap; gap: .5rem; list-style: none; margin: 0; padding: 0; }
      .home-role { display: inline-flex; align-items: center; gap: .4375rem; padding: .3125rem .8125rem; border-radius: 9999px;
        font-size: .75rem; font-weight: 500; line-height: 1.3;
        color: color-mix(in srgb, var(--c-on-navy) 88%, transparent);
        border: 1px solid color-mix(in srgb, var(--c-on-navy) 22%, transparent);
        background: color-mix(in srgb, var(--c-on-navy) 8%, transparent); }
      .home-role-main { color: var(--h-b); font-weight: 600;
        border-color: color-mix(in srgb, var(--h-b) 42%, transparent);
        background: color-mix(in srgb, var(--h-b) 12%, transparent); }
      .home-role-dot { width: 6px; height: 6px; border-radius: 9999px; background: var(--h-b); flex-shrink: 0; }

      /* buttons */
      .home-shine { position: relative; overflow: hidden; }
      .home-shine::after { content: ""; position: absolute; top: 0; bottom: 0; left: 0; width: 28%;
        transform: translateX(-160%) skewX(-20deg); pointer-events: none;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,.4), transparent); }
      .home-shine:hover::after, .home-shine:focus-visible::after { animation: homeShine .9s ease; }
      .home-cv { display: inline-flex; align-items: center; gap: .375rem; padding: .5625rem .25rem; font-size: .875rem; font-weight: 500;
        color: color-mix(in srgb, var(--c-on-navy) 80%, transparent); text-decoration: none; transition: color .2s; }
      .home-cv:hover { color: var(--h-b); }
      .home-cv:focus-visible { outline: 2px solid var(--h-b); outline-offset: 3px; border-radius: .375rem; }

      /* photo: ghoomta gradient frame + glow + glass badge */
      .home-photo-glow { position: absolute; inset: -18%; z-index: -1; pointer-events: none; filter: blur(22px);
        background: radial-gradient(circle at 50% 45%, color-mix(in srgb, var(--h-a) 60%, transparent), transparent 65%); }
      .home-frame { position: relative; isolation: isolate; overflow: hidden; border-radius: 1.5rem; padding: 3px;
        box-shadow: 0 22px 44px -16px rgba(0,0,0,.55); }
      .home-frame::before { content: ""; position: absolute; inset: -60%; z-index: -1;
        background: conic-gradient(from 0deg, var(--h-a), var(--h-b), var(--h-a), var(--h-b), var(--h-a));
        animation: homeSpin 9s linear infinite; }
      .home-frame-in { position: relative; overflow: hidden; border-radius: calc(1.5rem - 3px); }
      .home-badge { position: absolute; left: -.875rem; bottom: 1.25rem; z-index: 2; display: inline-flex; align-items: center; gap: .375rem;
        padding: .4375rem .75rem; border-radius: 9999px; font-size: .75rem; font-weight: 600; white-space: nowrap;
        color: var(--c-on-navy);
        background: color-mix(in srgb, var(--c-navy) 72%, transparent);
        border: 1px solid color-mix(in srgb, var(--c-on-navy) 22%, transparent);
        -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px);
        box-shadow: 0 12px 24px -12px rgba(0,0,0,.55); }

      /* ---------- Step cards (Research Interests): number badge + corner brackets ---------- */
      .hp-steps { gap: 1.75rem 1.5rem; padding: .5rem; }
      .hp-step { position: relative; height: 100%; }
      .hp-step::before, .hp-step::after { content: ""; position: absolute; pointer-events: none;
        transition: width .5s cubic-bezier(.2,.7,.2,1), height .5s cubic-bezier(.2,.7,.2,1); }
      .hp-step::before { top: -8px; right: -8px; width: 58%; height: 46%; border-top-right-radius: 1.25rem;
        border-top: 3px solid color-mix(in srgb, var(--h-a) 72%, var(--h-b)); border-right: 3px solid color-mix(in srgb, var(--h-a) 72%, var(--h-b)); }
      .hp-step::after { bottom: -8px; left: -8px; width: 54%; height: 46%; border-bottom-left-radius: 1.25rem;
        border-bottom: 3px solid color-mix(in srgb, currentColor 78%, transparent); border-left: 3px solid color-mix(in srgb, currentColor 78%, transparent); }
      .hp-step:hover::before { width: 72%; height: 60%; }
      .hp-step:hover::after { width: 68%; height: 60%; }
      .hp-step-card { position: relative; z-index: 1; height: 100%; padding: 1.25rem 1.25rem 1.375rem; border-radius: 1rem;
        background: #fff;
        box-shadow: 0 12px 28px -18px color-mix(in srgb, var(--h-a) 55%, transparent);
        transition: transform .3s cubic-bezier(.2,.7,.2,1), box-shadow .3s; }
      .hp-step:hover .hp-step-card { transform: translateY(-3px); box-shadow: 0 20px 36px -20px color-mix(in srgb, var(--h-a) 70%, transparent); }
      .hp-num { display: inline-flex; align-items: center; justify-content: center; width: 3rem; height: 3rem; border-radius: .875rem;
        background: var(--c-navy); color: var(--c-accent); font-family: var(--f-heading, serif); font-weight: 700; font-size: 1.0625rem; }
      .hp-step-title { margin-top: 1rem; font-size: 1.1875rem; line-height: 1.3; }
      .hp-step-text { margin-top: .5rem; font-size: .875rem; line-height: 1.7; text-wrap: pretty;
        text-align: justify; hyphens: auto; text-align-last: left;
        display: -webkit-box; -webkit-line-clamp: 6; -webkit-box-orient: vertical; overflow: hidden; }

      /* ---------- Article cards (Latest Articles) ---------- */
      .hp-read-chip { position: absolute; right: .625rem; bottom: .625rem; z-index: 1; display: inline-flex; align-items: center; gap: .3125rem;
        padding: .3125rem .625rem; border-radius: 9999px; font-size: .6875rem; font-weight: 600; color: #fff;
        background: color-mix(in srgb, var(--c-navy) 78%, transparent); -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px);
        opacity: 0; transform: translateY(6px); transition: opacity .3s, transform .3s; }
      .hp-card:hover .hp-read-chip, .hp-card:focus-visible .hp-read-chip { opacity: 1; transform: none; }
      .hp-meta { display: flex; flex-wrap: wrap; align-items: center; gap: .25rem .875rem; font-size: .75rem; }
      .hp-meta > span { display: inline-flex; align-items: center; gap: .3125rem; }
      .hp-foot { display: flex; align-items: center; justify-content: space-between; gap: .75rem; margin-top: auto; padding-top: .875rem;
        border-top: 1px solid var(--c-line); }
      .hp-av { display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; width: 1.75rem; height: 1.75rem; overflow: hidden;
        border-radius: 9999px; font-size: .625rem; font-weight: 700; color: #fff; background: linear-gradient(135deg, var(--h-a), var(--h-b)); }
      .hp-go { display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; width: 2rem; height: 2rem; border-radius: 9999px;
        border: 1px solid var(--c-line); color: var(--h-a); transition: background-color .25s, color .25s, border-color .25s, transform .25s; }
      .hp-card:hover .hp-go { background: var(--h-a); border-color: var(--h-a); color: #fff; transform: translateX(2px); }

      /* ---------- Grids ---------- */
      .hp-grid3 { display: grid; gap: 1.5rem; grid-template-columns: 1fr; }
      .hp-grid4 { display: grid; gap: 1.25rem; grid-template-columns: 1fr; }
      @media (min-width: 640px) { .hp-grid3 { grid-template-columns: 1fr 1fr; } .hp-grid4 { grid-template-columns: 1fr 1fr; } }
      @media (min-width: 1024px) { .hp-grid3 { grid-template-columns: repeat(3, 1fr); } .hp-grid4 { grid-template-columns: repeat(4, 1fr); } }

      /* ---------- Shimmer skeletons ---------- */
      .hp-sk { border-radius: .5rem;
        background: linear-gradient(90deg, var(--c-line) 25%, color-mix(in srgb, var(--c-line) 35%, transparent) 50%, var(--c-line) 75%);
        background-size: 200% 100%; animation: hpShimmer 1.4s linear infinite; }
      .hp-sk-dark { background: linear-gradient(90deg, rgba(255,255,255,.1) 25%, rgba(255,255,255,.04) 50%, rgba(255,255,255,.1) 75%);
        background-size: 200% 100%; }
      .hp-skcard { border: 1px solid var(--c-line); border-radius: .75rem; overflow: hidden; background: transparent; }

      /* ---------- Metrics ---------- */
      .hp-metrics { display: grid; gap: .75rem; grid-template-columns: repeat(auto-fit, minmax(9.5rem, 1fr)); }
      .hp-metric { position: relative; overflow: hidden; display: flex; align-items: center; gap: .75rem; padding: 1.0625rem 1.125rem; }
      .hp-metric::before { content: ""; position: absolute; left: 0; top: 0; width: 100%; height: 3px;
        background: linear-gradient(90deg, var(--h-a), var(--h-b)); }
      .hp-ico { display: inline-flex; align-items: center; justify-content: center; width: 2.5rem; height: 2.5rem; flex-shrink: 0;
        border-radius: .75rem; color: #fff; background: linear-gradient(135deg, var(--h-a), var(--h-b)); }

      /* ---------- Cards ---------- */
      .hp-card { position: relative; display: flex; flex-direction: column; height: 100%; overflow: hidden;
        transition: transform .3s, box-shadow .3s, border-color .3s; }
      .hp-card::after { content: ""; position: absolute; left: 0; bottom: 0; width: 100%; height: 3px; transform: scaleX(0); transform-origin: left;
        background: linear-gradient(90deg, var(--h-a), var(--h-b)); transition: transform .45s cubic-bezier(.2,.7,.2,1); }
      .hp-card:hover { transform: translateY(-4px); box-shadow: 0 18px 34px -20px var(--h-a); }
      .hp-card:hover::after { transform: scaleX(1); }
      .hp-card:focus-visible { outline: 2px solid var(--h-a); outline-offset: 2px; }
      .hp-media { position: relative; overflow: hidden; }

      /* poori image (crop nahi): foreground contain, peeche usi image ka blur */
      .hp-img { position: relative; aspect-ratio: 16 / 10; overflow: hidden;
        background: color-mix(in srgb, var(--c-line) 45%, transparent); }
      .hp-img-bg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover;
        filter: blur(18px) saturate(1.2); transform: scale(1.15); opacity: .55; }
      .hp-img-fg { position: relative; display: block; width: 100%; height: 100%; object-fit: contain;
        transition: transform .7s cubic-bezier(.2,.7,.2,1); }
      .hp-card:hover .hp-img-fg { transform: scale(1.04); }
      .hp-img-empty { display: flex; align-items: center; justify-content: center; color: var(--h-a);
        background: linear-gradient(135deg, color-mix(in srgb, var(--h-a) 14%, transparent), color-mix(in srgb, var(--h-b) 14%, transparent)); }
      .hp-media::after { content: ""; position: absolute; inset: 0; pointer-events: none; opacity: 0; transition: opacity .4s;
        background: linear-gradient(180deg, transparent 55%, rgba(0,0,0,.28)); }
      .hp-card:hover .hp-media::after { opacity: 1; }
      .hp-tag { display: inline-flex; align-items: center; padding: .1875rem .625rem; border-radius: 9999px; font-size: .6875rem; font-weight: 500;
        border: 1px solid var(--c-line); }
      .hp-more { margin-top: auto; padding-top: .875rem; display: inline-flex; align-items: center; gap: .25rem; font-size: .8125rem; font-weight: 600; }
      .hp-more svg { transition: transform .25s; }
      .hp-card:hover .hp-more svg { transform: translateX(3px); }

      /* ---------- Publications (timeline) ---------- */
      .hp-tl { position: relative; display: grid; gap: 1.125rem; list-style: none; margin: 0; padding: 0; }
      .hp-tl-item { position: relative; display: block; }
      .hp-rail { display: none; }
      .hp-dot { display: inline-flex; align-items: center; justify-content: center; min-width: 3.5rem; padding: .3125rem .5rem; border-radius: 9999px;
        font-size: .75rem; font-weight: 700; color: #fff; background: linear-gradient(135deg, var(--h-a), var(--h-b));
        box-shadow: 0 0 0 5px color-mix(in srgb, var(--h-a) 16%, transparent); }
      .hp-yr-inline { display: inline-flex; }
      @media (min-width: 640px) {
        .hp-tl::before { content: ""; position: absolute; left: 2rem; top: 1.25rem; bottom: 1.25rem; width: 2px; border-radius: 2px;
          background: linear-gradient(180deg, var(--h-a), var(--h-b) 65%, transparent); }
        .hp-tl-item { display: grid; grid-template-columns: 4rem minmax(0, 1fr); gap: 1.25rem; align-items: start; }
        .hp-rail { display: flex; justify-content: center; padding-top: 1.0625rem; position: relative; z-index: 1; }
        .hp-yr-inline { display: none; }
      }

      .hp-pcard { position: relative; overflow: hidden; padding: 1.125rem 1.25rem 1.25rem;
        transition: transform .3s, box-shadow .3s, border-color .3s; }
      .hp-pcard::after { content: ""; position: absolute; left: 0; bottom: 0; width: 100%; height: 3px; transform: scaleX(0); transform-origin: left;
        background: linear-gradient(90deg, var(--h-a), var(--h-b)); transition: transform .45s cubic-bezier(.2,.7,.2,1); }
      .hp-pcard:hover { transform: translateY(-3px); box-shadow: 0 18px 34px -22px var(--h-a); }
      .hp-pcard:hover::after { transform: scaleX(1); }
      .hp-cites { display: inline-flex; align-items: center; gap: .3125rem; padding: .1875rem .625rem; border-radius: 9999px; font-size: .75rem; font-weight: 600;
        background: color-mix(in srgb, var(--h-b) 14%, transparent); }
      .hp-actions { display: flex; flex-wrap: wrap; gap: .5rem; margin-top: 1rem; padding-top: .875rem; border-top: 1px solid var(--c-line); }
      .hp-btn { display: inline-flex; align-items: center; gap: .375rem; padding: .4375rem .875rem; border-radius: .5rem; font-size: .75rem; font-weight: 600;
        border: 1px solid var(--c-line); background: transparent; color: inherit; cursor: pointer; text-decoration: none;
        transition: border-color .2s, color .2s, filter .2s, transform .2s; }
      .hp-btn:hover { border-color: var(--h-a); color: var(--h-a); }
      .hp-btn:focus-visible { outline: 2px solid var(--h-a); outline-offset: 2px; }
      .hp-btn-primary { color: #fff; border-color: transparent; background: linear-gradient(135deg, var(--h-a), var(--h-b)); }
      .hp-btn-primary:hover { color: #fff; border-color: transparent; filter: brightness(1.08); transform: translateY(-1px); }

      /* ---------- Testimonials ---------- */
      .hp-prog { display: block; width: 6rem; height: 2px; margin: 1rem auto 0; border-radius: 9999px; overflow: hidden; background: rgba(255,255,255,.15); }
      .hp-prog > i { display: block; height: 100%; transform-origin: left; background: var(--h-b); animation: hpFill linear forwards; }

      @media (prefers-reduced-motion: reduce) {
        .home-word, .home-rise, .home-grow { animation: none; opacity: 1; transform: none; }
        .home-float, .home-drift, .home-sheen, .hp-sk, .home-frame::before { animation: none; }
        .home-shine:hover::after { animation: none; }
        .hp-prog { display: none; }
        .hp-card, .hp-pcard, .hp-btn, .hp-img-fg, .hp-more svg, .hp-step::before, .hp-step::after, .hp-step-card, .hp-read-chip, .hp-go { transition: none !important; }
        .hp-step:hover .hp-step-card { transform: none; }
        .hp-card:hover, .hp-pcard:hover, .hp-btn-primary:hover { transform: none; }
        .hp-card:hover .hp-img-fg { transform: none; }
      }
    `}</style>
  )
}

// ---------- Helpers ----------

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

const clamp = (lines) => ({
  display: '-webkit-box',
  WebkitLineClamp: lines,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
})

// Card ke paragraph: justify + hyphenation + line-clamp (zyada text ho to ... aata hai)
const clampJ = (lines) => ({ ...clamp(lines), textAlign: 'justify', hyphens: 'auto', textAlignLast: 'left' })

const asText = (value) =>
  value && typeof value === 'object' ? (value.name ?? value.title ?? value.full_name ?? '') : (value ?? '')

const prettify = (key = '') => {
  const text = String(key).replace(/_/g, ' ').replace(/^total\s+/i, '').trim()
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : ''
}

const titleCase = (text = '') =>
  String(text)
    .toLowerCase()
    .replace(/\b\p{L}/gu, (c) => c.toUpperCase())

function initialsOf(name = '') {
  const parts = name.replace(/^(dr|prof)\.?\s+/i, '').trim().split(/\s+/).filter(Boolean)
  return parts.length ? (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase() : '?'
}

// page_intros array ho ya { home: {...} } map, dono chalte hain
function getPageIntro(pageIntros, page) {
  if (Array.isArray(pageIntros)) return pageIntros.find((p) => p?.page === page) ?? null
  return pageIntros?.[page] ?? null
}

const introText = (item) => item?.subtitle || item?.intro || item?.description || ''

// "Professor of CS & Technology Entrepreneur" -> ["Professor of CS", "Technology Entrepreneur"]
function splitRoles(text = '') {
  return String(text)
    .split(/\s*(?:&|\||·|•|\/)\s*/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 3)
}

// Ek baar viewport mein aaye to true
function useInView(ref, margin = '0px 0px -8% 0px') {
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
      { threshold: 0.2, rootMargin: margin },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [ref, margin])
  return seen
}

// 0 se target tak ginta hai (reduced-motion par seedha target)
function useCountUp(target, active, duration = 1100) {
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

// Scroll par ek baar halka sa andar aata hai. Sirf cards/list ke liye.
function Reveal({ children, delay = 0, className, style }) {
  const ref = useRef(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el || prefersReducedMotion() || typeof IntersectionObserver === 'undefined') {
      setShown(true)
      return undefined
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true)
          io.disconnect()
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? 'none' : 'translateY(16px)',
        transition: `opacity .6s ease ${delay}ms, transform .6s cubic-bezier(.2,.7,.2,1) ${delay}ms`,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

// Page ke top par patli progress line
function ScrollProgress() {
  const barRef = useRef(null)

  useEffect(() => {
    const update = () => {
      const h = document.documentElement
      const max = h.scrollHeight - h.clientHeight
      const p = max > 0 ? h.scrollTop / max : 0
      if (barRef.current) barRef.current.style.transform = `scaleX(${p})`
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  return (
    <div aria-hidden="true" className="pointer-events-none" style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 3, zIndex: 60 }}>
      <div
        ref={barRef}
        style={{
          height: '100%',
          transformOrigin: 'left',
          transform: 'scaleX(0)',
          background: 'linear-gradient(90deg, var(--h-a), var(--h-b))',
        }}
      />
    </div>
  )
}

// Mouse ke saath halka 3D tilt (touch devices par band)
function useTilt(max = 7) {
  const ref = useRef(null)
  const enabled = () =>
    !prefersReducedMotion() && window.matchMedia('(hover: hover) and (pointer: fine)').matches

  const onMouseMove = (e) => {
    const el = ref.current
    if (!el || !enabled()) return
    const r = el.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width - 0.5
    const y = (e.clientY - r.top) / r.height - 0.5
    el.style.transition = 'transform .08s linear'
    el.style.transform = `perspective(1000px) rotateX(${(-y * max).toFixed(2)}deg) rotateY(${(x * max).toFixed(2)}deg)`
  }
  const onMouseLeave = () => {
    const el = ref.current
    if (!el) return
    el.style.transition = 'transform .5s cubic-bezier(.2,.7,.2,1)'
    el.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)'
  }
  return { ref, onMouseMove, onMouseLeave }
}

// Hero par cursor-follow spotlight (CSS variables --hx / --hy), touch par band
function useSpotlight() {
  const ref = useRef(null)
  const onMouseMove = (e) => {
    const el = ref.current
    if (!el || prefersReducedMotion() || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
    const r = el.getBoundingClientRect()
    el.style.setProperty('--hx', `${e.clientX - r.left}px`)
    el.style.setProperty('--hy', `${e.clientY - r.top}px`)
  }
  return { ref, onMouseMove }
}

// ---------- Hero ----------

function researchTarget(slug, vis) {
  if (vis.isPageVisible('publications')) return paths.sitePublications(slug)
  if (vis.isPageVisible('projects')) return paths.siteProjects(slug)
  return paths.siteAbout(slug)
}

// Neural-network jaisa nodes + lines wala background (ML research ke theme ke mutabiq).
function NeuralField() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined
    const ctx = canvas.getContext('2d')
    const reduced = prefersReducedMotion()
    let w = 0
    let h = 0
    let nodes = []
    let raf = 0
    let running = true
    let visible = true

    const color = getComputedStyle(canvas).color
    const LINK = 130

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = canvas.clientWidth
      h = canvas.clientHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const count = Math.min(70, Math.max(18, Math.floor((w * h) / 17000)))
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        r: 1 + Math.random() * 1.4,
      }))
    }

    const draw = () => {
      ctx.clearRect(0, 0, w, h)
      ctx.fillStyle = color
      ctx.strokeStyle = color
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i]
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j]
          const d = Math.hypot(a.x - b.x, a.y - b.y)
          if (d < LINK) {
            ctx.globalAlpha = (1 - d / LINK) * 0.35
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.stroke()
          }
        }
      }
      ctx.globalAlpha = 0.7
      for (const n of nodes) {
        ctx.beginPath()
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    const step = () => {
      if (!running) return
      if (visible && !document.hidden) {
        for (const n of nodes) {
          n.x += n.vx
          n.y += n.vy
          if (n.x < 0 || n.x > w) n.vx *= -1
          if (n.y < 0 || n.y > h) n.vy *= -1
        }
        draw()
      }
      raf = requestAnimationFrame(step)
    }

    resize()
    draw()
    if (!reduced) raf = requestAnimationFrame(step)

    const ro = new ResizeObserver(() => {
      resize()
      draw()
    })
    ro.observe(canvas)
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
    })
    io.observe(canvas)

    return () => {
      running = false
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="text-on-navy"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.5 }}
    />
  )
}

function HeroBackdrop() {
  const blob = { position: 'absolute', borderRadius: '9999px', filter: 'blur(64px)' }
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none"
      style={{ position: 'absolute', inset: 0, zIndex: -10, overflow: 'hidden' }}
    >
      <div className="bg-primary/30 home-drift" style={{ ...blob, top: '-10rem', left: '-8rem', width: '26rem', height: '26rem' }} />
      <div
        className="bg-primary/20 home-drift"
        style={{ ...blob, top: '33%', right: '-10rem', width: '22rem', height: '22rem', animationDelay: '-8s' }}
      />
      <NeuralField />
      <div className="home-spot" />
    </div>
  )
}

function HeroPhoto({ src, name, location }) {
  const [failed, setFailed] = useState(false)
  const tilt = useTilt(6)

  return (
    <div className="home-photo-wrap" onMouseMove={tilt.onMouseMove} onMouseLeave={tilt.onMouseLeave}>
      <span className="home-photo-glow" aria-hidden="true" />

      {/* floating shapes (tilt ke bahar, apni raftar se) */}
      <span
        className="home-float rounded-full border-2 border-accent/60"
        style={{ position: 'absolute', right: '-1.25rem', top: '14%', width: '2.5rem', height: '2.5rem', '--d': '0ms' }}
        aria-hidden="true"
      />
      <span
        className="home-float rounded-full bg-accent"
        style={{ position: 'absolute', right: '-0.5rem', bottom: '10%', width: '0.625rem', height: '0.625rem', '--d': '-2s' }}
        aria-hidden="true"
      />

      <div ref={tilt.ref} style={{ position: 'relative', willChange: 'transform' }}>
        <div className="home-frame">
          <div className="home-frame-in bg-primary-soft" style={{ aspectRatio: '1 / 1.12' }}>
            {src && !failed ? (
              <img
                src={src}
                alt={name}
                onError={() => setFailed(true)}
                className="object-cover"
                style={{ width: '100%', height: '100%', objectPosition: '50% 18%' }}
              />
            ) : (
              <span
                className="flex items-center justify-center font-serif text-6xl font-semibold text-primary"
                style={{ width: '100%', height: '100%' }}
                aria-hidden="true"
              >
                {initialsOf(name)}
              </span>
            )}
          </div>
        </div>

        {location && (
          <span className="home-badge">
            <MapPin width={13} height={13} className="text-accent" aria-hidden="true" />
            {location}
          </span>
        )}
      </div>
    </div>
  )
}

// Naam word-by-word neeche se upar slide hota hai; aakhri lafz gradient
function HeroName({ name }) {
  const words = (name || '').split(/\s+/).filter(Boolean)
  return (
    <h1
      className="text-on-navy"
      aria-label={name}
      style={{ marginTop: '1rem', fontSize: 'clamp(2rem, 4.4vw, 3.25rem)', lineHeight: 1.12 }}
    >
      {words.map((word, i) => (
        <span
          key={`${word}-${i}`}
          aria-hidden="true"
          style={{ display: 'inline-block', overflow: 'hidden', verticalAlign: 'bottom', paddingBottom: '0.1em' }}
        >
          <span
            className={cn('home-word', words.length > 1 && i === words.length - 1 && 'home-grad')}
            style={{ '--d': `${180 + i * 120}ms` }}
          >
            {word}
          </span>
          {i < words.length - 1 ? '\u00A0' : ''}
        </span>
      ))}
    </h1>
  )
}

// ---------- Metrics (citations etc.) ----------

const METRIC_ICONS = [
  [/citation/i, Quote],
  [/h.?index|i10/i, TrendingUp],
  [/publication|paper|article/i, BookOpen],
  [/project/i, FolderOpen],
  [/student|supervis|client|mentee/i, Users],
  [/award|honou?r|grant/i, Award],
  [/year|experience/i, CalendarDays],
]

function metricMeta(key) {
  const icon = METRIC_ICONS.find(([re]) => re.test(key))?.[1] ?? Sparkles
  let label = prettify(key)
  if (/^h.?index$/i.test(key)) label = 'h-index'
  else if (/^i10.?index$/i.test(key)) label = 'i10-index'
  return { icon, label }
}

// metrics object se sirf dikhne layak entries (number ya "12+" jaisi string)
function metricEntries(metrics) {
  return Object.entries(metrics ?? {}).filter(
    ([, v]) => typeof v === 'number' || (typeof v === 'string' && v.trim() !== ''),
  )
}

// "1,250" / 1250 / "12+" / "$3.5k" => { prefix, num, suffix, decimals }
function parseMetric(raw) {
  const m = String(raw).match(/^([^\d]*)([\d,]+(?:\.\d+)?)(.*)$/)
  if (!m) return null
  const num = parseFloat(m[2].replace(/,/g, ''))
  if (Number.isNaN(num)) return null
  return { prefix: m[1], num, suffix: m[3], decimals: (m[2].split('.')[1] ?? '').length }
}

function MetricCard({ metricKey, raw }) {
  const ref = useRef(null)
  const seen = useInView(ref)
  const parsed = parseMetric(raw)
  const counted = useCountUp(parsed ? parsed.num : 0, seen && Boolean(parsed))
  const { icon: Icon, label } = metricMeta(metricKey)

  const display = parsed
    ? `${parsed.prefix}${counted.toLocaleString(undefined, {
        minimumFractionDigits: parsed.decimals,
        maximumFractionDigits: parsed.decimals,
      })}${parsed.suffix}`
    : String(raw)

  return (
    <div ref={ref} className="hp-metric border-line bg-card rounded-xl border shadow-xs">
      <span className="hp-ico">
        <Icon width={18} height={18} aria-hidden="true" />
      </span>
      <div style={{ minWidth: 0 }}>
        <p className="text-heading font-semibold" style={{ fontSize: '1.375rem', lineHeight: 1.15 }} aria-label={`${label}: ${raw}`}>
          {display}
        </p>
        <p className="text-muted" style={{ fontSize: '0.75rem', marginTop: '0.125rem', ...clamp(1) }}>
          {label}
        </p>
      </div>
    </div>
  )
}

function MetricsStrip({ entries }) {
  return (
    <div className="hp-metrics" role="list" aria-label="Key numbers">
      {entries.map(([key, value]) => (
        <div key={key} role="listitem" style={{ display: 'contents' }}>
          <MetricCard metricKey={key} raw={value} />
        </div>
      ))}
    </div>
  )
}

function Hero() {
  const { slug, portfolio, vis, pageIntros, contact } = usePublicSite()
  const { full_name, designation, social_links, cv_url } = portfolio
  const spot = useSpotlight()

  // Backend ka home intro -> portfolio intro -> default (frontend)
  const homeIntro = getPageIntro(pageIntros, 'home')
  const intro = introText(homeIntro) || portfolio.intro || portfolio.short_intro || DEFAULT_INTRO
  const tagline = String(homeIntro?.title ?? '').trim()
  const ctaLabel = homeIntro?.cta_button_label || homeIntro?.ctaButtonLabel || 'View Research'

  const photo = portfolio.photo ?? portfolio.profile_photo ?? null
  const metrics = portfolio.metrics ?? {
    publications: portfolio.total_publications,
    citations: portfolio.citations,
    h_index: portfolio.h_index,
  }
  const entries = metricEntries(metrics)
  const hasMetrics = entries.length > 0

  const roles = splitRoles(designation)
  const location = [contact?.city, contact?.country].filter(Boolean).map(titleCase).join(', ')

  const target = researchTarget(slug, vis)
  const aboutPath = paths.siteAbout(slug)
  const showAbout = target !== aboutPath

  // Naam ke baad baqi cheezein is delay ke baad aati hain
  const nameWords = (full_name || '').split(/\s+/).filter(Boolean).length
  const base = 180 + nameWords * 120 + 250

  return (
    <>
      <section
        ref={spot.ref}
        onMouseMove={spot.onMouseMove}
        className="bg-navy text-on-navy"
        style={{
          position: 'relative',
          isolation: 'isolate',
          overflow: 'hidden',
          padding: hasMetrics ? '2.75rem 0 5.5rem' : '2.75rem 0',
        }}
      >
        <HeroBackdrop />

        <Container>
          <div className="home-hero-grid">
            <div style={{ minWidth: 0 }}>
              {roles.length > 0 && (
                <ul className="home-roles home-rise" style={{ '--d': '0ms' }}>
                  {roles.map((role, i) => (
                    <li key={role} className={cn('home-role', i === 0 && 'home-role-main')}>
                      {i === 0 && <span className="home-role-dot" aria-hidden="true" />}
                      {role}
                    </li>
                  ))}
                </ul>
              )}

              <HeroName name={full_name} />

              <span
                className="home-grow block rounded-full bg-accent"
                style={{ height: 3, width: 64, marginTop: '1rem', '--d': `${base - 150}ms` }}
                aria-hidden="true"
              />

              {tagline && (
                <p
                  className="home-rise text-accent"
                  style={{ marginTop: '1rem', fontSize: '1.0625rem', fontWeight: 600, lineHeight: 1.4, '--d': `${base - 60}ms` }}
                >
                  {tagline}
                </p>
              )}

              <p
                className="home-rise text-on-navy/80"
                style={{ marginTop: tagline ? '0.5rem' : '1rem', fontSize: '1rem', lineHeight: 1.65, '--d': `${base}ms` }}
              >
                {intro}
              </p>

              <div
                className="home-rise"
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  gap: '0.75rem 1rem',
                  marginTop: '1.5rem',
                  '--d': `${base + 120}ms`,
                }}
              >
                <Button as={Link} to={target} className="group home-shine">
                  {ctaLabel}
                  <ArrowRight
                    className="size-4 transition-transform group-hover:translate-x-0.5"
                    style={{ marginLeft: '0.5rem' }}
                    aria-hidden="true"
                  />
                </Button>

                {showAbout && (
                  <Link
                    to={aboutPath}
                    className="inline-flex items-center justify-center rounded-lg border border-on-navy/30 text-sm font-medium text-on-navy transition-colors hover:border-accent hover:text-accent"
                    style={{ padding: '0.5625rem 1.25rem' }}
                  >
                    About Me
                  </Link>
                )}

                {cv_url && (
                  <a href={cv_url} target="_blank" rel="noopener noreferrer" className="home-cv">
                    <Download width={15} height={15} aria-hidden="true" />
                    Download CV
                  </a>
                )}
              </div>

              <div
                className="home-rise border-t border-on-navy/10"
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  gap: '0.5rem 1rem',
                  marginTop: '1.5rem',
                  paddingTop: '1rem',
                  '--d': `${base + 240}ms`,
                }}
              >
                <span className="text-xs font-semibold tracking-widest text-on-navy/60 uppercase">Connect</span>
                <SocialLinks links={social_links} inverted />
              </div>
            </div>

            <div className="home-rise home-hero-photo" style={{ '--d': `${base - 100}ms` }}>
              <HeroPhoto src={photo} name={full_name} location={location} />
            </div>
          </div>
        </Container>

        <span className="home-sheen text-accent" aria-hidden="true" />
      </section>

      {hasMetrics && (
        <div className="bg-background">
          <Container>
            <Reveal
              style={{
                position: 'relative',
                zIndex: 10,
                marginTop: '-2.75rem',
                marginLeft: 'auto',
                marginRight: 'auto',
                maxWidth: '60rem',
              }}
            >
              <MetricsStrip entries={entries} />
            </Reveal>
          </Container>
        </div>
      )}
    </>
  )
}

// ---------- Card image (poori image, crop nahi) ----------

// Foreground image object-contain (poori dikhti hai), peeche usi ka blur taake khali patti dull na lage.
// Image na ho ya load fail ho to gradient placeholder.
function CardImage({ src, alt = '', icon: Icon = FolderOpen }) {
  const [failed, setFailed] = useState(false)

  if (!src || failed) {
    return (
      <div className="hp-img hp-img-empty" aria-hidden="true">
        <Icon width={34} height={34} />
      </div>
    )
  }

  return (
    <div className="hp-img">
      <img className="hp-img-bg" src={src} alt="" aria-hidden="true" loading="lazy" draggable={false} />
      <img className="hp-img-fg" src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} draggable={false} />
    </div>
  )
}

// ---------- Skeleton loaders (real card shapes) ----------

function Sk({ w = '100%', h = '1rem', dark = false, style, className }) {
  return <div className={cn('hp-sk', dark && 'hp-sk-dark', className)} style={{ width: w, height: h, ...style }} aria-hidden="true" />
}

function SkCard({ media = true }) {
  return (
    <div className="hp-skcard" aria-hidden="true">
      {media && <Sk h="11rem" style={{ borderRadius: 0 }} />}
      <div style={{ padding: '1rem 1.125rem 1.25rem', display: 'grid', gap: '0.625rem' }}>
        <Sk w="40%" h="0.75rem" />
        <Sk w="85%" h="1.125rem" />
        <Sk h="0.75rem" />
        <Sk w="70%" h="0.75rem" />
        <Sk w="30%" h="0.875rem" style={{ marginTop: '0.5rem' }} />
      </div>
    </div>
  )
}

function SkCards({ count = 3, media = true }) {
  return (
    <div className="hp-grid3" aria-busy="true" aria-label="Loading">
      {Array.from({ length: count }, (_, i) => (
        <SkCard key={i} media={media} />
      ))}
    </div>
  )
}

function SkResearch() {
  return (
    <div className="hp-grid4" aria-busy="true" aria-label="Loading">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="hp-skcard" style={{ padding: '1.5rem', display: 'grid', gap: '0.75rem' }} aria-hidden="true">
          <Sk w="2.75rem" h="2.75rem" style={{ borderRadius: '0.75rem' }} />
          <Sk w="70%" h="1.25rem" />
          <Sk h="0.75rem" />
          <Sk w="80%" h="0.75rem" />
        </div>
      ))}
    </div>
  )
}

function SkPubs() {
  return (
    <ul className="hp-tl" aria-busy="true" aria-label="Loading">
      {Array.from({ length: 4 }, (_, i) => (
        <li key={i} className="hp-tl-item" aria-hidden="true">
          <span className="hp-rail">
            <Sk w="3.5rem" h="1.75rem" style={{ borderRadius: '9999px' }} />
          </span>
          <div className="hp-skcard" style={{ padding: '1.125rem 1.25rem 1.25rem', display: 'grid', gap: '0.625rem' }}>
            <Sk w="30%" h="0.875rem" />
            <Sk w="80%" h="1.25rem" />
            <Sk w="60%" h="0.75rem" />
            <Sk w="45%" h="0.75rem" />
            <Sk w="9rem" h="2rem" style={{ marginTop: '0.5rem', borderRadius: '0.5rem' }} />
          </div>
        </li>
      ))}
    </ul>
  )
}

function SkTestimonial() {
  return (
    <div style={{ display: 'grid', justifyItems: 'center', gap: '0.75rem' }} aria-busy="true" aria-label="Loading">
      <Sk dark w="min(20rem, 76vw)" h="22rem" style={{ borderRadius: '1rem' }} />
      <Sk dark w="8rem" h="0.5rem" style={{ borderRadius: '9999px' }} />
    </div>
  )
}

// ---------- Shared helpers (sirf Home ke liye) ----------

function ViewAll({ to, children = 'View all' }) {
  return (
    <Link
      to={to}
      className="group inline-flex items-center gap-1.5 rounded-full border border-primary/20 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-on-primary"
    >
      {children}
      <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
    </Link>
  )
}

function DataSection({ enabled, query, hasContent, tone, heading, skeleton, children }) {
  if (!enabled) return null

  if (query.isPending) {
    return (
      <Section tone={tone}>
        <SectionHeading {...heading} action={undefined} />
        {skeleton}
      </Section>
    )
  }

  if (query.isError || !hasContent) return null

  return (
    <Section tone={tone}>
      <SectionHeading {...heading} />
      {children}
    </Section>
  )
}

// ---------- 2. Research Interests (max 4) ----------

function ResearchInterestsSection() {
  const { slug, vis } = usePublicSite()
  const enabled = vis.isEnabled('home', 'research_interests')
  const query = useAcademic(slug, { enabled })
  const items = (query.data?.research_interests ?? []).slice(0, 4)

  return (
    <DataSection
      enabled={enabled}
      query={query}
      hasContent={items.length > 0}
      tone="background"
      heading={{ eyebrow: 'Focus areas', title: 'Research Interests' }}
      skeleton={<SkResearch />}
    >
      <div className="hp-grid4 hp-steps">
        {items.map((item, i) => (
          <Reveal key={item.id} delay={i * 90} className="h-full">
            <article className="hp-step">
              <div className="hp-step-card">
                <span className="hp-num" aria-hidden="true">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="hp-step-title">{item.title}</h3>
                {item.description && (
                  <p className="hp-step-text text-body" title={item.description}>
                    {item.description}
                  </p>
                )}
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </DataSection>
  )
}

// ---------- 3. Featured Projects (3 cards) ----------

function tagsOf(project) {
  const raw = project.tags ?? project.technologies ?? project.tech_stack ?? []
  return (Array.isArray(raw) ? raw : String(raw).split(','))
    .map((t) => String(asText(t)).trim())
    .filter(Boolean)
    .slice(0, 3)
}

function HomeProjectCard({ project, to }) {
  const cover = project.thumbnail ?? project.cover_image ?? project.image ?? project.gallery_images?.[0]?.image ?? null
  const text = project.short_description ?? project.summary ?? project.description ?? ''
  const category = asText(project.category)
  const tags = tagsOf(project)
  const photos = Array.isArray(project.gallery_images) ? project.gallery_images.length : 0

  return (
    <Link to={to} className="hp-card group border-line bg-card hover:border-primary rounded-xl border shadow-xs">
      <div className="hp-media">
        <CardImage src={cover} alt={project.title} icon={FolderOpen} />
        <span style={{ position: 'absolute', top: '0.625rem', left: '0.625rem', display: 'flex', gap: '0.375rem', zIndex: 1 }}>
          {project.is_featured && (
            <Badge variant="accent" size="sm">
              Featured
            </Badge>
          )}
          {category && (
            <Badge variant="primary" size="sm" className="bg-card/90 backdrop-blur-sm">
              {category}
            </Badge>
          )}
        </span>
        {photos > 1 && (
          <span
            className="bg-card/90 text-body backdrop-blur-sm"
            style={{
              position: 'absolute',
              right: '0.625rem',
              bottom: '0.625rem',
              zIndex: 1,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              padding: '0.1875rem 0.5rem',
              borderRadius: '9999px',
              fontSize: '0.6875rem',
              fontWeight: 500,
            }}
          >
            <Camera width={11} height={11} aria-hidden="true" />
            {photos}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', flex: 1, flexDirection: 'column', padding: '1rem 1.125rem 1.125rem' }}>
        <h3 className="group-hover:text-primary transition-colors" style={{ fontSize: '1.125rem', lineHeight: 1.35, ...clamp(2) }}>
          {project.title}
        </h3>
        {text && (
          <p className="text-muted" style={{ fontSize: '0.8125rem', lineHeight: 1.65, marginTop: '0.5rem', ...clampJ(3) }}>
            {text}
          </p>
        )}
        {tags.length > 0 && (
          <span style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginTop: '0.75rem' }}>
            {tags.map((tag) => (
              <span key={tag} className="hp-tag text-body">
                {tag}
              </span>
            ))}
          </span>
        )}
        <span className="hp-more text-primary">
          View project
          <ArrowRight width={14} height={14} aria-hidden="true" />
        </span>
      </div>
    </Link>
  )
}

function FeaturedProjectsSection() {
  const { slug, vis } = usePublicSite()
  const enabled = vis.isEnabled('home', 'featured_projects') && vis.isPageVisible('projects')
  const query = useProjects(slug, { enabled })
  const all = query.data ?? []
  const items = [...all.filter((p) => p.is_featured), ...all.filter((p) => !p.is_featured)].slice(0, 3)

  return (
    <DataSection
      enabled={enabled}
      query={query}
      hasContent={items.length > 0}
      tone="blue-tint"
      heading={{
        eyebrow: 'Selected work',
        title: 'Featured Projects',
        action: <ViewAll to={paths.siteProjects(slug)} />,
      }}
      skeleton={<SkCards count={3} />}
    >
      <div className="hp-grid3">
        {items.map((project, i) => (
          <Reveal key={project.id} delay={i * 90} className="h-full">
            <HomeProjectCard project={project} to={paths.siteProject(slug, project.id)} />
          </Reveal>
        ))}
      </div>
    </DataSection>
  )
}

// ---------- 4. Latest Publications (4 rows) ----------

function authorListOf(pub) {
  const raw = pub.authors ?? pub.author ?? ''
  if (Array.isArray(raw)) return raw.map((x) => String(asText(x)).trim()).filter(Boolean)
  return String(asText(raw))
    .split(/;|,|\band\b/i)
    .map((x) => x.trim())
    .filter(Boolean)
}

const lastNameOf = (name = '') =>
  name.replace(/^(dr|prof)\.?\s+/i, '').trim().split(/\s+/).pop()?.toLowerCase() ?? ''

function linkOf(pub) {
  const direct = pub.url ?? pub.link ?? pub.pdf_url ?? pub.external_url
  if (direct) return direct
  if (pub.doi) return `https://doi.org/${String(pub.doi).replace(/^https?:\/\/(dx\.)?doi\.org\//, '')}`
  return null
}

function HomePublicationItem({ publication, owner, index }) {
  const [copied, setCopied] = useState(false)
  const authors = authorListOf(publication)
  const venue = String(asText(publication.journal ?? publication.venue ?? publication.publisher ?? publication.conference ?? ''))
  const kind = prettify(publication.type ?? publication.publication_type ?? '')
  const cites = Number(publication.citations ?? publication.citation_count)
  const href = linkOf(publication)
  const ownerLast = lastNameOf(owner)

  const copyCitation = async () => {
    const text = [
      authors.length ? authors.join(', ') : '',
      publication.year ? `(${publication.year}).` : '',
      `${publication.title}.`,
      venue ? `${venue}.` : '',
      href ?? '',
    ]
      .filter(Boolean)
      .join(' ')
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      notify.success('Citation copied')
      setTimeout(() => setCopied(false), 1800)
    } catch {
      notify.error('Could not copy citation')
    }
  }

  return (
    <li className="hp-tl-item">
      <span className="hp-rail" aria-hidden="true">
        <span className="hp-dot">{publication.year ?? <BookOpen width={14} height={14} />}</span>
      </span>

      <Reveal delay={index * 80}>
        <article className="hp-pcard border-line bg-card hover:border-primary rounded-xl border shadow-xs">
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem' }}>
            {publication.year && (
              <span className="hp-dot hp-yr-inline" style={{ minWidth: 0, boxShadow: 'none', fontSize: '0.6875rem', padding: '0.1875rem 0.625rem' }}>
                {publication.year}
              </span>
            )}
            {index === 0 && (
              <Badge variant="accent" size="sm">
                Latest
              </Badge>
            )}
            {kind && (
              <Badge variant="primary" size="sm">
                {kind}
              </Badge>
            )}
            {Number.isFinite(cites) && cites > 0 && (
              <span className="hp-cites text-heading" style={{ marginLeft: 'auto' }}>
                <Quote width={12} height={12} aria-hidden="true" />
                {cites.toLocaleString()} {cites === 1 ? 'citation' : 'citations'}
              </span>
            )}
          </div>

          <h3 style={{ fontSize: '1.1875rem', lineHeight: 1.35, marginTop: '0.75rem' }}>{publication.title}</h3>

          {authors.length > 0 && (
            <p className="text-body" style={{ fontSize: '0.875rem', lineHeight: 1.6, marginTop: '0.5rem' }}>
              {authors.map((name, i) => {
                const mine = ownerLast && name.toLowerCase().includes(ownerLast)
                return (
                  <span key={`${name}-${i}`}>
                    <span className={mine ? 'text-heading' : undefined} style={mine ? { fontWeight: 600 } : undefined}>
                      {name}
                    </span>
                    {i < authors.length - 1 ? ', ' : ''}
                  </span>
                )
              })}
            </p>
          )}

          {venue && (
            <p className="text-muted" style={{ display: 'flex', alignItems: 'flex-start', gap: '0.375rem', fontSize: '0.8125rem', fontStyle: 'italic', marginTop: '0.375rem' }}>
              <BookOpen width={14} height={14} style={{ flexShrink: 0, marginTop: '0.125rem' }} aria-hidden="true" />
              <span>{venue}</span>
            </p>
          )}

          <div className="hp-actions">
            {href && (
              <a href={href} target="_blank" rel="noopener noreferrer" className="hp-btn hp-btn-primary">
                View paper
                <ExternalLink width={13} height={13} aria-hidden="true" />
              </a>
            )}
            <button type="button" className="hp-btn" onClick={copyCitation} aria-live="polite">
              {copied ? <Check width={13} height={13} aria-hidden="true" /> : <Copy width={13} height={13} aria-hidden="true" />}
              {copied ? 'Copied' : 'Copy citation'}
            </button>
          </div>
        </article>
      </Reveal>
    </li>
  )
}

function LatestPublicationsSection() {
  const { slug, vis, portfolio } = usePublicSite()
  const enabled = vis.isEnabled('home', 'latest_publications') && vis.isPageVisible('publications')
  const query = usePublications(slug, { enabled })
  const items = [...(query.data ?? [])].sort((a, b) => (b.year ?? 0) - (a.year ?? 0)).slice(0, 4)

  return (
    <DataSection
      enabled={enabled}
      query={query}
      hasContent={items.length > 0}
      tone="background"
      heading={{
        eyebrow: 'Research output',
        title: 'Latest Publications',
        action: <ViewAll to={paths.sitePublications(slug)} />,
      }}
      skeleton={<SkPubs />}
    >
      <ul className="hp-tl">
        {items.map((publication, i) => (
          <HomePublicationItem key={publication.id} publication={publication} owner={portfolio?.full_name} index={i} />
        ))}
      </ul>
    </DataSection>
  )
}

// ---------- 5. Testimonials (3D coverflow carousel) ----------
// Center card clear, side cards chhote + blur + peeche.
// Auto-play 7s (hover/focus par ruk jata hai, reduced-motion par band), arrows, dots, swipe,
// side card par click => center, keyboard ← → bhi chalta hai. Neeche autoplay progress bar.
// Optional fields: item.rating (1-5) => stars, item.is_verified => "Verified" badge.

const AUTOPLAY_MS = 7000
// Size yahan se control hota hai (card chhota/bara karna ho to sirf ye 3 badlo)
const CARD_W = 'min(20rem, 76vw)'
const CARD_H = '22rem'
const STAGE_H = '25rem'

// Backend quote ke shuru/aakhir mein "..." bhejta hai; card apne quote marks lagata hai
const cleanQuote = (text) => String(text ?? '').replace(/^["“”]+|["“”]+$/g, '').trim()

function TestimonialCard({ item }) {
  const [failed, setFailed] = useState(false)
  const rating = Number(item.rating) || 0

  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-2xl bg-background p-2.5 shadow-2xl ring-1 ring-primary/10">
      <Quote
        className="pointer-events-none absolute text-primary/5"
        style={{ right: '-0.5rem', bottom: '-0.5rem', width: '7rem', height: '7rem' }}
        aria-hidden="true"
      />

      {/* Photo (oval) + badges */}
      <div className="relative">
        <div className="mx-auto aspect-[11/6] w-full overflow-hidden rounded-[50%] bg-primary-soft">
          {item.author_photo && !failed ? (
            <img
              src={item.author_photo}
              alt={item.author_name}
              onError={() => setFailed(true)}
              className="size-full object-cover object-[50%_12%]"
              draggable={false}
            />
          ) : (
            <span
              className="flex size-full items-center justify-center font-serif text-4xl font-semibold text-primary"
              aria-hidden="true"
            >
              {initialsOf(item.author_name)}
            </span>
          )}
        </div>

        {item.is_verified && (
          <span className="absolute top-0 right-0 inline-flex items-center gap-1 rounded-full bg-background px-2.5 py-0.5 text-[11px] font-semibold text-navy shadow-md">
            <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
            Verified client
          </span>
        )}

        {rating > 0 && (
          <span
            className="absolute bottom-0 left-0 inline-flex items-center gap-0.5 rounded-full bg-primary-soft px-2.5 py-1 ring-4 ring-background"
            aria-label={`${rating} out of 5 stars`}
          >
            {Array.from({ length: 5 }, (_, i) => (
              <Star
                key={i}
                className={cn('size-3.5', i < rating ? 'fill-primary text-primary' : 'text-primary/30')}
                aria-hidden="true"
              />
            ))}
          </span>
        )}
      </div>

      {/* Name + designation */}
      <div className="relative mt-3 px-1.5">
        <p className="flex items-center gap-1.5 font-serif text-lg leading-tight font-semibold text-navy">
          <span className="truncate">{item.author_name}</span>
          {item.is_verified && <BadgeCheck className="size-4 shrink-0 text-emerald-500" aria-hidden="true" />}
        </p>
        {item.author_title && (
          <p className="mt-1 truncate text-[11px] font-semibold tracking-widest text-body uppercase">
            {item.author_title}
          </p>
        )}
      </div>

      {/* Divider + quote */}
      <div className="relative mt-2.5 flex items-center gap-2 px-1.5">
        <span className="h-px flex-1 bg-primary/20" aria-hidden="true" />
        <Quote className="size-3.5 text-primary" aria-hidden="true" />
      </div>
      <blockquote className="relative mt-2 min-h-0 flex-1 overflow-hidden px-1.5 pb-1">
        <p className="line-clamp-4 text-sm leading-relaxed text-body">{cleanQuote(item.quote)}</p>
      </blockquote>
    </div>
  )
}

function TestimonialSlider({ items }) {
  const count = items.length
  const many = count > 1
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const touchX = useRef(null)
  const active = Math.min(index, count - 1)

  const go = (step) => setIndex((i) => (i + step + count) % count)

  useEffect(() => {
    if (!many || paused) return undefined
    if (prefersReducedMotion()) return undefined
    const timer = setTimeout(() => setIndex((i) => (i + 1) % count), AUTOPLAY_MS)
    return () => clearTimeout(timer)
  }, [many, paused, count, active])

  const onTouchStart = (e) => {
    touchX.current = e.touches[0].clientX
  }
  const onTouchEnd = (e) => {
    if (touchX.current === null) return
    const diff = e.changedTouches[0].clientX - touchX.current
    touchX.current = null
    if (Math.abs(diff) > 50) go(diff < 0 ? 1 : -1)
  }

  const onKeyDown = (e) => {
    if (e.key === 'ArrowLeft') go(-1)
    if (e.key === 'ArrowRight') go(1)
  }

  // Circular offset: active = 0, left = -1, -2 ... right = +1, +2 ...
  const offsetOf = (i) => {
    const half = Math.floor(count / 2)
    return ((i - active + count + half) % count) - half
  }

  const arrow =
    'inline-flex size-11 items-center justify-center rounded-full border border-on-navy/20 bg-on-navy/5 text-on-navy transition-colors hover:border-primary hover:bg-primary hover:text-on-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'

  return (
    <div
      className="relative mx-auto w-full max-w-4xl"
      role="region"
      aria-roledescription="carousel"
      aria-label="Testimonials"
      tabIndex={0}
      onKeyDown={onKeyDown}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {/* Stage */}
      <div
        className="relative overflow-hidden"
        style={{ height: STAGE_H, perspective: '1200px' }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div
          className="pointer-events-none absolute inset-x-1/3 top-8 bottom-8 rounded-full bg-primary/20 blur-3xl"
          aria-hidden="true"
        />

        {items.map((item, i) => {
          const offset = offsetOf(i)
          const abs = Math.abs(offset)
          const isActive = offset === 0
          const visible = abs <= 2

          return (
            <div
              key={item.id}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${count}`}
              aria-hidden={!isActive}
              onClick={() => !isActive && setIndex(i)}
              className={cn(
                'absolute transition-all duration-500 ease-out motion-reduce:transition-none',
                !isActive && visible && 'cursor-pointer',
              )}
              style={{
                top: '1.5rem',
                height: CARD_H,
                left: '50%',
                width: CARD_W,
                marginLeft: `calc(${CARD_W} / -2)`,
                transform: `translateX(${offset * 64}%) translateZ(${-abs * 80}px) rotateY(${offset * -8}deg) scale(${1 - abs * 0.1})`,
                opacity: !visible ? 0 : isActive ? 1 : abs === 1 ? 0.6 : 0.3,
                filter: isActive ? 'none' : `blur(${abs * 2 + 1}px)`,
                zIndex: 10 - abs,
                pointerEvents: visible ? 'auto' : 'none',
              }}
            >
              <TestimonialCard item={item} />
            </div>
          )
        })}
      </div>

      {many && (
        <>
          <div className="mt-4 flex items-center justify-center gap-4">
            <button type="button" className={arrow} aria-label="Previous testimonial" onClick={() => go(-1)}>
              <ChevronLeft className="size-5" />
            </button>
            <div className="flex gap-2" role="group" aria-label="Choose testimonial">
              {items.map((item, i) => (
                <button
                  key={item.id}
                  type="button"
                  aria-label={`Testimonial ${i + 1}`}
                  aria-current={i === active}
                  onClick={() => setIndex(i)}
                  className={cn(
                    'h-2 rounded-full transition-all',
                    i === active ? 'w-8 bg-accent' : 'w-2 bg-on-navy/30 hover:bg-on-navy/50',
                  )}
                />
              ))}
            </div>
            <button type="button" className={arrow} aria-label="Next testimonial" onClick={() => go(1)}>
              <ChevronRight className="size-5" />
            </button>
          </div>

          {/* autoplay progress: hover par ruk kar reset ho jati hai (timer ke saath sync) */}
          <span className="hp-prog" aria-hidden="true">
            <i
              key={`${active}-${paused}`}
              style={{ animationDuration: `${AUTOPLAY_MS}ms`, animationPlayState: paused ? 'paused' : 'running' }}
            />
          </span>
        </>
      )}
    </div>
  )
}

function TestimonialsSection() {
  const { slug, vis } = usePublicSite()
  const enabled = vis.isEnabled('home', 'testimonials')
  const query = useTestimonials(slug, { enabled })
  const items = (query.data ?? []).slice(0, 5)

  return (
    <DataSection
      enabled={enabled}
      query={query}
      hasContent={items.length > 0}
      tone="navy"
      heading={{ eyebrow: 'Kind words', title: 'What People Say', align: 'center' }}
      skeleton={<SkTestimonial />}
    >
      <Reveal>
        <TestimonialSlider items={items} />
      </Reveal>
    </DataSection>
  )
}

// ---------- 6. Latest Blogs (3 cards) ----------

// Chhota avatar: backend photo, na ho ya fail ho to initials
function HpAvatar({ src, name }) {
  const [failed, setFailed] = useState(false)
  return (
    <span className="hp-av" aria-hidden="true">
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

function HomeBlogCard({ blog, to, owner, photo }) {
  const title = blog.title ?? ''
  const excerpt = blog.excerpt ?? blog.summary ?? blog.short_description ?? ''
  const category = asText(blog.category)
  const cover = blog.cover_image ?? blog.thumbnail ?? blog.image ?? null
  const published = blog.published_at ?? blog.created_at ?? null

  // Author: article ka apna, warna portfolio ka malik; photo sirf malik ke liye
  const author = String(asText(blog.author) || owner || '')
  const isOwner = !blog.author || !owner || author.toLowerCase().includes(lastNameOf(owner))

  return (
    <Link to={to} className="hp-card group border-line bg-card hover:border-primary rounded-xl border shadow-xs">
      <div className="hp-media">
        <CardImage src={cover} alt={title} icon={FileText} />
        {category && (
          <span style={{ position: 'absolute', top: '0.625rem', left: '0.625rem', zIndex: 1 }}>
            <Badge variant="primary" size="sm" className="bg-card/90 backdrop-blur-sm">
              {category}
            </Badge>
          </span>
        )}
        <span className="hp-read-chip" aria-hidden="true">
          Read article
          <ArrowRight width={12} height={12} />
        </span>
      </div>

      <div style={{ display: 'flex', flex: 1, flexDirection: 'column', padding: '1rem 1.125rem 1.125rem' }}>
        <p className="hp-meta text-muted">
          {published && (
            <span>
              <CalendarDays width={12} height={12} aria-hidden="true" />
              <time dateTime={published}>{formatDate(published)}</time>
            </span>
          )}
          {blog.reading_time && (
            <span>
              <Clock width={12} height={12} aria-hidden="true" />
              {blog.reading_time} min read
            </span>
          )}
        </p>

        <h3 className="group-hover:text-primary transition-colors" style={{ fontSize: '1.125rem', lineHeight: 1.35, marginTop: '0.5rem', ...clamp(2) }}>
          {title}
        </h3>
        {excerpt && (
          <p className="text-muted" style={{ fontSize: '0.8125rem', lineHeight: 1.65, marginTop: '0.5rem', marginBottom: '0.875rem', ...clampJ(3) }}>
            {excerpt}
          </p>
        )}

        <div className="hp-foot">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
            {author && <HpAvatar src={isOwner ? photo : null} name={author} />}
            {author && (
              <span className="text-heading" style={{ fontSize: '0.75rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {author}
              </span>
            )}
          </span>
          <span className="hp-go" aria-hidden="true">
            <ArrowRight width={14} height={14} />
          </span>
        </div>
      </div>
    </Link>
  )
}

function LatestBlogsSection() {
  const { slug, vis, portfolio } = usePublicSite()
  const enabled = vis.isEnabled('home', 'latest_blogs') && vis.isPageVisible('blogs')
  const query = useBlogs(slug, { enabled })
  const items = [...(query.data ?? [])]
    .sort((a, b) => new Date(b.published_at) - new Date(a.published_at))
    .slice(0, 3)

  return (
    <DataSection
      enabled={enabled}
      query={query}
      hasContent={items.length > 0}
      tone="surface"
      heading={{
        eyebrow: 'From the blog',
        title: 'Latest Articles',
        action: <ViewAll to={paths.siteBlogs(slug)} />,
      }}
      skeleton={<SkCards count={3} />}
    >
      <div className="hp-grid3">
        {items.map((blog, i) => (
          <Reveal key={blog.id} delay={i * 90} className="h-full">
            <HomeBlogCard
              blog={blog}
              to={paths.siteBlog(slug, blog.slug ?? blog.id)}
              owner={portfolio?.full_name}
              photo={portfolio?.photo ?? portfolio?.profile_photo ?? null}
            />
          </Reveal>
        ))}
      </div>
    </DataSection>
  )
}

// ---------- Page ----------

export function HomePage() {
  return (
    <div className="home-root">
      <HomeStyles />
      <ScrollProgress />
      <Hero />
      <ResearchInterestsSection />
      <FeaturedProjectsSection />
      <LatestPublicationsSection />
      <TestimonialsSection />
      <LatestBlogsSection />
    </div>
  )
}