import { api, client } from './client'

// Public site API: /api/public/{slug}/...
// Sab calls skipAuth: visitors ke paas token nahi hota.
//
// Mock switch (.env):
//   VITE_PUBLIC_MOCK=true   (default) -> src/public/mock ka fake data
//   VITE_PUBLIC_MOCK=false            -> real backend
// Components sirf `publicApi` use karte hain, switch ka unhein pata nahi chalta.
export const USE_PUBLIC_MOCK = import.meta.env.VITE_PUBLIC_MOCK !== 'true'

const base = (slug) => `/public/${encodeURIComponent(slug)}`
const opts = { skipAuth: true }

const realApi = {
  getPortfolio: (slug) => api.get(`${base(slug)}/`, opts),
  getAcademic: (slug) => api.get(`${base(slug)}/academic/`, opts),
  getServices: (slug) => api.get(`${base(slug)}/services/`, opts),
  getProjects: (slug) => api.get(`${base(slug)}/projects/`, opts),
  getProject: (slug, id) => api.get(`${base(slug)}/projects/${id}/`, opts),
  getPublications: (slug) => api.get(`${base(slug)}/publications/`, opts),
  getBlogs: (slug) => api.get(`${base(slug)}/blogs/`, opts),
  getBlog: (slug, blogSlug) => api.get(`${base(slug)}/blogs/${encodeURIComponent(blogSlug)}/`, opts),
  getTestimonials: (slug) => api.get(`${base(slug)}/testimonials/`, opts),
  sendContact: (slug, payload) => api.post(`${base(slug)}/contact/`, payload, opts),
  // Blob response (poora axios response, `.data` = Blob)
  downloadPdf: (slug) => client.get(`${base(slug)}/pdf/`, { ...opts, responseType: 'blob' }),
}

// Mock sirf tab load hota hai jab flag ON ho (production build mein real mode par bundle mein nahi jata)
const call = (method, args) =>
  USE_PUBLIC_MOCK
    ? import('@/public/mock/mockApi').then((m) => m.mockPublicApi[method](...args))
    : realApi[method](...args)

export const publicApi = Object.fromEntries(
  Object.keys(realApi).map((method) => [method, (...args) => call(method, args)]),
)
