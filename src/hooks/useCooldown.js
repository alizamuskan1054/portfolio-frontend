import { useCallback, useEffect, useState } from 'react'

// Countdown jo page refresh ke baad bhi chalta rehta hai (expiry time localStorage mein).
//   const { remaining, start } = useCooldown('pp-resend-a@b.com', 5 * 60 * 1000)
//   remaining = baqi seconds (0 = dobara allowed), start() = naya countdown shuru

export function writeCooldown(storageKey, durationMs) {
  const expiresAt = Date.now() + durationMs
  try {
    localStorage.setItem(storageKey, String(expiresAt))
  } catch {
    /* storage blocked: countdown sirf is page tak chalega */
  }
  return expiresAt
}

function readCooldown(storageKey) {
  try {
    const value = Number(localStorage.getItem(storageKey))
    return Number.isFinite(value) ? value : 0
  } catch {
    return 0
  }
}

export function useCooldown(storageKey, durationMs) {
  const [expiresAt, setExpiresAt] = useState(() => readCooldown(storageKey))
  const [now, setNow] = useState(() => Date.now())
  const active = expiresAt > now

  useEffect(() => {
    if (!active) return undefined
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [active])

  const start = useCallback(() => {
    setExpiresAt(writeCooldown(storageKey, durationMs))
    setNow(Date.now())
  }, [storageKey, durationMs])

  return { remaining: Math.max(0, Math.ceil((expiresAt - now) / 1000)), start }
}

export function formatCountdown(totalSeconds) {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}