import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from '@/app/App'
import {
  THEME_KEY,
  TYPOGRAPHY_KEY,
  applyTheme,
  applyTypography,
  readStored,
} from '@/theme/applyTheme'
import { DEFAULT_TYPOGRAPHY } from '@/theme/typography'

// Paint se pehle variables set, taake flash na aaye
applyTheme(readStored(THEME_KEY, 'light'))
applyTypography(readStored(TYPOGRAPHY_KEY, DEFAULT_TYPOGRAPHY))

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
