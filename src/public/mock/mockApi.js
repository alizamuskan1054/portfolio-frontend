import { ApiError } from '@/api/errors'
import { mockSites } from './mockData'

// publicApi (src/api/public.js) ke mock methods. Signature bilkul real jaisi.
// Real API ki tarah: published nahi / slug galat / id galat => 404 ApiError.

const delay = (ms = 350) => new Promise((resolve) => setTimeout(resolve, ms))
const notFound = (message = 'Not found.') => new ApiError(message, { status: 404 })

async function getSite(slug) {
  await delay()
  const site = mockSites[slug]
  if (!site || site.status !== 'published') throw notFound('Portfolio not found.')
  return site
}

export const mockPublicApi = {
  async getPortfolio(slug) {
    const { portfolio, contact, page_intros, process_steps } = await getSite(slug)
    return { portfolio, contact, page_intros, process_steps }
  },
  async getAcademic(slug) {
    return (await getSite(slug)).academic
  },
  async getServices(slug) {
    return (await getSite(slug)).services
  },
  async getProjects(slug) {
    // List mein gallery/detail fields nahi hoti, detail endpoint par aati hain (doc mein list sirf thumbnail+gallery dikhati hai)
    return (await getSite(slug)).projects
  },
  async getProject(slug, id) {
    const project = (await getSite(slug)).projects.find((p) => String(p.id) === String(id))
    if (!project) throw notFound('Project not found.')
    return project
  },
  async getPublications(slug) {
    return (await getSite(slug)).publications
  },
  async getBlogs(slug) {
    // List mein `content` nahi hota (bhari HTML): detail par aata hai
    return (await getSite(slug)).blogs.map((blog) => {
      const rest = { ...blog }
      delete rest.content
      return rest
    })
  },
  async getBlog(slug, blogSlug) {
    const blog = (await getSite(slug)).blogs.find((b) => b.slug === blogSlug)
    if (!blog) throw notFound('Blog not found.')
    return blog
  },
  async getTestimonials(slug) {
    return (await getSite(slug)).testimonials
  },
  async sendContact(slug, payload) {
    await getSite(slug)
    await delay(800)
    // Error UI test karne ke liye: email "fail@test.com" likho
    if (payload?.email === 'fail@test.com') {
      throw new ApiError('Could not send your message. Please try again.', { status: 500 })
    }
    return { message: 'Thank you for your message.' }
  },
  async downloadPdf() {
    await delay()
    throw new ApiError('PDF download is not available in mock mode.', { status: 404 })
  },
}
