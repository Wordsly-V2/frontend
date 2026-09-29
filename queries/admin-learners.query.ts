import {
    getLearnerActivityCalendar,
    getLearnerOverview,
    getLearnerPath,
    getLearnerReport,
    getLearnerSummaries,
    resetLearnerLearning,
    resetLearnerPath,
} from "@/apis/admin-learners.api";
import { localDateString } from "@/lib/daily-habit";
import { queryKeys } from "@/lib/query-keys";
import type { ReportPeriod } from "@/types/learning-report/learning-report.type";
import { keepPreviousData, useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";

// Learners keep practising while an admin looks; always refetch on visit.
const FRESH = { staleTime: 0 } as const;

/** Streak, level and last active for one page of the users table. */
export const useLearnerSummariesQuery = (ids: string[]) =>
    useQuery({
        queryKey: queryKeys.adminLearners.summary(ids),
        queryFn: () => getLearnerSummaries(ids),
        enabled: ids.length > 0,
        // The next page's columns fill in without the table jumping.
        placeholderData: keepPreviousData,
        ...FRESH,
    });

export const useLearnerOverviewQuery = (userLoginId: string) =>
    useQuery({
        queryKey: queryKeys.adminLearners.overview(userLoginId),
        queryFn: () => getLearnerOverview(userLoginId),
        ...FRESH,
    });

/** Days are the admin's calendar day, as the learner's own /progress uses theirs. */
export const useLearnerReportQuery = (userLoginId: string, period: ReportPeriod, offset: number) => {
    const clientDate = localDateString();
    return useQuery({
        queryKey: queryKeys.adminLearners.report(userLoginId, period, clientDate, offset),
        queryFn: () => getLearnerReport({ userLoginId, period, clientDate, offset }),
        placeholderData: keepPreviousData,
        ...FRESH,
    });
};

export const useLearnerActivityCalendarQuery = (userLoginId: string) => {
    const clientDate = localDateString();
    return useQuery({
        queryKey: queryKeys.adminLearners.activityCalendar(userLoginId, clientDate),
        queryFn: () => getLearnerActivityCalendar({ userLoginId, clientDate }),
        ...FRESH,
    });
};

export const useLearnerPathQuery = (userLoginId: string) =>
    useQuery({
        queryKey: queryKeys.adminLearners.path(userLoginId),
        queryFn: () => getLearnerPath(userLoginId),
        ...FRESH,
    });

/** After a reset: this learner's pages, every users-table summary, and the platform numbers. */
function invalidateLearner(queryClient: QueryClient, userLoginId: string) {
    return Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.adminLearners.user(userLoginId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.adminLearners.summaries() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.adminStats.all }),
    ]);
}

export const useResetLearnerLearningMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: resetLearnerLearning,
        onSuccess: (_result, { userLoginId }) => invalidateLearner(queryClient, userLoginId),
    });
};

/**
 * Un-enroll and clear Path progress; with `withCards`, then also remove the
 * learner's Path cards in learning-service. Two services, so two calls: if the
 * second fails the Path is already reset, and the error says so.
 */
export const useResetLearnerPathMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ userLoginId, withCards }: { userLoginId: string; withCards: boolean }) => {
            const path = await resetLearnerPath(userLoginId);
            if (!withCards) return { path, cards: null };
            try {
                const cards = await resetLearnerLearning({ userLoginId, scope: "cards", source: "path" });
                return { path, cards };
            } catch (error) {
                throw new PathCardsResetError(error);
            }
        },
        // Invalidate on failure too: the first call may have gone through.
        onSettled: (_result, _error, { userLoginId }) => invalidateLearner(queryClient, userLoginId),
    });
};

/** The Path was reset but removing its cards failed. */
export class PathCardsResetError extends Error {
    constructor(readonly cause: unknown) {
        super("The Path was reset, but their Path cards couldn't be removed. Reset the cards from the Learning tab.");
    }
}
