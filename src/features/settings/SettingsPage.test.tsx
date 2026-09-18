import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { jsonResponse, mockFetch } from '../../test-utils/mockFetch'
import { renderWithProviders } from '../../test-utils/renderWithProviders'
import { SettingsPage } from './SettingsPage'
import { buildSettings } from './testData'

const renderLoaded = async () => {
  const fetchMock = mockFetch()
  fetchMock.mockResolvedValueOnce(jsonResponse({ body: buildSettings() }))
  const view = renderWithProviders(<SettingsPage />)
  await screen.findByRole('textbox', { name: /site name/i })
  return { fetchMock, ...view }
}

describe('SettingsPage', () => {
  it('loads the settings into the form', async () => {
    await renderLoaded()

    expect(screen.getByRole('textbox', { name: /site name/i })).toHaveValue('SeeTickets')
    expect(screen.getByRole('textbox', { name: /support email/i })).toHaveValue(
      'support@seetickets.example',
    )
    expect(screen.getByRole('spinbutton', { name: /max tickets per order/i })).toHaveValue(10)
    expect(screen.getByRole('spinbutton', { name: /reservation timeout/i })).toHaveValue(15)
    expect(screen.getByRole('checkbox', { name: /email notifications/i })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: /sms notifications/i })).not.toBeChecked()
    expect(screen.getByText(/never been saved/i)).toBeInTheDocument()
  })

  it('keeps Save disabled until something changes', async () => {
    const user = userEvent.setup()
    await renderLoaded()
    const save = screen.getByRole('button', { name: /save settings/i })

    expect(save).toBeDisabled()

    await user.type(screen.getByRole('textbox', { name: /site name/i }), ' Live')

    expect(save).toBeEnabled()
  })

  it('shows validation errors next to the fields and does not submit', async () => {
    const user = userEvent.setup()
    const { fetchMock } = await renderLoaded()

    await user.clear(screen.getByRole('textbox', { name: /site name/i }))
    const maxTickets = screen.getByRole('spinbutton', { name: /max tickets per order/i })
    await user.clear(maxTickets)
    await user.type(maxTickets, '99')
    await user.tab()

    expect(await screen.findByText('Site name is required')).toBeInTheDocument()
    expect(screen.getByText('Must be between 1 and 50')).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /site name/i })).toBeInvalid()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('submits numbers as numbers and confirms the save', async () => {
    const user = userEvent.setup()
    const { fetchMock } = await renderLoaded()
    const saved = buildSettings({
      ticketing: { maxTicketsPerOrder: 20, reservationTimeoutMinutes: 15 },
      updatedAt: '2024-07-01T10:00:00.000Z',
    })
    fetchMock.mockResolvedValueOnce(jsonResponse({ body: saved }))

    const maxTickets = screen.getByRole('spinbutton', { name: /max tickets per order/i })
    await user.clear(maxTickets)
    await user.type(maxTickets, '20')
    await user.click(screen.getByRole('checkbox', { name: /sms notifications/i }))
    await user.click(screen.getByRole('button', { name: /save settings/i }))

    expect(await screen.findByText(/settings saved/i)).toBeInTheDocument()
    const [url, init] = fetchMock.mock.calls[1]
    expect(url).toBe('/settings')
    expect(JSON.parse(String(init?.body))).toEqual({
      general: { siteName: 'SeeTickets', supportEmail: 'support@seetickets.example', currency: 'USD' },
      ticketing: { maxTicketsPerOrder: 20, reservationTimeoutMinutes: 15 },
      notifications: { emailEnabled: true, smsEnabled: true },
    })
    await waitFor(() => expect(screen.getByRole('button', { name: /save settings/i })).toBeDisabled())
  })

  it('shows server validation errors next to the field and clears them on edit', async () => {
    const user = userEvent.setup()
    const { fetchMock } = await renderLoaded()
    fetchMock.mockResolvedValueOnce(
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
    const email = screen.getByRole('textbox', { name: /support email/i })

    await user.type(email, 'x')
    await user.click(screen.getByRole('button', { name: /save settings/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid settings')
    expect(screen.getByText('must be a valid email address')).toBeInTheDocument()
    expect(email).toBeInvalid()

    await user.type(email, 'y')

    expect(screen.queryByText('must be a valid email address')).not.toBeInTheDocument()
  })

  it('lets the user change the currency', async () => {
    const user = userEvent.setup()
    const { fetchMock } = await renderLoaded()
    fetchMock.mockResolvedValueOnce(jsonResponse({ body: buildSettings() }))

    await user.click(screen.getByRole('combobox', { name: /currency/i }))
    await user.click(screen.getByRole('option', { name: /eur/i }))
    await user.click(screen.getByRole('button', { name: /save settings/i }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
    expect(JSON.parse(String(fetchMock.mock.calls[1][1]?.body)).general.currency).toBe('EUR')
  })

  it('shows a load error with retry', async () => {
    const user = userEvent.setup()
    const fetchMock = mockFetch()
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({ status: 500, body: { error: { code: 'INTERNAL', message: 'Mongo is down' } } }),
      )
      .mockResolvedValueOnce(jsonResponse({ body: buildSettings() }))
    renderWithProviders(<SettingsPage />)

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Mongo is down')

    await user.click(within(alert).getByRole('button', { name: /retry/i }))

    expect(await screen.findByRole('textbox', { name: /site name/i })).toBeInTheDocument()
  })
})
