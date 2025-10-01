import { createSlice } from '@reduxjs/toolkit';

export interface uploadBtn {
  uploadBtnState: boolean;
}

const initialState: uploadBtn = {
  uploadBtnState: true
};

export const uploadBtnSlice = createSlice({
  name: 'upload',
  initialState,
  reducers: {
    setUploadBtnState: (state, action) => {
      state.uploadBtnState = action.payload;
    }
  }
});

export const { setUploadBtnState } = uploadBtnSlice.actions;
export default uploadBtnSlice.reducer;
