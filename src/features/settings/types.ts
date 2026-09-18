export const CURRENCIES = ['USD', 'EUR', 'GBP'] as const
export type Currency = (typeof CURRENCIES)[number]

export interface Settings {
  general: {
    siteName: string
    supportEmail: string
    currency: Currency
  }
  ticketing: {
    maxTicketsPerOrder: number
    reservationTimeoutMinutes: number
  }
  notifications: {
    emailEnabled: boolean
    smsEnabled: boolean
  }
}

/** GET/POST /settings response: the settings plus when they were last saved (null = never). */
export interface StoredSettings extends Settings {
  updatedAt: string | null
}
