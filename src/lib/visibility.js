// Section visibility: admin wizard (Visibility step) save karta hai, public site padhti hai.
// Portfolio ke `section_visibility` JSON field ka shape yahin fix hai.
// IMPORTANT: admin team yahi file import kare (key names alag na likhe), warna toggles match nahi honge.
//
// Rule: key missing ho to ON maani jati hai (default: sab ON). Sirf `false` hide karta hai.

// Hero, navbar, footer hamesha dikhte hain. Pages jo toggle nahi hote:
export const ALWAYS_VISIBLE_PAGES = ['home', 'about', 'contact']

// group -> key -> label (admin toggles ka label bhi yahin se bane)
export const VISIBILITY_GROUPS = {
  pages: {
    label: 'Pages',
    items: {
      services: 'Services',
      projects: 'Projects',
      publications: 'Publications',
      blogs: 'Blogs',
    },
  },
  home: {
    label: 'Home sections',
    items: {
      research_interests: 'Research Interests',
      featured_projects: 'Featured Projects',
      latest_publications: 'Latest Publications',
      testimonials: 'Testimonials',
      latest_blogs: 'Latest Blogs',
    },
  },
  about: {
    label: 'About sections',
    items: {
      education: 'Education',
      experience: 'Experience',
      expertise: 'Expertise',
      awards: 'Awards',
      memberships: 'Memberships',
    },
  },
  services: {
    label: 'Services page',
    items: {
      how_i_work: 'How I Work',
      contact_cta: 'Contact call-to-action',
    },
  },
}

// Sab ON: { pages: { services: true, ... }, home: { ... }, ... }
export const DEFAULT_VISIBILITY = Object.fromEntries(
  Object.entries(VISIBILITY_GROUPS).map(([group, { items }]) => [
    group,
    Object.fromEntries(Object.keys(items).map((key) => [key, true])),
  ]),
)

// Backend se kuch bhi aaye (null, adhoora, purani keys) defaults ke upar merge hota hai.
export function normalizeVisibility(raw) {
  const source = raw && typeof raw === 'object' ? raw : {}
  const out = {}

  Object.entries(DEFAULT_VISIBILITY).forEach(([group, defaults]) => {
    const incoming = source[group] && typeof source[group] === 'object' ? source[group] : {}
    out[group] = { ...defaults }
    Object.keys(defaults).forEach((key) => {
      if (typeof incoming[key] === 'boolean') out[group][key] = incoming[key]
    })
  })

  return out
}
