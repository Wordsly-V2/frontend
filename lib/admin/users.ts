import type { AdminUserSummary } from "@/types/admin-users/admin-users.type";

/** What an admin may do to an account from the Account tab. */
export interface AccountActions {
    /** The server refuses every change to your own account (409); hide them. */
    isSelf: boolean;
    isAdmin: boolean;
    isSuspended: boolean;
    /** Revoking admin from an ADMIN_EMAILS user only lasts until they sign in. */
    adminComesBack: boolean;
}

export function accountActions(
    user: Pick<AdminUserSummary, "userLoginId" | "roles" | "status" | "bootstrapAdmin">,
    selfId: string | undefined,
): AccountActions {
    const isAdmin = user.roles.includes("admin");
    return {
        isSelf: user.userLoginId === selfId,
        isAdmin,
        isSuspended: user.status !== "active",
        adminComesBack: isAdmin && user.bootstrapAdmin,
    };
}

/** The name to show for an account, falling back to its email, then its id. */
export function userLabel(user: Pick<AdminUserSummary, "displayName" | "email" | "userLoginId">): string {
    return user.displayName?.trim() || user.email || user.userLoginId.slice(0, 8);
}

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 365 * 86_400_000],
    ["month", 30 * 86_400_000],
    ["week", 7 * 86_400_000],
    ["day", 86_400_000],
    ["hour", 3_600_000],
    ["minute", 60_000],
];

/** "3 days ago", "just now"; `null` reads as "Never". */
export function formatRelative(iso: string | null, now: Date = new Date()): string {
    if (!iso) return "Never";
    const diff = new Date(iso).getTime() - now.getTime();
    const format = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
    for (const [unit, ms] of UNITS) {
        if (Math.abs(diff) >= ms) return format.format(Math.round(diff / ms), unit);
    }
    return "just now";
}

/** "26 Sep 2026" in the viewer's zone. */
export function formatDate(iso: string): string {
    return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(
        new Date(iso),
    );
}

/** Total pages for a list, never less than 1. */
export function totalPages(total: number, pageSize: number): number {
    return Math.max(1, Math.ceil(total / Math.max(1, pageSize)));
}
