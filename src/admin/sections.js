import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'
import { createResource } from '@/api/resource'
import { buildFilePayload } from '@/lib/formData'

export const toList = (data) => (Array.isArray(data) ? data : (data?.results ?? []))

// ============================================================================
// Portfolio ke child sections (Academic + Website content).
// Form ke fields BACKEND se aate hain: OPTIONS /api/portfolios/<path>/ (DRF metadata) har field ka
// naam, type, required, choices batata hai. Isliye field names guess nahi hote.
// Neeche `fallbackFields` sirf tab chalte hain jab OPTIONS na mile.
// ============================================================================
export const SECTIONS = {
  // --- Academic ---
  educations: { label: 'Education', singular: 'Education' },
  experiences: { label: 'Experience', singular: 'Experience' },
  'research-interests': { label: 'Research interests', singular: 'Research interest' },
  expertise: { label: 'Expertise', singular: 'Expertise' },
  awards: { label: 'Awards', singular: 'Award' },
  memberships: { label: 'Memberships', singular: 'Membership' },
  // --- Website content ---
  services: {
    label: 'Services',
    singular: 'Service',
    reorder: true,
    toggle: 'is_visible',
  },
  projects: {
    label: 'Projects',
    singular: 'Project',
    toggle: 'is_visible',
    gallery: true,
  },
  publications: { label: 'Publications', singular: 'Publication', toggle: 'is_visible' },
  blogs: { label: 'Blogs', singular: 'Blog post', toggle: 'is_visible' },
  testimonials: { label: 'Testimonials', singular: 'Testimonial', toggle: 'is_visible' },
  contacts: { label: 'Contact', singular: 'Contact details', max: 1 },
  'social-links': { label: 'Social links', singular: 'Social link' },
  'process-steps': { label: 'How I work', singular: 'Step' },
  'page-intros': { label: 'Page intros', singular: 'Page intro' },
  categories: { label: 'Categories', singular: 'Category' },
}

export const ACADEMIC_TABS = [
  'educations',
  'experiences',
  'research-interests',
  'expertise',
  'awards',
  'memberships',
]
// 'contact-links' = Contact + Social links ek hi tab (ContactLinks.jsx). Order: jo pehle add hona chahiye woh pehle.
export const CONTENT_TABS = [
  'categories',
  'projects',
  'blogs',
  'services',
  'publications',
  'testimonials',
  'contact-links',
  'process-steps',
  'page-intros',
]

export const resources = Object.fromEntries(
  Object.keys(SECTIONS).map((path) => [
    path,
    createResource(`/portfolios/${path}`, { name: `pf-${path}` }),
  ]),
)
export const galleryResource = createResource('/portfolios/project-images', {
  name: 'pf-project-images',
})

// OPTIONS na mile to ye chalte hain (backend errors se jo naam pata chale wo bhi shamil)
const fallbackFields = {
  educations: [
    { name: 'degree', label: 'Degree', required: true },
    { name: 'field_of_study', label: 'Field of study', required: true },
    { name: 'institution', label: 'Institution', required: true },
    { name: 'start_year', label: 'Start year', type: 'number' },
    { name: 'end_year', label: 'End year', type: 'number' },
    { name: 'description', label: 'Description', type: 'textarea' },
  ],
  experiences: [
    { name: 'job_title', label: 'Job title', required: true },
    { name: 'organization_name', label: 'Organization', required: true },
    { name: 'start_date', label: 'Start date', type: 'date', required: true },
    { name: 'end_date', label: 'End date', type: 'date' },
    { name: 'description', label: 'Description', type: 'textarea' },
  ],
  awards: [
    { name: 'name', label: 'Name', required: true },
    { name: 'issuing_organization', label: 'Issuing organization', required: true },
    { name: 'description', label: 'Description', type: 'textarea' },
  ],
}

// === OPTIONS metadata -> form fields =========================================
const HIDDEN = new Set([
  'id',
  'portfolio',
  'project',
  'created_at',
  'updated_at',
  'display_order',
  'order',
  'status_changed_at',
])
// Dusre table se juday fields (backend pk maangta hai): form mein dropdown / checkboxes
const RELATIONS = {
  category: { path: 'categories', labelKey: 'name' },
  categories: { path: 'categories', labelKey: 'name', multiple: true },
}
const RICH = new Set(['content', 'body', 'detailed_description'])
const LONG = /description|summary|bio|message|excerpt|address|notes|abstract/i

function mapField(name, meta, path) {
  if (!meta || meta.read_only || HIDDEN.has(name)) return null
  const base = {
    name,
    label: meta.label || name.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase()),
    required: Boolean(meta.required),
    maxLength: meta.max_length,
    hint: meta.help_text || undefined,
  }
  switch (meta.type) {
    case 'integer':
    case 'decimal':
    case 'float':
      return { ...base, type: 'number' }
    case 'boolean':
      return { ...base, type: 'checkbox', required: false }
    case 'date':
      return { ...base, type: 'date' }
    case 'datetime':
      return { ...base, type: 'datetime-local' }
    case 'email':
      return { ...base, type: 'email' }
    case 'url':
      return { ...base, type: 'url' }
    case 'image upload':
      return { ...base, type: 'image' }
    case 'file upload':
      return { ...base, type: 'file' }
    case 'choice':
    case 'multiple choice':
      return {
        ...base,
        type: 'select',
        options: (meta.choices ?? []).map((c) => ({
          value: c.value,
          label: c.display_name,
        })),
      }
    case 'field':
    case 'many related':
      if (RELATIONS[name]) return { ...base, type: 'relation', relation: RELATIONS[name] }
      if (meta.type === 'many related') return null
    // eslint-disable-next-line no-fallthrough
    case 'string': {
      if (RICH.has(name) && ['blogs', 'projects'].includes(path))
        return { ...base, type: 'rich' }
      const long =
        (meta.max_length ?? 0) > 200 ||
        LONG.test(name) ||
        meta.style?.base_template === 'textarea.html'
      return { ...base, type: long ? 'textarea' : 'text' }
    }
    default:
      return null // nested object / list: form mein nahi
  }
}

// Fields ka order: required pehle, phir baaki; image/rich/textarea aakhir mein
const weight = (f) =>
  ['rich'].includes(f.type)
    ? 3
    : ['textarea'].includes(f.type)
      ? 2
      : ['image', 'file'].includes(f.type)
        ? 4
        : f.required
          ? 0
          : 1

export function useSectionSchema(path, { enabled = true } = {}) {
  const query = useQuery({
    enabled,
    queryKey: ['pf-schema', path],
    staleTime: Infinity,
    retry: false,
    queryFn: async () => {
      try {
        const meta = await api.options(`/portfolios/${path}/`)
        const post = meta?.actions?.POST
        if (!post) return null
        const fields = Object.entries(post)
          .map(([name, m]) => mapField(name, m, path))
          .filter(Boolean)
        return fields.length ? fields : null
      } catch {
        return null
      }
    },
  })

  const fields = query.data ?? (query.isFetched ? (fallbackFields[path] ?? []) : null)
  const sorted = fields ? [...fields].sort((a, b) => weight(a) - weight(b)) : null
  return {
    fields: sorted,
    isLoading: enabled && query.isLoading,
    fromBackend: Boolean(query.data),
  }
}

// Row ka title / subtitle fields schema se
export function pickDisplay(fields, item) {
  const text = fields.filter((f) =>
    ['text', 'textarea', 'select', 'date', 'number', 'url', 'email'].includes(f.type),
  )
  const titleField = text.find((f) => f.required && f.type === 'text') ?? text[0]
  const rest = text.filter((f) => f !== titleField && f.type !== 'textarea').slice(0, 3)
  const val = (f) => {
    const v = item[f.name]
    if (v === null || v === undefined || v === '') return null
    const opt = f.options?.find((o) => String(o.value) === String(v))
    return opt?.label ?? v
  }
  return {
    title: titleField ? val(titleField) : null,
    subtitle: rest.map(val).filter(Boolean).join(' · '),
  }
}

// Form values -> API payload. File/image fields: naya File = multipart, hata di = null, jas ki tas = bheji nahi jati.
export function buildPayload(
  fields,
  values,
  extra = {},
  isUpdate = false,
  original = null,
) {
  const data = { ...extra }
  const fileFields = []
  fields.forEach((f) => {
    const v = values[f.name]
    if (f.type === 'image' || f.type === 'file') {
      fileFields.push(f.name)
      data[f.name] = v
      return
    }
    if (v === undefined) return
    if (f.type === 'relation') {
      if (f.relation?.multiple) data[f.name] = (v ?? []).map(Number)
      else if (v === '' || v === null) {
        if (isUpdate) data[f.name] = null
      } else data[f.name] = Number(v)
      return
    }
    if (v === '' && !['text', 'textarea', 'rich'].includes(f.type)) {
      // khali number/date/select: create par bhejte hi nahi, edit par null (clear karne ke liye) - select skip
      if (isUpdate && f.type !== 'select') data[f.name] = null
      return
    }
    data[f.name] = f.type === 'number' ? Number(v) : v
  })
  return buildFilePayload(data, fileFields, original ?? {})
}

// === Category kinds: Project categories alag, Blog categories alag ==========
// Backend ke categories form mein agar "type" jaisa choice field hai (project / blog), to hum usse
// alag karte hain. Wo field form mein dikhaya nahi jata; tab ke hisab se khud set hota hai.
export const CATEGORY_KINDS = { projects: 'project', blogs: 'blog' }
export const CATEGORY_TABS = { project: 'project-categories', blog: 'blog-categories' }

export const findKindField = (fields) =>
  fields?.find(
    (f) =>
      f.type === 'select' &&
      f.options?.some((o) => /project/i.test(String(o.value))) &&
      f.options?.some((o) => /blog/i.test(String(o.value))),
  )

export const kindValue = (kindField, kind) =>
  kindField?.options.find((o) => String(o.value).toLowerCase().includes(kind))?.value

export const matchesKind = (kindField, item, kind) =>
  !kindField ||
  String(item[kindField.name] ?? '')
    .toLowerCase()
    .includes(kind)
