import { configureStore } from '@reduxjs/toolkit';

import promptSlice from './slices/promptSlice';
import uploadBtnSlice from './slices/uploadBtnSlice';

export const store = configureStore({
  reducer: {
    prompt: promptSlice,
    upload: uploadBtnSlice
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
