import { toast } from 'sonner'

// Toasts ke liye ek jagah. error() string bhi leta hai aur ApiError bhi.
export const notify = {
  success: (message) => toast.success(message),
  info: (message) => toast.info(message),
  error: (errorOrMessage, fallback = 'Something went wrong.') =>
    toast.error(
      typeof errorOrMessage === 'string' ? errorOrMessage : errorOrMessage?.message || fallback,
    ),
}
