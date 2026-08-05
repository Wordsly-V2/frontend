"use client";

import { initInstallPromptCapture } from "@/lib/install-prompt-store";
import { useEffect } from "react";

/**
 * Registers the Serwist-generated service worker (`/sw.js`) on the client, and
 * starts capturing `beforeinstallprompt` — both belong in the root layout so
 * they run from hydration. The install event fires once and early, so any
 * install UI mounting later (the profile card, the learn-screen prompt) depends
 * on this capture already being live.
 *
 * No-op for the SW when service workers aren't supported or in dev (Serwist
 * disables the SW build in development).
 */
export function ServiceWorkerRegistration() {
    useEffect(() => {
        initInstallPromptCapture();
    }, []);

    useEffect(() => {
        if (
            typeof navigator === "undefined" ||
            !("serviceWorker" in navigator) ||
            process.env.NODE_ENV !== "production"
        ) {
            return;
        }

        const register = () => {
            navigator.serviceWorker.register("/sw.js").catch(() => {
                // Registration can fail on unsupported browsers / private mode —
                // the app still works without the SW, so swallow silently.
            });
        };

        if (document.readyState === "complete") {
            register();
        } else {
            globalThis.addEventListener("load", register);
            return () => globalThis.removeEventListener("load", register);
        }
    }, []);

    return null;
}
