import { Description, Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }

// Focus trap, Esc, backdrop click, scroll lock: sab Headless UI sambhalta hai.
// dismissible={false}: submit ke dauran band hone se roknay ke liye.
export function Modal({
  open,
  onClose,
  title,
  description,
  size = 'md',
  dismissible = true,
  footer,
  className,
  children,
}) {
  const handleClose = () => {
    if (dismissible) onClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} className="relative z-50">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-navy/60 backdrop-blur-sm transition duration-200 ease-out data-closed:opacity-0"
      />
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <DialogPanel
            transition
            className={cn(
              'flex max-h-[90vh] w-full flex-col rounded-2xl border border-line bg-card shadow-xl transition duration-200 ease-out data-closed:scale-95 data-closed:opacity-0',
              sizes[size],
              className,
            )}
          >
            <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-4">
              <div className="min-w-0">
                <DialogTitle as="h2" className="text-xl">
                  {title}
                </DialogTitle>
                {description && (
                  <Description className="mt-1 text-sm text-muted">{description}</Description>
                )}
              </div>
              {dismissible && (
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close"
                  className="-mt-1 -mr-2 flex size-8 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-primary-soft hover:text-primary"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
            <div className="overflow-y-auto px-6 py-5">{children}</div>
            {footer && (
              <div className="flex flex-wrap items-center justify-end gap-3 border-t border-line px-6 py-4">
                {footer}
              </div>
            )}
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  )
}
