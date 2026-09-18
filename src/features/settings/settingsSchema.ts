import * as yup from 'yup'
import { CURRENCIES, type Settings } from './types'

// Same limits the backend enforces, so the client never sends a value the server rejects.
export const TICKETING_LIMITS = {
  maxTicketsPerOrder: { min: 1, max: 50 },
  reservationTimeoutMinutes: { min: 1, max: 120 },
} as const

// Mirrors the backend pattern: one "@", something on both sides, no whitespace.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const integerInRange = ({ min, max }: { min: number; max: number }) =>
  yup
    .number()
    .typeError('Enter a number')
    .required('Enter a number')
    .integer('Must be a whole number')
    .min(min, `Must be between ${min} and ${max}`)
    .max(max, `Must be between ${min} and ${max}`)

export const settingsSchema = yup.object({
  general: yup.object({
    siteName: yup.string().trim().required('Site name is required'),
    supportEmail: yup
      .string()
      .trim()
      .required('Support email is required')
      .matches(EMAIL_PATTERN, 'Enter a valid email address'),
    currency: yup
      .string()
      .oneOf(CURRENCIES, 'Choose a supported currency')
      .required('Choose a supported currency'),
  }),
  ticketing: yup.object({
    maxTicketsPerOrder: integerInRange(TICKETING_LIMITS.maxTicketsPerOrder),
    reservationTimeoutMinutes: integerInRange(TICKETING_LIMITS.reservationTimeoutMinutes),
  }),
  notifications: yup.object({
    emailEnabled: yup.boolean().required(),
    smsEnabled: yup.boolean().required(),
  }),
})

/**
 * Turns form values into the request body: trims strings, coerces numeric inputs to real
 * numbers and drops anything the API does not accept (such as `updatedAt`).
 */
export const toSettingsPayload = (values: Settings): Settings =>
  settingsSchema.cast(values, { stripUnknown: true }) as Settings
