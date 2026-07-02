import { request } from "@/lib/axios";
import type { IUserLevel } from "@/types/user-level/user-level.type";

/** Fetch the current user's learning level (numeric level, rank, XP progress). */
export const getUserLevel = (): Promise<IUserLevel> =>
    request((i) => i.get("/user-level"));
