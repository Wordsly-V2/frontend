/**
 * Browser localStorage helpers safe for SSR and storage failures (quota, private mode).
 */

export const THEME_STORAGE_KEY = 'theme';

export const ACCESS_TOKEN_STORAGE_KEY = 'access_token';

export function getLocalStorageItem(key: string): string | null {
    if (globalThis.window === undefined) return null;
    try {
        return globalThis.localStorage.getItem(key);
    } catch {
        return null;
    }
}

export function setLocalStorageItem(key: string, value: string): void {
    if (globalThis.window === undefined) return;
    try {
        globalThis.localStorage.setItem(key, value);
    } catch {
        // Quota, private mode, or disabled storage
    }
}

export function removeLocalStorageItem(key: string): void {
    if (globalThis.window === undefined) return;
    try {
        globalThis.localStorage.removeItem(key);
    } catch {
        // ignore
    }
}
