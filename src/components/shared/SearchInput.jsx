import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { cn } from '@/lib/utils'

// Controlled: onChange ko seedha string milti hai. API call ke liye useDebounce use karein.
export function SearchInput({ value, onChange, placeholder = 'Search...', className, ...props }) {
  return (
    <div className={cn('relative w-full sm:max-w-xs', className)}>
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
      <Input
        type="text"
        inputMode="search"
        aria-label={placeholder}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pr-9 pl-9"
        {...props}
      />
      {value && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => onChange('')}
          className="absolute top-1/2 right-2 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-muted transition-colors hover:bg-primary-soft hover:text-primary"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  )
}
