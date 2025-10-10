import { createSlice } from '@reduxjs/toolkit';

export interface uploadBtn {
  uploadBtnState: boolean;
  uploadBtnWebSearchState: boolean;
}

const initialState: uploadBtn = {
  uploadBtnState: true,
  uploadBtnWebSearchState: true
};

export const uploadBtnSlice = createSlice({
  name: 'upload',
  initialState,
  reducers: {
    setUploadBtnState: (state, action) => {
      state.uploadBtnState = action.payload;
    },
    setUploadBtnWebSearchState: (state, action) => {
      state.uploadBtnWebSearchState = action.payload;
    }
  }
});

export const { setUploadBtnState, setUploadBtnWebSearchState } =
  uploadBtnSlice.actions;
export default uploadBtnSlice.reducer;
