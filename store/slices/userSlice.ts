import { logout as logoutApi } from '@/apis/auth.api';
import { getUserProfile } from '@/apis/users.api';
import { isUnauthorizedError } from '@/lib/api-error';
import {
    clearOfflineAuthSession,
    readOfflineAuthSession,
    saveOfflineAuthSession,
} from '@/lib/offline/auth-session';
import { IUserProfile } from '@/types/users/users.type';
import type { RootState } from '@/store/store';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

/**
 * Why the last identity check failed.
 *
 * The distinction is load-bearing: `network` may fall back to the cached profile
 * and the offline grace window, while `unauthorized` must wipe local data and
 * send the user to login. Treating every failure the same is what made the app
 * unusable offline — and treating them the same in the other direction would be
 * a security hole.
 */
export type AuthFailureReason = 'network' | 'unauthorized';

interface UserState {
    profile: IUserProfile | null
    error: string | undefined
    isLoading: boolean
    authFailure: AuthFailureReason | null
    /** True when `profile` came from the local cache, not a live response. */
    isProfileFromCache: boolean
}

const initialState: UserState = {
    profile: null,
    error: undefined,
    isLoading: true,
    authFailure: null,
    isProfileFromCache: false,
}

interface FetchProfileRejection {
    reason: AuthFailureReason;
    status?: number;
}

export const fetchProfile = createAsyncThunk<
    IUserProfile,
    { force?: boolean } | undefined,
    { rejectValue: FetchProfileRejection }
>(
    'user/fetchProfile',
    async (_arg, { rejectWithValue }) => {
        try {
            const profile = await getUserProfile();
            saveOfflineAuthSession(profile);
            return profile;
        } catch (error) {
            // Only an explicit rejection of this identity may wipe local data.
            // Everything else -- a 5xx, a timeout, a gateway that cannot reach
            // the key set to check the token -- is "we could not ask", which
            // must fall back to offline grace. Classifying those as
            // `unauthorized` would let a brief backend blip destroy every
            // learner's cached work and queued answers.
            if (isUnauthorizedError(error)) {
                return rejectWithValue({ reason: 'unauthorized' });
            }
            return rejectWithValue({ reason: 'network' });
        }
    },
    {
        condition: (arg, { getState }) => {
            // `force` exists so reconnecting can re-verify an identity we are
            // currently serving from cache; without it the guard below would
            // block every re-check for the life of the tab.
            if (arg?.force) return true;
            const { user } = getState() as RootState;
            return user.profile === null;
        },
    },
);

export const logout = createAsyncThunk('user/logout', async ({ isLoggedOutFromAllDevices }: { isLoggedOutFromAllDevices?: boolean }, { rejectWithValue }) => {
    try {
        return await logoutApi(isLoggedOutFromAllDevices);
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
            state.authFailure = null;
            state.isProfileFromCache = false;
        });
        builder.addCase(fetchProfile.rejected, (state, action) => {
            state.error = action.error.message;
            state.isLoading = false;
            state.authFailure = action.payload?.reason ?? 'unauthorized';

            if (state.authFailure === 'network') {
                // Offline: keep the app usable by serving the cached profile.
                // Whether that is *allowed* is decided by the grace check in
                // useAuthSession, not here — this only makes the data available.
                const cached = readOfflineAuthSession();
                state.profile = cached?.profile ?? null;
                state.isProfileFromCache = cached !== null;
                return;
            }

            // The server rejected this identity. Nothing cached about it may be
            // trusted from here on.
            clearOfflineAuthSession();
            state.profile = null;
            state.isProfileFromCache = false;
        });

        // Logout
        builder.addCase(logout.pending, (state) => {
            state.error = undefined;
            state.isLoading = true;
        });
        builder.addCase(logout.fulfilled, (state) => {
            clearOfflineAuthSession();
            state.profile = null;
            state.isLoading = false;
            state.authFailure = null;
            state.isProfileFromCache = false;
        });
        builder.addCase(logout.rejected, (state, action) => {
            clearOfflineAuthSession();
            state.error = action.error.message;
            state.profile = null;
            state.isLoading = false;
            state.authFailure = null;
            state.isProfileFromCache = false;
        });
    },
})

export default userSlice.reducer
