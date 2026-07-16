import { request } from "@/lib/axios";
import type {
    IAppPreferences,
    IPreferencesResponse,
} from "@/types/preferences/preferences.type";

/** Fetch the learner's device-independent preferences blob. */
export const getPreferences = (): Promise<IPreferencesResponse> =>
    request((i) => i.get("/preferences"));

/** Merge a partial preferences patch (last-write-wins per top-level key). */
export const updatePreferences = (
    patch: IAppPreferences,
): Promise<IPreferencesResponse> =>
    request((i) => i.patch("/preferences", { preferences: patch }));
