import type { IUserProfile } from "@/types/users/users.type";

/**
 * Whether to show admin UI. Presentation only: the services decide from the
 * access token's `roles` claim, and a role change reaches the token (and the
 * profile) on the next refresh.
 */
export function isAdmin(profile: IUserProfile | null | undefined): boolean {
    return profile?.roles?.includes("admin") ?? false;
}
