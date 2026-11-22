import { useState } from 'react'
import { Image as ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

// Card ki image. src na ho ya load fail ho to soft blue placeholder (layout nahi hilta).
export function CoverImage({ src, alt = '', className, imgClassName }) {
  const [failed, setFailed] = useState(false)

  return (
    <div className={cn('relative aspect-video overflow-hidden bg-primary-soft', className)}>
      {src && !failed ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onError={() => setFailed(true)}
          className={cn('size-full object-cover', imgClassName)}
        />
      ) : (
        <span className="flex size-full items-center justify-center text-primary/40" aria-hidden="true">
          <ImageIcon className="size-10" />
        </span>
      )}
    </div>
  )
}
