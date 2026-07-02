import { request } from "@/lib/axios";

export const logout = (isLoggedOutFromAllDevices?: boolean): Promise<{ success: boolean }> =>
    request((i) => i.post('/auth/logout', { isLoggedOutFromAllDevices }));
