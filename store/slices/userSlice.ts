import { getUserProfile } from '@/apis/users.api';
import { logout as logoutApi } from '@/apis/auth.api';
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
    isLoading: false,
}

export const fetchProfile = createAsyncThunk('user/fetchProfile', async (_, { rejectWithValue }) => {
    try {
        return getUserProfile();
    } catch (error) {
        return rejectWithValue(error);
    }
});

export const logout = createAsyncThunk('user/logout', async (_, { rejectWithValue }) => {
    try {
        return  logoutApi();
    } catch (error) {
        return rejectWithValue(error);
    }
});

const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        initProfileFromLocalStorage: (state) => {
            const userProfile = localStorage.getItem('userProfile');
            if (userProfile) {
                state.profile = JSON.parse(userProfile);
            }
            state.error = undefined;
            state.isLoading = false;
        },
    },
    extraReducers: (builder) => {
        // Fetch profile
        builder.addCase(fetchProfile.pending, (state) => {
            state.error = undefined;
            state.isLoading = true;
        });
        builder.addCase(fetchProfile.fulfilled, (state, action) => {
            state.profile = action.payload;
            state.isLoading = false;
            localStorage.setItem('userProfile', JSON.stringify(action.payload));
        });
        builder.addCase(fetchProfile.rejected, (state, action) => {
            state.error = action.error.message;
            state.profile = null;
            state.isLoading = false;
            localStorage.removeItem('userProfile');
        });

        // Logout
        builder.addCase(logout.pending, (state) => {
            state.error = undefined;
            state.isLoading = true;
        });
        builder.addCase(logout.fulfilled, (state, action) => {
            state.profile = null;
            state.isLoading = false;
            localStorage.removeItem('userProfile');
        });
        builder.addCase(logout.rejected, (state, action) => {
            state.error = action.error.message;
            state.profile = null;
            state.isLoading = false;
        });
    },
})

export const { initProfileFromLocalStorage } =
    userSlice.actions

export default userSlice.reducer
