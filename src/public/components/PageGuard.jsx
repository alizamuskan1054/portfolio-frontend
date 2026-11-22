import { Outlet } from 'react-router-dom'
import { paths } from '@/routes/paths'
import { usePublicSite } from '@/public/hooks/usePublicSite'
import { PublicNotFound } from './PublicNotFound'

// Route guard: page OFF ho to URL kholne par bhi NotFound (navbar link pehle hi nahi aata).
//   { element: <PageGuard page="blogs" />, children: [ ...blogs routes ] }
export function PageGuard({ page }) {
  const { slug, vis } = usePublicSite()
  return vis.isPageVisible(page) ? <Outlet /> : <PublicNotFound homeTo={paths.site(slug)} />
}
