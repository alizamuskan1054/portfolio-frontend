import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  ArrowUpRight,
  Check,
  Globe,
  Lock,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Send,
  ShieldCheck,
} from 'lucide-react'
import { applyServerErrors } from '@/api/errors'
import { CopyButton } from '@/components/shared/CopyButton'
import { FormField } from '@/components/shared/FormField'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { notify } from '@/lib/notify'
import { Container } from '@/public/components/Container'
import { PageHero } from '@/public/components/PageHero'
import { useSendContact } from '@/public/hooks/usePublicData'
import { usePublicSite } from '@/public/hooks/usePublicSite'

// =====================================================================================
// CONTACT PAGE (v2): poora code isi file mein. Route: /:slug/contact (hamesha visible).
//   1. Hero (navy PageHero)      animated gradient glow + dot grid + chips ki entrance animation
//   2. Left (40%)                Contact details (email + copy, phone, WhatsApp, location)
//                                Find me online (real brand icons, sirf jo diye gaye hon)
//   3. Right (60%)               Inquiry form: validation, loading, success + error, double submit se bachao
// Is version mein koi naya content/section nahi: sirf hero animation + polish
// (gradient accents, hover states, focus glow, success animation, reduced-motion support).
// Gradient colors ek hi jagah: .cp-root { --cp-a, --cp-b }. Token names alag hon to sirf wo 2 lines badlein.
// =====================================================================================

// ---------- Constants ----------

// Backend choices ka `value` yahan exact match hona chahiye (warna "... is not a valid choice").
// Backend se confirm ki hui list.
const INQUIRY_TYPES = [
  { value: 'general', label: 'General Inquiry' },
  { value: 'collaboration', label: 'Collaboration' },
  { value: 'speaking', label: 'Speaking / Event' },
  { value: 'research_inquiry', label: 'Research Inquiry' },
  { value: 'other', label: 'Other' },
]

const FIELDS = ['full_name', 'email', 'subject', 'inquiry_type', 'message']
const MESSAGE_MAX = 2000
const DEFAULT_SUCCESS = 'Thank you for your message. I will get back to you soon.'

const contactSchema = z.object({
  full_name: z.string().trim().min(2, 'Please enter your full name').max(100, 'Name is too long'),
  email: z.string().trim().min(1, 'Email is required').email('Enter a valid email address'),
  subject: z.string().trim().min(3, 'Please add a short subject').max(150, 'Subject is too long'),
  inquiry_type: z.string().min(1, 'Select an inquiry type'),
  message: z
    .string()
    .trim()
    .min(10, 'Please write at least 10 characters')
    .max(MESSAGE_MAX, `Message must be ${MESSAGE_MAX} characters or less`),
})

const defaultValues = { full_name: '', email: '', subject: '', inquiry_type: '', message: '' }

// Responsive grid + animations. Media queries yahin taake Tailwind par depend na ho.
const PAGE_CSS = `
.cp-root{--cp-a:var(--c-primary,#2563eb);--cp-b:var(--c-accent,#f59e0b)}

/* ---------- keyframes ---------- */
@keyframes cp-float-a{0%,100%{transform:translate3d(0,0,0) scale(1)}50%{transform:translate3d(40px,24px,0) scale(1.12)}}
@keyframes cp-float-b{0%,100%{transform:translate3d(0,0,0) scale(1)}50%{transform:translate3d(-48px,-18px,0) scale(1.08)}}
@keyframes cp-sheen{0%{background-position:0% 50%}100%{background-position:200% 50%}}
@keyframes cp-rise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
@keyframes cp-pop{0%{transform:scale(.4);opacity:0}60%{transform:scale(1.12);opacity:1}100%{transform:scale(1)}}
@keyframes cp-ring{0%{transform:scale(1);opacity:.5}100%{transform:scale(1.9);opacity:0}}

/* ---------- hero ---------- */
.cp-hero{position:relative;overflow:hidden}
.cp-glow{position:absolute;pointer-events:none;border-radius:9999px;filter:blur(70px);z-index:1}
.cp-glow-a{width:22rem;height:22rem;top:-8rem;right:-4rem;background:var(--cp-a);opacity:.38;animation:cp-float-a 14s ease-in-out infinite}
.cp-glow-b{width:18rem;height:18rem;bottom:-9rem;left:-3rem;background:var(--cp-b);opacity:.28;animation:cp-float-b 18s ease-in-out infinite}
.cp-dots{position:absolute;inset:0;pointer-events:none;z-index:1;opacity:.5;
  background-image:radial-gradient(rgba(255,255,255,.14) 1px,transparent 1px);background-size:22px 22px;
  -webkit-mask-image:linear-gradient(180deg,#000,transparent 85%);mask-image:linear-gradient(180deg,#000,transparent 85%)}
.cp-hero::after{content:"";position:absolute;left:0;right:0;bottom:0;height:2px;z-index:2;pointer-events:none;
  background:linear-gradient(90deg,transparent,var(--cp-a),var(--cp-b),transparent);background-size:200% 100%;animation:cp-sheen 6s linear infinite}
.cp-chips{display:flex;flex-wrap:wrap;gap:.5rem;list-style:none;margin:0;padding:0}
.cp-chips>li{animation:cp-rise .6s cubic-bezier(.2,.7,.2,1) both;animation-delay:calc(var(--i,0) * 110ms + 150ms);
  transition:transform .25s,background-color .25s}
.cp-chips>li:hover{transform:translateY(-2px)}

/* ---------- layout ---------- */
.cp-grid{display:grid;gap:1.5rem;align-items:start;padding:2.5rem 0 4rem}
.cp-form{order:1;min-width:0;animation:cp-rise .65s cubic-bezier(.2,.7,.2,1) both;animation-delay:.1s}
.cp-side{order:2;display:grid;gap:1.5rem;min-width:0}
.cp-side>*{animation:cp-rise .65s cubic-bezier(.2,.7,.2,1) both}
.cp-side>*:nth-child(1){animation-delay:.2s}
.cp-side>*:nth-child(2){animation-delay:.3s}

/* ---------- cards ---------- */
.cp-card{position:relative;overflow:hidden;padding:1.25rem 1.5rem;transition:box-shadow .3s,border-color .3s}
.cp-card::before{content:"";position:absolute;left:0;top:0;width:100%;height:3px;
  background:linear-gradient(90deg,var(--cp-a),var(--cp-b))}
.cp-card:hover{box-shadow:0 18px 36px -24px var(--cp-a)}
.cp-head{padding-bottom:1rem;margin-bottom:1.25rem;border-bottom:1px solid var(--c-line)}
.cp-card label{font-size:.75rem}
.cp-card :is(input,select,textarea){font-size:.875rem;transition:box-shadow .2s,border-color .2s}
.cp-card :is(input,select,textarea):focus-visible{box-shadow:0 0 0 3px color-mix(in srgb,var(--cp-a) 25%,transparent)}
.cp-row{display:grid;gap:1rem}

/* ---------- contact rows ---------- */
.cp-rows{list-style:none;margin:0;padding:0}
.cp-rows>li{padding:.875rem 0}
.cp-rows>li:first-child{padding-top:0}
.cp-rows>li:last-child{padding-bottom:0}
.cp-rows>li+li{border-top:1px solid var(--c-line)}
.cp-ico{transition:transform .3s,background-image .3s,color .3s}
.cp-rows>li:hover .cp-ico{background-image:linear-gradient(135deg,var(--cp-a),var(--cp-b));color:#fff;transform:scale(1.06) rotate(-4deg)}

/* ---------- social tiles ---------- */
.cp-tiles{display:grid;grid-template-columns:1fr 1fr;gap:.5rem;list-style:none;margin:0;padding:0}
.cp-tiles>li{min-width:0}
.cp-tiles>li:last-child:nth-child(odd){grid-column:1/-1}
.cp-tile{transition:transform .25s,box-shadow .25s,border-color .25s,color .25s}
.cp-tile:hover{transform:translateY(-2px);box-shadow:0 10px 20px -14px var(--cp-a)}
.cp-tile:focus-visible{outline:2px solid var(--cp-a);outline-offset:2px}
.cp-arrow{transition:transform .25s,color .25s}
.cp-tile:hover .cp-arrow{transform:translate(2px,-2px)}

/* ---------- success ---------- */
.cp-check{position:relative}
.cp-check>svg{animation:cp-pop .55s cubic-bezier(.2,.9,.3,1.3) both .1s}
.cp-check::after{content:"";position:absolute;inset:0;border-radius:9999px;border:2px solid currentColor;animation:cp-ring 1.4s ease-out .2s 2 both}

@media (min-width:640px){.cp-row{grid-template-columns:1fr 1fr}.cp-card{padding:1.5rem 1.75rem}}
@media (min-width:1024px){
  .cp-grid{grid-template-columns:2fr 3fr}
  .cp-side{order:1}
  .cp-form{order:2}
}

/* ---------- reduced motion ---------- */
@media (prefers-reduced-motion:reduce){
  .cp-glow,.cp-hero::after,.cp-chips>li,.cp-form,.cp-side>*,.cp-check>svg,.cp-check::after{animation:none!important}
  .cp-card,.cp-ico,.cp-tile,.cp-arrow,.cp-chips>li{transition:none!important}
  .cp-rows>li:hover .cp-ico,.cp-tile:hover,.cp-tile:hover .cp-arrow,.cp-chips>li:hover{transform:none}
}
`

// ---------- Brand icons (real logos) ----------
// Paths: Simple Icons (CC0) + Material Design Icons (LinkedIn). Sab 24x24, currentColor se rang lete hain.
const BRAND_PATHS = {
  linkedin: 'M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93zM6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37z',
  github: 'M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12',
  x: 'M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299-.929-1.329L3.076 1.56h3.182l5.965 8.532.929 1.329 7.754 11.09h-3.182z',
  facebook: 'M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a9 9 0 0 1 1.141.195v3.325a9 9 0 0 0-.653-.036 27 27 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.7 1.7 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647',
  instagram: 'M7.03.084c-1.277.06-2.149.264-2.91.563a5.9 5.9 0 0 0-2.124 1.388 5.9 5.9 0 0 0-1.38 2.127C.321 4.926.12 5.8.064 7.076s-.069 1.688-.063 4.947.021 3.667.083 4.947c.061 1.277.264 2.149.563 2.911.308.789.72 1.457 1.388 2.123a5.9 5.9 0 0 0 2.129 1.38c.763.295 1.636.496 2.913.552 1.278.056 1.689.069 4.947.063s3.668-.021 4.947-.082c1.28-.06 2.147-.265 2.91-.563a5.9 5.9 0 0 0 2.123-1.388 5.9 5.9 0 0 0 1.38-2.129c.295-.763.496-1.636.551-2.912.056-1.28.07-1.69.063-4.948-.006-3.258-.02-3.667-.081-4.947-.06-1.28-.264-2.148-.564-2.911a5.9 5.9 0 0 0-1.387-2.123 5.86 5.86 0 0 0-2.128-1.38C19.074.322 18.202.12 16.924.066 15.647.009 15.236-.006 11.977 0S8.31.021 7.03.084m.14 21.693c-1.17-.05-1.805-.245-2.228-.408a3.7 3.7 0 0 1-1.382-.895 3.7 3.7 0 0 1-.9-1.378c-.165-.423-.363-1.058-.417-2.228-.06-1.264-.072-1.644-.08-4.848-.006-3.204.006-3.583.061-4.848.05-1.169.246-1.805.408-2.228.216-.561.477-.96.895-1.382a3.7 3.7 0 0 1 1.379-.9c.423-.165 1.057-.361 2.227-.417 1.265-.06 1.644-.072 4.848-.08 3.203-.006 3.583.006 4.85.062 1.168.05 1.804.244 2.227.408.56.216.96.475 1.382.895s.681.817.9 1.378c.165.422.362 1.056.417 2.227.06 1.265.074 1.645.08 4.848.005 3.203-.006 3.583-.061 4.848-.051 1.17-.245 1.805-.408 2.23-.216.56-.477.96-.896 1.38a3.7 3.7 0 0 1-1.378.9c-.422.165-1.058.362-2.226.418-1.266.06-1.645.072-4.85.079s-3.582-.006-4.848-.06m9.783-16.192a1.44 1.44 0 1 0 1.437-1.442 1.44 1.44 0 0 0-1.437 1.442M5.839 12.012a6.161 6.161 0 1 0 12.323-.024 6.162 6.162 0 0 0-12.323.024M8 12.008A4 4 0 1 1 12.008 16 4 4 0 0 1 8 12.008',
  youtube: 'M23.498 6.186a3.02 3.02 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.02 3.02 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.02 3.02 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.02 3.02 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814M9.545 15.568V8.432L15.818 12z',
  google_scholar: 'M5.242 13.769 0 9.5 12 0l12 9.5-5.242 4.269C17.548 11.249 14.978 9.5 12 9.5c-2.977 0-5.548 1.748-6.758 4.269M12 10a7 7 0 1 0 0 14 7 7 0 0 0 0-14',
  researchgate: 'M19.586 0q-1.226.001-2.073.565-.846.565-1.213 1.68a3 3 0 0 0-.112.437 8 8 0 0 0-.078.53 9 9 0 0 0-.05.727q-.014.423-.013 1.016a31.121 31.123 0 0 0 .014 1.017 9 9 0 0 0 .05.727 8 8 0 0 0 .077.53h-.005a3 3 0 0 0 .113.438q.368 1.114 1.214 1.68.847.564 2.075.564c.8 0 1.536-.213 2.105-.603.57-.39.94-.916 1.175-1.65.076-.235.135-.558.177-.93a11 11 0 0 0 .043-1.207v-.82q0-.142-.14-.142h-3.064q-.14 0-.14.141v.956q0 .14.14.14h1.666q.084.001.084.086c0 .36 0 .62-.036.865-.038.244-.1.447-.147.606-.108.385-.348.664-.638.876s-.738.35-1.227.35c-.545 0-.901-.15-1.21-.353-.306-.203-.517-.454-.67-.915a3.1 3.1 0 0 1-.147-.762 17.366 17.367 0 0 1-.034-.656q-.015-.39-.014-.939a26.401 26.403 0 0 1 .014-.938 16 16 0 0 1 .035-.656 3.2 3.2 0 0 1 .148-.76 1.9 1.9 0 0 1 .742-1.01c.344-.244.593-.352 1.137-.352.508 0 .815.096 1.144.303.33.207.528.492.764.925q.069.141.198.07l1.044-.43q.113-.072.042-.199a3.6 3.6 0 0 0-.466-.742 3 3 0 0 0-.679-.607 3.3 3.3 0 0 0-.903-.41A4 4 0 0 0 19.586 0M8.217 5.836c-1.69 0-3.036.086-4.297.086-1.146 0-2.291 0-3.007-.029v.831l1.088.2c.744.144 1.174.488 1.174 2.264v11.288c0 1.777-.43 2.12-1.174 2.263l-1.088.2v.832c.773-.029 2.12-.086 3.465-.086 1.29 0 2.951.057 3.667.086v-.831l-1.49-.2c-.773-.115-1.174-.487-1.174-2.264v-4.784c.688.057 1.29.057 2.206.057 1.748 3.123 3.41 5.472 4.355 6.56.86 1.032 2.177 1.691 3.839 1.691.487 0 1.003-.086 1.318-.23v-.744c-1.031 0-2.063-.716-2.808-1.518-1.26-1.376-2.95-3.582-4.355-6.074 2.32-.545 4.04-2.722 4.04-4.9 0-3.208-2.492-4.698-5.758-4.698zm-.515 1.29c2.406 0 3.839 1.26 3.839 3.552 0 2.263-1.547 3.782-4.097 3.782-.974 0-1.404-.03-2.063-.086v-7.19c.66-.059 1.547-.059 2.32-.059z',
  orcid: 'M12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0M7.369 4.378c.525 0 .947.431.947.947s-.422.947-.947.947a.95.95 0 0 1-.947-.947c0-.525.422-.947.947-.947m-.722 3.038h1.444v10.041H6.647zm3.562 0h3.9c3.712 0 5.344 2.653 5.344 5.025 0 2.578-2.016 5.025-5.325 5.025h-3.919zm1.444 1.303v7.444h2.297c3.272 0 4.022-2.484 4.022-3.722 0-2.016-1.284-3.722-4.097-3.722z',
}

const PLATFORMS = {
  linkedin: { label: 'LinkedIn', icon: 'linkedin' },
  github: { label: 'GitHub', icon: 'github' },
  twitter: { label: 'X (Twitter)', icon: 'x' },
  x: { label: 'X (Twitter)', icon: 'x' },
  facebook: { label: 'Facebook', icon: 'facebook' },
  instagram: { label: 'Instagram', icon: 'instagram' },
  youtube: { label: 'YouTube', icon: 'youtube' },
  google_scholar: { label: 'Google Scholar', icon: 'google_scholar' },
  researchgate: { label: 'ResearchGate', icon: 'researchgate' },
  orcid: { label: 'ORCID', icon: 'orcid' },
  website: { label: 'Website' },
  email: { label: 'Email' },
}

function BrandIcon({ platform, size = 16 }) {
  const meta = PLATFORMS[platform]
  const path = meta?.icon ? BRAND_PATHS[meta.icon] : null

  if (path) {
    return (
      <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true">
        <path d={path} />
      </svg>
    )
  }
  const Fallback = platform === 'email' ? Mail : Globe
  return <Fallback width={size} height={size} aria-hidden="true" />
}

// ---------- Small pieces ----------

function CardHead({ eyebrow, title, description }) {
  return (
    <div className="cp-head">
      {eyebrow && (
        <p
          className="text-primary font-semibold tracking-widest uppercase"
          style={{ fontSize: '0.6875rem' }}
        >
          {eyebrow}
        </p>
      )}
      <h2 style={{ fontSize: '1.375rem', lineHeight: 1.25, marginTop: '0.25rem' }}>{title}</h2>
      {description && (
        <p className="text-muted" style={{ fontSize: '0.8125rem', lineHeight: 1.6, marginTop: '0.375rem' }}>
          {description}
        </p>
      )}
    </div>
  )
}

function InfoRow({ icon: Icon, label, action, children }) {
  return (
    <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <span
        className="cp-ico bg-primary-soft text-primary inline-flex shrink-0 items-center justify-center rounded-lg"
        style={{ width: '2.25rem', height: '2.25rem' }}
      >
        <Icon width={16} height={16} aria-hidden="true" />
      </span>
      <div style={{ minWidth: 0, flex: 1 }}>
        <p
          className="text-muted font-semibold tracking-widest uppercase"
          style={{ fontSize: '0.625rem' }}
        >
          {label}
        </p>
        <div
          className="text-heading font-medium"
          style={{ fontSize: '0.875rem', marginTop: '0.125rem', overflowWrap: 'anywhere' }}
        >
          {children}
        </div>
      </div>
      {action}
    </li>
  )
}

const valueLink = 'transition-colors hover:text-primary hover:underline'

function ContactDetailsCard({ contact }) {
  const email = contact?.email
  const phone = contact?.phone
  const address = contact?.address
  // WhatsApp: contact.whatsapp, warna phone. Sirf digits chahiye (country code ke saath)
  const waDigits = String(contact?.whatsapp || phone || '').replace(/\D/g, '')
  const hasAny = Boolean(email || phone || address || waDigits)

  return (
    <Card className="cp-card bg-surface">
      <CardHead eyebrow="Direct channels" title="Contact details" />

      {hasAny ? (
        <ul className="cp-rows">
          {email && (
            <InfoRow icon={Mail} label="Email" action={<CopyButton text={email} className="shrink-0" />}>
              <a href={`mailto:${email}`} className={valueLink}>
                {email}
              </a>
            </InfoRow>
          )}
          {phone && (
            <InfoRow icon={Phone} label="Phone">
              <a href={`tel:${phone.replace(/[^\d+]/g, '')}`} className={valueLink}>
                {phone}
              </a>
            </InfoRow>
          )}
          {waDigits && (
            <InfoRow icon={MessageCircle} label="WhatsApp">
              <a
                href={`https://wa.me/${waDigits}`}
                target="_blank"
                rel="noopener noreferrer"
                className={valueLink}
              >
                Chat on WhatsApp
              </a>
            </InfoRow>
          )}
          {address && (
            <InfoRow icon={MapPin} label="Location">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className={valueLink}
              >
                {address}
              </a>
            </InfoRow>
          )}
        </ul>
      ) : (
        <p className="text-muted" style={{ fontSize: '0.875rem' }}>
          Use the form to send a message. It goes straight to my inbox.
        </p>
      )}
    </Card>
  )
}

function SocialCard({ links }) {
  const valid = (links ?? []).filter((l) => l?.url)
  if (valid.length === 0) return null

  return (
    <Card className="cp-card bg-surface">
      <CardHead eyebrow="Profiles" title="Find me online" />
      <ul className="cp-tiles">
        {valid.map(({ platform, url }) => {
          const label = PLATFORMS[platform]?.label ?? platform ?? 'Link'
          return (
            <li key={`${platform}-${url}`}>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="cp-tile group border-line bg-card text-heading hover:border-primary hover:text-primary flex items-center justify-between rounded-lg border"
                style={{ padding: '0.5rem 0.75rem', gap: '0.5rem' }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                  <span className="text-primary inline-flex shrink-0">
                    <BrandIcon platform={platform} size={16} />
                  </span>
                  <span className="truncate font-medium" style={{ fontSize: '0.8125rem' }}>
                    {label}
                  </span>
                </span>
                <ArrowUpRight
                  className="cp-arrow text-muted group-hover:text-primary shrink-0"
                  width={14}
                  height={14}
                  aria-hidden="true"
                />
              </a>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}

function SuccessPanel({ message, onReset }) {
  return (
    <div role="status" aria-live="polite" style={{ textAlign: 'center', padding: '2rem 0.5rem' }}>
      <span
        className="cp-check bg-success/15 text-success mx-auto flex items-center justify-center rounded-full"
        style={{ width: '3.5rem', height: '3.5rem' }}
      >
        <Check width={28} height={28} aria-hidden="true" />
      </span>
      <h2 style={{ fontSize: '1.5rem', marginTop: '1.25rem' }}>Message sent</h2>
      <p
        className="text-muted mx-auto"
        style={{ fontSize: '0.875rem', marginTop: '0.5rem', maxWidth: '24rem', lineHeight: 1.7 }}
      >
        {message}
      </p>
      <Button variant="secondary" onClick={onReset} style={{ marginTop: '1.5rem' }}>
        Send another message
      </Button>
    </div>
  )
}

// ---------- Form ----------

function InquiryForm({ slug }) {
  const [successMessage, setSuccessMessage] = useState(null)
  const { mutateAsync, isPending } = useSendContact(slug)

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    reset,
    control,
    formState: { errors },
  } = useForm({ resolver: zodResolver(contactSchema), defaultValues })

  const messageLength = (useWatch({ control, name: 'message' }) ?? '').length

  const onSubmit = async (values) => {
    if (isPending) return // double submit se bachao
    clearErrors('root')
    try {
      const response = await mutateAsync(values)
      reset(defaultValues)
      setSuccessMessage(response?.message || DEFAULT_SUCCESS)
      notify.success('Message sent')
    } catch (error) {
      const fieldErrors = applyServerErrors(error, setError, { fields: FIELDS })
      notify.error(fieldErrors ? 'Please check the highlighted fields.' : error)
    }
  }

  // Reference jaisa halka tinted field background
  const field = 'bg-background'

  return (
    <Card className="cp-card">
      {successMessage ? (
        <SuccessPanel message={successMessage} onReset={() => setSuccessMessage(null)} />
      ) : (
        <>
          <CardHead
            eyebrow="Send a message"
            title="Send an Inquiry"
            description="Fill out the form below and I will reply to your inquiry by email."
          />

          <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ display: 'grid', gap: '1rem' }}>
            <div className="cp-row">
              <FormField label="Full name" error={errors.full_name?.message} required>
                <Input
                  {...register('full_name')}
                  className={field}
                  placeholder="e.g. Dr. Julian Vance"
                  autoComplete="name"
                />
              </FormField>
              <FormField label="Email address" error={errors.email?.message} required>
                <Input
                  {...register('email')}
                  className={field}
                  type="email"
                  placeholder="e.g. j.vance@institute.edu"
                  autoComplete="email"
                />
              </FormField>
            </div>

            <div className="cp-row">
              <FormField label="Subject" error={errors.subject?.message} required>
                <Input {...register('subject')} className={field} placeholder="Brief topic summary" />
              </FormField>
              <FormField label="Inquiry type" error={errors.inquiry_type?.message} required>
                <Select {...register('inquiry_type')} className={field} placeholder="Select an inquiry area...">
                  {INQUIRY_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </Select>
              </FormField>
            </div>

            <FormField
              label="Message"
              error={errors.message?.message}
              hint={`${messageLength} / ${MESSAGE_MAX}`}
              required
            >
              <Textarea
                {...register('message')}
                className={field}
                rows={6}
                placeholder="Please outline your question, proposal or meeting request..."
              />
            </FormField>

            {errors.root?.server?.message && (
              <p
                role="alert"
                className="border-danger/30 bg-danger/10 text-danger rounded-lg border"
                style={{ fontSize: '0.8125rem', padding: '0.625rem 0.875rem' }}
              >
                {errors.root.server.message}
              </p>
            )}

            <div
              className="border-line bg-surface text-muted rounded-lg border"
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.625rem',
                padding: '0.75rem 0.875rem',
                fontSize: '0.75rem',
              }}
            >
              <ShieldCheck className="text-primary shrink-0" width={16} height={16} aria-hidden="true" />
              <p style={{ lineHeight: 1.6 }}>
                Your details are only used to reply to your message and are never shared with anyone else.
              </p>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem 1rem' }}>
              <Button type="submit" loading={isPending}>
                {isPending ? (
                  'Sending...'
                ) : (
                  <>
                    Send Message
                    <Send width={14} height={14} aria-hidden="true" />
                  </>
                )}
              </Button>
              <p className="text-muted" style={{ fontSize: '0.75rem' }}>
                Fields marked * are required.
              </p>
            </div>
          </form>
        </>
      )}
    </Card>
  )
}

// ---------- Hero ----------

const HERO_CHIPS = [
  { icon: Mail, label: 'Replies by email' },
  { icon: Lock, label: 'Private & confidential' },
  { icon: Globe, label: 'Collaborations welcome' },
]

// Navy PageHero + animated gradient glow, dot grid, neeche chalti gradient line, chips ek ek karke aate hain.
function ContactHero({ title, subtitle }) {
  return (
    <div className="cp-hero">
      <PageHero eyebrow="Contact" title={title} subtitle={subtitle}>
        <ul className="cp-chips">
          {HERO_CHIPS.map(({ icon: Icon, label }, i) => (
            <li
              key={label}
              className="border-on-navy/20 bg-on-navy/10 text-on-navy/85 inline-flex items-center rounded-full border"
              style={{ '--i': i, gap: '0.375rem', padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}
            >
              <Icon className="text-accent" width={13} height={13} aria-hidden="true" />
              {label}
            </li>
          ))}
        </ul>
      </PageHero>
      <span className="cp-glow cp-glow-a" aria-hidden="true" />
      <span className="cp-glow cp-glow-b" aria-hidden="true" />
      <span className="cp-dots" aria-hidden="true" />
    </div>
  )
}

// ---------- Page ----------

export function ContactPage() {
  const { slug, portfolio, contact, pageIntros } = usePublicSite()
  const intro = pageIntros?.contact

  return (
    <div className="cp-root">
      <style>{PAGE_CSS}</style>

      <ContactHero
        title={intro?.title || "Let's Connect"}
        subtitle={
          intro?.subtitle ||
          'Open to scholarly exchanges, research collaborations, advisory consultations and speaking engagements. Reach out below and I will reply by email.'
        }
      />

      <div className="bg-background">
        <Container>
          <div className="cp-grid">
            <div className="cp-form">
              <InquiryForm slug={slug} />
            </div>

            <aside className="cp-side" aria-label="Contact details">
              <ContactDetailsCard contact={contact} />
              <SocialCard links={portfolio?.social_links} />
            </aside>
          </div>
        </Container>
      </div>
    </div>
  )
}
