import { apiPaths } from "@/lib/api-paths";
import { request } from "@/lib/axios";
import type {
    CardSource,
    LearnerOverview,
    LearnerPath,
    LearnerSummary,
    LearningResetResult,
    LearningResetScope,
    PathResetResult,
} from "@/types/admin-learners/admin-learners.type";
import type { IActivityCalendar, ILearningReport, ReportPeriod } from "@/types/learning-report/learning-report.type";

/** Up to `MAX_SUMMARY_IDS` learners in one request (learning-service). */
export const getLearnerSummaries = (ids: string[]): Promise<LearnerSummary[]> =>
    request((i) => i.post(apiPaths.adminLearning.usersSummary(), { ids }));

export const getLearnerOverview = (userLoginId: string): Promise<LearnerOverview> =>
    request((i) => i.get(apiPaths.adminLearning.user(userLoginId)));

/** The same report the learner sees on /progress, for the day `clientDate`. */
export const getLearnerReport = ({
    userLoginId,
    period,
    clientDate,
    offset,
}: {
    userLoginId: string;
    period: ReportPeriod;
    clientDate: string;
    offset: number;
}): Promise<ILearningReport> =>
    request((i) => i.get(apiPaths.adminLearning.userReport(userLoginId), { params: { period, clientDate, offset } }));

export const getLearnerActivityCalendar = ({
    userLoginId,
    clientDate,
}: {
    userLoginId: string;
    clientDate: string;
}): Promise<IActivityCalendar> =>
    request((i) => i.get(apiPaths.adminLearning.userActivityCalendar(userLoginId), { params: { clientDate } }));

/** `source` only goes with the `cards` scope (400 otherwise). */
export const resetLearnerLearning = ({
    userLoginId,
    scope,
    source,
}: {
    userLoginId: string;
    scope: LearningResetScope;
    source?: CardSource;
}): Promise<LearningResetResult> =>
    request((i) => i.post(apiPaths.adminLearning.userReset(userLoginId), { scope, source }));

export const getLearnerPath = (userLoginId: string): Promise<LearnerPath> =>
    request((i) => i.get(apiPaths.adminPath.user(userLoginId)));

/** Un-enrolls and clears Path progress (curriculum-service). Path cards stay in learning-service. */
export const resetLearnerPath = (userLoginId: string): Promise<PathResetResult> =>
    request((i) => i.post(apiPaths.adminPath.userReset(userLoginId)));
