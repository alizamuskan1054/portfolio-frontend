import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'
import { CoverImage } from './CoverImage'

// project: { title, category, short_description, thumbnail, year }. to: detail page ka path (paths.siteProject).
// featured: bara horizontal card (Projects page ka ek featured project).
export function ProjectCard({ project, to, featured = false, className }) {
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
        src={project.thumbnail}
        alt={project.title}
        className={featured ? 'aspect-video md:aspect-auto md:min-h-72' : undefined}
        imgClassName="transition-transform duration-300 group-hover:scale-105"
      />
      <div className={cn('flex flex-1 flex-col p-5', featured && 'justify-center md:p-8')}>
        <div className="flex flex-wrap items-center gap-2">
          {project.category && <Badge variant="primary">{project.category}</Badge>}
          {project.year && <span className="text-sm text-muted">{project.year}</span>}
        </div>
        <h3 className={cn('mt-3 transition-colors group-hover:text-primary', featured ? 'text-2xl' : 'text-lg')}>
          {project.title}
        </h3>
        {project.short_description && (
          <p className={cn('mt-2 text-body', !featured && 'line-clamp-2')}>{project.short_description}</p>
        )}
      </div>
    </Link>
  )
}
