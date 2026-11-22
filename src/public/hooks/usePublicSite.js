import { createContext, useContext } from 'react'

// PublicLayout portfolio ek baar load karke yahan rakhta hai. Pages/sections isse padhte hain:
//   const { slug, portfolio, contact, pageIntros, processSteps, vis } = usePublicSite()
//   vis.isVisible('home', 'testimonials', items.length > 0)
export const PublicSiteContext = createContext(null)

export function usePublicSite() {
  const ctx = useContext(PublicSiteContext)
  if (!ctx) throw new Error('usePublicSite must be used inside <PublicLayout>')
  return ctx
}
