import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { toApiErrorPayload, type ApiErrorPayload } from '../../api/httpClient'
import type { RootState } from '../../app/store'
import { getSettings, postSettings } from './settingsApi'
import type { Settings, StoredSettings } from './types'

export interface SettingsState {
  data: StoredSettings | null
  status: 'idle' | 'loading' | 'succeeded' | 'failed'
  /** Load failure. */
  error: string | null
  /** Save failure, shown above the form until the next attempt. */
  saveError: string | null
  /**
   * Validation errors returned by the server, keyed by dot path ("general.siteName").
   * Kept here instead of in Formik because Formik wipes `setErrors` on its next validation.
   */
  serverFieldErrors: Record<string, string>
  currentRequestId: string | null
}

const initialState: SettingsState = {
  data: null,
  status: 'idle',
  error: null,
  saveError: null,
  serverFieldErrors: {},
  currentRequestId: null,
}

export const fetchSettings = createAsyncThunk<StoredSettings, void, { rejectValue: ApiErrorPayload }>(
  'settings/fetchSettings',
  async (_, { signal, rejectWithValue }) => {
    try {
      return await getSettings(signal)
    } catch (error) {
      return rejectWithValue(toApiErrorPayload(error))
    }
  },
)

export const saveSettings = createAsyncThunk<StoredSettings, Settings, { rejectValue: ApiErrorPayload }>(
  'settings/saveSettings',
  async (settings, { signal, rejectWithValue }) => {
    try {
      return await postSettings(settings, signal)
    } catch (error) {
      return rejectWithValue(toApiErrorPayload(error))
    }
  },
)

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    clearServerFieldError(state, action: PayloadAction<string>) {
      delete state.serverFieldErrors[action.payload]
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSettings.pending, (state, action) => {
        state.status = 'loading'
        state.error = null
        state.currentRequestId = action.meta.requestId
      })
      .addCase(fetchSettings.fulfilled, (state, action) => {
        if (state.currentRequestId !== action.meta.requestId) return
        state.data = action.payload
        state.status = 'succeeded'
        state.currentRequestId = null
      })
      .addCase(fetchSettings.rejected, (state, action) => {
        if (state.currentRequestId !== action.meta.requestId) return
        state.currentRequestId = null
        if (action.meta.aborted) {
          state.status = state.data ? 'succeeded' : 'idle'
          return
        }
        state.status = 'failed'
        state.error = action.payload?.message ?? action.error.message ?? 'Could not load settings'
      })
      .addCase(saveSettings.pending, (state) => {
        state.saveError = null
        state.serverFieldErrors = {}
      })
      .addCase(saveSettings.fulfilled, (state, action) => {
        state.data = action.payload
      })
      .addCase(saveSettings.rejected, (state, action) => {
        if (action.meta.aborted) return
        state.saveError = action.payload?.message ?? action.error.message ?? 'Could not save settings'
        state.serverFieldErrors = Object.fromEntries(
          (action.payload?.details ?? []).map(({ field, message }) => [field, message]),
        )
      })
  },
})

export const { clearServerFieldError } = settingsSlice.actions
export default settingsSlice.reducer

export const selectSettings = (state: RootState) => state.settings
