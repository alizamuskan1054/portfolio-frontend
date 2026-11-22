// Timeline ke period text: (2010, 2015) -> "2010 – 2015", (2020, null, true) -> "2020 – Present"
export function formatPeriod(start, end, current = false) {
  if (!start && !end) return ''
  if (current) return `${start ?? ''} – Present`.trim()
  if (start && end) return start === end ? String(start) : `${start} – ${end}`
  return String(start ?? end)
}
