/**
 * Where to send a learner back to after signing in.
 *
 * The OAuth round trip leaves the app entirely, so the intended destination is
 * parked in sessionStorage (per tab, cleared when the tab closes) as well as
 * being passed as `?redirect=` where the URL survives. Everything read back out
 * is treated as untrusted input.
 */

const AUTH_REDIRECT_STORAGE_KEY = "auth_redirect";

export const DEFAULT_POST_LOGIN_PATH = "/learn";

/**
 * Accept only same-origin absolute paths. `//evil.com` and `https://evil.com`
 * are both browser-valid redirect targets, so a bare "starts with /" check is
 * not enough. Bouncing back into `/auth/*` would also loop.
 */
export function sanitizeRedirectPath(
    value: string | null | undefined,
    fallback: string = DEFAULT_POST_LOGIN_PATH,
): string {
    if (!value) return fallback;
    if (!value.startsWith("/")) return fallback;
    if (value.startsWith("//") || value.startsWith("/\\")) return fallback;
    if (value.startsWith("/auth")) return fallback;
    return value;
}

export function rememberAuthRedirect(path: string): void {
    if (globalThis.window === undefined) return;
    try {
        globalThis.sessionStorage.setItem(
            AUTH_REDIRECT_STORAGE_KEY,
            sanitizeRedirectPath(path),
        );
    } catch {
        // Private mode / disabled storage: fall back to the default landing.
    }
}

/** Read and clear the parked destination. */
export function consumeAuthRedirect(): string | null {
    if (globalThis.window === undefined) return null;
    try {
        const value = globalThis.sessionStorage.getItem(AUTH_REDIRECT_STORAGE_KEY);
        globalThis.sessionStorage.removeItem(AUTH_REDIRECT_STORAGE_KEY);
        return value;
    } catch {
        return null;
    }
}

export function clearAuthRedirect(): void {
    if (globalThis.window === undefined) return;
    try {
        globalThis.sessionStorage.removeItem(AUTH_REDIRECT_STORAGE_KEY);
    } catch {
        // ignore
    }
}

/** `/auth/login?redirect=<current location>`, ready to hand to the router. */
export function buildLoginUrl(currentPath: string): string {
    const target = sanitizeRedirectPath(currentPath, "");
    return target
        ? `/auth/login?redirect=${encodeURIComponent(target)}`
        : "/auth/login";
}
