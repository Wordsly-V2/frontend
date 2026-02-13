import { logout as logoutApi } from '@/apis/auth.api';
import { getUserProfile } from '@/apis/users.api';
import { IUserProfile } from '@/types/users/users.type';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

interface UserState {
    profile: IUserProfile | null
    error: string | undefined
    isLoading: boolean
}

const initialState: UserState = {
    profile: null,
    error: undefined,
    isLoading: true,
}

export const fetchProfile = createAsyncThunk('user/fetchProfile', async (_, { rejectWithValue }) => {
    try {
        return getUserProfile();
    } catch (error) {
        return rejectWithValue(error);
    }
});

export const logout = createAsyncThunk('user/logout', async ({ isLoggedOutFromAllDevices }: { isLoggedOutFromAllDevices?: boolean }, { rejectWithValue }) => {
    try {
        return logoutApi(isLoggedOutFromAllDevices);
    } catch (error) {
        return rejectWithValue(error);
    }
});

const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        // Fetch profile
        builder.addCase(fetchProfile.pending, (state) => {
            state.error = undefined;
            state.isLoading = true;
        });
        builder.addCase(fetchProfile.fulfilled, (state, action) => {
            state.profile = action.payload;
            state.isLoading = false;
        });
        builder.addCase(fetchProfile.rejected, (state, action) => {
            state.error = action.error.message;
            state.profile = null;
            state.isLoading = false;
        });

        // Logout
        builder.addCase(logout.pending, (state) => {
            state.error = undefined;
            state.isLoading = true;
        });
        builder.addCase(logout.fulfilled, (state, action) => {
            state.profile = null;
            state.isLoading = false;
        });
        builder.addCase(logout.rejected, (state, action) => {
            state.error = action.error.message;
            state.profile = null;
            state.isLoading = false;
        });
    },
})

export default userSlice.reducer
