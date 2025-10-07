// src/state/chatGptAgreementSlice.ts
import { createSlice } from '@reduxjs/toolkit';

export interface AgreementState {
  hasAgreed: boolean;
}

const initialState: AgreementState = {
  hasAgreed: false
};

const chatGptAgreementSlice = createSlice({
  name: 'chatGptAgreement',
  initialState,
  reducers: {
    setHasAgreed: (state) => {
      state.hasAgreed = true;
    }
  }
});

export const { setHasAgreed } = chatGptAgreementSlice.actions;

export default chatGptAgreementSlice.reducer;
