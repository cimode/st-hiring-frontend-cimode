import { request } from '../../api/httpClient'
import type { EventsQuery, EventsResponse } from './types'

export const getEvents = ({ page, pageSize }: EventsQuery, signal?: AbortSignal) =>
  request<EventsResponse>(`/events?page=${page}&pageSize=${pageSize}`, { signal })
