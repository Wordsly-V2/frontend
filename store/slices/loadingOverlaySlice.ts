import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface LoadingOverlayState {
    visible: boolean;
    label: string;
}

const initialState: LoadingOverlayState = {
    visible: false,
    label: "Loading...",
};

const loadingOverlaySlice = createSlice({
    name: "loadingOverlay",
    initialState,
    reducers: {
        showLoadingOverlay: (state, action: PayloadAction<{ label?: string }>) => {
            state.visible = true;
            if (action.payload?.label === undefined) {
                state.label = initialState.label;
            } else {
                state.label = action.payload.label;
            }
        },
        hideLoadingOverlay: (state) => {
            state.visible = false;
        },
    },
});

export const { showLoadingOverlay, hideLoadingOverlay } = loadingOverlaySlice.actions;
export default loadingOverlaySlice.reducer;
