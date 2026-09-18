import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { jsonResponse, mockFetch } from '../../test-utils/mockFetch'
import { renderWithProviders } from '../../test-utils/renderWithProviders'
import { EventsPage } from './EventsPage'
import { buildEvent, buildEventsResponse } from './testData'

const pageOf = (page: number, totalItems = 30) =>
  buildEventsResponse({
    data: [buildEvent({ id: page, name: `Event on page ${page}` })],
    pagination: { page, pageSize: 12, totalItems, totalPages: Math.ceil(totalItems / 12) },
  })

describe('EventsPage', () => {
  it('announces loading and then lists the events', async () => {
    mockFetch().mockResolvedValueOnce(jsonResponse({ body: pageOf(1) }))
    renderWithProviders(<EventsPage />)

    expect(screen.getByRole('status')).toHaveTextContent(/loading events/i)

    expect(await screen.findByRole('heading', { name: 'Event on page 1' })).toBeInTheDocument()
    expect(screen.getByText('Showing 1–1 of 30 events')).toBeInTheDocument()
  })

  it('requests the next page when the user paginates', async () => {
    const user = userEvent.setup()
    const fetchMock = mockFetch()
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ body: pageOf(1) }))
      .mockResolvedValueOnce(jsonResponse({ body: pageOf(2) }))
    renderWithProviders(<EventsPage />)
    await screen.findByRole('heading', { name: 'Event on page 1' })

    const pagination = screen.getByRole('navigation', { name: /events pagination/i })
    await user.click(within(pagination).getByRole('button', { name: /go to page 2/i }))

    expect(await screen.findByRole('heading', { name: 'Event on page 2' })).toBeInTheDocument()
    expect(fetchMock).toHaveBeenLastCalledWith('/events?page=2&pageSize=12', expect.anything())
  })

  it('goes back to page 1 with the new size when the page size changes', async () => {
    const user = userEvent.setup()
    const fetchMock = mockFetch()
    fetchMock.mockResolvedValue(jsonResponse({ body: pageOf(1) }))
    renderWithProviders(<EventsPage />)
    await screen.findByRole('heading', { name: 'Event on page 1' })

    await user.click(screen.getByRole('combobox', { name: /events per page/i }))
    await user.click(screen.getByRole('option', { name: '24' }))

    await waitFor(() =>
      expect(fetchMock).toHaveBeenLastCalledWith('/events?page=1&pageSize=24', expect.anything()),
    )
  })

  it('shows the error with a retry action that reloads the list', async () => {
    const user = userEvent.setup()
    const fetchMock = mockFetch()
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({ status: 500, body: { error: { code: 'INTERNAL', message: 'Database is down' } } }),
      )
      .mockResolvedValueOnce(jsonResponse({ body: pageOf(1) }))
    renderWithProviders(<EventsPage />)

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Database is down')

    await user.click(within(alert).getByRole('button', { name: /retry/i }))

    expect(await screen.findByRole('heading', { name: 'Event on page 1' })).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('shows an empty state when there are no events', async () => {
    mockFetch().mockResolvedValueOnce(
      jsonResponse({
        body: buildEventsResponse({
          data: [],
          pagination: { page: 1, pageSize: 12, totalItems: 0, totalPages: 0 },
        }),
      }),
    )
    renderWithProviders(<EventsPage />)

    expect(await screen.findByText(/no events to show/i)).toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: /events pagination/i })).not.toBeInTheDocument()
  })

  it('recovers to the last page when the requested page no longer exists', async () => {
    const fetchMock = mockFetch()
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({
          body: buildEventsResponse({
            data: [],
            pagination: { page: 5, pageSize: 12, totalItems: 30, totalPages: 3 },
          }),
        }),
      )
      .mockResolvedValueOnce(jsonResponse({ body: pageOf(3) }))
    renderWithProviders(<EventsPage />, {
      preloadedState: {
        events: {
          items: [],
          query: { page: 5, pageSize: 12 },
          pagination: null,
          status: 'idle',
          error: null,
          currentRequestId: null,
        },
      },
    })

    expect(await screen.findByRole('heading', { name: 'Event on page 3' })).toBeInTheDocument()
    expect(fetchMock).toHaveBeenLastCalledWith('/events?page=3&pageSize=12', expect.anything())
  })
})
