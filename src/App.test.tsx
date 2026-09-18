import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import { buildEventsResponse } from './features/events/testData'
import { buildSettings } from './features/settings/testData'
import { jsonResponse, mockFetch } from './test-utils/mockFetch'
import { renderWithProviders } from './test-utils/renderWithProviders'

const mockApi = () =>
  mockFetch().mockImplementation(async (url) =>
    jsonResponse({ body: String(url).startsWith('/settings') ? buildSettings() : buildEventsResponse() }),
  )

describe('App', () => {
  it('renders the application heading and opens on the events tab', async () => {
    mockApi()
    renderWithProviders(<App />)

    expect(screen.getByRole('heading', { level: 1, name: /see tickets/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Events' })).toHaveAttribute('aria-selected', 'true')
    expect(await screen.findByRole('heading', { name: 'Rock Night' })).toBeInTheDocument()
  })

  it('switches to the settings form', async () => {
    const user = userEvent.setup()
    mockApi()
    renderWithProviders(<App />)

    await user.click(screen.getByRole('tab', { name: 'Settings' }))

    expect(screen.getByRole('tab', { name: 'Settings' })).toHaveAttribute('aria-selected', 'true')
    expect(await screen.findByRole('textbox', { name: /site name/i })).toHaveValue('SeeTickets')
    expect(screen.queryByRole('heading', { name: 'Rock Night' })).not.toBeInTheDocument()
  })
})
