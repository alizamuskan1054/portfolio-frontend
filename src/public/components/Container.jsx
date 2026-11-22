import { cn } from '@/lib/utils'

// Public site ki standard width. Har section/hero/navbar/footer isi ke andar.
export function Container({ as: Comp = 'div', className, ...props }) {
  return <Comp className={cn('mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-10', className)} {...props} />
}