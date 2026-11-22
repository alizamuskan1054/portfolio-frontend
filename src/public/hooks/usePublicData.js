import { useMutation, useQuery } from '@tanstack/react-query'
import { publicApi } from '@/api/public'
import { normalizeAcademic, normalizePortfolioBundle, sortByOrder, toList } from '@/public/lib/normalize'

// Public site ke saare data hooks. Pages sirf yeh use karen, publicApi seedha nahi.
//
//   const { data, isPending, isError, error } = usePortfolio(slug)
//   error.status === 404  -> slug galat ya portfolio published nahi (NotFound dikhao)
//
// Query key: ['public', slug, ...]. Visitors ke liye 5 minute cache (admin edits ke liye 1 min kafi nahi, 5 theek).

const STALE = 5 * 60 * 1000

function usePublicQuery(slug, name, queryFn, { select, extraKey = [], enabled = true } = {}) {
  return useQuery({
    queryKey: ['public', slug, name, ...extraKey],
    queryFn,
    select,
    enabled: Boolean(slug) && enabled,
    staleTime: STALE,
  })
}

// Layout ek baar load karta hai; baqi hooks isi slug par chalte hain
export const usePortfolio = (slug) =>
  usePublicQuery(slug, 'portfolio', () => publicApi.getPortfolio(slug), { select: normalizePortfolioBundle })

export const useAcademic = (slug, options) =>
  usePublicQuery(slug, 'academic', () => publicApi.getAcademic(slug), { select: normalizeAcademic, ...options })

export const useServices = (slug, options) =>
  usePublicQuery(slug, 'services', () => publicApi.getServices(slug), { select: sortByOrder, ...options })

export const useProjects = (slug, options) =>
  usePublicQuery(slug, 'projects', () => publicApi.getProjects(slug), { select: sortByOrder, ...options })

export const useProject = (slug, id, options) =>
  usePublicQuery(slug, 'project', () => publicApi.getProject(slug, id), {
    extraKey: [id],
    enabled: id !== undefined && id !== null,
    ...options,
  })

export const usePublications = (slug, options) =>
  usePublicQuery(slug, 'publications', () => publicApi.getPublications(slug), { select: toList, ...options })

export const useBlogs = (slug, options) =>
  usePublicQuery(slug, 'blogs', () => publicApi.getBlogs(slug), { select: toList, ...options })

export const useBlog = (slug, blogSlug, options) =>
  usePublicQuery(slug, 'blog', () => publicApi.getBlog(slug, blogSlug), {
    extraKey: [blogSlug],
    enabled: Boolean(blogSlug),
    ...options,
  })

export const useTestimonials = (slug, options) =>
  usePublicQuery(slug, 'testimonials', () => publicApi.getTestimonials(slug), { select: sortByOrder, ...options })

// Contact form: error par throw karta hai (form mein applyServerErrors use karna).
// Double submit se bachne ke liye form `isPending` se button disable kare.
export function useSendContact(slug) {
  return useMutation({ mutationFn: (payload) => publicApi.sendContact(slug, payload) })
}
