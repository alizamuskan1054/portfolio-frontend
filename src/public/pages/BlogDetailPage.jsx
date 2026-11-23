import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, CalendarDays, Check, Clock, FileText, Link2 } from 'lucide-react'
import { ErrorState } from '@/components/shared/ErrorState'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { paths } from '@/routes/paths'
import { BrandIcon } from '@/public/components/BrandIcon'
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
//
// v2 (is file mein hi, koi aur file nahi):
//   * Cover image aur related cards mein image POORI dikhti hai (crop nahi): object-contain + peeche usi ka blur.
//     Related cards ab isi file ke andar hain (pehle shared BlogCard jo crop karta tha).
//   * Author avatar backend se: portfolio photo | profile_photo | logo (na ho to initials).
//     Photo sirf tab jab article ka author portfolio ka malik ho; kisi aur author ke initials.
//   * category object ho to bhi crash nahi (asText), tab title mein "undefined" nahi.
// =====================================================================================

// ---------- Helpers ----------

function initialsOf(name = '') {
  const parts = name.replace(/^(dr|prof)\.?\s+/i, '').trim().split(/\s+/).filter(Boolean)
  return parts.length ? (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase() : '?'
}

const lastNameOf = (name = '') =>
  String(name).replace(/^(dr|prof)\.?\s+/i, '').trim().split(/\s+/).pop()?.toLowerCase() ?? ''

// Backend kabhi object ({name}) bhejta hai kabhi string: dono sambhalte hain
const asText = (value) =>
  value && typeof value === 'object' ? (value.name ?? value.title ?? value.full_name ?? '') : String(value ?? '')

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

// Justify: har line dono taraf barabar khatam hoti hai. Hyphenation (lang ke saath) se bade khali gap nahi bante;
// aakhri line left par; text-wrap:pretty se akela lafz neeche nahi girta.
const textClass =
  'text-[1.0625rem] leading-8 text-body text-justify [hyphens:auto] [text-align-last:left] [text-wrap:pretty] [overflow-wrap:anywhere]'

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

// Backend wali photo/logo (src); na ho ya fail ho to initials
function Avatar({ name, src, className }) {
  const [failed, setFailed] = useState(false)
  return (
    <span
      className={cn('flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary font-serif font-semibold text-on-primary', className)}
      aria-hidden="true"
    >
      {src && !failed ? (
        <img
          src={src}
          alt=""
          draggable={false}
          onError={() => setFailed(true)}
          className="size-full object-cover"
          style={{ objectPosition: '50% 20%' }}
        />
      ) : (
        initialsOf(name)
      )}
    </span>
  )
}

// Image poori dikhti hai (object-contain), peeche usi ka blur taake khali patti dull na lage.
// placeholder=false: image na ho to kuch render nahi hota (cover ke liye); true: gradient + icon (cards ke liye).
function CardImage({ src, alt = '', className, imgClassName, placeholder = true }) {
  const [failed, setFailed] = useState(false)

  if (!src || failed) {
    if (!placeholder) return null
    return (
      <div className={cn('flex items-center justify-center bg-primary-soft text-primary', className)} aria-hidden="true">
        <FileText className="size-9" />
      </div>
    )
  }

  return (
    <div className={cn('relative overflow-hidden bg-primary-soft', className)}>
      <img
        src={src}
        alt=""
        aria-hidden="true"
        loading="lazy"
        draggable={false}
        className="absolute inset-0 size-full object-cover"
        style={{ filter: 'blur(18px) saturate(1.2)', transform: 'scale(1.15)', opacity: 0.55 }}
      />
      <img
        src={src}
        alt={alt}
        loading="lazy"
        draggable={false}
        onError={() => setFailed(true)}
        className={cn('relative size-full object-contain', imgClassName)}
      />
    </div>
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
            <BrandIcon name={l.name} className="size-4" />
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

// Cover: poori image (crop nahi); image na ho to kuch nahi dikhta
function CoverFigure({ src, alt }) {
  return (
    <figure className="mt-8 empty:hidden sm:mt-10">
      <CardImage
        src={src}
        alt={alt}
        placeholder={false}
        className="aspect-[16/8] w-full rounded-2xl border border-line shadow-sm"
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

// Related article card (pehle shared BlogCard tha jo image crop karta tha)
function RelatedCard({ blog, to }) {
  const category = asText(blog.category)
  const cover = blog.cover_image ?? blog.thumbnail ?? blog.image ?? null
  const excerpt = blog.excerpt ?? blog.summary ?? blog.short_description ?? ''
  const published = blog.published_at ?? blog.created_at ?? null

  return (
    <Link
      to={to}
      className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-line bg-card shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-lg motion-reduce:transition-none motion-reduce:hover:translate-y-0"
    >
      <div className="relative">
        <CardImage
          src={cover}
          alt={blog.title}
          className="aspect-[16/10]"
          imgClassName="transition-transform duration-700 group-hover:scale-105 motion-reduce:transition-none"
        />
        {category && (
          <span className="absolute top-2.5 left-2.5">
            <Badge variant="primary" size="sm" className="bg-card/90 backdrop-blur-sm">
              {category}
            </Badge>
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
          {published && <time dateTime={published}>{formatDate(published)}</time>}
          {blog.reading_time && (
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3" aria-hidden="true" />
              {blog.reading_time} min read
            </span>
          )}
        </p>
        <h3 className="mt-2 line-clamp-2 text-lg leading-snug transition-colors group-hover:text-primary">{blog.title}</h3>
        {excerpt && <p className="mt-2 line-clamp-3 text-justify [hyphens:auto] [text-align-last:left] text-sm leading-relaxed text-muted">{excerpt}</p>}
        <span className="mt-auto inline-flex items-center gap-1 pt-3.5 text-sm font-semibold text-primary">
          Read more
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </span>
      </div>

      {/* hover par neeche gradient line */}
      <span
        className="absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 bg-primary transition-transform duration-500 group-hover:scale-x-100 motion-reduce:transition-none"
        aria-hidden="true"
      />
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
  const ownerName = portfolio?.full_name
  useEffect(() => {
    if (!blog?.title) return undefined
    const previous = document.title
    document.title = ownerName ? `${blog.title} | ${ownerName}` : blog.title
    return () => {
      document.title = previous
    }
  }, [blog?.title, ownerName])

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

  const author = asText(blog.author) || ownerName || ''
  const category = asText(blog.category)
  const minutes = blog.reading_time || (parsed.words ? Math.max(1, Math.ceil(parsed.words / 200)) : null)

  // Backend se: profile photo, na ho to logo. Sirf tab jab author portfolio ka malik ho.
  const photo = portfolio?.photo ?? portfolio?.profile_photo ?? portfolio?.logo ?? null
  const isOwner = !blog.author || !ownerName || author.toLowerCase().includes(lastNameOf(ownerName))
  const authorPhoto = isOwner ? photo : null

  // Related: same category pehle, phir latest; current nikal kar, 3 tak
  const others = (related.data ?? []).filter((b) => b.slug !== blog.slug && b.id !== blog.id)
  const sameCategory = others.filter((b) => category && asText(b.category) === category)
  const relatedPosts = [...sameCategory, ...others.filter((b) => !sameCategory.includes(b))].slice(0, 3)

  return (
    <>
      <ReadingProgress targetRef={articleRef} />

      {/* 1. Header */}
      <header className="bg-surface pt-8 pb-10 sm:pt-10 sm:pb-14">
        <Container className="max-w-4xl">
          <BackLink to={blogsTo} />

          <div className="mt-6 max-w-3xl">
            {category && <Badge variant="primary">{category}</Badge>}
            <h1 className="mt-4 text-[clamp(1.875rem,4.6vw,3rem)] leading-[1.12]">{blog.title}</h1>
            {blog.excerpt && <p className="mt-4 text-lg leading-relaxed text-body sm:text-xl">{blog.excerpt}</p>}

            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-line pt-5 text-sm text-muted">
              {author && (
                <span className="flex items-center gap-2.5">
                  <Avatar name={author} src={authorPhoto} className="size-8 text-xs" />
                  <span className="font-medium text-heading">{author}</span>
                </span>
              )}
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
              <div lang="en" className="max-w-3xl [&>*:first-child]:mt-0">
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
          {author && (
            <div className="mt-12 flex items-center gap-4 rounded-2xl border border-line bg-card p-5 sm:p-6">
              <Avatar name={author} src={authorPhoto} className="size-12 text-base sm:size-14 sm:text-lg" />
              <div className="min-w-0">
                <p className="text-xs font-semibold tracking-widest text-muted uppercase">Written by</p>
                <p className="font-serif text-lg font-semibold text-heading">{author}</p>
                {isOwner && portfolio?.designation && <p className="text-sm text-muted">{portfolio.designation}</p>}
              </div>
            </div>
          )}
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
              <RelatedCard key={b.id} blog={b} to={paths.siteBlog(slug, b.slug ?? b.id)} />
            ))}
          </div>
        </Section>
      )}
    </>
  )
}
