import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { queryClient } from './queryClient'
import { useTheme } from '@/theme/theme-context'

function ThemedToaster() {
  const { resolved } = useTheme()
  return <Toaster theme={resolved} position="top-right" closeButton richColors />
}

export function Providers({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ThemedToaster />
    </QueryClientProvider>
  )
}