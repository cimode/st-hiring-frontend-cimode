import { setupStore } from '../../app/store'
import { jsonResponse, mockFetch } from '../../test-utils/mockFetch'
import reducer, { clearServerFieldError, fetchSettings, saveSettings } from './settingsSlice'
import { toSettingsPayload } from './settingsSchema'
import { buildSettings } from './testData'

const payload = toSettingsPayload(buildSettings())

describe('settings reducer', () => {
  it('starts empty and idle', () => {
    expect(reducer(undefined, { type: '@@init' })).toEqual({
      data: null,
      status: 'idle',
      error: null,
      saveError: null,
      serverFieldErrors: {},
      currentRequestId: null,
    })
  })
})

describe('fetchSettings', () => {
  it('loads the settings', async () => {
    const fetchMock = mockFetch()
    fetchMock.mockResolvedValueOnce(jsonResponse({ body: buildSettings() }))
    const store = setupStore()

    await store.dispatch(fetchSettings())

    expect(fetchMock).toHaveBeenCalledWith('/settings', expect.objectContaining({ method: 'GET' }))
    expect(store.getState().settings).toMatchObject({ data: buildSettings(), status: 'succeeded' })
  })

  it('stores the error message on failure', async () => {
    mockFetch().mockResolvedValueOnce(
      jsonResponse({ status: 500, body: { error: { code: 'INTERNAL', message: 'Mongo is down' } } }),
    )
    const store = setupStore()

    await store.dispatch(fetchSettings())

    expect(store.getState().settings).toMatchObject({ status: 'failed', error: 'Mongo is down' })
  })

  it('does not surface an aborted request as an error', async () => {
    mockFetch().mockImplementationOnce(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () =>
            reject(new DOMException('Aborted', 'AbortError')),
          )
        }),
    )
    const store = setupStore()

    const promise = store.dispatch(fetchSettings())
    promise.abort()
    await promise

    expect(store.getState().settings).toMatchObject({ status: 'idle', error: null })
  })
})

describe('saveSettings', () => {
  it('posts the settings and stores what the server saved', async () => {
    const fetchMock = mockFetch()
    const saved = buildSettings({ updatedAt: '2024-07-01T10:00:00.000Z' })
    fetchMock.mockResolvedValueOnce(jsonResponse({ body: saved }))
    const store = setupStore()

    await store.dispatch(saveSettings(payload))

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/settings')
    expect(init).toMatchObject({ method: 'POST', body: JSON.stringify(payload) })
    expect(store.getState().settings).toMatchObject({ data: saved, saveError: null })
  })

  it('maps server validation details to field errors', async () => {
    mockFetch().mockResolvedValueOnce(
      jsonResponse({
        status: 400,
        body: {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid settings',
            details: [{ field: 'general.supportEmail', message: 'must be a valid email address' }],
          },
        },
      }),
    )
    const store = setupStore()

    await store.dispatch(saveSettings(payload))

    expect(store.getState().settings).toMatchObject({
      saveError: 'Invalid settings',
      serverFieldErrors: { 'general.supportEmail': 'must be a valid email address' },
    })
  })

  it('clears previous save errors when a new save starts', async () => {
    const fetchMock = mockFetch()
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({ status: 500, body: { error: { code: 'INTERNAL', message: 'Boom' } } }),
      )
      .mockResolvedValueOnce(jsonResponse({ body: buildSettings() }))
    const store = setupStore()

    await store.dispatch(saveSettings(payload))
    expect(store.getState().settings.saveError).toBe('Boom')

    await store.dispatch(saveSettings(payload))
    expect(store.getState().settings.saveError).toBeNull()
  })

  it('clears a single server field error once the user edits that field', () => {
    const state = {
      ...reducer(undefined, { type: '@@init' }),
      serverFieldErrors: { 'general.siteName': 'taken', 'general.supportEmail': 'invalid' },
    }

    expect(reducer(state, clearServerFieldError('general.siteName')).serverFieldErrors).toEqual({
      'general.supportEmail': 'invalid',
    })
  })
})
