import axios from 'axios'

export class ApiError extends Error {
  constructor(
    message,
    { status = 0, errors = null, data = null, isNetworkError = false } = {},
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.errors = errors // backend ka field-wise errors object
    this.data = data
    this.isNetworkError = isNetworkError
  }
}

const DEFAULT_MESSAGES = {
  400: 'Invalid request. Please check your input.',
  401: 'Your session has expired. Please log in again.',
  403: 'You do not have permission to do this.',
  404: 'Not found.',
  429: 'Too many requests. Please wait a while and try again.',
  500: 'Server error. Please try again later.',
}

export function normalizeError(error) {
  if (error instanceof ApiError || axios.isCancel(error)) return error

  if (error?.response) {
    const { status, data } = error.response
    const body = data && typeof data === 'object' ? data : {}
    const message =
      status === 429
        ? DEFAULT_MESSAGES[429]
        : (typeof body.message === 'string' && body.message) ||
          (typeof body.detail === 'string' && body.detail) ||
          DEFAULT_MESSAGES[status] ||
          (status >= 500 ? DEFAULT_MESSAGES[500] : 'Something went wrong.')
    return new ApiError(message, { status, errors: body.errors ?? null, data: body })
  }

  if (error?.request) {
    return new ApiError('Cannot reach the server. Please check your connection.', {
      isNetworkError: true,
    })
  }

  return new ApiError(error?.message || 'Unexpected error.')
}

// Backend ke field errors ko React Hook Form mein dikhata hai.
// fields: form mein jo fields hain unke naam. Baqi (token, uid, non_field_errors...) root.server mein jate hain.
// Return: true agar koi error set hua.
export function applyServerErrors(error, setError, { fields } = {}) {
  const errs = error?.errors
  const rootMessages = []
  let applied = false

  if (errs && typeof errs === 'object') {
    Object.entries(errs).forEach(([field, value]) => {
      const message = Array.isArray(value)
        ? value.join(' ')
        : typeof value === 'string'
          ? value
          : null
      if (!message) return

      const isFormField =
        field !== 'non_field_errors' &&
        field !== 'detail' &&
        (!fields || fields.includes(field))
      if (isFormField) {
        setError(field, { type: 'server', message })
        applied = true
      } else {
        // Form mein jo field nahi, uska naam saath dikhao (config adjust karne mein madad)
        rootMessages.push(
          field === 'non_field_errors' || field === 'detail'
            ? message
            : `${field}: ${message}`,
        )
      }
    })
  }

  if (rootMessages.length) {
    setError('root.server', { type: 'server', message: rootMessages.join(' ') })
    applied = true
  }

  if (!applied) setError('root.server', { type: 'server', message: error?.message })
  return applied
}
