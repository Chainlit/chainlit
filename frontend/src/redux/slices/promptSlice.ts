import { createSlice } from '@reduxjs/toolkit';

export interface PromptState {
  input: string;
}

const initialState: PromptState = {
  input: ''
};

export const promptSlice = createSlice({
  name: 'prompt',
  initialState,
  reducers: {
    setPrompt: (state, action) => {
      state.input = action.payload;
    }
  }
});

export const { setPrompt } = promptSlice.actions;

export default promptSlice.reducer;
