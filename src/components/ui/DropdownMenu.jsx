import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { MoreVertical } from 'lucide-react'
import { cn } from '@/lib/utils'

// items: [{ label, icon, onClick, to, danger, disabled }]
// trigger na do to default "⋮" button aata hai (table row actions).
// Custom trigger ek element hona chahiye jo ref le (jaise <Button>).
export function DropdownMenu({ items, trigger, align = 'end', label = 'Open menu' }) {
  return (
    <Menu>
      {trigger ? (
        <MenuButton as={Fragment}>{trigger}</MenuButton>
      ) : (
        <MenuButton
          aria-label={label}
          className="inline-flex size-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-primary-soft hover:text-primary data-open:bg-primary-soft data-open:text-primary"
        >
          <MoreVertical className="size-4" />
        </MenuButton>
      )}

      <MenuItems
        transition
        anchor={`bottom ${align}`}
        className="z-50 w-52 rounded-xl border border-line bg-card p-1 shadow-lg [--anchor-gap:6px] transition duration-100 ease-out focus:outline-none data-closed:scale-95 data-closed:opacity-0"
      >
        {items.map(({ label: text, icon: Icon, onClick, to, danger, disabled }) => {
          const className = cn(
            'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors data-disabled:opacity-50',
            danger ? 'text-danger data-focus:bg-danger/10' : 'text-body data-focus:bg-primary-soft data-focus:text-primary',
          )
          return (
            <MenuItem key={text} disabled={disabled}>
              {to ? (
                <Link to={to} className={className}>
                  {Icon && <Icon className="size-4" />}
                  {text}
                </Link>
              ) : (
                <button type="button" onClick={onClick} className={className}>
                  {Icon && <Icon className="size-4" />}
                  {text}
                </button>
              )}
            </MenuItem>
          )
        })}
      </MenuItems>
    </Menu>
  )
}
