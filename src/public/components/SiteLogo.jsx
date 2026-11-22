import { useState } from 'react'
import { cn } from '@/lib/utils'

// Researcher ka logo (backend: portfolio.logo). Logo na ho ya load fail ho to naam ke initials wala badge.
// Navbar aur Footer dono isi ko use karte hain.
//   size   : badge/logo ki height (Tailwind class), default navbar jaisi
//   framed : navy background par logo kho na jaye, isliye halka safed chip ke andar (Footer)

function initialsOf(name = '') {
  const parts = name.replace(/^(dr|prof)\.?\s+/i, '').trim().split(/\s+/).filter(Boolean)
  return parts.length ? (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase() : '?'
}

export function SiteLogo({ logo, name, size = 'h-9', framed = false, className }) {
  const [failed, setFailed] = useState(false)

  if (logo && !failed) {
    const img = (
      <img
        src={logo}
        alt=""
        onError={() => setFailed(true)}
        className={cn(size, 'w-auto max-w-40 shrink-0 object-contain', !framed && className)}
      />
    )
    return framed ? <span className={cn('inline-flex rounded-lg bg-white/95 p-1.5', className)}>{img}</span> : img
  }

  return (
    <span
      className={cn(
        size,
        'inline-flex aspect-square shrink-0 items-center justify-center rounded-xl bg-primary font-serif text-sm font-semibold text-on-primary shadow-sm',
        className,
      )}
      aria-hidden="true"
    >
      {initialsOf(name)}
    </span>
  )
}
