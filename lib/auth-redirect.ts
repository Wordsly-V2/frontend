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
 * Stand-in origin for resolving paths during SSR, where there is no window.
 * Only ever compared against itself, so it never has to be reachable.
 */
const SSR_DUMMY_ORIGIN = "http://localhost.invalid";

/**
 * ASCII control characters (tab, newline and friends) plus any whitespace. The
 * URL parser silently deletes tabs and newlines, so `/\t/evil.com` passes a
 * "starts with / but not //" check yet navigates to `//evil.com`.
 */
const CONTROL_OR_WHITESPACE = /[\u0000-\u001f\u007f\s]/;

/**
 * Accept only same-origin absolute paths. `//evil.com` and `https://evil.com`
 * are both browser-valid redirect targets, so a bare "starts with /" check is
 * not enough — the prefix checks are a cheap first pass, and the real test is
 * resolving the value the way the browser will and requiring the origin to be
 * unchanged. Bouncing back into `/auth/*` would also loop.
 */
export function sanitizeRedirectPath(
    value: string | null | undefined,
    fallback: string = DEFAULT_POST_LOGIN_PATH,
): string {
    if (!value) return fallback;
    // Rejected rather than stripped: a legitimate in-app path never contains
    // them, so their presence is itself the signal of a crafted value.
    if (CONTROL_OR_WHITESPACE.test(value)) return fallback;
    if (!value.startsWith("/")) return fallback;
    if (value.startsWith("//") || value.startsWith("/\\")) return fallback;

    const origin =
        globalThis.window === undefined
            ? SSR_DUMMY_ORIGIN
            : globalThis.window.location.origin;
    let resolved: URL;
    try {
        resolved = new URL(value, origin);
    } catch {
        return fallback;
    }
    if (resolved.origin !== origin) return fallback;

    // Checked on the normalised path so `/./auth` or `/x/../auth` can't loop.
    if (resolved.pathname.startsWith("/auth")) return fallback;
    return `${resolved.pathname}${resolved.search}${resolved.hash}`;
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
