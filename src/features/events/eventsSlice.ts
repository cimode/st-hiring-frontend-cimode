import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { toApiErrorPayload, type ApiErrorPayload } from '../../api/httpClient'
import type { RootState } from '../../app/store'
import { getEvents } from './eventsApi'
import type { EventItem, EventsQuery, EventsResponse, PaginationMeta } from './types'

// 12 fills complete rows in the 1, 2 and 3 column layouts.
export const PAGE_SIZE_OPTIONS = [6, 12, 24, 48] as const
export const DEFAULT_PAGE_SIZE = 12

export interface EventsState {
  items: EventItem[]
  /** What the user asked for. */
  query: EventsQuery
  /** What the server last answered; null until the first response. */
  pagination: PaginationMeta | null
  status: 'idle' | 'loading' | 'succeeded' | 'failed'
  error: string | null
  /** Id of the latest request, used to drop responses that arrive out of order. */
  currentRequestId: string | null
}

const initialState: EventsState = {
  items: [],
  query: { page: 1, pageSize: DEFAULT_PAGE_SIZE },
  pagination: null,
  status: 'idle',
  error: null,
  currentRequestId: null,
}

export const fetchEvents = createAsyncThunk<EventsResponse, EventsQuery, { rejectValue: ApiErrorPayload }>(
  'events/fetchEvents',
  async (query, { signal, rejectWithValue }) => {
    try {
      return await getEvents(query, signal)
    } catch (error) {
      return rejectWithValue(toApiErrorPayload(error))
    }
  },
)

const eventsSlice = createSlice({
  name: 'events',
  initialState,
  reducers: {
    setPage(state, action: PayloadAction<number>) {
      state.query.page = action.payload
    },
    setPageSize(state, action: PayloadAction<number>) {
      state.query.pageSize = action.payload
      // The current page number means something else with a different size.
      state.query.page = 1
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEvents.pending, (state, action) => {
        state.status = 'loading'
        state.error = null
        state.currentRequestId = action.meta.requestId
      })
      .addCase(fetchEvents.fulfilled, (state, action) => {
        if (state.currentRequestId !== action.meta.requestId) return
        state.items = action.payload.data
        state.pagination = action.payload.pagination
        state.status = 'succeeded'
        state.currentRequestId = null
      })
      .addCase(fetchEvents.rejected, (state, action) => {
        if (state.currentRequestId !== action.meta.requestId) return
        state.currentRequestId = null
        if (action.meta.aborted) {
          // Cancelled on purpose (unmount or superseded request): not an error.
          state.status = state.pagination ? 'succeeded' : 'idle'
          return
        }
        state.status = 'failed'
        state.error = action.payload?.message ?? action.error.message ?? 'Could not load events'
      })
  },
})

export const { setPage, setPageSize } = eventsSlice.actions
export default eventsSlice.reducer

export const selectEvents = (state: RootState) => state.events

/** Built from the loaded response, so it never describes a page that is still loading. */
export const selectRangeLabel = (state: RootState): string => {
  const { pagination, items } = state.events
  if (!pagination || items.length === 0) return ''
  const first = (pagination.page - 1) * pagination.pageSize + 1
  const last = first + items.length - 1
  return `Showing ${first}–${last} of ${pagination.totalItems} events`
}
