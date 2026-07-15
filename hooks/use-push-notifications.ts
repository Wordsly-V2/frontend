"use client";

import {
    useCreatePushSubscriptionMutation,
    useDeletePushSubscriptionMutation,
    useNotificationPreferencesQuery,
    useUpdateNotificationPreferencesMutation,
    useVapidPublicKeyQuery,
} from "@/queries/notifications.query";
import { useCallback, useEffect, useState } from "react";

/** Convert a base64url VAPID public key into the Uint8Array subscribe() wants. */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const raw = globalThis.atob(base64);
    const output = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
    return output;
}

function pushSupported(): boolean {
    return (
        typeof window !== "undefined" &&
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window
    );
}

function isStandalone(): boolean {
    if (typeof window === "undefined") return false;
    return (
        globalThis.matchMedia?.("(display-mode: standalone)").matches ||
        (navigator as Navigator & { standalone?: boolean }).standalone === true
    );
}

function isIos(): boolean {
    if (typeof navigator === "undefined") return false;
    return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export type PushStatus =
    /** Browser can't do web push at all. */
    | "unsupported"
    /** iOS Safari only allows push once the PWA is added to the home screen. */
    | "ios-needs-install"
    /** Permission not yet requested — safe to ask on a user gesture. */
    | "prompt"
    /** User blocked notifications. */
    | "denied"
    /** Permission granted and a push subscription exists. */
    | "enabled"
    /** Permission granted but not subscribed (or reminder disabled). */
    | "granted";

export interface UsePushNotificationsResult {
    status: PushStatus;
    isSupported: boolean;
    isBusy: boolean;
    error: string | null;
    reminderTime: string;
    /** Ask permission (user gesture) + subscribe + save preferences. */
    enable: (reminderTime?: string) => Promise<void>;
    /** Unsubscribe and turn the reminder off. */
    disable: () => Promise<void>;
    /** Update just the reminder time (when already enabled). */
    setReminderTime: (reminderTime: string) => Promise<void>;
}

const DEFAULT_REMINDER_TIME = "19:00";

/**
 * Web-push permission state machine. Requests Notification permission ONLY when
 * `enable()` is called (must be from a user gesture), subscribes via PushManager
 * with the gateway's VAPID key, registers the subscription, and syncs the
 * learner's timezone + reminder time to the preferences endpoint.
 */
export function usePushNotifications(): UsePushNotificationsResult {
    const supported = pushSupported();
    const { data: preferences } = useNotificationPreferencesQuery(supported);
    const { data: vapid } = useVapidPublicKeyQuery(supported);
    const createSubscription = useCreatePushSubscriptionMutation();
    const deleteSubscription = useDeletePushSubscriptionMutation();
    const updatePreferences = useUpdateNotificationPreferencesMutation();

    const [permission, setPermission] = useState<NotificationPermission>("default");
    const [isBusy, setIsBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (supported) setPermission(Notification.permission);
    }, [supported]);

    const reminderTime = preferences?.reminderTime ?? DEFAULT_REMINDER_TIME;

    let status: PushStatus;
    if (!supported) {
        status = isIos() && !isStandalone() ? "ios-needs-install" : "unsupported";
    } else if (permission === "denied") {
        status = "denied";
    } else if (
        permission === "granted" &&
        preferences?.hasSubscription &&
        preferences.streakReminderEnabled
    ) {
        status = "enabled";
    } else if (permission === "granted") {
        status = "granted";
    } else {
        status = "prompt";
    }

    const enable = useCallback(
        async (chosenTime?: string) => {
            setError(null);
            if (!supported) {
                setError("Push notifications aren't supported on this device.");
                return;
            }
            if (!vapid?.publicKey) {
                setError("Reminders aren't available right now. Try again later.");
                return;
            }
            setIsBusy(true);
            try {
                // Must be called from a user gesture — the caller wires this to a click.
                const result = await Notification.requestPermission();
                setPermission(result);
                if (result !== "granted") {
                    setError(
                        result === "denied"
                            ? "Notifications are blocked. Enable them in your browser settings."
                            : "We need permission to send reminders.",
                    );
                    return;
                }

                const registration = await navigator.serviceWorker.ready;
                const existing = await registration.pushManager.getSubscription();
                const subscription =
                    existing ??
                    (await registration.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey: urlBase64ToUint8Array(
                            vapid.publicKey,
                        ) as BufferSource,
                    }));

                const json = subscription.toJSON();
                await createSubscription.mutateAsync({
                    endpoint: subscription.endpoint,
                    keys: {
                        p256dh: json.keys?.p256dh ?? "",
                        auth: json.keys?.auth ?? "",
                    },
                    userAgent: navigator.userAgent,
                });

                await updatePreferences.mutateAsync({
                    streakReminderEnabled: true,
                    reminderTime: chosenTime ?? reminderTime,
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                });
            } catch {
                setError("Couldn't turn on reminders. Please try again.");
            } finally {
                setIsBusy(false);
            }
        },
        [supported, vapid, reminderTime, createSubscription, updatePreferences],
    );

    const disable = useCallback(async () => {
        setError(null);
        setIsBusy(true);
        try {
            if (supported) {
                const registration = await navigator.serviceWorker.ready;
                const subscription = await registration.pushManager.getSubscription();
                if (subscription) {
                    await deleteSubscription.mutateAsync(subscription.endpoint);
                    await subscription.unsubscribe();
                }
            }
            await updatePreferences.mutateAsync({ streakReminderEnabled: false });
        } catch {
            setError("Couldn't turn off reminders. Please try again.");
        } finally {
            setIsBusy(false);
        }
    }, [supported, deleteSubscription, updatePreferences]);

    const setReminderTime = useCallback(
        async (chosenTime: string) => {
            setError(null);
            try {
                await updatePreferences.mutateAsync({
                    reminderTime: chosenTime,
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                });
            } catch {
                setError("Couldn't update the reminder time.");
            }
        },
        [updatePreferences],
    );

    return {
        status,
        isSupported: supported,
        isBusy,
        error,
        reminderTime,
        enable,
        disable,
        setReminderTime,
    };
}
