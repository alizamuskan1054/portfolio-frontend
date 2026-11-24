import { forwardRef } from 'react'
import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { Spinner } from './Spinner'

const buttonVariants = cva(
  'inline-flex shrink-0 items-center justify-center gap-2 rounded-xl font-medium whitespace-nowrap transition-all duration-150 focus-visible:ring-4 focus-visible:ring-primary/25 focus-visible:outline-none active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60',
  {
    variants: {
      variant: {
        primary:
          'bg-primary text-on-primary shadow-sm shadow-primary/30 hover:bg-primary-hover hover:shadow-md hover:shadow-primary/30',
        secondary:
          'border border-line bg-card text-heading shadow-xs hover:border-primary hover:bg-primary-soft/50 hover:text-primary',
        soft: 'bg-primary-soft text-primary hover:bg-primary/20',
        ghost: 'text-body hover:bg-primary-soft hover:text-primary',
        danger:
          'bg-danger text-on-danger shadow-sm shadow-danger/25 hover:bg-danger/90 focus-visible:ring-danger/25',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-5 text-sm',
        lg: 'h-12 px-6 text-base',
        icon: 'size-10',
        'icon-sm': 'size-8',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
)

// `as={Link}` se router link bhi button jaisa dikh sakta hai.
// Default type="button": submit ke liye type="submit" dena zaroori hai.
export const Button = forwardRef(function Button(
  {
    as: Comp = 'button',
    variant,
    size,
    loading = false,
    disabled,
    type,
    className,
    children,
    ...props
  },
  ref,
) {
  const isNativeButton = Comp === 'button'
  return (
    <Comp
      ref={ref}
      type={isNativeButton ? (type ?? 'button') : undefined}
      disabled={isNativeButton ? disabled || loading : undefined}
      aria-busy={loading || undefined}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      {loading && <Spinner className="size-4 text-current" />}
      {children}
    </Comp>
  )
})
