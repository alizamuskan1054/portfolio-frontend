import { cn } from '@/lib/utils'

import {
  FaLinkedinIn,
  FaGithub,
  FaFacebookF,
  FaInstagram,
  FaYoutube,
  FaWhatsapp,
} from 'react-icons/fa6'

import {
  SiX,
  SiGooglescholar,
  SiResearchgate,
  SiOrcid,
} from 'react-icons/si'

import { Globe, Mail, Link2 } from 'lucide-react'

const PLATFORMS = {
  linkedin: { label: 'LinkedIn', icon: FaLinkedinIn },
  github: { label: 'GitHub', icon: FaGithub },
  twitter: { label: 'X (Twitter)', icon: SiX },
  x: { label: 'X (Twitter)', icon: SiX },
  facebook: { label: 'Facebook', icon: FaFacebookF },
  instagram: { label: 'Instagram', icon: FaInstagram },
  youtube: { label: 'YouTube', icon: FaYoutube },
  whatsapp: { label: 'WhatsApp', icon: FaWhatsapp },
  google_scholar: { label: 'Google Scholar', icon: SiGooglescholar },
  researchgate: { label: 'ResearchGate', icon: SiResearchgate },
  orcid: { label: 'ORCID', icon: SiOrcid },
  website: { label: 'Website', icon: Globe },
  email: { label: 'Email', icon: Mail },
}

const sizes = {
  sm: 'size-8',
  md: 'size-10',
}

const iconSizes = {
  sm: 'text-base',
  md: 'text-lg',
}

export function SocialLinks({
  links,
  inverted = false,
  size = 'md',
  className,
}) {
  const valid = (links ?? []).filter((link) => link?.url)

  if (valid.length === 0) return null

  return (
    <ul className={cn('flex flex-wrap items-center gap-2.5', className)}>
      {valid.map(({ platform, url }) => {
        const meta = PLATFORMS[platform] ?? {
          label: platform || 'Link',
          icon: Link2,
        }

        const Icon = meta.icon

        return (
          <li key={`${platform}-${url}`}>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={meta.label}
              title={meta.label}
              className={cn(
                'inline-flex items-center justify-center rounded-lg transition-all duration-300 hover:-translate-y-1 hover:scale-110',
                sizes[size],
                inverted
                  ? 'bg-on-navy/10 text-on-navy hover:bg-primary hover:text-on-primary'
                  : 'bg-primary-soft text-primary hover:bg-primary hover:text-on-primary',
              )}
            >
              <Icon
                className={iconSizes[size]}
                aria-hidden="true"
              />
            </a>
          </li>
        )
      })}
    </ul>
  )
}