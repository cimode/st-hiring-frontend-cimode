export interface Ticket {
  id: number
  eventId: number
  type: string
  status: string
  /** Integer minor units (cents). */
  price: number
}

export interface EventItem {
  id: number
  name: string
  /** ISO 8601 string as serialised by the API. */
  date: string
  location: string | null
  description: string | null
  availableTickets: Ticket[]
}

export interface PaginationMeta {
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}

export interface EventsResponse {
  data: EventItem[]
  pagination: PaginationMeta
}

export interface EventsQuery {
  page: number
  pageSize: number
}
