import { useEffect, useRef, useState } from 'react'
import { Camera, RefreshCw } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'

// Live camera se photo: onCapture(File) milta hai (jpeg).
export function CameraCaptureModal({ open, onClose, onCapture }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [error, setError] = useState(null)
  const [ready, setReady] = useState(false)
  const [facing, setFacing] = useState('user')

  useEffect(() => {
    if (!open) return undefined
    let cancelled = false
    setError(null)
    setReady(false)

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 1280 } },
          audio: false,
        })
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        const video = videoRef.current
        if (video) {
          video.srcObject = stream
          await video.play().catch(() => {})
        }
        setReady(true)
      } catch (e) {
        setError(
          e?.name === 'NotAllowedError'
            ? 'Camera permission was blocked. Allow camera access in the browser and try again.'
            : 'Could not open the camera on this device.',
        )
      }
    }
    start()

    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }, [open, facing])

  const capture = () => {
    const video = videoRef.current
    if (!video?.videoWidth) return
    // Square crop (profile photo ke liye)
    const size = Math.min(video.videoWidth, video.videoHeight)
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = Math.min(size, 1024)
    const ctx = canvas.getContext('2d')
    ctx.drawImage(
      video,
      (video.videoWidth - size) / 2,
      (video.videoHeight - size) / 2,
      size,
      size,
      0,
      0,
      canvas.width,
      canvas.height,
    )
    canvas.toBlob(
      (blob) => {
        if (!blob) return
        onCapture(new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' }))
        onClose()
      },
      'image/jpeg',
      0.92,
    )
  }

  return (
    <Modal open={open} onClose={onClose} title="Take a photo" size="sm">
      <div className="space-y-4 p-6">
        {error ? (
          <p
            role="alert"
            className="bg-danger/10 text-danger rounded-lg px-3 py-2 text-sm"
          >
            {error}
          </p>
        ) : (
          <div className="bg-navy relative mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-2xl">
            <video
              ref={videoRef}
              playsInline
              muted
              className={`size-full object-cover ${facing === 'user' ? '-scale-x-100' : ''}`}
            />
            {!ready && (
              <span className="text-on-navy absolute inset-0 flex items-center justify-center text-sm">
                Starting camera…
              </span>
            )}
          </div>
        )}
        <div className="flex flex-wrap justify-center gap-2">
          <Button type="button" onClick={capture} disabled={!ready || Boolean(error)}>
            <Camera className="size-4" /> Capture
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={Boolean(error)}
            onClick={() => setFacing((f) => (f === 'user' ? 'environment' : 'user'))}
          >
            <RefreshCw className="size-4" /> Switch camera
          </Button>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  )
}
