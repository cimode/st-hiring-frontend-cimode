/** Ticket prices come from the API as integer minor units (cents). */
export const formatPrice = (cents: number, currency = 'USD'): string =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cents / 100)

export const formatEventDate = (isoDate: string, timeZone?: string): string => {
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) return 'Date to be confirmed'
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone,
  }).format(date)
}
