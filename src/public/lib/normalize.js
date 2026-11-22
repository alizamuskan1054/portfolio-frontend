import { faviconUrl, forceDownload } from './download'

// Backend response -> frontend ka predictable shape.
// Backend ke field names badlein to sirf yahan fix hota hai, components nahi.
// Keys snake_case hi rehti hain (backend jaisi); yeh file sirf missing/null se bachati hai.

// Plain array ya DRF paginated { results: [] }, dono handle
export function toList(value) {
  if (Array.isArray(value)) return value
  if (Array.isArray(value?.results)) return value.results
  return []
}

const byOrder = (a, b) => (a?.display_order ?? 0) - (b?.display_order ?? 0)
export const sortByOrder = (value) => [...toList(value)].sort(byOrder)

const numberOrNull = (value) => (value === undefined || value === null || value === '' ? null : Number(value))

// GET /public/{slug}/  ->  { portfolio, contact, pageIntros, processSteps }
// ASSUMPTION: metrics `portfolio.metrics` mein hain; flat fields (citations, h_index) bhi chalte hain.
export function normalizePortfolioBundle(data) {
  const p = data?.portfolio ?? {}
  const m = p.metrics ?? {}

  return {
    portfolio: {
      slug: p.slug ?? '',
      title: p.title ?? '',
      full_name: p.full_name ?? '',
      designation: p.designation ?? '',
      photo: p.photo ?? p.profile_photo ?? null,
      favicon: faviconUrl(p.favicon ?? p.favicon_url ?? null), // browser tab icon (admin: PATCH /portfolios/portfolios/{id}/ field `favicon`)
      logo: p.logo ?? p.logo_url ?? null, // researcher ka apna logo (admin wizard mein upload)
      intro: p.intro ?? '',
      biography: p.biography ?? '',
      cv_url: forceDownload(p.cv_url ?? null, p.full_name), // Cloudinary link ko download link banata hai
      // Template ki key (admin Templates page wali, jaise "academic"). Backend ka shape confirm karna: template_key, template.key ya template (string)
      template: p.template_key ?? p.template?.key ?? (typeof p.template === 'string' ? p.template : null),
      section_visibility: p.section_visibility ?? null, // useSectionVisibility normalize karta hai
      social_links: toList(p.social_links).filter((s) => s?.url),
      metrics: {
        publications: numberOrNull(m.publications ?? p.total_publications),
        citations: numberOrNull(m.citations ?? p.citations),
        h_index: numberOrNull(m.h_index ?? p.h_index),
      },
    },
    contact: data?.contact ?? {},
    // page_intros: [{ page: 'services', title, intro }] -> { services: {...} }
    // Backend item: { page, title, intro, cta_text, cta_button_label }. Pages `subtitle` padhte hain, isliye intro ko subtitle bhi bana dete hain.
    pageIntros: Object.fromEntries(toList(data?.page_intros).map((i) => [i.page, { ...i, subtitle: i.subtitle ?? i.intro ?? '' }])),
    processSteps: sortByOrder(data?.process_steps),
  }
}

// GET /public/{slug}/academic/
export function normalizeAcademic(data) {
  return {
    educations: sortByOrder(data?.educations),
    experiences: sortByOrder(data?.experiences),
    research_interests: sortByOrder(data?.research_interests),
    expertise: sortByOrder(data?.expertise),
    awards: sortByOrder(data?.awards),
    memberships: sortByOrder(data?.memberships),
  }
}