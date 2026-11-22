import { paths } from '@/routes/paths'

// Navbar aur Footer dono yahan se links lete hain. page = visibility key (ALWAYS_VISIBLE_PAGES ya pages group).
const NAV_ITEMS = [
  { page: 'home', label: 'Home', to: paths.site },
  { page: 'about', label: 'About', to: paths.siteAbout },
  { page: 'services', label: 'Services', to: paths.siteServices },
  { page: 'projects', label: 'Projects', to: paths.siteProjects },
  { page: 'publications', label: 'Publications', to: paths.sitePublications },
  { page: 'blogs', label: 'Blogs', to: paths.siteBlogs },
  { page: 'contact', label: 'Contact', to: paths.siteContact },
]

// OFF page ka link nahi aata. vis = useSectionVisibility(...) ka result.
export function getVisibleNav(slug, vis) {
  return NAV_ITEMS.filter((item) => vis.isPageVisible(item.page)).map((item) => ({
    page: item.page,
    label: item.label,
    to: item.to(slug),
    end: item.page === 'home', // Home sirf exact /:slug par active
  }))
}
