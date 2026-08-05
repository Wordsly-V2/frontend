/**
 * Module-level capture for the `beforeinstallprompt` event.
 *
 * The browser fires that event **once, early** in the page's life. A component
 * that mounts later (e.g. the profile page reached by client-side navigation)
 * would miss it entirely and wrongly conclude the app can't be installed — so
 * the listener has to live outside React, attached as early as the client
 * bundle runs, and hand the saved event to whoever subscribes afterwards.
 */

/** The (not-yet-standardized) beforeinstallprompt event. */
export interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    prompt: () => Promise<void>;
    readonly userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let installed = false;
let initialized = false;
const listeners = new Set<() => void>();

function emit(): void {
    for (const listener of listeners) listener();
}

/**
 * Attach the global listeners. Idempotent and safe to call from anywhere on the
 * client; a no-op during SSR.
 */
export function initInstallPromptCapture(): void {
    if (initialized || typeof window === "undefined") return;
    initialized = true;

    globalThis.addEventListener("beforeinstallprompt", (e: Event) => {
        // Suppress Chromium's own mini-infobar so our UI owns the moment.
        e.preventDefault();
        deferredPrompt = e as BeforeInstallPromptEvent;
        emit();
    });

    globalThis.addEventListener("appinstalled", () => {
        installed = true;
        deferredPrompt = null;
        emit();
    });
}

export function subscribeInstallPrompt(listener: () => void): () => void {
    initInstallPromptCapture();
    listeners.add(listener);
    return () => listeners.delete(listener);
}

/** The saved event, or null if the browser hasn't offered one. */
export function getInstallPrompt(): BeforeInstallPromptEvent | null {
    return deferredPrompt;
}

/** True once `appinstalled` has fired in this page's lifetime. */
export function getAppInstalled(): boolean {
    return installed;
}

/**
 * Drop the saved event after using it — it is single-use. Chromium fires a
 * fresh one if the page stays installable after a declined prompt, which the
 * global listener picks up automatically.
 */
export function clearInstallPrompt(): void {
    deferredPrompt = null;
    emit();
}

// Attach on import so the listener is live from hydration, well before any
// install UI mounts.
initInstallPromptCapture();
