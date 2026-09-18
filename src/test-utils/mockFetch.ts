type MockResponseInit = { status?: number; body?: unknown }

export const jsonResponse = ({ status = 200, body }: MockResponseInit = {}) =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  }) as Response

/** Replaces global fetch with a jest mock and returns it, so tests can queue responses. */
export const mockFetch = () => {
  const fetchMock = jest.fn<Promise<Response>, [RequestInfo | URL, RequestInit?]>()
  global.fetch = fetchMock as unknown as typeof fetch
  return fetchMock
}
