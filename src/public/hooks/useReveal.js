import { useEffect, useRef, useState } from 'react'

// Element viewport mein aate hi ek baar `shown = true` (scroll reveal animation ke liye).
//   const [ref, shown] = useReveal()
// IntersectionObserver na ho to content seedha dikhta hai (kuch chhupa nahi rehta).
const supportsObserver = () => typeof window !== 'undefined' && 'IntersectionObserver' in window

export function useReveal({ threshold = 0.12, rootMargin = '0px 0px -6% 0px' } = {}) {
  const ref = useRef(null)
  const [shown, setShown] = useState(() => !supportsObserver())

  useEffect(() => {
    const node = ref.current
    if (!node || !supportsObserver()) return undefined

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true)
          observer.disconnect()
        }
      },
      { threshold, rootMargin },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [threshold, rootMargin])

  return [ref, shown]
}
