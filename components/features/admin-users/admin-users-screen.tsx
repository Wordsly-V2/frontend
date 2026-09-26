"use client";

import { FilterToggle } from "@/components/features/admin/filter-toggle";
import { EmptyState, ErrorState, Skeleton } from "@/components/common/states";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAdminUsersParams } from "@/hooks/useAdminUsersParams.hook";
import { formatDate, totalPages } from "@/lib/admin/users";
import { cn } from "@/lib/utils";
import { useAdminUsersQuery } from "@/queries/admin-users.query";
import type { AssignableRole, UserStatus } from "@/types/admin-users/admin-users.type";
import { Search, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserIdentity, UserRoleBadges, UserStatusBadge } from "./user-badges";

const PAGE_SIZE = 20;

const ROLE_OPTIONS = [
    { value: null, label: "Everyone" },
    { value: "admin", label: "Admins" },
] as const satisfies readonly { value: AssignableRole | null; label: string }[];

const STATUS_OPTIONS = [
    { value: null, label: "Any status" },
    { value: "active", label: "Active" },
    { value: "suspended", label: "Suspended" },
] as const satisfies readonly { value: UserStatus | null; label: string }[];

/** /admin/users: find an account, then open it. */
export function AdminUsersScreen() {
    const router = useRouter();
    const params = useAdminUsersParams();
    const { data, isFetching, refetch } = useAdminUsersQuery({
        q: params.q || undefined,
        role: params.role ?? undefined,
        status: params.status ?? undefined,
        page: params.page,
        pageSize: PAGE_SIZE,
    });
    const filtered = !!(params.q || params.role || params.status);

    return (
        <div className="space-y-5">
            <header className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold">Users</h1>
                    <p className="text-sm text-muted-foreground">
                        {data ? `${data.total} ${data.total === 1 ? "account" : "accounts"}` : "Everyone who signed in"}
                        {filtered ? " match" : ""}
                    </p>
                </div>
            </header>

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        type="search"
                        value={params.searchInput}
                        onChange={(event) => params.setSearchInput(event.target.value)}
                        placeholder="Search by name or email…"
                        aria-label="Search users"
                        className="pl-9"
                    />
                </div>
                <div className="flex flex-wrap gap-2">
                    <FilterToggle label="Role" value={params.role} options={ROLE_OPTIONS} onChange={params.setRole} />
                    <FilterToggle
                        label="Status"
                        value={params.status}
                        options={STATUS_OPTIONS}
                        onChange={params.setStatus}
                    />
                </div>
            </div>

            {!data && isFetching ? (
                <div aria-busy className="space-y-2">
                    {Array.from({ length: 6 }, (_, i) => (
                        <Skeleton key={i} className="h-14 w-full rounded-xl" />
                    ))}
                </div>
            ) : !data ? (
                <ErrorState message="Couldn't load users." onRetry={() => void refetch()} />
            ) : data.items.length === 0 ? (
                <EmptyState
                    icon={Users}
                    title={filtered ? "No one matches" : "No users yet"}
                    description={filtered ? "Try another name, or clear the filters." : "Accounts appear here after their first sign-in."}
                />
            ) : (
                <div className={cn("space-y-4 transition-opacity", isFetching && "opacity-60")}>
                    <div className="hidden overflow-hidden rounded-2xl border border-border/80 bg-card md:block">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="pl-4">User</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead className="text-right">Devices</TableHead>
                                    <TableHead className="pr-4 text-right">Joined</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.items.map((user) => (
                                    <TableRow
                                        key={user.userLoginId}
                                        className="cursor-pointer"
                                        onClick={() => router.push(`/admin/users/${user.userLoginId}`)}
                                    >
                                        <TableCell className="max-w-72 pl-4">
                                            <Link
                                                href={`/admin/users/${user.userLoginId}`}
                                                onClick={(event) => event.stopPropagation()}
                                                className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                            >
                                                <UserIdentity user={user} />
                                            </Link>
                                        </TableCell>
                                        <TableCell>
                                            <UserStatusBadge status={user.status} />
                                        </TableCell>
                                        <TableCell>
                                            <UserRoleBadges user={user} />
                                        </TableCell>
                                        <TableCell className="text-right tabular-nums">{user.activeSessions}</TableCell>
                                        <TableCell className="pr-4 text-right text-muted-foreground">
                                            {formatDate(user.createdAt)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    <ul className="space-y-2 md:hidden">
                        {data.items.map((user) => (
                            <li key={user.userLoginId}>
                                <Link
                                    href={`/admin/users/${user.userLoginId}`}
                                    className="block rounded-2xl border border-border/80 bg-card p-4 active:bg-muted/50"
                                >
                                    <UserIdentity user={user} />
                                    <span className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                                        <UserStatusBadge status={user.status} />
                                        <UserRoleBadges user={user} />
                                        <span className="ml-auto text-muted-foreground">
                                            Joined {formatDate(user.createdAt)}
                                        </span>
                                    </span>
                                </Link>
                            </li>
                        ))}
                    </ul>

                    <Pagination
                        currentPage={data.page}
                        totalPages={totalPages(data.total, data.pageSize)}
                        onPageChange={params.setPage}
                        label="Users pagination"
                    />
                </div>
            )}
        </div>
    );
}
