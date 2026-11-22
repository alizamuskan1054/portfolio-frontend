import { useEffect } from 'react'
import { Outlet, useLocation, useParams } from 'react-router-dom'
import { FullPageSpinner } from '@/components/ui/Spinner'
import { ErrorState } from '@/components/shared/ErrorState'
import { ScrollToTop } from '@/components/shared/ScrollToTop'
import { useSectionVisibility } from '@/hooks/useSectionVisibility'
import { Footer } from './components/Footer'
import { Navbar } from './components/Navbar'
import { PublicNotFound } from './components/PublicNotFound'
import { PublicSiteContext } from './hooks/usePublicSite'
import { usePortfolio } from './hooks/usePublicData'
import { resolveTemplate } from './templates'

// Naye page par upar se shuru
function ScrollToTopOnNavigate() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

// Browser tab icon: portfolio ka favicon (backend). Na ho to project ka default icon rehta hai.
// Site se bahar jane par purana icon wapas.
function useFavicon(href) {
  useEffect(() => {
    if (!href) return undefined
    let links = [...document.querySelectorAll('link[rel~="icon"]')]
    let created = null
    if (links.length === 0) {
      created = document.createElement('link')
      created.rel = 'icon'
      document.head.appendChild(created)
      links = [created]
    }
    const previous = links.map((l) => ({ link: l, href: l.getAttribute('href'), type: l.getAttribute('type') }))
    links.forEach((l) => {
      l.setAttribute('href', href)
      l.removeAttribute('type') // purana type (svg) naye png/ico par galat hota hai
    })
    return () => {
      if (created) created.remove()
      else
        previous.forEach(({ link, href: oldHref, type }) => {
          if (oldHref === null) link.removeAttribute('href')
          else link.setAttribute('href', oldHref)
          if (type) link.setAttribute('type', type)
        })
    }
  }, [href])
}

// Portfolio ek baar slug se load, navbar visibility se banta hai.
// Galat slug / unpublished (404) => simple standalone NotFound. Dusra error => retry.
export function PublicLayout() {
  const { slug } = useParams()
  const { data, isPending, isError, error, refetch } = usePortfolio(slug)
  const vis = useSectionVisibility(data?.portfolio.section_visibility)
  const fullName = data?.portfolio.full_name
  const designation = data?.portfolio.designation
  useFavicon(data?.portfolio.favicon)

  // Browser tab title
  useEffect(() => {
    if (!fullName) return undefined
    const previous = document.title
    document.title = designation ? `${fullName} | ${designation}` : fullName
    return () => {
      document.title = previous
    }
  }, [fullName, designation])

  if (isPending) return <FullPageSpinner />

  if (isError) {
    if (error?.status === 404) {
      return (
        <PublicNotFound
          fullScreen
          title="Portfolio not found"
          message="This portfolio does not exist or has not been published."
        />
      )
    }
    return (
      <main className="bg-background flex min-h-screen items-center justify-center px-6">
        <ErrorState message={error?.message} onRetry={refetch} />
      </main>
    )
  }

  const template = resolveTemplate(data.portfolio.template)
  const value = { slug, ...data, vis, template }

  return (
    <PublicSiteContext.Provider value={value}>
      <div data-template={template.key}>
        <ScrollToTopOnNavigate />
        <a
          href="#main"
          className="focus:bg-primary focus:text-on-primary sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:px-4 focus:py-2"
        >
          Skip to content
        </a>
        <Navbar />
        <div id="main">
          <Outlet />
        </div>
        <Footer />
        <ScrollToTop className="bottom-2" />
      </div>
    </PublicSiteContext.Provider>
  )
}
