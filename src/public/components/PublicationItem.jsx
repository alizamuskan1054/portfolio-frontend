import { ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'

// publication: { title, authors, journal, year, type, doi, url, is_featured }
// List row: patli divider ke saath (planning: rows with thin dividers). Parent <ul> mein <li> ki tarah use karo.
export function PublicationItem({ publication: p }) {
  const doiUrl = p.doi ? `https://doi.org/${p.doi}` : null
  const venue = [p.journal, p.year].filter(Boolean).join(' · ')

  return (
    <li className="border-b border-line py-6 first:pt-0 last:border-b-0">
      <div className="flex flex-wrap items-center gap-2">
        {p.type && <Badge variant="primary">{p.type}</Badge>}
        {p.is_featured && <Badge variant="accent">Featured</Badge>}
      </div>
      <h3 className="mt-2 text-lg">{p.title}</h3>
      {p.authors && <p className="mt-1 text-body">{p.authors}</p>}
      {venue && <p className="text-sm text-muted italic">{venue}</p>}
      {(doiUrl || p.url) && (
        <p className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm font-medium">
          {doiUrl && (
            <a href={doiUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              DOI: {p.doi}
            </a>
          )}
          {p.url && (
            <a
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              View paper <ExternalLink className="size-3.5" aria-hidden="true" />
            </a>
          )}
        </p>
      )}
    </li>
  )
}
