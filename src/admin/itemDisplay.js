// List mein har entry ka title / subtitle / meta (years, badges) bananay ke liye.
// Backend ke field names section ke hisaab se alag hote hain, isliye pehle jo mile wahi lete hain.

const TITLE_KEYS = [
  'degree',
  'degree_name',
  'job_title',
  'position',
  'role',
  'title',
  'name',
  'certificate_name',
  'award_name',
  'course_name',
  'project_title',
  'service_name',
  'skill_name',
  'headline',
  'label',
  'platform',
  'question',
  'subject',
]
const SUBTITLE_KEYS = [
  'institution',
  'university',
  'organization',
  'company',
  'issuer',
  'issuing_organization',
  'awarded_by',
  'field_of_study',
  'client_name',
  'author_name',
  'author',
  'designation',
  'publisher',
  'venue',
  'location',
  'short_description',
  'summary',
]
const START_KEYS = ['start_year', 'start_date', 'from_year', 'issue_date', 'date', 'year']
const END_KEYS = ['end_year', 'end_date', 'to_year']
const BADGE_KEYS = [
  'grade',
  'gpa',
  'level',
  'proficiency',
  'employment_type',
  'status',
  'type',
]

const text = (v) => {
  if (v === null || v === undefined || v === '') return ''
  if (typeof v === 'object') return text(v.name ?? v.title ?? v.label)
  if (typeof v === 'boolean' || Array.isArray(v)) return ''
  return String(v).trim()
}
const first = (item, keys, skip = '') => {
  for (const k of keys) {
    const v = text(item[k])
    if (v && v !== skip) return v
  }
  return ''
}
const yearOf = (v) => {
  const t = text(v)
  const m = t.match(/^(\d{4})(?:-(\d{2}))?/)
  if (!m) return t
  if (!m[2]) return m[1]
  return new Date(`${m[1]}-${m[2]}-01T00:00:00`).toLocaleDateString('en', {
    month: 'short',
    year: 'numeric',
  })
}

export function describeItem(item, fallback = {}) {
  const title = first(item, TITLE_KEYS) || fallback.title || `#${item.id}`
  const subtitle = first(item, SUBTITLE_KEYS, title) || fallback.subtitle || ''

  const start = yearOf(first(item, START_KEYS))
  const current = item.is_current === true || item.currently_studying === true
  const end = current ? 'Present' : yearOf(first(item, END_KEYS))
  const period = start && end && start !== end ? `${start} – ${end}` : start || end || ''

  const badges = BADGE_KEYS.map((k) => text(item[k])).filter(Boolean)
  const category = text(item.category)
  if (category && !badges.includes(category)) badges.unshift(category)
  if (item.is_featured === true) badges.push('Featured')

  return { title, subtitle, period, badges: badges.slice(0, 3) }
}
