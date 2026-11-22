import { useRef, useState } from 'react'
import { FileText, ImagePlus, Loader2, Trash2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ACCEPTED_IMAGE_TYPES } from '@/lib/constants'
import { cn } from '@/lib/utils'

const nameFromUrl = (url) => {
  try {
    return decodeURIComponent(new URL(url).pathname.split('/').pop() || 'File')
  } catch {
    return 'File'
  }
}

// Generic file (PDF, DOC...) ke liye: click ya drag & drop, replace, remove.
// value: File | string (existing URL) | null,  onChange(file | null)
// React Hook Form: <Controller ... render={({ field }) => <FileUploader value={field.value} onChange={field.onChange} />} />
export function FileUploader({
  value,
  onChange,
  label = 'Upload file',
  accept = 'application/pdf',
  acceptLabel = 'PDF',
  maxSizeMB = 10,
  error,
  disabled = false,
  className,
}) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const [localError, setLocalError] = useState(null)

  const hasValue = value instanceof File || (typeof value === 'string' && value)
  const accepted = accept.split(',').map((t) => t.trim())

  const select = (file) => {
    if (!file) return
    if (!accepted.includes(file.type)) {
      setLocalError(`Unsupported file. Use a ${acceptLabel} file.`)
      return
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      setLocalError(`File must be smaller than ${maxSizeMB} MB.`)
      return
    }
    setLocalError(null)
    onChange(file)
  }

  const message = error || localError

  return (
    <div className={cn('space-y-2', className)}>
      <div
        onDragOver={(e) => {
          e.preventDefault()
          if (!disabled) setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          if (!disabled) select(e.dataTransfer.files?.[0])
        }}
        className={cn(
          'rounded-xl border-2 border-dashed transition-colors',
          dragging
            ? 'border-primary bg-primary-soft'
            : message
              ? 'border-danger'
              : 'border-line',
        )}
      >
        {hasValue ? (
          <div className="flex items-center gap-3 p-3">
            <span className="bg-primary-soft text-primary flex size-10 shrink-0 items-center justify-center rounded-lg">
              <FileText className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-heading truncate text-sm font-medium">
                {value instanceof File ? value.name : nameFromUrl(value)}
              </p>
              {typeof value === 'string' ? (
                <a
                  href={value}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary text-xs hover:underline"
                >
                  View current file
                </a>
              ) : (
                <p className="text-muted text-xs">
                  {(value.size / 1024 / 1024).toFixed(2)} MB · will upload on save
                </p>
              )}
            </div>
            {!disabled && (
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => inputRef.current?.click()}
                >
                  Replace
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Remove file"
                  className="text-danger hover:text-danger"
                  onClick={() => {
                    setLocalError(null)
                    onChange(null)
                  }}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
            className="text-muted hover:text-primary flex w-full flex-col items-center gap-1.5 px-4 py-6 text-center text-sm disabled:opacity-60"
          >
            <Upload className="size-6" />
            <span>{label}</span>
            <span className="text-xs opacity-70">
              or drag and drop · {acceptLabel} up to {maxSizeMB} MB
            </span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        hidden
        onChange={(e) => {
          select(e.target.files?.[0])
          e.target.value = ''
        }}
      />
      {message && (
        <p role="alert" className="text-danger text-xs">
          {message}
        </p>
      )}
    </div>
  )
}

// Ek se zyada images ek saath (gallery): click ya drag & drop. onFiles(File[])
export function ImageDropzone({ onFiles, busy = false, className }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const [localError, setLocalError] = useState(null)

  const accepted = ACCEPTED_IMAGE_TYPES.split(',')
  const handle = (list) => {
    const files = Array.from(list ?? [])
    const valid = files.filter((f) => accepted.includes(f.type))
    setLocalError(
      valid.length < files.length ? 'Only PNG, JPG or WebP images are allowed.' : null,
    )
    if (valid.length) onFiles(valid)
  }

  return (
    <div className={className}>
      <button
        type="button"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          handle(e.dataTransfer.files)
        }}
        className={cn(
          'text-muted hover:border-primary flex w-full flex-col items-center gap-1.5 rounded-xl border-2 border-dashed px-4 py-6 text-center text-sm transition-colors',
          dragging ? 'border-primary bg-primary-soft' : 'border-line',
        )}
      >
        {busy ? (
          <Loader2 className="size-6 animate-spin" />
        ) : (
          <ImagePlus className="size-6" />
        )}
        <span>{busy ? 'Uploading...' : 'Add images'}</span>
        <span className="text-xs opacity-70">or drag and drop · PNG, JPG or WebP</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPTED_IMAGE_TYPES}
        hidden
        onChange={(e) => {
          handle(e.target.files)
          e.target.value = ''
        }}
      />
      {localError && (
        <p role="alert" className="text-danger mt-1 text-xs">
          {localError}
        </p>
      )}
    </div>
  )
}
