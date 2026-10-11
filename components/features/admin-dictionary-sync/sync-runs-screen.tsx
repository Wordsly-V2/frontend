"use client";

import { EmptyState, ErrorState, Skeleton } from "@/components/common/states";
import { FilterToggle } from "@/components/features/admin/filter-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    fieldList,
    isActiveJob,
    JOB_STATUS_BADGES,
    JOB_STATUS_FILTERS,
    JOB_STATUS_LABELS,
    jobSummary,
    MODE_LABELS,
} from "@/lib/admin/dictionary-sync";
import { formatRelative } from "@/lib/admin/users";
import { useSyncJobsQuery } from "@/queries/admin-dictionary-sync.query";
import type { SyncJobStatus } from "@/types/admin-dictionary-sync/admin-dictionary-sync.type";
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { SyncWithLangeekButton } from "./start-sync-dialog";
import { SyncProgressBar } from "./sync-progress";

const PAGE_SIZE = 20;

/** `/admin/vocabulary/sync`: Langeek sync runs, newest first, live while one runs. */
export function SyncRunsScreen() {
    const [status, setStatus] = useState<SyncJobStatus | null>(null);
    const [page, setPage] = useState(1);
    const { data, isFetching, refetch } = useSyncJobsQuery({ page, limit: PAGE_SIZE, status: status ?? undefined });
    const running = data?.items.some(isActiveJob) ?? false;

    return (
        <div className="space-y-5">
            <header className="flex flex-wrap items-end justify-between gap-3">
                <div className="max-w-xl">
                    <h1 className="text-2xl font-bold">Langeek sync</h1>
                    <p className="text-sm text-muted-foreground">
                        Fill images, meanings, examples, pronunciation and levels from Langeek. One sync runs at a time,
                        in the background.
                    </p>
                </div>
                <SyncWithLangeekButton variant="default" disabled={running}>
                    New sync
                </SyncWithLangeekButton>
            </header>

            <div className="overflow-x-auto">
                <div className="w-max">
                    <FilterToggle
                        label="Status"
                        value={status}
                        options={JOB_STATUS_FILTERS}
                        onChange={(value) => {
                            setStatus(value);
                            setPage(1);
                        }}
                    />
                </div>
            </div>

            {!data && isFetching ? (
                <Skeleton aria-busy className="h-64 w-full rounded-2xl" />
            ) : !data ? (
                <ErrorState message="Couldn't load sync runs." onRetry={() => void refetch()} />
            ) : data.items.length === 0 ? (
                <EmptyState
                    icon={RefreshCw}
                    title={status ? "No run matches" : "No syncs yet"}
                    description={status ? "Try another status." : "Start one to fill missing word data from Langeek."}
                />
            ) : (
                <section className="rounded-2xl border border-border/80 bg-card">
                    <ul className="divide-y divide-border/60">
                        {data.items.map((job) => (
                            <li key={job.id}>
                                <Link
                                    href={`/admin/vocabulary/sync/${job.id}`}
                                    className="flex items-center justify-between gap-3 px-5 py-4 hover:text-primary"
                                >
                                    <span className="min-w-0 flex-1 space-y-1.5">
                                        <span className="flex flex-wrap items-center gap-2">
                                            <span className="min-w-0 truncate font-medium">{job.scopeLabel}</span>
                                            <Badge variant={JOB_STATUS_BADGES[job.status]}>
                                                {JOB_STATUS_LABELS[job.status]}
                                                {isActiveJob(job) ? ` ${job.percent}%` : ""}
                                            </Badge>
                                        </span>
                                        {isActiveJob(job) ? (
                                            <SyncProgressBar
                                                percent={job.percent}
                                                label={`${job.scopeLabel} progress`}
                                            />
                                        ) : null}
                                        <span className="block text-sm text-muted-foreground">{jobSummary(job)}</span>
                                        <span className="block text-xs text-muted-foreground">
                                            {fieldList(job.fields)} · {MODE_LABELS[job.mode]} · started{" "}
                                            {formatRelative(job.startedAt)}
                                        </span>
                                    </span>
                                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                                </Link>
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {data && data.totalPages > 1 ? (
                <div className="flex items-center justify-between gap-2 text-sm">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                    </Button>
                    <span className="text-muted-foreground">
                        Page {data.currentPage} of {data.totalPages}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={page >= data.totalPages}
                        onClick={() => setPage(page + 1)}
                    >
                        Next
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            ) : null}
        </div>
    );
}
