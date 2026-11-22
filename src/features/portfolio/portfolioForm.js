// Portfolio form ke shared helpers: admin wizard aur client portal dono yahi istemal karte hain.

import { z } from 'zod'
import { buildFilePayload } from '@/lib/formData'
import { RESERVED_SLUGS } from '@/routes/paths'

export const FIELDS = [
  'client',
  'template',
  'title',
  'slug',
  'full_name',
  'designation',
  'short_intro',
  'biography',
  'profile_photo',
  'logo',
  'favicon',
  'cv_file',
  'total_publications',
  'citations',
  'h_index',
]

export const toList = (data) => (Array.isArray(data) ? data : (data?.results ?? []))

export const slugify = (text) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const optionalCount = z
  .union([z.string(), z.number()])
  .optional()
  .refine(
    (v) => v === undefined || v === '' || /^\d+$/.test(String(v)),
    'Enter a whole number',
  )

export const schema = z.object({
  client: z.string().min(1, 'Select a client'),
  template: z.string().min(1, 'Select a template'),
  title: z.string().trim().min(1, 'Title is required').max(255, 'Too long'),
  slug: z
    .string()
    .trim()
    .min(1, 'Public link is required')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and dashes only')
    .refine((v) => !RESERVED_SLUGS.includes(v), 'This link is reserved. Try another.'),
  full_name: z.string().trim().min(1, 'Full name is required').max(255, 'Too long'),
  designation: z.string().trim().optional(),
  short_intro: z.string().trim().max(300, 'Keep it under 300 characters').optional(),
  biography: z.string().trim().optional(),
  profile_photo: z.any().optional(),
  logo: z.any().optional(),
  favicon: z.any().optional(),
  cv_file: z.any().optional(),
  total_publications: optionalCount,
  citations: optionalCount,
  h_index: optionalCount,
})

export const toDefaults = (p, presetClient) => ({
  client: String(p?.client ?? presetClient ?? ''),
  template: String(p?.template ?? ''),
  title: p?.title ?? '',
  slug: p?.slug ?? '',
  full_name: p?.full_name ?? '',
  designation: p?.designation ?? '',
  short_intro: p?.short_intro ?? '',
  biography: p?.biography ?? '',
  profile_photo: p?.profile_photo ?? null,
  logo: p?.logo ?? null,
  favicon: p?.favicon ?? null,
  cv_file: p?.cv_file ?? null,
  total_publications: p?.total_publications ?? '',
  citations: p?.citations ?? '',
  h_index: p?.h_index ?? '',
})

// Naya File ho to multipart; warna JSON (purani file ka URL wapas nahi bhejte, warna PATCH fail hota hai)
export function buildPayload(values, original) {
  const { profile_photo, logo, favicon, cv_file, ...rest } = values
  const data = { ...rest }
  ;['total_publications', 'citations', 'h_index'].forEach((key) => {
    if (data[key] === '' || data[key] === undefined) delete data[key]
    else data[key] = Number(data[key])
  })
  return buildFilePayload(
    { ...data, profile_photo, logo, favicon, cv_file },
    ['profile_photo', 'logo', 'favicon', 'cv_file'],
    original,
  )
}

// Client portal: client backend se apne aap set hota hai, isliye form mein nahi hota.
export const portalSchema = schema.extend({ client: z.string().optional() })

// create par backend `client` maangta hai: apni client id bhejte hain (backend ownership check kare).
// edit (PATCH) par client nahi bheja jata.
export function buildPortalPayload(values, original, { clientId } = {}) {
  const payload = buildPayload(values, original)
  if (payload instanceof FormData) {
    payload.delete('client')
    if (clientId) payload.set('client', String(clientId))
  } else {
    delete payload.client
    if (clientId) payload.client = Number(clientId)
  }
  return payload
}
