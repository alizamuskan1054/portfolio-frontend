import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

// Layout ke andar: navbar/footer ke beech. Standalone (galat slug): fullScreen, homeTo nahi (public home hai hi nahi).
export function PublicNotFound({ homeTo, fullScreen = false, title = 'Page not found', message }) {
  return (
    <main
      className={cn(
        'flex flex-col items-center justify-center bg-background px-6 text-center',
        fullScreen ? 'min-h-screen' : 'min-h-[60vh] py-16',
      )}
    >
      <p className="font-serif text-7xl font-bold text-primary">404</p>
      <h1 className="mt-3 text-2xl">{title}</h1>
      <p className="mt-2 max-w-md text-muted">
        {message ?? 'The page you are looking for does not exist or is not available.'}
      </p>
      {homeTo && (
        <Link
          to={homeTo}
          className="mt-6 rounded-lg bg-primary px-5 py-2.5 font-medium text-on-primary transition-colors hover:bg-primary-hover"
        >
          Go to Home
        </Link>
      )}
    </main>
  )
}
