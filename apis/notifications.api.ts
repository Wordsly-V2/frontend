import { request } from "@/lib/axios";
import type {
    INotificationPreferences,
    IPushSubscriptionDto,
    IUpdateNotificationPreferencesDto,
    IVapidPublicKeyResponse,
} from "@/types/notifications/notifications.type";

/** Register a browser push subscription for the current user. */
export const createPushSubscription = (dto: IPushSubscriptionDto): Promise<void> =>
    request((i) => i.post("/notifications/subscriptions", dto));

/** Remove a push subscription by its endpoint. */
export const deletePushSubscription = (endpoint: string): Promise<void> =>
    request((i) =>
        i.delete("/notifications/subscriptions", { data: { endpoint } }),
    );

/** Fetch the learner's streak-reminder preferences. */
export const getNotificationPreferences = (): Promise<INotificationPreferences> =>
    request((i) => i.get("/notifications/preferences"));

/** Update streak-reminder preferences (partial patch). */
export const updateNotificationPreferences = (
    dto: IUpdateNotificationPreferencesDto,
): Promise<INotificationPreferences> =>
    request((i) => i.patch("/notifications/preferences", dto));

/** Fetch the server VAPID public key (null when push isn't configured). */
export const getVapidPublicKey = (): Promise<IVapidPublicKeyResponse> =>
    request((i) => i.get("/notifications/vapid-public-key"));
