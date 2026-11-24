import {
  Children,
  Fragment,
  forwardRef,
  isValidElement,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { fieldClass } from './field-styles'
import { SCROLL_X } from '@/lib/scrollbar'

// <option> children se list banao (Fragment / arrays bhi chalte hain)
function readOptions(children, out = []) {
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return
    if (child.type === Fragment) return readOptions(child.props.children, out)
    if (child.type === 'option') {
      const label = Children.toArray(child.props.children).join('')
      out.push({
        value: String(child.props.value ?? label),
        label,
        disabled: Boolean(child.props.disabled),
      })
    }
  })
  return out
}

// Custom dropdown (theme ke mutabik). Neeche ek hidden native <select> rehta hai, isliye
// React Hook Form register(), value/onChange, name, ref sab pehle ki tarah chalte hain.
export const Select = forwardRef(function Select(
  { invalid = false, placeholder, className, children, onBlur, ...props },
  forwardedRef,
) {
  const selectRef = useRef(null)
  const buttonRef = useRef(null)
  const listRef = useRef(null)
  const wrapRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState(
    String(props.value ?? props.defaultValue ?? ''),
  )
  const [active, setActive] = useState(0)
  const [pos, setPos] = useState(null)

  const setRefs = useCallback(
    (node) => {
      selectRef.current = node
      if (typeof forwardedRef === 'function') forwardedRef(node)
      else if (forwardedRef) forwardedRef.current = node
    },
    [forwardedRef],
  )

  const options = useMemo(() => {
    const list = readOptions(children)
    return placeholder !== undefined && !list.some((o) => o.value === '')
      ? [{ value: '', label: placeholder, disabled: false, isPlaceholder: true }, ...list]
      : list
  }, [children, placeholder])

  // Native select ki asal value se display sync (RHF reset() wagaira ke baad bhi)
  useLayoutEffect(() => {
    const v = selectRef.current?.value
    if (v !== undefined && v !== current) setCurrent(v)
  })

  const selected = options.find((o) => o.value === current)
  const showPlaceholder = !selected || (current === '' && selected.isPlaceholder)

  const place = useCallback(() => {
    const r = buttonRef.current?.getBoundingClientRect()
    if (!r) return
    const room = window.innerHeight - r.bottom
    const up = room < 240 && r.top > room
    setPos({
      left: r.left,
      width: r.width,
      ...(up
        ? { bottom: window.innerHeight - r.top + 6 }
        : { top: r.bottom + 6 }),
      maxHeight: Math.min(260, (up ? r.top : room) - 16),
    })
  }, [])

  const openList = () => {
    if (props.disabled) return
    place()
    setActive(Math.max(0, options.findIndex((o) => o.value === current)))
    setOpen(true)
  }
  const closeList = useCallback(() => {
    setOpen(false)
    onBlur?.({ target: selectRef.current, type: 'blur' })
  }, [onBlur])

  const choose = (opt) => {
    if (opt.disabled) return
    const el = selectRef.current
    if (el && el.value !== opt.value) {
      el.value = opt.value
      el.dispatchEvent(new Event('change', { bubbles: true }))
      setCurrent(opt.value)
    }
    setOpen(false)
    buttonRef.current?.focus()
  }

  // Bahar click / scroll / resize par band
  useEffect(() => {
    if (!open) return
    const onDown = (e) => {
      if (wrapRef.current?.contains(e.target) || listRef.current?.contains(e.target))
        return
      closeList()
    }
    const onMove = (e) => {
      if (listRef.current?.contains(e.target)) return
      closeList()
    }
    document.addEventListener('pointerdown', onDown, true)
    window.addEventListener('scroll', onMove, true)
    window.addEventListener('resize', onMove)
    return () => {
      document.removeEventListener('pointerdown', onDown, true)
      window.removeEventListener('scroll', onMove, true)
      window.removeEventListener('resize', onMove)
    }
  }, [open, closeList])

  useEffect(() => {
    if (open)
      listRef.current
        ?.querySelector(`[data-i="${active}"]`)
        ?.scrollIntoView({ block: 'nearest' })
  }, [open, active])

  const onKeyDown = (e) => {
    if (props.disabled) return
    const move = (d) => {
      e.preventDefault()
      if (!open) return openList()
      let i = active
      for (let n = 0; n < options.length; n++) {
        i = (i + d + options.length) % options.length
        if (!options[i].disabled) break
      }
      setActive(i)
    }
    if (e.key === 'ArrowDown') move(1)
    else if (e.key === 'ArrowUp') move(-1)
    else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (open) choose(options[active])
      else openList()
    } else if (e.key === 'Escape' && open) {
      e.stopPropagation() // modal band na ho
      closeList()
    } else if (e.key === 'Tab' && open) closeList()
  }

  return (
    <div ref={wrapRef} className="relative">
      <select
        ref={setRefs}
        tabIndex={-1}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full opacity-0"
        {...props}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {children}
      </select>

      <button
        ref={buttonRef}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-invalid={invalid || undefined}
        aria-label={props['aria-label']}
        title={props.title}
        disabled={props.disabled}
        onClick={() => (open ? closeList() : openList())}
        onKeyDown={onKeyDown}
        className={fieldClass(
          invalid,
          cn(
            'flex h-10 items-center py-2 pr-9 text-left',
            open && 'border-primary ring-primary/15 ring-[3px]',
            className,
          ),
        )}
      >
        <span className={cn('truncate', showPlaceholder && 'text-muted/70')}>
          {selected?.label || placeholder || ''}
        </span>
      </button>
      <ChevronDown
        className={cn(
          'text-muted pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 transition-transform',
          open && 'text-primary rotate-180',
        )}
      />

      {open && pos && (
        <ul
          ref={listRef}
          role="listbox"
          style={pos}
          className={cn(
            'border-line bg-card fixed z-[60] overflow-y-auto rounded-xl border p-1 shadow-xl',
            SCROLL_X,
          )}
        >
          {options.map((o, i) => {
            const isSel = o.value === current
            return (
              <li
                key={`${o.value}-${i}`}
                data-i={i}
                role="option"
                aria-selected={isSel}
                aria-disabled={o.disabled || undefined}
                onMouseEnter={() => setActive(i)}
                onClick={() => choose(o)}
                className={cn(
                  'flex cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm',
                  o.isPlaceholder ? 'text-muted' : 'text-heading',
                  i === active && 'bg-primary-soft',
                  isSel && 'text-primary font-medium',
                  o.disabled && 'cursor-not-allowed opacity-50',
                )}
              >
                <span className="truncate">{o.label}</span>
                {isSel && <Check className="size-4 shrink-0" />}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
})
