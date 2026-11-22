import { useEffect, useRef, useState } from 'react'
import { Camera, ImagePlus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { CameraCaptureModal } from '@/components/shared/CameraCaptureModal'
import { ACCEPTED_IMAGE_TYPES, MAX_IMAGE_SIZE_MB } from '@/lib/constants'
import { cn } from '@/lib/utils'

const shapes = {
  circle: 'size-32 rounded-full',
  square: 'size-40 rounded-xl',
  wide: 'aspect-video w-full max-w-md rounded-xl',
}

// value: File (naya chuna hua) | string (existing image URL) | null
// onChange(file | null): null = hata diya gaya
// React Hook Form: <Controller name="photo" control={control} render={({ field }) => <ImageUploader value={field.value} onChange={field.onChange} />} />
export function ImageUploader({
  value,
  onChange,
  label = 'Upload image',
  shape = 'square',
  accept = ACCEPTED_IMAGE_TYPES,
  maxSizeMB = MAX_IMAGE_SIZE_MB,
  error,
  disabled = false,
  camera = true, // live capture ka button
  className,
}) {
  const inputRef = useRef(null)
  const urlRef = useRef(null)
  const [localPreview, setLocalPreview] = useState(null)
  const [localError, setLocalError] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [cameraOpen, setCameraOpen] = useState(false)
  const canCapture =
    camera &&
    typeof navigator !== 'undefined' &&
    Boolean(navigator.mediaDevices?.getUserMedia)

  // Unmount par object URL free karo
  useEffect(
    () => () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current)
    },
    [],
  )

  const preview =
    value instanceof File
      ? localPreview
      : typeof value === 'string' && value
        ? value
        : null

  const accepted = accept.split(',').map((t) => t.trim())

  const selectFile = (file) => {
    if (!file) return
    if (!accepted.includes(file.type)) {
      setLocalError('Unsupported file type. Use PNG, JPG or WebP.')
      return
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      setLocalError(`Image must be smaller than ${maxSizeMB} MB.`)
      return
    }
    setLocalError(null)
    if (urlRef.current) URL.revokeObjectURL(urlRef.current)
    urlRef.current = URL.createObjectURL(file)
    setLocalPreview(urlRef.current)
    onChange(file)
  }

  const removeFile = () => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current)
    urlRef.current = null
    setLocalPreview(null)
    setLocalError(null)
    if (inputRef.current) inputRef.current.value = ''
    onChange(null)
  }

  const message = error || localError

  return (
    <div className={cn('space-y-2', className)}>
      <button
        type="button"
        disabled={disabled}
        aria-label={preview ? 'Change image' : label}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          if (!disabled) setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          if (!disabled) selectFile(e.dataTransfer.files?.[0])
        }}
        className={cn(
          'group relative flex items-center justify-center overflow-hidden border-2 border-dashed bg-surface text-muted transition-colors disabled:opacity-60',
          shapes[shape],
          dragging || !message ? 'hover:border-primary' : '',
          dragging
            ? 'border-primary bg-primary-soft'
            : message
              ? 'border-danger'
              : 'border-line',
          preview && 'border-solid',
        )}
      >
        {preview ? (
          <>
            <img src={preview} alt="" className="size-full object-cover" />
            <span className="absolute inset-0 flex items-center justify-center bg-navy/60 text-sm font-medium text-on-navy opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
              Change
            </span>
          </>
        ) : (
          <span className="flex flex-col items-center gap-1.5 px-3 text-center text-xs">
            <ImagePlus className="size-7" />
            {label}
            <span className="opacity-70">or drag and drop</span>
          </span>
        )}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        hidden
        onChange={(e) => {
          selectFile(e.target.files?.[0])
          e.target.value = '' // same file dobara chun sakein
        }}
      />

      {!disabled && (
        <div className="flex flex-wrap items-center gap-1">
          {canCapture && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setCameraOpen(true)}
            >
              <Camera className="size-4" />
              Use camera
            </Button>
          )}
          {preview && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={removeFile}
              className="text-danger hover:text-danger"
            >
              <Trash2 className="size-4" />
              Remove
            </Button>
          )}
        </div>
      )}

      {canCapture && (
        <CameraCaptureModal
          open={cameraOpen}
          onClose={() => setCameraOpen(false)}
          onCapture={selectFile}
        />
      )}

      {message ? (
        <p role="alert" className="text-xs text-danger">
          {message}
        </p>
      ) : (
        <p className="text-xs text-muted">PNG, JPG or WebP, up to {maxSizeMB} MB.</p>
      )}
    </div>
  )
}
