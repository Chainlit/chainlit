import { configureStore } from '@reduxjs/toolkit';

import promptSlice from './slices/promptSlice';

export const store = configureStore({
  reducer: {
    prompt: promptSlice
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
