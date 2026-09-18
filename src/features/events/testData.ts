import type { EventItem, EventsResponse } from './types'

export const buildEvent = (overrides: Partial<EventItem> = {}): EventItem => ({
  id: 1,
  name: 'Rock Night',
  date: '2024-07-01T19:30:00.000Z',
  location: 'Madrid Arena',
  description: 'A night of rock classics.',
  availableTickets: [
    { id: 1, eventId: 1, type: 'general', status: 'available', price: 2500 },
    { id: 2, eventId: 1, type: 'vip', status: 'available', price: 9000 },
  ],
  ...overrides,
})

export const buildEventsResponse = (overrides: Partial<EventsResponse> = {}): EventsResponse => ({
  data: [buildEvent()],
  pagination: { page: 1, pageSize: 12, totalItems: 1, totalPages: 1 },
  ...overrides,
})
