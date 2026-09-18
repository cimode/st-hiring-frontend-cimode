import { settingsSchema, toSettingsPayload } from './settingsSchema'
import { buildSettings } from './testData'

const errorsFor = async (value: unknown) => {
  try {
    await settingsSchema.validate(value, { abortEarly: false })
    return {}
  } catch (error) {
    const { inner } = error as { inner: { path: string; message: string }[] }
    return Object.fromEntries(inner.map(({ path, message }) => [path, message]))
  }
}

describe('settingsSchema', () => {
  it('accepts valid settings', async () => {
    expect(await errorsFor(buildSettings())).toEqual({})
  })

  it('requires a site name and a valid support email', async () => {
    const settings = buildSettings({
      general: { siteName: '   ', supportEmail: 'not-an-email', currency: 'USD' },
    })

    expect(await errorsFor(settings)).toEqual({
      'general.siteName': 'Site name is required',
      'general.supportEmail': 'Enter a valid email address',
    })
  })

  it('rejects unsupported currencies', async () => {
    const settings = buildSettings({
      general: { ...buildSettings().general, currency: 'JPY' as never },
    })

    expect(await errorsFor(settings)).toEqual({ 'general.currency': 'Choose a supported currency' })
  })

  it.each([
    ['ticketing.maxTicketsPerOrder', 0, 'Must be between 1 and 50'],
    ['ticketing.maxTicketsPerOrder', 51, 'Must be between 1 and 50'],
    ['ticketing.maxTicketsPerOrder', 2.5, 'Must be a whole number'],
    ['ticketing.reservationTimeoutMinutes', 0, 'Must be between 1 and 120'],
    ['ticketing.reservationTimeoutMinutes', 121, 'Must be between 1 and 120'],
    ['ticketing.maxTicketsPerOrder', '', 'Enter a number'],
  ])('validates %s = %p', async (path, value, message) => {
    const [, field] = path.split('.')
    const settings = buildSettings()
    const invalid = { ...settings, ticketing: { ...settings.ticketing, [field]: value } }

    expect(await errorsFor(invalid)).toEqual({ [path]: message })
  })
})

describe('toSettingsPayload', () => {
  it('sends numbers as numbers and strips fields the API does not accept', () => {
    const values = {
      ...buildSettings({ updatedAt: '2024-07-01T00:00:00.000Z' }),
      ticketing: { maxTicketsPerOrder: '20', reservationTimeoutMinutes: '30' },
    }

    const payload = toSettingsPayload(values as never)

    expect(payload).toEqual({
      general: { siteName: 'SeeTickets', supportEmail: 'support@seetickets.example', currency: 'USD' },
      ticketing: { maxTicketsPerOrder: 20, reservationTimeoutMinutes: 30 },
      notifications: { emailEnabled: true, smsEnabled: false },
    })
  })

  it('trims text fields', () => {
    const settings = buildSettings()
    const payload = toSettingsPayload({
      ...settings,
      general: { ...settings.general, siteName: '  My Site  ' },
    })

    expect(payload.general.siteName).toBe('My Site')
  })
})
