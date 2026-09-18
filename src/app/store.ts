import { combineReducers, configureStore } from '@reduxjs/toolkit'
import eventsReducer from '../features/events/eventsSlice'

const rootReducer = combineReducers({
  events: eventsReducer,
})

export type RootState = ReturnType<typeof rootReducer>

/** Store factory: the app creates one, and every test gets its own isolated instance. */
export const setupStore = (preloadedState?: Partial<RootState>) =>
  configureStore({ reducer: rootReducer, preloadedState })

export type AppStore = ReturnType<typeof setupStore>
export type AppDispatch = AppStore['dispatch']
