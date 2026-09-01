import { apiPaths } from "@/lib/api-paths";
import { request } from "@/lib/axios";
import { localDateString } from "@/lib/daily-habit";
import type {
    IBatchRecordDailyPracticeDto,
    IDailyHabit,
    IRecordDailyPracticeDto,
    IUpdateDailyGoalDto,
} from "@/types/daily-habit/daily-habit.type";

export const getDailyHabit = (clientDate?: string): Promise<IDailyHabit> =>
    request((i) => i.get(apiPaths.dailyHabit.root(), {
        params: { clientDate: clientDate ?? localDateString() },
    }));

export const recordDailyPractice = (
    data: IRecordDailyPracticeDto,
): Promise<IDailyHabit> =>
    request((i) => i.post(apiPaths.dailyHabit.recordPractice(), data));

/** Flush several offline days at once; see IBatchRecordDailyPracticeDto. */
export const recordDailyPracticeBatch = (
    data: IBatchRecordDailyPracticeDto,
): Promise<IDailyHabit> =>
    request((i) => i.post(apiPaths.dailyHabit.recordPracticeBatch(), data));

export const updateDailyGoal = (
    data: IUpdateDailyGoalDto,
    clientDate?: string,
): Promise<IDailyHabit> =>
    request((i) => i.patch(apiPaths.dailyHabit.goal(), data, {
        params: { clientDate: clientDate ?? localDateString() },
    }));
