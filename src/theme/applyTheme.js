import { palettes } from './colors'
import { typographies, DEFAULT_TYPOGRAPHY } from './typography'

export const THEME_KEY = 'pp-theme' // 'light' | 'dark'
export const TYPOGRAPHY_KEY = 'pp-typography'

export function readStored(key, fallback) {
  try {
    return localStorage.getItem(key) || fallback
  } catch {
    return fallback
  }
}

export function writeStored(key, value) {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* storage blocked: ignore */
  }
}

export function resolveTheme(preference) {
  return preference === 'dark' ? 'dark' : 'light'
}

export function applyTheme(preference) {
  const mode = resolveTheme(preference)
  const root = document.documentElement
  root.classList.toggle('dark', mode === 'dark')
  root.style.colorScheme = mode
  Object.entries(palettes[mode]).forEach(([token, value]) => {
    root.style.setProperty(`--c-${token}`, value)
  })
  return mode
}

export function applyTypography(key) {
  const t = typographies[key] ?? typographies[DEFAULT_TYPOGRAPHY]
  const root = document.documentElement
  root.style.setProperty('--f-heading', t.heading)
  root.style.setProperty('--f-body', t.body)
}
