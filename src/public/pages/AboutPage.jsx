import { useEffect, useState } from 'react'
import { Award, BadgeCheck, Briefcase, Check, Download, GraduationCap, Users } from 'lucide-react'
import { ErrorState } from '@/components/shared/ErrorState'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { Container } from '@/public/components/Container'
import { Section } from '@/public/components/Section'
import { SectionHeading } from '@/public/components/SectionHeading'
import { SocialLinks } from '@/public/components/SocialLinks'
import { Timeline } from '@/public/components/Timeline'
import { useAcademic } from '@/public/hooks/usePublicData'
import { usePublicSite } from '@/public/hooks/usePublicSite'
import { formatPeriod } from '@/public/lib/period'

// =====================================================================================
// ABOUT PAGE: poora code isi file mein. (About page hamesha dikhta hai, sirf andar ke sections toggle hote hain.)
// Order aur backgrounds:
//   1. Hero: polaroid photo (left) + story statement (right)          surface (Home ke navy se alag)
//   2. Biography (+ At a glance)                               background
//   3. Education | Experience (timelines)                      blue-tint
//   4. Expertise                                               background
//   5. Awards | Memberships                                    surface (cream)
// Section dikhta hai jab: toggle ON (about group) + content ho. Call-to-action is page par nahi (planning doc).
// Data: usePublicSite (portfolio) + useAcademic (educations, experiences, expertise, awards, memberships, research_interests).
// Koi naya API call ya library nahi: metrics hata diye, floating badges academic data se aate hain.
// Motion: sirf hero ka ek page-load sequence (CSS transitions). prefers-reduced-motion par band.
// v2: Biography + Education + Experience ka content justify. Awards ke icon par theme gradient (primary -> accent).
// =====================================================================================

// Justify (hyphenation ke saath), aakhri line left par rehti hai
const JUSTIFY = 'text-justify hyphens-auto [text-align-last:left]'

// Timeline ke andar ke paragraphs justify (Timeline component ko chhuay bina)
const TIMELINE_JUSTIFY = '[&_p]:text-justify [&_p]:hyphens-auto [&_p]:[text-align-last:left]'

// Theme gradient: Home page ke icons wala hi (primary -> accent)
const THEME_GRADIENT = { background: 'linear-gradient(135deg, var(--c-primary, #2563eb), var(--c-accent, #f59e0b))' }

// ---------- Helpers ----------

function initialsOf(name = '') {
  const parts = name.replace(/^(dr|prof)\.?\s+/i, '').trim().split(/\s+/).filter(Boolean)
  return parts.length ? (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase() : '?'
}

// Biography HTML ya plain text ho sakti hai. Hum hamesha TEXT paragraphs banate hain (HTML render nahi hota),
// is liye koi sanitizer ya dangerouslySetInnerHTML nahi chahiye.
function bioParagraphs(biography) {
  if (!biography) return []
  const text = String(biography)

  if (/<[a-z][\s\S]*>/i.test(text)) {
    const doc = new DOMParser().parseFromString(text, 'text/html')
    const blocks = [...doc.body.querySelectorAll('p, li, h1, h2, h3, h4')]
    const parts = (blocks.length ? blocks.map((b) => b.textContent) : [doc.body.textContent]) ?? []
    return parts.map((t) => t.trim()).filter(Boolean)
  }

  return text
    .split(/\n\s*\n/)
    .map((t) => t.trim())
    .filter(Boolean)
}

// Mount ke thori der baad true: isse CSS transition chalti hai (hero load sequence ke liye)
function useMounted(delay = 60) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), delay)
    return () => clearTimeout(t)
  }, [delay])
  return mounted
}

// ---------- 1. Hero ----------

// Hero ka entrance helper: neeche se halka uthta hua fade-in. Reduced-motion par seedha dikhta hai.
function Rise({ show, delay = 0, className = '', children }) {
  return (
    <div
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out motion-reduce:transition-none ${
        show ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 motion-reduce:translate-y-0 motion-reduce:opacity-100'
      } ${className}`}
    >
      {children}
    </div>
  )
}

function HeroPhoto({ src, name }) {
  const [failed, setFailed] = useState(false)

  return (
    <div className="relative mx-auto w-full max-w-[15rem] pt-10 sm:max-w-[17rem]">
      {/* Haath se likha "That's me" note + arrow (decoration, screen reader ke liye nahi) */}
      <div className="pointer-events-none absolute top-0 left-0 flex items-start gap-1 whitespace-nowrap text-primary sm:-left-4" aria-hidden="true">
        <span className="-rotate-6 font-serif text-2xl italic">That&apos;s me</span>
        <svg viewBox="0 0 48 28" className="mt-4 h-7 w-12 fill-none stroke-current" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 5c14-4 28 1 40 15M42 20l-10-1M42 20l-3-10" />
        </svg>
      </div>

      {/* Polaroid: safed frame, thoda tilt. Hover par seedha ho jata hai */}
      <div className="relative -rotate-[9deg] rounded-sm bg-card p-3 pb-12 shadow-xl ring-1 ring-line transition-transform duration-500 ease-out hover:-rotate-[3deg] motion-reduce:transition-none motion-reduce:hover:-rotate-[9deg]">
        <div className="aspect-[4/5] overflow-hidden bg-primary-soft">
          {src && !failed ? (
            <img src={src} alt={name} onError={() => setFailed(true)} className="size-full object-cover" />
          ) : (
            <span
              className="flex size-full items-center justify-center font-serif text-6xl font-semibold text-primary"
              aria-hidden="true"
            >
              {initialsOf(name)}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// Intro (backend wali tagline) ko bada statement bana kar word-by-word dikhate hain
function HeroStatement({ text, show }) {
  const words = text.split(/\s+/).filter(Boolean)

  return (
    <p className="max-w-3xl font-serif text-2xl leading-[1.2] text-heading sm:text-3xl lg:text-4xl">
      {words.map((word, i) => (
        <span key={i}>
          <span
            style={{ transitionDelay: `${Math.min(i * 55, 800)}ms` }}
            className={`inline-block transition-all duration-700 ease-out motion-reduce:transition-none ${
              show ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0 motion-reduce:translate-y-0 motion-reduce:opacity-100'
            }`}
          >
            {word}
          </span>{' '}
        </span>
      ))}
    </p>
  )
}

function AboutHero({ portfolio, pageIntro }) {
  const { full_name, designation, photo, social_links, cv_url } = portfolio
  // Statement: About page ka intro (page_intros), na ho to portfolio ki intro
  const intro = pageIntro?.intro || portfolio.intro
  const show = useMounted()


  return (
    <header className="relative overflow-hidden bg-surface">
      {/* Halka decoration: dot grid + gold glow. Sirf background, content se alag */}
      <div
        className="pointer-events-none absolute inset-0 text-primary/15 [mask-image:linear-gradient(to_bottom_left,black,transparent_55%)]"
        style={{ backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)', backgroundSize: '22px 22px' }}
        aria-hidden="true"
      />
      <div className="pointer-events-none absolute -top-28 -left-28 size-80 rounded-full bg-accent/10 blur-3xl" aria-hidden="true" />

      <Container className="relative grid items-center gap-8 py-10 sm:py-12 lg:grid-cols-[17rem_1fr] lg:gap-16 lg:py-14">
        <Rise show={show} delay={200}>
          <HeroPhoto src={photo} name={full_name} />
        </Rise>

        <div>
          {intro ? (
            <>
              <HeroStatement text={intro} show={show} />
              {/* Gold underline left se right draw hoti hai */}
              <span
                style={{ transitionDelay: '700ms' }}
                className={`mt-4 block h-0.5 w-16 origin-left bg-accent transition-transform duration-700 ease-out motion-reduce:transition-none ${
                  show ? 'scale-x-100' : 'scale-x-0 motion-reduce:scale-x-100'
                }`}
                aria-hidden="true"
              />
              <Rise show={show} delay={850} className="mt-4">
                <h1 className="text-xl text-heading sm:text-2xl">{full_name}</h1>
                {designation && <p className="mt-1 text-accent-text">{designation}</p>}
              </Rise>
            </>
          ) : (
            <Rise show={show}>
              <h1 className="text-3xl text-heading sm:text-4xl">{full_name}</h1>
              {designation && <p className="mt-1 text-base text-accent-text">{designation}</p>}
              <span className="mt-5 block h-0.5 w-20 bg-accent" aria-hidden="true" />
            </Rise>
          )}

          <Rise show={show} delay={1000} className="mt-5 flex flex-wrap items-center gap-4">
            {cv_url && (
              <a
                href={cv_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-medium text-white transition-opacity hover:opacity-90"
              >
                <Download className="size-4" aria-hidden="true" />
                Download CV
              </a>
            )}
            <SocialLinks links={social_links} />
          </Rise>
        </div>
      </Container>
    </header>
  )
}

// ---------- 2. Biography (+ At a glance) ----------

function GlanceItem({ icon: Icon, label, value }) {
  return (
    <li className="flex items-start gap-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-xs tracking-wide text-muted uppercase">{label}</p>
        <p className="font-medium break-words text-heading">{value}</p>
      </div>
    </li>
  )
}

// At a glance: sirf data se nikalte hain (kuch bana kar nahi likhte)
function glanceFacts(academic) {
  const current = academic.experiences.find((e) => e.is_current)
  const education = academic.educations[0]
  const interests = academic.research_interests.slice(0, 3).map((r) => r.title).filter(Boolean)

  return [
    current && { icon: Briefcase, label: 'Current role', value: [current.position, current.organization].filter(Boolean).join(', ') },
    education && { icon: GraduationCap, label: 'Education', value: [education.degree, education.institution].filter(Boolean).join(', ') },
    interests.length > 0 && { icon: BadgeCheck, label: 'Research focus', value: interests.join(' · ') },
  ].filter(Boolean)
}

function BiographySection({ paragraphs, facts }) {
  const [lead, ...rest] = paragraphs

  return (
    <Section tone="background">
      <div className={facts.length > 0 ? 'grid items-start gap-8 lg:grid-cols-[1.6fr_1fr] lg:gap-12' : 'max-w-3xl'}>
        <div>
          <SectionHeading eyebrow="Biography" title="A little about me" className="mb-5" />
          <div className="space-y-4">
            <p className={`text-lg leading-relaxed text-heading ${JUSTIFY}`}>{lead}</p>
            {rest.map((text, i) => (
              <p key={i} className={`leading-relaxed text-body ${JUSTIFY}`}>
                {text}
              </p>
            ))}
          </div>
        </div>

        {facts.length > 0 && (
          <Card className="p-5 lg:sticky lg:top-24">
            <h3 className="text-lg">At a glance</h3>
            <span className="mt-2 mb-4 block h-0.5 w-10 bg-accent" aria-hidden="true" />
            <ul className="space-y-4">
              {facts.map((fact) => (
                <GlanceItem key={fact.label} {...fact} />
              ))}
            </ul>
          </Card>
        )}
      </div>
    </Section>
  )
}

// ---------- 3. Education | Experience ----------

function ColumnHeading({ icon: Icon, title }) {
  return (
    <div className="mb-6 flex items-center gap-3">
      <span className="flex size-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <h2 className="text-xl sm:text-2xl">{title}</h2>
    </div>
  )
}

function EducationExperienceSection({ educations, experiences, showEducation, showExperience }) {
  const columns = [
    showEducation && {
      key: 'education',
      icon: GraduationCap,
      title: 'Education',
      items: educations.map((e) => ({
        key: e.id,
        title: e.degree,
        subtitle: e.institution,
        period: formatPeriod(e.start_year, e.end_year),
        description: e.description,
      })),
    },
    showExperience && {
      key: 'experience',
      icon: Briefcase,
      title: 'Experience',
      items: experiences.map((e) => ({
        key: e.id,
        title: e.position,
        subtitle: e.organization,
        period: formatPeriod(e.start_year, e.end_year, e.is_current),
        description: e.description,
        current: e.is_current,
      })),
    },
  ].filter(Boolean)

  if (columns.length === 0) return null

  return (
    <Section tone="blue-tint">
      <div className={columns.length > 1 ? 'grid gap-10 lg:grid-cols-2 lg:gap-14' : 'max-w-3xl'}>
        {columns.map((col) => (
          <div key={col.key}>
            <ColumnHeading icon={col.icon} title={col.title} />
            <div className={TIMELINE_JUSTIFY}>
              <Timeline items={col.items} />
            </div>
          </div>
        ))}
      </div>
    </Section>
  )
}

// ---------- 4. Expertise ----------

function ExpertiseSection({ items }) {
  return (
    <Section tone="background">
      <SectionHeading eyebrow="Skills" title="Areas of Expertise" />
      <ul className="flex flex-wrap gap-3">
        {items.map((item) => (
          <li
            key={item.id}
            className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-4 py-2 font-medium text-heading shadow-xs transition-colors hover:border-primary hover:text-primary"
          >
            <span className="flex size-5 items-center justify-center rounded-full bg-primary-soft text-primary">
              <Check className="size-3" aria-hidden="true" />
            </span>
            {item.title ?? item.name}
          </li>
        ))}
      </ul>
    </Section>
  )
}

// ---------- 5. Awards | Memberships ----------

function AwardCard({ award }) {
  return (
    <Card hoverable className="flex items-start gap-4 p-4">
      <span
        className="flex size-10 shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
        style={THEME_GRADIENT}
      >
        <Award className="size-5" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h3 className="text-base font-semibold">{award.title}</h3>
          {award.year && <Badge variant="primary">{award.year}</Badge>}
        </div>
        {award.issuer && <p className="mt-0.5 text-sm text-muted">{award.issuer}</p>}
        {award.description && <p className="mt-2 text-sm text-body">{award.description}</p>}
      </div>
    </Card>
  )
}

function MembershipRow({ membership }) {
  return (
    <li className="flex items-center gap-4 border-b border-line py-3 first:pt-0 last:border-b-0 last:pb-0">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
        <Users className="size-5" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-heading">{membership.organization}</p>
        {membership.role && <p className="text-sm text-muted">{membership.role}</p>}
      </div>
      {membership.year && <span className="text-sm text-muted">Since {membership.year}</span>}
    </li>
  )
}

function AwardsMembershipsSection({ awards, memberships, showAwards, showMemberships }) {
  if (!showAwards && !showMemberships) return null
  const both = showAwards && showMemberships

  return (
    <Section tone="surface">
      <div className={both ? 'grid items-start gap-10 lg:grid-cols-2 lg:gap-14' : 'max-w-3xl'}>
        {showAwards && (
          <div>
            <SectionHeading eyebrow="Recognition" title="Awards & Honours" className="mb-5" />
            <div className="space-y-3">
              {awards.map((award) => (
                <AwardCard key={award.id} award={award} />
              ))}
            </div>
          </div>
        )}

        {showMemberships && (
          <div>
            <SectionHeading eyebrow="Community" title="Memberships" className="mb-5" />
            <Card className="p-5">
              <ul>
                {memberships.map((m) => (
                  <MembershipRow key={m.id} membership={m} />
                ))}
              </ul>
            </Card>
          </div>
        )}
      </div>
    </Section>
  )
}

// ---------- Page ----------

function AboutSkeleton() {
  return (
    <Section tone="background">
      <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-3">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-3/4" />
        </div>
        <Skeleton className="h-44 rounded-xl" />
      </div>
    </Section>
  )
}

export function AboutPage() {
  const { slug, portfolio, pageIntros, vis } = usePublicSite()
  const query = useAcademic(slug)
  const academic = query.data
  const paragraphs = bioParagraphs(portfolio.biography)

  // Section dikhta hai: about toggle ON + content
  const show = (key, items) => vis.isVisible('about', key, items.length > 0)

  return (
    <>
      <AboutHero portfolio={portfolio} pageIntro={pageIntros.about} />

      {/* Biography portfolio ke saath aati hai (academic data ka intezar nahi) */}
      {paragraphs.length > 0 && (
        <BiographySection paragraphs={paragraphs} facts={academic ? glanceFacts(academic) : []} />
      )}

      {query.isPending && <AboutSkeleton />}

      {query.isError && (
        <Section tone="background">
          <ErrorState message={query.error?.message} onRetry={query.refetch} />
        </Section>
      )}

      {academic && (
        <>
          <EducationExperienceSection
            educations={academic.educations}
            experiences={academic.experiences}
            showEducation={show('education', academic.educations)}
            showExperience={show('experience', academic.experiences)}
          />
          {show('expertise', academic.expertise) && <ExpertiseSection items={academic.expertise} />}
          <AwardsMembershipsSection
            awards={academic.awards}
            memberships={academic.memberships}
            showAwards={show('awards', academic.awards)}
            showMemberships={show('memberships', academic.memberships)}
          />
        </>
      )}
    </>
  )
}