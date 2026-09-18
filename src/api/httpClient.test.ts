import { ApiError, request, toApiErrorPayload } from './httpClient'
import { jsonResponse, mockFetch } from '../test-utils/mockFetch'

describe('request', () => {
  it('returns the parsed JSON body on success', async () => {
    const fetchMock = mockFetch()
    fetchMock.mockResolvedValueOnce(jsonResponse({ body: { hello: 'world' } }))

    await expect(request('/events')).resolves.toEqual({ hello: 'world' })
    expect(fetchMock).toHaveBeenCalledWith('/events', expect.objectContaining({ method: 'GET' }))
  })

  it('sends a JSON body and content type when a body is given', async () => {
    const fetchMock = mockFetch()
    fetchMock.mockResolvedValueOnce(jsonResponse({ body: {} }))

    await request('/settings', { method: 'POST', body: { a: 1 } })

    const [, init] = fetchMock.mock.calls[0]
    expect(init?.body).toBe(JSON.stringify({ a: 1 }))
    expect(init?.headers).toEqual(expect.objectContaining({ 'Content-Type': 'application/json' }))
  })

  it('forwards the abort signal', async () => {
    const fetchMock = mockFetch()
    fetchMock.mockResolvedValueOnce(jsonResponse({ body: {} }))
    const controller = new AbortController()

    await request('/events', { signal: controller.signal })

    expect(fetchMock.mock.calls[0][1]?.signal).toBe(controller.signal)
  })

  it('throws an ApiError built from the backend error envelope', async () => {
    const fetchMock = mockFetch()
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        status: 400,
        body: {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid settings',
            details: [{ field: 'general.siteName', message: 'must be a non-empty string' }],
          },
        },
      }),
    )

    await expect(request('/settings')).rejects.toMatchObject({
      name: 'ApiError',
      status: 400,
      code: 'VALIDATION_ERROR',
      message: 'Invalid settings',
      details: [{ field: 'general.siteName', message: 'must be a non-empty string' }],
    })
  })

  it('falls back to a generic error when the error body is not JSON', async () => {
    const fetchMock = mockFetch()
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 502,
      json: async () => {
        throw new SyntaxError('Unexpected token <')
      },
    } as unknown as Response)

    await expect(request('/events')).rejects.toMatchObject({ status: 502, code: 'HTTP_ERROR' })
  })

  it('wraps network failures in an ApiError', async () => {
    const fetchMock = mockFetch()
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'))

    await expect(request('/events')).rejects.toMatchObject({ status: 0, code: 'NETWORK_ERROR' })
  })

  it('lets abort errors through untouched', async () => {
    const fetchMock = mockFetch()
    const abortError = new DOMException('Aborted', 'AbortError')
    fetchMock.mockRejectedValueOnce(abortError)

    await expect(request('/events')).rejects.toBe(abortError)
  })
})

describe('toApiErrorPayload', () => {
  it('serialises an ApiError to a plain object', () => {
    const error = new ApiError({ status: 400, code: 'X', message: 'Nope', details: [] })

    expect(toApiErrorPayload(error)).toEqual({ status: 400, code: 'X', message: 'Nope', details: [] })
  })

  it('maps unknown errors to a generic payload', () => {
    expect(toApiErrorPayload(new Error('boom'))).toEqual({
      status: 0,
      code: 'UNKNOWN_ERROR',
      message: 'boom',
      details: [],
    })
  })
})
