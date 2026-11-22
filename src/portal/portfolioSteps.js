// Portfolio banane ke steps (admin wizard jaise): har step ek page hai.
// part '' = Overview (Review & publish).
export const PORTFOLIO_STEPS = [
  { key: 'basic', label: 'Basic info', part: 'basic' },
  { key: 'academic', label: 'Academic', part: 'academic' },
  { key: 'content', label: 'Website content', part: 'content' },
  { key: 'contact', label: 'Contact & links', part: 'contact' },
  { key: 'visibility', label: 'Visibility', part: 'visibility' },
  { key: 'review', label: 'Review & publish', part: '' },
]

const ACADEMIC_SECTIONS = [
  'educations',
  'experiences',
  'research-interests',
  'expertise',
  'awards',
  'memberships',
]

// URL ke hisab se current step ka index (item add/edit pages apne section ke step mein aate hain)
export function stepIndexFor(pathname, portfolioId) {
  const rest = pathname
    .replace(`/portal/portfolios/${portfolioId}`, '')
    .replace(/^\//, '')
  if (!rest) return 5
  const [first, section] = rest.split('/')
  if (first === 'items') return ACADEMIC_SECTIONS.includes(section) ? 1 : 2
  const i = PORTFOLIO_STEPS.findIndex((s) => s.part === first)
  return i === -1 ? 5 : i
}
