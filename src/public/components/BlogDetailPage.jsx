import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CalendarDays, Check, Clock, Link2 } from 'lucide-react'
import { ErrorState } from '@/components/shared/ErrorState'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { paths } from '@/routes/paths'
import { BlogCard } from '@/public/components/BlogCard'
import { Container } from '@/public/components/Container'
import { PublicNotFound } from '@/public/components/PublicNotFound'
import { Section } from '@/public/components/Section'
import { useBlog, useBlogs } from '@/public/hooks/usePublicData'
import { usePublicSite } from '@/public/hooks/usePublicSite'

// =====================================================================================
// BLOG DETAIL PAGE: poora code isi file mein. Route: /:slug/blogs/:blogSlug (PageGuard "blogs" ke andar).
// Planning doc: cover, title, author, category, date, reading time, rich content, related articles, Back link.
//   1. Header (surface): Back link, category, title, excerpt, author + date + reading time, cover (agar ho)
//   2. Article (background): rich content | right sidebar (On this page + Share), scroll par reading progress bar
//   3. Author card + related articles (blue-tint, 3 cards: same category pehle)
// Rich content (Tiptap HTML) SAFE render hota hai: HTML ko parse kar ke sirf allowed tags React elements ban'te hain
// (script/style/iframe/on* attributes/javascript: links sab drop). dangerouslySetInnerHTML kahin nahi.
// =====================================================================================

// ---------- Helpers ----------

function initialsOf(name = '') {
  const parts = name.replace(/^(dr|prof)\.?\s+/i, '').trim().split(/\s+/).filter(Boolean)
  return parts.length ? (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase() : '?'
}

const slugify = (text) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')

const SAFE_URL = /^(https?:\/\/|mailto:|tel:|\/|#)/i
const SAFE_IMG = /^https?:\/\//i
const isExternal = (href) => /^https?:\/\//i.test(href)

// ---------- Safe rich-content renderer ----------

const DROP = new Set(['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'textarea', 'select', 'link', 'meta', 'svg', 'math', 'noscript'])

const textClass = 'text-[1.0625rem] leading-8 text-body'

// DOM node -> React node. Unknown tags: sirf unka text/children (tag nahi).
function convert(node, ctx, key) {
  if (node.nodeType === 3) return node.textContent
  if (node.nodeType !== 1) return null

  const tag = node.tagName.toLowerCase()
  if (DROP.has(tag)) return null

  const kids = () => [...node.childNodes].map((child, i) => convert(child, ctx, i))

  switch (tag) {
    case 'p':
      return (
        <p key={key} className={cn('my-5', textClass)}>
          {kids()}
        </p>
      )
    case 'h1':
    case 'h2':
    case 'h3':
    case 'h4': {
      const level = tag === 'h1' || tag === 'h2' ? 2 : tag === 'h3' ? 3 : 4
      const text = node.textContent.trim()
      let id
      if (level < 4 && text) {
        id = slugify(text) || `section-${ctx.headings.length + 1}`
        if (ctx.used.has(id)) id = `${id}-${ctx.headings.length + 1}`
        ctx.used.add(id)
        ctx.headings.push({ id, text, level })
      }
      const Tag = `h${level}`
      const size = level === 2 ? 'mt-12 mb-4 text-2xl sm:text-3xl' : level === 3 ? 'mt-9 mb-3 text-xl sm:text-2xl' : 'mt-7 mb-2 text-lg'
      return (
        <Tag key={key} id={id} className={cn('scroll-mt-24', size)}>
          {kids()}
        </Tag>
      )
    }
    case 'ul':
      return (
        <ul key={key} className={cn('my-5 list-disc space-y-2 pl-6 marker:text-primary', textClass)}>
          {kids()}
        </ul>
      )
    case 'ol':
      return (
        <ol key={key} className={cn('my-5 list-decimal space-y-2 pl-6 marker:font-semibold marker:text-primary', textClass)}>
          {kids()}
        </ol>
      )
    case 'li':
      return <li key={key}>{kids()}</li>
    case 'blockquote':
      return (
        <blockquote key={key} className="my-8 border-l-4 border-accent pl-5 font-serif text-xl leading-snug text-heading italic">
          {kids()}
        </blockquote>
      )
    case 'a': {
      const href = node.getAttribute('href') ?? ''
      if (!SAFE_URL.test(href.trim())) return <span key={key}>{kids()}</span>
      const external = isExternal(href)
      return (
        <a
          key={key}
          href={href.trim()}
          {...(external ? { target: '_blank', rel: 'noopener noreferrer nofollow' } : {})}
          className="font-medium text-primary underline decoration-primary/40 underline-offset-2 transition-colors hover:decoration-primary"
        >
          {kids()}
        </a>
      )
    }
    case 'strong':
    case 'b':
      return (
        <strong key={key} className="font-semibold text-heading">
          {kids()}
        </strong>
      )
    case 'em':
    case 'i':
      return <em key={key}>{kids()}</em>
    case 'u':
      return (
        <u key={key} className="underline-offset-2">
          {kids()}
        </u>
      )
    case 's':
    case 'del':
      return <s key={key}>{kids()}</s>
    case 'mark':
      return (
        <mark key={key} className="rounded bg-accent/25 px-1 text-heading">
          {kids()}
        </mark>
      )
    case 'sup':
      return <sup key={key}>{kids()}</sup>
    case 'sub':
      return <sub key={key}>{kids()}</sub>
    case 'br':
      return <br key={key} />
    case 'hr':
      return <hr key={key} className="my-10 border-line" />
    case 'code':
      if (ctx.inPre) return <code key={key}>{kids()}</code>
      return (
        <code key={key} className="rounded bg-primary-soft px-1.5 py-0.5 font-mono text-[0.9em] text-heading">
          {kids()}
        </code>
      )
    case 'pre': {
      const prev = ctx.inPre
      ctx.inPre = true
      const children = kids()
      ctx.inPre = prev
      return (
        <pre key={key} className="my-6 overflow-x-auto rounded-xl border border-line bg-surface p-4 font-mono text-sm leading-relaxed text-heading">
          {children}
        </pre>
      )
    }
    case 'img': {
      const src = node.getAttribute('src') ?? ''
      if (!SAFE_IMG.test(src.trim())) return null
      return (
        <img
          key={key}
          src={src.trim()}
          alt={node.getAttribute('alt') ?? ''}
          loading="lazy"
          className="my-6 h-auto max-w-full rounded-xl border border-line"
        />
      )
    }
    case 'figure':
      return (
        <figure key={key} className="my-8">
          {kids()}
        </figure>
      )
    case 'figcaption':
      return (
        <figcaption key={key} className="mt-2 text-center text-sm text-muted">
          {kids()}
        </figcaption>
      )
    case 'table':
      return (
        <div key={key} className="my-6 overflow-x-auto rounded-xl border border-line">
          <table className="w-full border-collapse text-left text-[0.95rem] text-body">{kids()}</table>
        </div>
      )
    case 'thead':
      return <thead key={key} className="bg-surface">{kids()}</thead>
    case 'tbody':
      return <tbody key={key}>{kids()}</tbody>
    case 'tr':
      return (
        <tr key={key} className="border-b border-line last:border-b-0">
          {kids()}
        </tr>
      )
    case 'th':
      return (
        <th key={key} className="px-4 py-2.5 font-semibold text-heading">
          {kids()}
        </th>
      )
    case 'td':
      return (
        <td key={key} className="px-4 py-2.5 align-top">
          {kids()}
        </td>
      )
    default:
      // div, span, section... : tag hata kar content rakho
      return <span key={key}>{kids()}</span>
  }
}

// content (HTML ya plain text) -> { nodes, headings, words }
function parseContent(content) {
  const text = String(content ?? '').trim()
  if (!text) return { nodes: [], headings: [], words: 0 }

  const ctx = { headings: [], used: new Set(), inPre: false }

  if (!/<[a-z][\s\S]*>/i.test(text)) {
    const paras = text.split(/\n\s*\n/).map((t) => t.trim()).filter(Boolean)
    return {
      nodes: paras.map((t, i) => (
        <p key={i} className={cn('my-5', textClass)}>
          {t}
        </p>
      )),
      headings: [],
      words: text.split(/\s+/).length,
    }
  }

  const doc = new DOMParser().parseFromString(text, 'text/html')
  const nodes = [...doc.body.childNodes].map((child, i) => convert(child, ctx, i))
  const words = (doc.body.textContent ?? '').trim().split(/\s+/).filter(Boolean).length
  return { nodes, headings: ctx.headings, words }
}

// ---------- Pieces ----------

function ReadingProgress({ targetRef }) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const update = () => {
      const el = targetRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const total = rect.height - window.innerHeight * 0.6
      const done = -rect.top + window.innerHeight * 0.2
      setProgress(total > 0 ? Math.min(1, Math.max(0, done / total)) : 0)
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [targetRef])

  return (
    <div className="fixed inset-x-0 top-0 z-50 h-0.5 bg-transparent" aria-hidden="true">
      <div className="h-full origin-left bg-primary" style={{ transform: `scaleX(${progress})` }} />
    </div>
  )
}

function Avatar({ name, className }) {
  return (
    <span
      className={cn('flex shrink-0 items-center justify-center rounded-full bg-primary font-serif font-semibold text-on-primary', className)}
      aria-hidden="true"
    >
      {initialsOf(name)}
    </span>
  )
}

// Share icons (inline SVG, alag BrandIcon file ki zaroorat nahi)
const SHARE_ICONS = {
  linkedin: { viewBox: '0 0 448 512', d: 'M100.28 448H7.4V148.9h92.88zM53.79 108.1C24.09 108.1 0 83.5 0 53.8a53.79 53.79 0 0 1 107.58 0c0 29.7-24.1 54.3-53.79 54.3zM447.9 448h-92.68V302.4c0-34.7-.7-79.2-48.29-79.2-48.29 0-55.69 37.7-55.69 76.7V448h-92.78V148.9h89.08v40.8h1.3c12.4-23.5 42.69-48.3 87.88-48.3 94 0 111.28 61.9 111.28 142.3V448z' },
  x: { viewBox: '0 0 24 24', d: 'M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299-.929-1.329L3.076 1.56h3.182l5.965 8.532.929 1.329 7.754 11.09h-3.182z' },
  whatsapp: { viewBox: '0 0 24 24', d: 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z' },
}

function ShareIcon({ name, className }) {
  const icon = SHARE_ICONS[name]
  return (
    <svg viewBox={icon.viewBox} fill="currentColor" aria-hidden="true" className={className}>
      <path d={icon.d} />
    </svg>
  )
}

const shareBtn =
  'inline-flex size-9 items-center justify-center rounded-full bg-primary-soft text-primary transition-colors hover:bg-primary hover:text-on-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none'

function ShareLinks({ title, className }) {
  const [copied, setCopied] = useState(false)
  const timer = useRef(null)
  useEffect(() => () => clearTimeout(timer.current), [])

  const url = typeof window === 'undefined' ? '' : window.location.href
  const enc = encodeURIComponent
  const links = [
    { name: 'linkedin', label: 'Share on LinkedIn', href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}` },
    { name: 'x', label: 'Share on X', href: `https://twitter.com/intent/tweet?url=${enc(url)}&text=${enc(title)}` },
    { name: 'whatsapp', label: 'Share on WhatsApp', href: `https://wa.me/?text=${enc(`${title} ${url}`)}` },
  ]

  const copy = async () => {
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(url)
      else {
        const area = document.createElement('textarea')
        area.value = url
        area.style.cssText = 'position:fixed;opacity:0'
        document.body.appendChild(area)
        area.select()
        document.execCommand('copy')
        area.remove()
      }
      setCopied(true)
      clearTimeout(timer.current)
      timer.current = setTimeout(() => setCopied(false), 2000)
    } catch {
      // copy na ho to chup: share links phir bhi kaam karte hain
    }
  }

  return (
    <div className={className}>
      <p className="text-xs font-semibold tracking-widest text-muted uppercase">Share</p>
      <div className="mt-3 flex items-center gap-2">
        {links.map((l) => (
          <a key={l.name} href={l.href} target="_blank" rel="noopener noreferrer" aria-label={l.label} className={shareBtn}>
            <ShareIcon name={l.name} className="size-4" />
          </a>
        ))}
        <button type="button" onClick={copy} aria-label="Copy link" className={shareBtn}>
          {copied ? <Check className="size-4" aria-hidden="true" /> : <Link2 className="size-4" aria-hidden="true" />}
        </button>
        <span className="text-sm text-muted" aria-live="polite">
          {copied ? 'Link copied' : ''}
        </span>
      </div>
    </div>
  )
}

function Toc({ headings }) {
  const [active, setActive] = useState('')

  useEffect(() => {
    if (headings.length === 0) return undefined
    const observer = new IntersectionObserver(
      (entries) => {
        const hit = entries.find((e) => e.isIntersecting)
        if (hit) setActive(hit.target.id)
      },
      { rootMargin: '-90px 0px -65% 0px' },
    )
    headings.forEach((h) => {
      const el = document.getElementById(h.id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [headings])

  if (headings.length < 2) return null

  return (
    <nav aria-label="On this page">
      <p className="text-xs font-semibold tracking-widest text-muted uppercase">On this page</p>
      <ul className="mt-3 space-y-1 border-l border-line">
        {headings.map((h) => (
          <li key={h.id}>
            <a
              href={`#${h.id}`}
              className={cn(
                '-ml-px block border-l-2 py-1 pr-2 text-sm leading-snug transition-colors',
                h.level === 3 ? 'pl-6' : 'pl-4',
                active === h.id ? 'border-primary font-medium text-heading' : 'border-transparent text-muted hover:text-heading',
              )}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

function CoverFigure({ src, alt }) {
  const [failed, setFailed] = useState(false)
  if (!src || failed) return null

  return (
    <figure className="mt-8 sm:mt-10">
      <img
        src={src}
        alt={alt}
        onError={() => setFailed(true)}
        className="aspect-[16/8] w-full rounded-2xl border border-line object-cover shadow-sm"
      />
    </figure>
  )
}

function BackLink({ to, className }) {
  return (
    <Link to={to} className={cn('inline-flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-heading', className)}>
      <ArrowLeft className="size-4" aria-hidden="true" />
      All articles
    </Link>
  )
}

// ---------- Loading ----------

function DetailSkeleton() {
  return (
    <>
      <section className="bg-surface py-10 sm:py-14" aria-busy="true" aria-label="Loading article">
        <Container className="max-w-3xl space-y-4">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-5 w-1/2" />
        </Container>
      </section>
      <Section tone="background">
        <div className="mx-auto max-w-3xl space-y-3">
          {[100, 100, 92, 100, 70].map((w, i) => (
            <Skeleton key={i} className="h-5" style={{ width: `${w}%` }} />
          ))}
        </div>
      </Section>
    </>
  )
}

// ---------- Page ----------

export function BlogDetailPage() {
  const { blogSlug } = useParams()
  const { slug, portfolio } = usePublicSite()
  const query = useBlog(slug, blogSlug)
  const blog = query.data
  const related = useBlogs(slug, { enabled: Boolean(blog) })
  const articleRef = useRef(null)

  const parsed = useMemo(() => parseContent(blog?.content), [blog?.content])

  // Tab title
  useEffect(() => {
    if (!blog?.title) return undefined
    const previous = document.title
    document.title = `${blog.title} | ${portfolio.full_name}`
    return () => {
      document.title = previous
    }
  }, [blog?.title, portfolio.full_name])

  const blogsTo = paths.siteBlogs(slug)

  if (query.isPending) return <DetailSkeleton />

  if (query.isError) {
    if (query.error?.status === 404) {
      return (
        <PublicNotFound
          homeTo={paths.site(slug)}
          title="Article not found"
          message="This article does not exist or is no longer available."
        />
      )
    }
    return (
      <Section tone="background">
        <BackLink to={blogsTo} className="mb-6" />
        <ErrorState message={query.error?.message} onRetry={query.refetch} />
      </Section>
    )
  }

  const author = blog.author || portfolio.full_name
  const minutes = blog.reading_time || (parsed.words ? Math.max(1, Math.ceil(parsed.words / 200)) : null)

  // Related: same category pehle, phir latest; current nikal kar, 3 tak
  const others = (related.data ?? []).filter((b) => b.slug !== blog.slug && b.id !== blog.id)
  const sameCategory = others.filter((b) => blog.category && b.category === blog.category)
  const relatedPosts = [...sameCategory, ...others.filter((b) => !sameCategory.includes(b))].slice(0, 3)

  return (
    <>
      <ReadingProgress targetRef={articleRef} />

      {/* 1. Header */}
      <header className="bg-surface pt-8 pb-10 sm:pt-10 sm:pb-14">
        <Container className="max-w-4xl">
          <BackLink to={blogsTo} />

          <div className="mt-6 max-w-3xl">
            {blog.category && <Badge variant="primary">{blog.category}</Badge>}
            <h1 className="mt-4 text-[clamp(1.875rem,4.6vw,3rem)] leading-[1.12]">{blog.title}</h1>
            {blog.excerpt && <p className="mt-4 text-lg leading-relaxed text-body sm:text-xl">{blog.excerpt}</p>}

            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-line pt-5 text-sm text-muted">
              <span className="flex items-center gap-2.5">
                <Avatar name={author} className="size-8 text-xs" />
                <span className="font-medium text-heading">{author}</span>
              </span>
              {blog.published_at && (
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="size-4" aria-hidden="true" />
                  <time dateTime={blog.published_at}>{formatDate(blog.published_at)}</time>
                </span>
              )}
              {minutes && (
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="size-4" aria-hidden="true" />
                  {minutes} min read
                </span>
              )}
            </div>
          </div>

          <CoverFigure src={blog.cover_image} alt={blog.title} />
        </Container>
      </header>

      {/* 2. Article */}
      <section className="bg-background py-10 sm:py-14">
        <Container className="max-w-4xl">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_14rem] lg:gap-14">
            <article ref={articleRef} className="min-w-0">
              <div className="max-w-3xl [&>*:first-child]:mt-0">
                {parsed.nodes.length > 0 ? (
                  parsed.nodes
                ) : (
                  <p className="text-muted">The full article will be published soon.</p>
                )}
              </div>

              <ShareLinks title={blog.title} className="mt-10 border-t border-line pt-6 lg:hidden" />
            </article>

            <aside className="hidden lg:block">
              <div className="sticky top-24 space-y-8">
                <Toc headings={parsed.headings} />
                <ShareLinks title={blog.title} />
              </div>
            </aside>
          </div>

          {/* Author card */}
          <div className="mt-12 flex items-center gap-4 rounded-2xl border border-line bg-card p-5 sm:p-6">
            <Avatar name={author} className="size-12 text-base sm:size-14 sm:text-lg" />
            <div className="min-w-0">
              <p className="text-xs font-semibold tracking-widest text-muted uppercase">Written by</p>
              <p className="font-serif text-lg font-semibold text-heading">{author}</p>
              {author === portfolio.full_name && portfolio.designation && (
                <p className="text-sm text-muted">{portfolio.designation}</p>
              )}
            </div>
          </div>
        </Container>
      </section>

      {/* 3. Related */}
      {relatedPosts.length > 0 && (
        <Section tone="blue-tint">
          <div className="mb-6 flex items-end justify-between gap-4">
            <h2 className="text-2xl sm:text-3xl">Keep reading</h2>
            <Link to={blogsTo} className="text-sm font-medium text-primary hover:underline">
              View all
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {relatedPosts.map((b) => (
              <BlogCard key={b.id} blog={b} to={paths.siteBlog(slug, b.slug)} />
            ))}
          </div>
        </Section>
      )}
    </>
  )
}
