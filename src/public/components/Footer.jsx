import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ChevronRight,
  Mail,
  MessageCircle,
  Layers,
  Home,
  UserRound,
  BriefcaseBusiness,
  FolderKanban,
  BookOpen,
  FileText,
  Send,
} from 'lucide-react'

import { paths } from '@/routes/paths'
import { usePublicSite } from '@/public/hooks/usePublicSite'
import { getVisibleNav } from '@/public/lib/nav'
import { Container } from './Container'
import { SocialLinks } from './SocialLinks'

// Neural lines (hero wali jaisi): sirf ye naya hai, baqi footer original hai
function NeuralField({ opacity = 0.5 }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined
    const ctx = canvas.getContext('2d')
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
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
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity }}
    />
  )
}

// Generate initials from portfolio name
function initialsOf(name = '') {
  const parts = name
    .replace(/^(dr|prof)\.?\s+/i, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  return parts.length
    ? (
        parts[0][0] +
        (parts.length > 1 ? parts[parts.length - 1][0] : '')
      ).toUpperCase()
    : '?'
}

// Footer heading
function FooterHeading({ children, icon: Icon }) {
  return (
    <div className="mb-6">
      <h2 className="flex items-center gap-3 text-sm font-bold uppercase tracking-[0.16em] text-accent">
        {Icon && (
          <Icon className="size-5" aria-hidden="true" />
        )}
        {children}
      </h2>

      <span
        className="mt-3 block h-1 w-12 rounded-full bg-accent"
        aria-hidden="true"
      />
    </div>
  )
}

// Get navigation icon according to page
function getNavIcon(item) {
  const key = `${item.page} ${item.label}`.toLowerCase()

  if (key.includes('home')) return Home
  if (key.includes('about')) return UserRound
  if (key.includes('service')) return BriefcaseBusiness
  if (key.includes('project')) return FolderKanban
  if (key.includes('publication')) return BookOpen
  if (key.includes('blog')) return FileText
  if (key.includes('contact')) return Mail

  return ChevronRight
}

export function Footer() {
  const { slug, portfolio, contact, vis } = usePublicSite()

  const items = getVisibleNav(slug, vis)
  const [logoFailed, setLogoFailed] = useState(false)

  // WhatsApp number
  const waDigits = String(
    contact?.whatsapp || contact?.phone || ''
  ).replace(/\D/g, '')

  return (
    <footer className="relative isolate overflow-hidden bg-navy text-on-navy">

      {/* Background gradient */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background: `
            radial-gradient(
              ellipse at 5% 0%,
              rgba(37, 99, 235, 0.18),
              transparent 45%
            ),
            radial-gradient(
              ellipse at 95% 100%,
              rgba(37, 99, 235, 0.16),
              transparent 40%
            )
          `,
        }}
      />

      {/* Neural lines (NEW) */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <NeuralField opacity={0.4} />
      </div>

      {/* Decorative gold wave */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-12 -right-12 -z-10 h-24 w-1/4 rotate-[-8deg] opacity-80"
        style={{
          background: 'linear-gradient(90deg, transparent, #EAB544)',
          clipPath: 'polygon(15% 100%, 100% 0, 100% 100%)',
        }}
      />

      {/* Main footer content */}
      <Container>
        <div className="grid grid-cols-1 gap-10 py-12 md:grid-cols-[1.3fr_1fr_1fr] md:gap-8 md:py-14">

          {/* BRAND / PROFILE SECTION */}
          <div className="md:pr-6">

            <Link
              to={paths.site(slug)}
              className="group inline-flex items-center gap-4"
            >
              {/* Logo (backend) ya initials */}
              {portfolio.logo && !logoFailed ? (
                <img
                  src={portfolio.logo}
                  alt=""
                  onError={() => setLogoFailed(true)}
                  className="h-14 w-auto max-w-40 shrink-0 rounded-2xl bg-white/95 object-contain p-1.5 shadow-lg"
                />
              ) : (
                <span
                  className="inline-flex size-14 shrink-0 items-center justify-center rounded-2xl border border-accent/60 bg-primary text-xl font-bold text-on-primary shadow-lg"
                  aria-hidden="true"
                >
                  {initialsOf(portfolio.full_name)}
                </span>
              )}

              {/* Name and designation */}
              <span className="border-l-2 border-accent pl-4">
                <span className="block font-serif text-2xl font-bold text-on-navy transition-colors group-hover:text-accent">
                  {portfolio.full_name}
                </span>

                {portfolio.designation && (
                  <span className="mt-1 block text-sm text-on-navy/75">
                    {portfolio.designation}
                  </span>
                )}
              </span>
            </Link>

            {/* Description */}
            <p className="mt-5 max-w-md text-sm leading-relaxed text-on-navy/70">
              Researcher, educator, and technologist with interest in
              AI, Software Engineering, and High-Performance Computing.
            </p>

            {/* Social links */}
            <div className="mt-6">
              <SocialLinks
                links={portfolio.social_links}
                inverted
                size="sm"
              />
            </div>

          </div>

          {/* QUICK LINKS SECTION */}
          <nav
            aria-label="Footer navigation"
            className="border-white/15 md:border-l md:pl-8"
          >
            <FooterHeading icon={Layers}>
              Explore
            </FooterHeading>

            <ul className="grid grid-cols-2 gap-x-5 gap-y-4">
              {items.map((item) => {
                const Icon = getNavIcon(item)

                return (
                  <li key={item.page}>
                    <Link
                      to={item.to}
                      className="group inline-flex items-center gap-2 text-sm text-on-navy/80 transition-all duration-200 hover:translate-x-1 hover:text-accent"
                    >
                      <Icon
                        className="size-4 shrink-0 text-on-navy/65 transition-colors group-hover:text-accent"
                        aria-hidden="true"
                      />

                      <span>{item.label}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* CONTACT SECTION */}
          <div className="border-white/15 md:border-l md:pl-8">

            <FooterHeading icon={Send}>
              Get in Touch
            </FooterHeading>

            <div className="flex flex-col items-start gap-3">

              {/* Email button */}
              {contact?.email && (
                <a
                  href={`mailto:${contact.email}`}
                  className="flex w-full max-w-sm items-center gap-3 rounded-xl border border-on-navy/20 bg-on-navy/5 px-4 py-3 text-sm text-on-navy/90 transition-all duration-300 hover:border-accent hover:bg-on-navy/10"
                >
                  <Mail
                    className="size-5 shrink-0 text-accent"
                    aria-hidden="true"
                  />

                  <span className="truncate">
                    {contact.email}
                  </span>

                  <ChevronRight className="ml-auto size-4 shrink-0 text-accent" />
                </a>
              )}

              {/* WhatsApp button */}
              {waDigits && (
                <a
                  href={`https://wa.me/${waDigits}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex w-full max-w-sm items-center gap-3 rounded-xl border border-[#25D366] bg-transparent px-4 py-3 text-sm font-semibold text-[#25D366] transition-all duration-300 hover:bg-[#25D366] hover:text-[#062b14]"
                >
                  <MessageCircle
                    className="size-5 shrink-0"
                    aria-hidden="true"
                  />

                  <span>Chat on WhatsApp</span>

                  <ChevronRight className="ml-auto size-4 shrink-0 transition-transform group-hover:translate-x-1" />
                </a>
              )}

            </div>
          </div>

        </div>
      </Container>

    </footer>
  )
}