import {
    getDailyHabit,
    recordDailyPractice,
    updateDailyGoal,
} from "@/apis/daily-habit.api";
import {
    cacheDailyHabitLocally,
    emptyLocalDailyHabit,
    localDateString,
} from "@/lib/daily-habit";
import type {
    IDailyHabit,
    IRecordDailyPracticeDto,
    IUpdateDailyGoalDto,
} from "@/types/daily-habit/daily-habit.type";
import { queryKeys } from "@/lib/query-keys";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const dailyHabitQueryKey = (clientDate: string) =>
    queryKeys.dailyHabit.byDate(clientDate);

export const useGetDailyHabitQuery = (enabled = true) => {
    const clientDate = localDateString();

    return useQuery<IDailyHabit>({
        queryKey: dailyHabitQueryKey(clientDate),
        queryFn: async () => {
            const habit = await getDailyHabit(clientDate);
            cacheDailyHabitLocally(habit);
            return habit;
        },
        enabled,
        staleTime: 30_000,
    });
};

export const useRecordDailyPracticeMutation = () => {
    const queryClient = useQueryClient();

    return useMutation<IDailyHabit, Error, IRecordDailyPracticeDto>({
        mutationFn: recordDailyPractice,
        onSuccess: (habit) => {
            cacheDailyHabitLocally(habit);
            queryClient.setQueryData(dailyHabitQueryKey(habit.date), habit);
        },
    });
};

export const useUpdateDailyGoalMutation = () => {
    const queryClient = useQueryClient();
    const clientDate = localDateString();

    return useMutation<IDailyHabit, Error, IUpdateDailyGoalDto>({
        mutationFn: (body) => updateDailyGoal(body, clientDate),
        onSuccess: (habit) => {
            cacheDailyHabitLocally(habit);
            queryClient.setQueryData(dailyHabitQueryKey(habit.date), habit);
        },
    });
};

/** Resolved habit for UI: server data when available, else local cache. */
export function useDailyHabitDisplay() {
    const clientDate = localDateString();
    const { data, isLoading, isError } = useGetDailyHabitQuery();
    const habit = data ?? undefined;

    return {
        clientDate,
        habit,
        isLoading,
        isError,
        goal: data?.goal,
    };
}

export function useDailyHabitWithFallback(): IDailyHabit {
    const { data } = useGetDailyHabitQuery();
    return data ?? emptyLocalDailyHabit();
}
