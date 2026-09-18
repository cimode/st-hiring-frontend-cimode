import { formatEventDate, formatPrice } from './format'

describe('formatPrice', () => {
  it('formats cents as a currency amount', () => {
    expect(formatPrice(1000)).toBe('$10.00')
    expect(formatPrice(1999, 'EUR')).toBe('€19.99')
  })
})

describe('formatEventDate', () => {
  it('formats an ISO date as a readable date and time', () => {
    expect(formatEventDate('2024-07-01T19:30:00.000Z', 'UTC')).toBe('Mon, Jul 1, 2024, 7:30 PM')
  })

  it('returns a placeholder for invalid dates', () => {
    expect(formatEventDate('not-a-date')).toBe('Date to be confirmed')
  })
})
