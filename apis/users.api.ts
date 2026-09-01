import { apiPaths } from "@/lib/api-paths";
import { request } from "@/lib/axios";
import { IUserProfile } from "@/types/users/users.type";

export const getUserProfile = (): Promise<IUserProfile> =>
    request((i) => i.get(apiPaths.profile()));
