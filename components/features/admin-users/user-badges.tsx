import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { userLabel } from "@/lib/admin/users";
import type { AdminUserSummary } from "@/types/admin-users/admin-users.type";

export function UserStatusBadge({ status }: Readonly<{ status: string }>) {
    return status === "active" ? (
        <Badge variant="success">Active</Badge>
    ) : (
        <Badge variant="destructive" className="capitalize">
            {status}
        </Badge>
    );
}

/** Admin, with a note when the role comes from ADMIN_EMAILS. */
export function UserRoleBadges({ user }: Readonly<{ user: Pick<AdminUserSummary, "roles" | "bootstrapAdmin"> }>) {
    if (user.roles.length === 0) return <span className="text-muted-foreground">Learner</span>;
    return (
        <span className="flex flex-wrap gap-1">
            {user.roles.map((role) => (
                <Badge key={role} variant="accent" className="capitalize">
                    {role}
                </Badge>
            ))}
            {user.bootstrapAdmin ? (
                <Badge variant="muted" title="Listed in ADMIN_EMAILS: gets admin back at every sign-in">
                    bootstrap
                </Badge>
            ) : null}
        </span>
    );
}

export function UserIdentity({
    user,
    size = "sm",
}: Readonly<{
    user: Pick<AdminUserSummary, "displayName" | "email" | "pictureUrl" | "userLoginId">;
    size?: "sm" | "lg";
}>) {
    const label = userLabel(user);
    return (
        <span className="flex min-w-0 items-center gap-3">
            <Avatar className={size === "lg" ? "h-14 w-14" : "h-9 w-9"}>
                <AvatarImage src={user.pictureUrl ?? undefined} alt="" />
                <AvatarFallback>{label.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="min-w-0">
                <span className={`block truncate font-semibold ${size === "lg" ? "text-xl" : ""}`}>{label}</span>
                {user.email ? <span className="block truncate text-xs text-muted-foreground">{user.email}</span> : null}
            </span>
        </span>
    );
}
