import { configureStore } from '@reduxjs/toolkit'
import loadingOverlayReducer from './slices/loadingOverlaySlice'
import userReducer from './slices/userSlice'

export const store = configureStore({
  reducer: {
    user: userReducer,
    loadingOverlay: loadingOverlayReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
