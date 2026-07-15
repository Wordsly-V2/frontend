import {
    getLearningSettings,
    updateLearningSettings,
} from "@/apis/learning-settings.api";
import { queryKeys } from "@/lib/query-keys";
import type {
    ILearningSettings,
    IUpdateLearningSettingsDto,
} from "@/types/learning-settings/learning-settings.type";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useGetLearningSettingsQuery = (enabled: boolean = true) =>
    useQuery<ILearningSettings>({
        queryKey: queryKeys.learningSettings.all,
        queryFn: getLearningSettings,
        enabled,
    });

export const useUpdateLearningSettingsMutation = () => {
    const queryClient = useQueryClient();

    return useMutation<ILearningSettings, Error, IUpdateLearningSettingsDto>({
        mutationFn: updateLearningSettings,
        onSuccess: () => {
            // New daily limits change today's pacing, so refresh the settings and
            // the due-word-id queues (which carry the pacing snapshot).
            queryClient.invalidateQueries({ queryKey: queryKeys.learningSettings.all });
            queryClient.invalidateQueries({ queryKey: queryKeys.dueWordIds.all });
        },
    });
};
