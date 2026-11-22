import { paths } from '@/routes/paths'
import { PublicNotFound } from '@/public/components/PublicNotFound'
import { usePublicSite } from '@/public/hooks/usePublicSite'

// /:slug/koi-bhi-galat-url (layout ke andar, slug sahi hai)
export function PublicNotFoundPage() {
  const { slug } = usePublicSite()
  return <PublicNotFound homeTo={paths.site(slug)} />
}
