import { Link } from 'react-router-dom'
import { Clock } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { CoverImage } from './CoverImage'

// blog: { title, excerpt, category, cover_image, published_at, reading_time }. to: paths.siteBlog.
// featured: bara horizontal card (Blogs page).
export function BlogCard({ blog, to, featured = false, className }) {
  return (
    <Link
      to={to}
      className={cn(
        'group overflow-hidden rounded-xl border border-line bg-card shadow-xs transition-colors hover:border-primary',
        featured ? 'grid md:grid-cols-2' : 'flex h-full flex-col',
        className,
      )}
    >
      <CoverImage
        src={blog.cover_image}
        alt={blog.title}
        className={featured ? 'aspect-video md:aspect-auto md:min-h-72' : undefined}
        imgClassName="transition-transform duration-300 group-hover:scale-105"
      />
      <div className={cn('flex flex-1 flex-col p-5', featured && 'justify-center md:p-8')}>
        {blog.category && (
          <div>
            <Badge variant="primary">{blog.category}</Badge>
          </div>
        )}
        <h3 className={cn('mt-3 transition-colors group-hover:text-primary', featured ? 'text-2xl' : 'text-lg')}>
          {blog.title}
        </h3>
        {featured && blog.excerpt && <p className="mt-2 text-body">{blog.excerpt}</p>}
        <p className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 pt-4 text-sm text-muted">
          <time dateTime={blog.published_at}>{formatDate(blog.published_at)}</time>
          {blog.reading_time && (
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3.5" aria-hidden="true" />
              {blog.reading_time} min read
            </span>
          )}
        </p>
      </div>
    </Link>
  )
}
