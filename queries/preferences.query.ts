import { getPreferences, updatePreferences } from "@/apis/preferences.api";
import { queryKeys } from "@/lib/query-keys";
import type {
    IAppPreferences,
    IPreferencesResponse,
} from "@/types/preferences/preferences.type";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useGetPreferencesQuery = (enabled: boolean = true) =>
    useQuery<IPreferencesResponse>({
        queryKey: queryKeys.preferences.all,
        queryFn: getPreferences,
        enabled,
    });

export const useUpdatePreferencesMutation = () => {
    const queryClient = useQueryClient();

    return useMutation<IPreferencesResponse, Error, IAppPreferences>({
        mutationFn: updatePreferences,
        onSuccess: (data) => {
            // The server returns the merged blob — seed the cache so a later
            // refocus/refetch reconciles against the freshest known state.
            queryClient.setQueryData(queryKeys.preferences.all, data);
        },
    });
};
