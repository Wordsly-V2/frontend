"use client";

import ConfirmDialog from "@/components/common/confirm-dialog/confirm-dialog";
import { EmptyState, ErrorState, Skeleton } from "@/components/common/states";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api-error";
import { accountActions, formatDate, formatRelative, userLabel } from "@/lib/admin/users";
import { adminErrorMessages } from "@/lib/admin-path/errors";
import {
    useAdminUserQuery,
    useDeleteAdminUserMutation,
    useRevokeAdminUserSessionsMutation,
    useSetAdminUserRolesMutation,
    useSetAdminUserStatusMutation,
} from "@/queries/admin-users.query";
import { useAppSelector } from "@/store/hooks";
import type { AdminUserDetail as AdminUser } from "@/types/admin-users/admin-users.type";
import { FilterToggle } from "@/components/features/admin/filter-toggle";
import { adminUserSearchParams, type AdminUserTab } from "@/lib/search-params/admin-user";
import { ArrowLeft, Ban, Copy, LogOut, ShieldCheck, ShieldOff, Trash2, UserCheck, UserX } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryStates } from "nuqs";
import { useState } from "react";
import { toast } from "sonner";
import { DeleteAccountDialog } from "./delete-account-dialog";
import { ActionRow, Fact } from "./detail-parts";
import { LearnerLearningTab } from "./learner-learning-tab";
import { LearnerPathTab } from "./learner-path-tab";
import { UserIdentity, UserRoleBadges, UserStatusBadge } from "./user-badges";

const TAB_OPTIONS = [
    { value: "account", label: "Account" },
    { value: "learning", label: "Learning" },
    { value: "path", label: "Wordsly Path" },
] as const satisfies readonly { value: AdminUserTab; label: string }[];

/** /admin/users/[id]: one account, their learning and Path, and what an admin may change. */
export function AdminUserDetail({ userLoginId }: Readonly<{ userLoginId: string }>) {
    const { data, isFetching, error, refetch } = useAdminUserQuery(userLoginId);
    const [{ tab }, setParams] = useQueryStates(adminUserSearchParams, { history: "push" });

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
        body = (
            <div className="space-y-6">
                <header className="flex flex-wrap items-center justify-between gap-4">
                    <UserIdentity user={data} size="lg" />
                    <span className="flex flex-wrap items-center gap-2">
                        <UserStatusBadge status={data.status} />
                        <UserRoleBadges user={data} />
                    </span>
                </header>
                <div className="overflow-x-auto">
                    <div className="w-max">
                        <FilterToggle
                            label="Section"
                            value={tab}
                            options={TAB_OPTIONS}
                            onChange={(value) => void setParams({ tab: value ?? "account" })}
                        />
                    </div>
                </div>
                {tab === "account" && <AccountView user={data} />}
                {tab === "learning" && <LearnerLearningTab userLoginId={userLoginId} name={userLabel(data)} />}
                {tab === "path" && <LearnerPathTab userLoginId={userLoginId} name={userLabel(data)} />}
            </div>
        );
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

type Pending = "grant" | "revoke" | "suspend" | "reactivate" | "signout" | "delete" | null;

function AccountView({ user }: Readonly<{ user: AdminUser }>) {
    const selfId = useAppSelector((state) => state.user.profile?.userLoginId);
    const actions = accountActions(user, selfId);
    const [pending, setPending] = useState<Pending>(null);
    const roles = useSetAdminUserRolesMutation();
    const status = useSetAdminUserStatusMutation();
    const signOut = useRevokeAdminUserSessionsMutation();
    const remove = useDeleteAdminUserMutation();
    const router = useRouter();
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
            case "delete":
                remove.mutate(user.userLoginId, {
                    onSuccess: ({ eventPublished }) => {
                        if (eventPublished) {
                            toast.success(`${name} was deleted`, {
                                description: "Their courses, progress and Path data are being removed.",
                            });
                        } else {
                            toast.warning(`${name} was deleted`, {
                                description:
                                    "Their learning data will be removed once the message queue is reachable again. Nothing is lost.",
                            });
                        }
                        router.push("/admin/users");
                    },
                    onError: (error) => {
                        onError(error);
                        close();
                    },
                });
                break;
        }
    };

    const dialog = pending && pending !== "delete" ? DIALOGS[pending](name, actions.adminComesBack) : null;

    return (
        <div className="space-y-6">
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

            {actions.isSelf ? null : (
                <section className="rounded-2xl border border-destructive/40 bg-card p-5">
                    <h2 className="font-semibold text-destructive">Danger zone</h2>
                    <div className="mt-4">
                        <ActionRow
                            title="Delete account"
                            description="Deletes the account and all their learning data in every part of Wordsly. This can't be undone."
                        >
                            <Button variant="destructive" onClick={() => setPending("delete")}>
                                <Trash2 className="h-4 w-4" />
                                Delete account
                            </Button>
                        </ActionRow>
                    </div>
                </section>
            )}

            {pending === "delete" ? (
                <DeleteAccountDialog
                    user={user}
                    name={name}
                    onClose={close}
                    onConfirm={confirm}
                    isLoading={remove.isPending}
                />
            ) : null}

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
    Exclude<Pending, null | "delete">,
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
