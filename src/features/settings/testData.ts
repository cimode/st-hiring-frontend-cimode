import type { StoredSettings } from './types'

export const buildSettings = (overrides: Partial<StoredSettings> = {}): StoredSettings => ({
  general: { siteName: 'SeeTickets', supportEmail: 'support@seetickets.example', currency: 'USD' },
  ticketing: { maxTicketsPerOrder: 10, reservationTimeoutMinutes: 15 },
  notifications: { emailEnabled: true, smsEnabled: false },
  updatedAt: null,
  ...overrides,
})
