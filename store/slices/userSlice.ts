import axios from '@/lib/axios';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

export type UserProfile = {
    id: string;
    gmail: string;
    displayName: string;
    pictureUrl: string;
}

interface UserState {
    profile: UserProfile | null
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
        const response = await axios.get<UserProfile>('/auth/users/profile');
        return response.data;
    } catch (error) {
        return rejectWithValue(error);
    }
});

export const logout = createAsyncThunk('user/logout', async (_, { rejectWithValue }) => {
    try {
        await axios.post('/auth/logout');
        return { success: true };
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
