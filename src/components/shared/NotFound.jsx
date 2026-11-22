import { Link } from 'react-router-dom'

export function NotFound({ homeTo = '/', homeLabel = 'Go to Home' }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <p className="text-7xl font-bold text-primary">404</p>
      <h1 className="mt-4 text-3xl">Page not found</h1>
      <p className="mt-2 max-w-md text-muted">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        to={homeTo}
        className="mt-6 rounded-lg bg-primary px-5 py-2.5 font-medium text-on-primary transition-colors hover:bg-primary-hover"
      >
        {homeLabel}
      </Link>
    </main>
  )
}
