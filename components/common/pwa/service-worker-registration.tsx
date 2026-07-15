"use client";

import { useEffect } from "react";

/**
 * Registers the Serwist-generated service worker (`/sw.js`) on the client.
 * Rendered once from the root layout. No-op when service workers aren't
 * supported or in dev (Serwist disables the SW build in development).
 */
export function ServiceWorkerRegistration() {
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
