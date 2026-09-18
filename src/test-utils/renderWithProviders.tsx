import type { PropsWithChildren, ReactElement } from 'react'
import { render, type RenderOptions } from '@testing-library/react'
import { Provider } from 'react-redux'
import { setupStore, type AppStore, type RootState } from '../app/store'

interface ExtendedRenderOptions extends Omit<RenderOptions, 'queries'> {
  preloadedState?: Partial<RootState>
  store?: AppStore
}

/** Renders a component against a real store so tests exercise reducers and thunks too. */
export const renderWithProviders = (
  ui: ReactElement,
  { preloadedState, store = setupStore(preloadedState), ...options }: ExtendedRenderOptions = {},
) => {
  const Wrapper = ({ children }: PropsWithChildren) => <Provider store={store}>{children}</Provider>
  return { store, ...render(ui, { wrapper: Wrapper, ...options }) }
}
