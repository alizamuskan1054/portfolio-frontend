import { useEffect, useRef, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { notify } from '@/lib/notify'

async function writeToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }
  // Purane browsers / non-secure context
  const area = document.createElement('textarea')
  area.value = text
  area.style.position = 'fixed'
  area.style.opacity = '0'
  document.body.appendChild(area)
  area.select()
  const ok = document.execCommand('copy')
  area.remove()
  if (!ok) throw new Error('Copy failed')
}

// <CopyButton text={url} />  (icon only)   |   <CopyButton text={url} label="Copy URL" />
export function CopyButton({ text, label, variant = 'ghost', className }) {
  const [copied, setCopied] = useState(false)
  const timer = useRef(null)

  useEffect(() => () => clearTimeout(timer.current), [])

  const handleCopy = async () => {
    try {
      await writeToClipboard(text)
      setCopied(true)
      notify.success('Copied to clipboard')
      clearTimeout(timer.current)
      timer.current = setTimeout(() => setCopied(false), 2000)
    } catch {
      notify.error('Could not copy. Please copy manually.')
    }
  }

  const Icon = copied ? Check : Copy

  return (
    <Button
      variant={variant}
      size={label ? 'md' : 'icon-sm'}
      onClick={handleCopy}
      aria-label={label ? undefined : 'Copy'}
      className={className}
    >
      <Icon className="size-4" />
      {label}
    </Button>
  )
}
