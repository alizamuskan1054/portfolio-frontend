import {
  AlignLeft,
  Award,
  BarChart3,
  BookOpen,
  Briefcase,
  Building2,
  CalendarDays,
  GraduationCap,
  Globe,
  Image,
  KeyRound,
  LayoutTemplate,
  Link2,
  Lock,
  Mail,
  MapPin,
  Paperclip,
  Phone,
  Tag,
  Type,
  User,
} from 'lucide-react'

// Label ke lafz se icon: har form mein khud lagta hai. Pehla match jeetta hai.
// FormField mein icon={Icon} se badal sakte hain, icon={false} se hata sakte hain.
const RULES = [
  [/e-?mail/, Mail],
  [/phone|mobile|whatsapp|contact number/, Phone],
  [/password/, Lock],
  [/full name|author|client|researcher|^user/, User],
  [/profession|designation|job|position|role|employer/, Briefcase],
  [
    /organi[sz]ation|institution|university|company|issuer|publisher|venue|school/,
    Building2,
  ],
  [/location|address|city|country|place/, MapPin],
  [/degree|education|field of study|major|course|certificate/, GraduationCap],
  [/public link|slug|link|url|website|linkedin|github|twitter|social/, Link2],
  [/^key$|\bkey\b|identifier|^id$/, KeyRound],
  [/date|year|start|end|from|until|issued|period/, CalendarDays],
  [/grade|gpa|score|award|honou?r|rank/, Award],
  [/publication|citation|journal|paper|book/, BookOpen],
  [/h-?index|count|total|number/, BarChart3],
  [
    /description|biography|bio\b|summary|intro|about|message|content|abstract|details|body|note/,
    AlignLeft,
  ],
  [/template/, LayoutTemplate],
  [/logo|favicon|photo|image|picture|avatar|banner|thumbnail|cover/, Image],
  [/\bcv\b|resume|file|attachment|document|pdf/, Paperclip],
  [/language|platform|site/, Globe],
  [/title|subject|heading|headline|name|label|question/, Type],
]

// Backend ke labels: "Doi" -> "DOI", "External url" -> "External URL"
export function prettyLabel(label) {
  if (typeof label !== 'string') return label
  return label
    .replace(/\bdoi\b/i, 'DOI')
    .replace(/\burl\b/i, 'URL')
    .replace(/\bcv\b/i, 'CV')
    .replace(/\bgpa\b/i, 'GPA')
}

export function inferFieldIcon(label) {
  if (typeof label !== 'string') return Tag
  const text = label.toLowerCase().trim()
  for (const [pattern, icon] of RULES) if (pattern.test(text)) return icon
  return Tag
}
