"use client";

import ConfirmDialog from "@/components/common/confirm-dialog/confirm-dialog";
import { EmptyState, ErrorState, Skeleton } from "@/components/common/states";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api-error";
import { accountActions, formatDate, formatRelative, userLabel } from "@/lib/admin/users";
import { adminErrorMessages } from "@/lib/admin-path/errors";
import {
    useAdminUserQuery,
    useRevokeAdminUserSessionsMutation,
    useSetAdminUserRolesMutation,
    useSetAdminUserStatusMutation,
} from "@/queries/admin-users.query";
import { useAppSelector } from "@/store/hooks";
import type { AdminUserDetail as AdminUser } from "@/types/admin-users/admin-users.type";
import { ArrowLeft, Ban, Copy, LogOut, ShieldCheck, ShieldOff, UserCheck, UserX } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { UserIdentity, UserRoleBadges, UserStatusBadge } from "./user-badges";

/** /admin/users/[id]: one account, and what an admin may change about it. */
export function AdminUserDetail({ userLoginId }: Readonly<{ userLoginId: string }>) {
    const { data, isFetching, error, refetch } = useAdminUserQuery(userLoginId);

    let body: React.ReactNode;
    if (!data && isFetching) {
        body = (
            <div aria-busy className="space-y-4">
                <Skeleton className="h-20 w-full rounded-2xl" />
                <Skeleton className="h-48 w-full rounded-2xl" />
            </div>
        );
    } else if (!data && error instanceof ApiError && (error.status === 404 || error.status === 400)) {
        body = <EmptyState icon={UserX} title="No such user" description="The account may have been deleted." />;
    } else if (!data) {
        body = <ErrorState message="Couldn't load this user." onRetry={() => void refetch()} />;
    } else {
        body = <AccountView user={data} />;
    }

    return (
        <div className="space-y-6">
            <Link
                href="/admin/users"
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
                <ArrowLeft className="h-4 w-4" />
                Users
            </Link>
            {body}
        </div>
    );
}

type Pending = "grant" | "revoke" | "suspend" | "reactivate" | "signout" | null;

function AccountView({ user }: Readonly<{ user: AdminUser }>) {
    const selfId = useAppSelector((state) => state.user.profile?.userLoginId);
    const actions = accountActions(user, selfId);
    const [pending, setPending] = useState<Pending>(null);
    const roles = useSetAdminUserRolesMutation();
    const status = useSetAdminUserStatusMutation();
    const signOut = useRevokeAdminUserSessionsMutation();
    const name = userLabel(user);

    const onError = (error: unknown) => toast.error(adminErrorMessages(error)[0]);
    const close = () => setPending(null);

    const confirm = () => {
        switch (pending) {
            case "grant":
            case "revoke":
                roles.mutate(
                    { userLoginId: user.userLoginId, roles: pending === "grant" ? ["admin"] : [] },
                    {
                        onSuccess: () =>
                            toast.success(pending === "grant" ? `${name} is now an admin` : `${name} is no longer an admin`),
                        onError,
                        onSettled: close,
                    },
                );
                break;
            case "suspend":
            case "reactivate":
                status.mutate(
                    { userLoginId: user.userLoginId, status: pending === "suspend" ? "suspended" : "active" },
                    {
                        onSuccess: () => toast.success(pending === "suspend" ? `${name} is suspended` : `${name} can sign in again`),
                        onError,
                        onSettled: close,
                    },
                );
                break;
            case "signout":
                signOut.mutate(user.userLoginId, {
                    onSuccess: ({ sessionsEnded }) =>
                        toast.success(`Signed out of ${sessionsEnded} ${sessionsEnded === 1 ? "device" : "devices"}`),
                    onError,
                    onSettled: close,
                });
                break;
        }
    };

    const dialog = pending ? DIALOGS[pending](name, actions.adminComesBack) : null;

    return (
        <div className="space-y-6">
            <header className="flex flex-wrap items-center justify-between gap-4">
                <UserIdentity user={user} size="lg" />
                <span className="flex flex-wrap items-center gap-2">
                    <UserStatusBadge status={user.status} />
                    <UserRoleBadges user={user} />
                </span>
            </header>

            <section className="rounded-2xl border border-border/80 bg-card p-5">
                <h2 className="mb-4 font-semibold">Account</h2>
                <dl className="grid gap-x-6 gap-y-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
                    <Fact label="User ID">
                        <button
                            type="button"
                            className="inline-flex max-w-full items-center gap-1.5 font-mono text-xs hover:text-primary"
                            onClick={() => {
                                void navigator.clipboard?.writeText(user.userLoginId);
                                toast.success("User ID copied");
                            }}
                        >
                            <span className="truncate">{user.userLoginId}</span>
                            <Copy className="h-3.5 w-3.5 shrink-0" />
                        </button>
                    </Fact>
                    <Fact label="Signs in with">
                        <span className="capitalize">{user.provider}</span>
                    </Fact>
                    <Fact label="Joined">{formatDate(user.createdAt)}</Fact>
                    <Fact label="Last signed in">
                        {/* From refresh tokens, which sign-outs and suspension delete. */}
                        {user.lastSeenAt ? (
                            <span title={user.lastSeenAt}>{formatRelative(user.lastSeenAt)}</span>
                        ) : (
                            <span className="text-muted-foreground">No live session</span>
                        )}
                    </Fact>
                    <Fact label="Signed-in devices">{user.activeSessions}</Fact>
                </dl>
            </section>

            <section className="rounded-2xl border border-border/80 bg-card p-5">
                <h2 className="font-semibold">Access</h2>
                {actions.isSelf ? (
                    <p className="mt-2 text-sm text-muted-foreground">
                        This is your own account. Admins can&apos;t change their own role or status here, so nobody locks
                        themselves out by accident.
                    </p>
                ) : (
                    <div className="mt-4 space-y-4">
                        <ActionRow
                            title={actions.isAdmin ? "Admin" : "Learner"}
                            description={
                                actions.adminComesBack
                                    ? "Listed in ADMIN_EMAILS: removing admin only lasts until their next sign-in."
                                    : actions.isAdmin
                                      ? "Can open this admin area and edit content."
                                      : "Can learn, but can't open the admin area."
                            }
                        >
                            {actions.isAdmin ? (
                                <Button variant="outline" onClick={() => setPending("revoke")}>
                                    <ShieldOff className="h-4 w-4" />
                                    Remove admin
                                </Button>
                            ) : (
                                <Button variant="outline" onClick={() => setPending("grant")}>
                                    <ShieldCheck className="h-4 w-4" />
                                    Make admin
                                </Button>
                            )}
                        </ActionRow>
                        <ActionRow
                            title="Sessions"
                            description="Signs the account out on every device. They can sign straight back in."
                        >
                            <Button
                                variant="outline"
                                onClick={() => setPending("signout")}
                                disabled={user.activeSessions === 0}
                            >
                                <LogOut className="h-4 w-4" />
                                Sign out everywhere
                            </Button>
                        </ActionRow>
                        <ActionRow
                            title={actions.isSuspended ? "Suspended" : "Active"}
                            description={
                                actions.isSuspended
                                    ? "Can't sign in. Their learning data is kept."
                                    : "Suspending blocks sign-in within 15 minutes and keeps their learning data."
                            }
                        >
                            {actions.isSuspended ? (
                                <Button variant="outline" onClick={() => setPending("reactivate")}>
                                    <UserCheck className="h-4 w-4" />
                                    Reactivate
                                </Button>
                            ) : (
                                <Button variant="destructive" onClick={() => setPending("suspend")}>
                                    <Ban className="h-4 w-4" />
                                    Suspend
                                </Button>
                            )}
                        </ActionRow>
                    </div>
                )}
            </section>

            {dialog ? (
                <ConfirmDialog
                    isOpen
                    onClose={close}
                    onConfirm={confirm}
                    title={dialog.title}
                    description={dialog.description}
                    confirmText={dialog.confirm}
                    cancelText="Cancel"
                    loadingText="Working…"
                    variant={dialog.destructive ? "destructive" : "default"}
                    isLoading={roles.isPending || status.isPending || signOut.isPending}
                />
            ) : null}
        </div>
    );
}

const DIALOGS: Record<
    Exclude<Pending, null>,
    (name: string, adminComesBack: boolean) => { title: string; description: string; confirm: string; destructive?: boolean }
> = {
    grant: (name) => ({
        title: `Make ${name} an admin?`,
        description: "They'll be able to manage users and edit content once their session refreshes (within 15 minutes).",
        confirm: "Make admin",
    }),
    revoke: (name, comesBack) => ({
        title: `Remove admin from ${name}?`,
        description: comesBack
            ? "They're listed in ADMIN_EMAILS, so they'll get admin back the next time they sign in. Remove them from that list to make this stick."
            : "They'll lose access to the admin area within 15 minutes.",
        confirm: "Remove admin",
        destructive: true,
    }),
    suspend: (name) => ({
        title: `Suspend ${name}?`,
        description:
            "They'll be signed out of every device and can't sign in again until you reactivate them. Their learning data is kept.",
        confirm: "Suspend",
        destructive: true,
    }),
    reactivate: (name) => ({
        title: `Reactivate ${name}?`,
        description: "They'll be able to sign in again.",
        confirm: "Reactivate",
    }),
    signout: (name) => ({
        title: `Sign ${name} out everywhere?`,
        description: "Every device they're signed in on is signed out. They can sign straight back in.",
        confirm: "Sign out",
    }),
};

function Fact({ label, children }: Readonly<{ label: string; children: React.ReactNode }>) {
    return (
        <div className="min-w-0">
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="mt-0.5 font-medium">{children}</dd>
        </div>
    );
}

function ActionRow({
    title,
    description,
    children,
}: Readonly<{ title: string; description: string; children: React.ReactNode }>) {
    return (
        <div className="flex flex-col gap-3 border-t border-border/60 pt-4 first:border-t-0 first:pt-0 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
                <p className="text-sm font-medium">{title}</p>
                <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            <div className="shrink-0">{children}</div>
        </div>
    );
}
