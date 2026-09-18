export interface ApiFieldError {
  field: string
  message: string
}

/** Plain, serialisable shape of an API failure: safe to keep in the Redux store. */
export interface ApiErrorPayload {
  status: number
  code: string
  message: string
  details: ApiFieldError[]
}

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly details: ApiFieldError[]

  constructor({ status, code, message, details }: ApiErrorPayload) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

export const isAbortError = (error: unknown): boolean =>
  error instanceof DOMException && error.name === 'AbortError'

export const toApiErrorPayload = (error: unknown): ApiErrorPayload => {
  if (error instanceof ApiError) {
    return { status: error.status, code: error.code, message: error.message, details: error.details }
  }
  return {
    status: 0,
    code: 'UNKNOWN_ERROR',
    message: error instanceof Error ? error.message : 'Something went wrong',
    details: [],
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST'
  body?: unknown
  signal?: AbortSignal
}

// The backend wraps every failure as { error: { code, message, details? } }.
const parseErrorBody = async (response: Response): Promise<ApiError> => {
  try {
    const body = await response.json()
    const { code, message, details } = body?.error ?? {}
    if (typeof code === 'string' && typeof message === 'string') {
      return new ApiError({
        status: response.status,
        code,
        message,
        details: Array.isArray(details) ? details : [],
      })
    }
  } catch {
    // Not JSON (e.g. a proxy error page): fall through to the generic error.
  }
  return new ApiError({
    status: response.status,
    code: 'HTTP_ERROR',
    message: `Request failed with status ${response.status}`,
    details: [],
  })
}

export const request = async <T>(
  path: string,
  { method = 'GET', body, signal }: RequestOptions = {},
): Promise<T> => {
  let response: Response
  try {
    response = await fetch(path, {
      method,
      signal,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined && { 'Content-Type': 'application/json' }),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch (error) {
    if (isAbortError(error)) throw error
    throw new ApiError({
      status: 0,
      code: 'NETWORK_ERROR',
      message: 'Could not reach the server. Check your connection and try again.',
      details: [],
    })
  }

  if (!response.ok) throw await parseErrorBody(response)
  return (await response.json()) as T
}
