import { setupStore } from '../../app/store'
import { jsonResponse, mockFetch } from '../../test-utils/mockFetch'
import reducer, {
  DEFAULT_PAGE_SIZE,
  fetchEvents,
  selectRangeLabel,
  setPage,
  setPageSize,
} from './eventsSlice'
import { buildEvent, buildEventsResponse } from './testData'

const initialState = reducer(undefined, { type: '@@init' })

describe('events reducer', () => {
  it('starts idle on the first page with the default page size', () => {
    expect(initialState).toMatchObject({
      items: [],
      query: { page: 1, pageSize: DEFAULT_PAGE_SIZE },
      pagination: null,
      status: 'idle',
      error: null,
    })
  })

  it('changes the requested page', () => {
    expect(reducer(initialState, setPage(3)).query.page).toBe(3)
  })

  it('goes back to the first page when the page size changes', () => {
    const state = reducer(reducer(initialState, setPage(3)), setPageSize(24))

    expect(state.query).toEqual({ page: 1, pageSize: 24 })
  })
})

describe('fetchEvents', () => {
  it('requests the page and stores events and pagination', async () => {
    const fetchMock = mockFetch()
    const response = buildEventsResponse()
    fetchMock.mockResolvedValueOnce(jsonResponse({ body: response }))
    const store = setupStore()

    await store.dispatch(fetchEvents({ page: 1, pageSize: 12 }))

    expect(fetchMock).toHaveBeenCalledWith('/events?page=1&pageSize=12', expect.anything())
    expect(store.getState().events).toMatchObject({
      items: response.data,
      pagination: response.pagination,
      status: 'succeeded',
      error: null,
    })
  })

  it('is loading while the request is in flight', () => {
    mockFetch().mockReturnValueOnce(new Promise(() => {}))
    const store = setupStore()

    store.dispatch(fetchEvents({ page: 1, pageSize: 12 }))

    expect(store.getState().events.status).toBe('loading')
  })

  it('stores the API error message on failure', async () => {
    mockFetch().mockResolvedValueOnce(
      jsonResponse({
        status: 400,
        body: { error: { code: 'INVALID_PAGINATION', message: 'Invalid pagination parameters' } },
      }),
    )
    const store = setupStore()

    await store.dispatch(fetchEvents({ page: 1, pageSize: 12 }))

    expect(store.getState().events).toMatchObject({
      status: 'failed',
      error: 'Invalid pagination parameters',
    })
  })

  it('ignores a stale response that resolves after a newer request', async () => {
    const fetchMock = mockFetch()
    let resolveFirst: (response: Response) => void = () => {}
    fetchMock.mockReturnValueOnce(new Promise<Response>((resolve) => (resolveFirst = resolve)))
    const second = buildEventsResponse({
      data: [buildEvent({ id: 2, name: 'Second page event' })],
      pagination: { page: 2, pageSize: 12, totalItems: 13, totalPages: 2 },
    })
    fetchMock.mockResolvedValueOnce(jsonResponse({ body: second }))
    const store = setupStore()

    const firstRequest = store.dispatch(fetchEvents({ page: 1, pageSize: 12 }))
    await store.dispatch(fetchEvents({ page: 2, pageSize: 12 }))
    resolveFirst(jsonResponse({ body: buildEventsResponse() }))
    await firstRequest

    expect(store.getState().events.items).toEqual(second.data)
    expect(store.getState().events.pagination?.page).toBe(2)
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

    const promise = store.dispatch(fetchEvents({ page: 1, pageSize: 12 }))
    promise.abort()
    await promise

    expect(store.getState().events.error).toBeNull()
    expect(store.getState().events.status).not.toBe('failed')
  })
})

describe('selectRangeLabel', () => {
  const stateWith = (pagination: { page: number; pageSize: number; totalItems: number; totalPages: number }, count: number) => ({
    events: { ...initialState, pagination, items: Array.from({ length: count }, (_, i) => buildEvent({ id: i })) },
  })

  it('describes the loaded range, not the requested one', () => {
    const state = stateWith({ page: 2, pageSize: 12, totalItems: 30, totalPages: 3 }, 12)

    expect(selectRangeLabel(state as never)).toBe('Showing 13–24 of 30 events')
  })

  it('handles a partial last page', () => {
    const state = stateWith({ page: 3, pageSize: 12, totalItems: 30, totalPages: 3 }, 6)

    expect(selectRangeLabel(state as never)).toBe('Showing 25–30 of 30 events')
  })

  it('is empty when nothing is loaded', () => {
    expect(selectRangeLabel({ events: initialState } as never)).toBe('')
  })
})
