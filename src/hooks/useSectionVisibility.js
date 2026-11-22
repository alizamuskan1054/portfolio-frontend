import { useCallback, useMemo } from 'react'
import { ALWAYS_VISIBLE_PAGES, normalizeVisibility } from '@/lib/visibility'

// Rule: section tabhi dikhta hai jab toggle ON ho AUR content ho. (Toggle OFF: data safe rehta hai.)
//   const vis = useSectionVisibility(portfolio.section_visibility)
//   vis.isVisible('home', 'testimonials', testimonials.length > 0)   // public site
//   vis.isPageVisible('blogs')                                       // navbar link + route guard
//   vis.statusOf('about', 'awards', awards.length > 0)               // admin: 'on' | 'off' | 'empty'
export function useSectionVisibility(rawVisibility) {
  const settings = useMemo(() => normalizeVisibility(rawVisibility), [rawVisibility])

  const isEnabled = useCallback((group, key) => settings[group]?.[key] !== false, [settings])

  const isVisible = useCallback(
    (group, key, hasContent = true) => isEnabled(group, key) && Boolean(hasContent),
    [isEnabled],
  )

  const isPageVisible = useCallback(
    (page) => ALWAYS_VISIBLE_PAGES.includes(page) || isEnabled('pages', page),
    [isEnabled],
  )

  // Admin hint: toggle ON hai lekin content nahi = 'empty' (site par chhupa rahega)
  const statusOf = useCallback(
    (group, key, hasContent) => {
      if (!isEnabled(group, key)) return 'off'
      return hasContent ? 'on' : 'empty'
    },
    [isEnabled],
  )

  return { settings, isEnabled, isVisible, isPageVisible, statusOf }
}