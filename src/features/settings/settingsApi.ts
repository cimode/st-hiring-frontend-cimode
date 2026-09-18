import { request } from '../../api/httpClient'
import type { Settings, StoredSettings } from './types'

export const getSettings = (signal?: AbortSignal) => request<StoredSettings>('/settings', { signal })

export const postSettings = (settings: Settings, signal?: AbortSignal) =>
  request<StoredSettings>('/settings', { method: 'POST', body: settings, signal })
