import { request } from "@/lib/axios";
import { localDateString } from "@/lib/daily-habit";
import type {
    IDailyHabit,
    IRecordDailyPracticeDto,
    IUpdateDailyGoalDto,
} from "@/types/daily-habit/daily-habit.type";

export const getDailyHabit = (clientDate?: string): Promise<IDailyHabit> =>
    request((i) => i.get("/daily-habit", {
        params: { clientDate: clientDate ?? localDateString() },
    }));

export const recordDailyPractice = (
    data: IRecordDailyPracticeDto,
): Promise<IDailyHabit> =>
    request((i) => i.post("/daily-habit/record-practice", data));

export const updateDailyGoal = (
    data: IUpdateDailyGoalDto,
    clientDate?: string,
): Promise<IDailyHabit> =>
    request((i) => i.patch("/daily-habit/goal", data, {
        params: { clientDate: clientDate ?? localDateString() },
    }));
