import {
  Award, BookOpen, Brain, Briefcase, Code, Compass, Cpu, Database, FileText, FlaskConical, GraduationCap,
  Globe, Handshake, HeartPulse, Layers, Lightbulb, MessageSquare, Microscope, Mic, Presentation, Rocket,
  Scale, Search, ShieldCheck, Sparkles, Target, Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Backend icon naam (string) -> lucide icon. Sirf yeh chunnay hue icons bundle mein aate hain
// (saare lucide icons import karna bundle bhari kar deta hai). Naya icon chahiye to is map mein add karo.
const ICONS = {
  award: Award,
  'book-open': BookOpen,
  brain: Brain,
  briefcase: Briefcase,
  code: Code,
  compass: Compass,
  cpu: Cpu,
  database: Database,
  'file-text': FileText,
  'flask-conical': FlaskConical,
  globe: Globe,
  'graduation-cap': GraduationCap,
  handshake: Handshake,
  'heart-pulse': HeartPulse,
  layers: Layers,
  lightbulb: Lightbulb,
  'message-square': MessageSquare,
  mic: Mic,
  microscope: Microscope,
  presentation: Presentation,
  rocket: Rocket,
  scale: Scale,
  search: Search,
  'shield-check': ShieldCheck,
  target: Target,
  users: Users,
}

const boxSizes = { md: 'size-12', lg: 'size-14', xl: 'size-20' }
const iconSizes = { md: 'size-6', lg: 'size-7', xl: 'size-10' }

// variant:
//   soft     (default) soft blue tile par blue icon
//   gradient royal blue gradient tile (Services cards)
//   glass    navy/gradient background ke upar frosted tile
// Naam na mile to Sparkles.
export function IconTile({ name, size = 'md', variant = 'soft', className }) {
  const Icon = ICONS[name] ?? Sparkles
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center',
        variant === 'soft' && 'rounded-xl bg-primary-soft text-primary',
        variant === 'gradient' && 'sv-icon-gradient rounded-xl',
        variant === 'glass' && 'sv-icon-glass rounded-2xl',
        boxSizes[size] ?? boxSizes.md,
        className,
      )}
    >
      <Icon className={iconSizes[size] ?? iconSizes.md} aria-hidden="true" />
    </span>
  )
}
