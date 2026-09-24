import {
    getLocalStorageItem,
    removeLocalStorageItem,
    setLocalStorageItem,
} from '@/lib/local-storage';

/**
 * A sign-out the server has not confirmed yet.
 *
 * Local state is wiped the moment the learner signs out, but the refresh token
 * lives in an httpOnly cookie only the server can end. If `/auth/logout` fails
 * (offline, cold start, a 5xx), that cookie survives — and the next page load
 * would silently refresh with it and sign the previous user straight back in,
 * on what may be a shared device.
 *
 * So the intent is persisted before the call and cleared only on success. While
 * it is set, `lib/axios.ts` refuses to refresh (except for the logout retry
 * itself), and the profile check retries the logout before anything else.
 *
 * Deliberately NOT in `clearUserLocalData`'s list: it must outlive the wipe.
 * And deliberately free of API imports: `lib/axios.ts` reads it, so pulling in
 * `apis/auth.api` here would be an import cycle. The server call lives with the
 * logout thunk in `store/slices/userSlice.ts`.
 */
export const LOGOUT_PENDING_STORAGE_KEY = 'wordsly.logoutPending';

export interface PendingLogout {
    allDevices: boolean;
    requestedAt: string;
}

export function markLogoutPending(allDevices: boolean): void {
    const value: PendingLogout = {
        allDevices,
        requestedAt: new Date().toISOString(),
    };
    setLocalStorageItem(LOGOUT_PENDING_STORAGE_KEY, JSON.stringify(value));
}

export function clearLogoutPending(): void {
    removeLocalStorageItem(LOGOUT_PENDING_STORAGE_KEY);
}

export function readLogoutPending(): PendingLogout | null {
    const raw = getLocalStorageItem(LOGOUT_PENDING_STORAGE_KEY);
    if (!raw) return null;
    try {
        const parsed = JSON.parse(raw) as Partial<PendingLogout>;
        return {
            allDevices: parsed?.allDevices === true,
            requestedAt: parsed?.requestedAt ?? '',
        };
    } catch {
        // Unreadable, but its presence still means a sign-out was asked for —
        // fail towards "signed out", never towards a silent sign-in.
        return { allDevices: false, requestedAt: '' };
    }
}

export function isLogoutPending(): boolean {
    return readLogoutPending() !== null;
}
