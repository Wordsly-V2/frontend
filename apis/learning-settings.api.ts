import { request } from "@/lib/axios";
import type {
    ILearningSettings,
    IUpdateLearningSettingsDto,
} from "@/types/learning-settings/learning-settings.type";

/** Fetch the learner's daily-pacing + leech settings. */
export const getLearningSettings = (): Promise<ILearningSettings> =>
    request((i) => i.get("/learning-settings"));

/** Update daily-pacing + leech settings (partial patch). */
export const updateLearningSettings = (
    dto: IUpdateLearningSettingsDto,
): Promise<ILearningSettings> =>
    request((i) => i.patch("/learning-settings", dto));
