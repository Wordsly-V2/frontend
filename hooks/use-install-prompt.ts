"use client";

import {
    getLocalStorageItem,
    setLocalStorageItem,
} from "@/lib/local-storage";
import { startTransition, useCallback, useEffect, useState } from "react";

const INSTALL_PROMPT_DISMISSED_KEY = "pwa_install_dismissed";

/** The (not-yet-standardized) beforeinstallprompt event. */
interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    prompt: () => Promise<void>;
    readonly userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isStandalone(): boolean {
    if (typeof window === "undefined") return false;
    return (
        globalThis.matchMedia?.("(display-mode: standalone)").matches ||
        // iOS Safari exposes navigator.standalone.
        (navigator as Navigator & { standalone?: boolean }).standalone === true
    );
}

function isIos(): boolean {
    if (typeof navigator === "undefined") return false;
    return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export interface UseInstallPromptResult {
    /** Whether an install affordance should be shown at all. */
    canPrompt: boolean;
    /** iOS has no beforeinstallprompt — show manual "Add to Home Screen" steps. */
    isIos: boolean;
    /** True once the app is running installed (standalone). */
    isInstalled: boolean;
    /** Trigger the native install prompt (Chromium). */
    promptInstall: () => Promise<void>;
    /** Dismiss the affordance and remember the choice. */
    dismiss: () => void;
}

/**
 * Captures `beforeinstallprompt`, tracks install/standalone state, and persists
 * a dismissal so the prompt doesn't nag. iOS gets manual instructions instead.
 */
export function useInstallPrompt(): UseInstallPromptResult {
    const [deferredPrompt, setDeferredPrompt] =
        useState<BeforeInstallPromptEvent | null>(null);
    const [dismissed, setDismissed] = useState(true);
    const [installed, setInstalled] = useState(false);
    const [ios, setIos] = useState(false);

    useEffect(() => {
        // Read browser/storage state after mount (SSR-safe helpers) — wrapped in
        // a transition to avoid the cascading-render warning.
        startTransition(() => {
            setDismissed(getLocalStorageItem(INSTALL_PROMPT_DISMISSED_KEY) === "1");
            setInstalled(isStandalone());
            setIos(isIos());
        });

        const onBeforeInstall = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
        };
        const onInstalled = () => {
            setInstalled(true);
            setDeferredPrompt(null);
        };

        globalThis.addEventListener("beforeinstallprompt", onBeforeInstall);
        globalThis.addEventListener("appinstalled", onInstalled);
        return () => {
            globalThis.removeEventListener("beforeinstallprompt", onBeforeInstall);
            globalThis.removeEventListener("appinstalled", onInstalled);
        };
    }, []);

    const dismiss = useCallback(() => {
        setDismissed(true);
        setLocalStorageItem(INSTALL_PROMPT_DISMISSED_KEY, "1");
    }, []);

    const promptInstall = useCallback(async () => {
        if (!deferredPrompt) return;
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        setDeferredPrompt(null);
        if (choice.outcome === "accepted") dismiss();
    }, [deferredPrompt, dismiss]);

    // iOS: offer manual instructions. Chromium: only once we have the event.
    const canPrompt =
        !installed &&
        !dismissed &&
        (ios ? true : deferredPrompt !== null);

    return {
        canPrompt,
        isIos: ios,
        isInstalled: installed,
        promptInstall,
        dismiss,
    };
}
