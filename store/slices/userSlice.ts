import axios from '@/lib/axios';
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'

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

const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        setProfile: (state, action: PayloadAction<UserProfile>) => {
            state.profile = action.payload
            state.error = undefined;
        },
    },
    extraReducers: (builder) => {
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
    },
})

export const { setProfile } =
    userSlice.actions

export default userSlice.reducer
