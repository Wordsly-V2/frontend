/** Web push types owned by the gateway's notifications routes. */

/** Push subscription payload sent to POST /notifications/subscriptions. */
export interface IPushSubscriptionDto {
    endpoint: string;
    keys: {
        p256dh: string;
        auth: string;
    };
    userAgent?: string;
}

/** Streak-reminder preferences from GET /notifications/preferences. */
export interface INotificationPreferences {
    streakReminderEnabled: boolean;
    /** Local "HH:mm" time to send the daily reminder. */
    reminderTime: string;
    /** IANA timezone (e.g. "Asia/Ho_Chi_Minh"). */
    timezone: string;
    /** Whether the server has an active push subscription for this device/user. */
    hasSubscription: boolean;
}

/** Partial update payload for PATCH /notifications/preferences. */
export type IUpdateNotificationPreferencesDto = Partial<
    Pick<INotificationPreferences, "streakReminderEnabled" | "reminderTime" | "timezone">
>;

/** GET /notifications/vapid-public-key response. */
export interface IVapidPublicKeyResponse {
    publicKey: string | null;
}
