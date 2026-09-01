import { apiPaths } from "@/lib/api-paths";
import { request } from "@/lib/axios";

export const logout = (isLoggedOutFromAllDevices?: boolean): Promise<{ success: boolean }> =>
    request((i) => i.post(apiPaths.auth.logout(), { isLoggedOutFromAllDevices }));
