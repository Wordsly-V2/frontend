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

/** Coarse device family — decides which manual steps to show. */
export type InstallPlatform = "ios" | "android" | "desktop";

/** Browser family, only as precise as the manual steps need it to be. */
export type InstallBrowser = "safari" | "chromium" | "firefox" | "samsung" | "other";

const STANDALONE_QUERY = "(display-mode: standalone)";

function isStandalone(): boolean {
    if (typeof window === "undefined") return false;
    return (
        globalThis.matchMedia?.(STANDALONE_QUERY).matches ||
        // iOS Safari exposes navigator.standalone.
        (navigator as Navigator & { standalone?: boolean }).standalone === true
    );
}

function detectPlatform(): InstallPlatform {
    if (typeof navigator === "undefined") return "desktop";
    const ua = navigator.userAgent;
    // iPadOS 13+ reports as Macintosh; touch points disambiguate it from a Mac.
    const iPadOs = /macintosh/i.test(ua) && navigator.maxTouchPoints > 1;
    if (/iphone|ipad|ipod/i.test(ua) || iPadOs) return "ios";
    if (/android/i.test(ua)) return "android";
    return "desktop";
}

function detectBrowser(platform: InstallPlatform): InstallBrowser {
    if (typeof navigator === "undefined") return "other";
    const ua = navigator.userAgent;
    // On iOS every browser is WebKit and installs through the Share sheet, so
    // they all get the same steps.
    if (platform === "ios") return "safari";
    if (/samsungbrowser/i.test(ua)) return "samsung";
    if (/firefox|fxios/i.test(ua)) return "firefox";
    if (/edg|chrome|crios|opr/i.test(ua)) return "chromium";
    if (/safari/i.test(ua)) return "safari";
    return "other";
}

export interface UseInstallPromptResult {
    /** Whether the dismissible install affordance should be shown. */
    canPrompt: boolean;
    /** iOS has no beforeinstallprompt — show manual "Add to Home Screen" steps. */
    isIos: boolean;
    /** True once the app is running installed (standalone). */
    isInstalled: boolean;
    /** True when the browser handed us a native install prompt we can fire. */
    hasNativePrompt: boolean;
    /** Coarse device family, for platform-specific instructions. */
    platform: InstallPlatform;
    /** Browser family, for platform-specific instructions. */
    browser: InstallBrowser;
    /** False until browser state has been read after mount (avoids SSR flashes). */
    isReady: boolean;
    /** Trigger the native install prompt (Chromium). Resolves to the outcome. */
    promptInstall: () => Promise<"accepted" | "dismissed" | "unavailable">;
    /** Dismiss the affordance and remember the choice. */
    dismiss: () => void;
}

/**
 * Captures `beforeinstallprompt`, tracks install/standalone state, and persists
 * a dismissal so the prompt doesn't nag. iOS gets manual instructions instead.
 * Also reports platform/browser so callers can render the right manual steps.
 */
export function useInstallPrompt(): UseInstallPromptResult {
    const [deferredPrompt, setDeferredPrompt] =
        useState<BeforeInstallPromptEvent | null>(null);
    const [dismissed, setDismissed] = useState(true);
    const [installed, setInstalled] = useState(false);
    const [platform, setPlatform] = useState<InstallPlatform>("desktop");
    const [browser, setBrowser] = useState<InstallBrowser>("other");
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        // Read browser/storage state after mount (SSR-safe helpers) — wrapped in
        // a transition to avoid the cascading-render warning.
        startTransition(() => {
            const detectedPlatform = detectPlatform();
            setDismissed(getLocalStorageItem(INSTALL_PROMPT_DISMISSED_KEY) === "1");
            setInstalled(isStandalone());
            setPlatform(detectedPlatform);
            setBrowser(detectBrowser(detectedPlatform));
            setIsReady(true);
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

        // Keep the installed state live: opening the app from the home screen
        // flips display-mode without a reload.
        const media = globalThis.matchMedia?.(STANDALONE_QUERY);
        const onDisplayModeChange = (e: MediaQueryListEvent) => {
            if (e.matches) setInstalled(true);
        };
        media?.addEventListener("change", onDisplayModeChange);

        return () => {
            globalThis.removeEventListener("beforeinstallprompt", onBeforeInstall);
            globalThis.removeEventListener("appinstalled", onInstalled);
            media?.removeEventListener("change", onDisplayModeChange);
        };
    }, []);

    const dismiss = useCallback(() => {
        setDismissed(true);
        setLocalStorageItem(INSTALL_PROMPT_DISMISSED_KEY, "1");
    }, []);

    const promptInstall = useCallback(async () => {
        if (!deferredPrompt) return "unavailable" as const;
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        // The event is single-use; Chromium fires a fresh one if the page stays
        // eligible after a decline.
        setDeferredPrompt(null);
        if (choice.outcome === "accepted") dismiss();
        return choice.outcome;
    }, [deferredPrompt, dismiss]);

    // iOS: offer manual instructions. Chromium: only once we have the event.
    const canPrompt =
        !installed && !dismissed && (platform === "ios" ? true : deferredPrompt !== null);

    return {
        canPrompt,
        isIos: platform === "ios",
        isInstalled: installed,
        hasNativePrompt: deferredPrompt !== null,
        platform,
        browser,
        isReady,
        promptInstall,
        dismiss,
    };
}
