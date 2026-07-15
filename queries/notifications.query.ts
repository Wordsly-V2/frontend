import {
    createPushSubscription,
    deletePushSubscription,
    getNotificationPreferences,
    getVapidPublicKey,
    updateNotificationPreferences,
} from "@/apis/notifications.api";
import { queryKeys } from "@/lib/query-keys";
import type {
    INotificationPreferences,
    IPushSubscriptionDto,
    IUpdateNotificationPreferencesDto,
    IVapidPublicKeyResponse,
} from "@/types/notifications/notifications.type";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useNotificationPreferencesQuery = (enabled: boolean = true) =>
    useQuery<INotificationPreferences>({
        queryKey: queryKeys.notifications.preferences(),
        queryFn: getNotificationPreferences,
        enabled,
    });

export const useVapidPublicKeyQuery = (enabled: boolean = true) =>
    useQuery<IVapidPublicKeyResponse>({
        queryKey: queryKeys.notifications.vapidPublicKey(),
        queryFn: getVapidPublicKey,
        enabled,
        // VAPID key is effectively static — don't refetch it aggressively.
        staleTime: Infinity,
    });

export const useCreatePushSubscriptionMutation = () => {
    const queryClient = useQueryClient();

    return useMutation<void, Error, IPushSubscriptionDto>({
        mutationFn: createPushSubscription,
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.notifications.preferences(),
            });
        },
    });
};

export const useDeletePushSubscriptionMutation = () => {
    const queryClient = useQueryClient();

    return useMutation<void, Error, string>({
        mutationFn: deletePushSubscription,
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.notifications.preferences(),
            });
        },
    });
};

export const useUpdateNotificationPreferencesMutation = () => {
    const queryClient = useQueryClient();

    return useMutation<
        INotificationPreferences,
        Error,
        IUpdateNotificationPreferencesDto
    >({
        mutationFn: updateNotificationPreferences,
        onSuccess: (prefs) => {
            queryClient.setQueryData(
                queryKeys.notifications.preferences(),
                prefs,
            );
        },
    });
};
