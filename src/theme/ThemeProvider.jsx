import { useCallback, useEffect, useMemo, useState } from 'react'
import { ThemeContext } from './theme-context'
import {
  THEME_KEY,
  TYPOGRAPHY_KEY,
  applyTheme,
  applyTypography,
  readStored,
  writeStored,
} from './applyTheme'
import { DEFAULT_TYPOGRAPHY } from './typography'

// Sirf 'light' ya 'dark'. Pehli baar light. Purani 'system' value ko light maana jata hai.
export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() =>
    readStored(THEME_KEY, 'light') === 'dark' ? 'dark' : 'light',
  )
  const [typography, setTypographyState] = useState(() =>
    readStored(TYPOGRAPHY_KEY, DEFAULT_TYPOGRAPHY),
  )

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  useEffect(() => {
    applyTypography(typography)
  }, [typography])

  const setTheme = useCallback((value) => {
    const next = value === 'dark' ? 'dark' : 'light'
    writeStored(THEME_KEY, next)
    setThemeState(next)
  }, [])

  const setTypography = useCallback((value) => {
    writeStored(TYPOGRAPHY_KEY, value)
    setTypographyState(value)
  }, [])

  const value = useMemo(
    () => ({ theme, resolved: theme, setTheme, typography, setTypography }),
    [theme, setTheme, typography, setTypography],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
