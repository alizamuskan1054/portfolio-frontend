import { RouterProvider } from 'react-router-dom'
import { ThemeProvider } from '@/theme/ThemeProvider'
import { Providers } from './Providers'
import { router } from './router'

export default function App() {
  return (
    <ThemeProvider>
      <Providers>
        <RouterProvider router={router} />
      </Providers>
    </ThemeProvider>
  )
}
