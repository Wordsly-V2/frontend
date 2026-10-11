"use client";

import ConfirmDialog from "@/components/common/confirm-dialog/confirm-dialog";
import { EmptyState, ErrorState, Skeleton } from "@/components/common/states";
import { FilterToggle } from "@/components/features/admin/filter-toggle";
import { DetailSection, Fact, Facts } from "@/components/features/admin-users/detail-parts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    FIELD_LABELS,
    fieldList,
    isActiveJob,
    ITEM_STATUS_BADGES,
    ITEM_STATUS_FILTERS,
    ITEM_STATUS_LABELS,
    JOB_STATUS_BADGES,
    JOB_STATUS_LABELS,
    jobSummary,
    reasonLabel,
    retryableCount,
    scopeHref,
} from "@/lib/admin/dictionary-sync";
import { formatRelative } from "@/lib/admin/users";
import { countOf } from "@/lib/admin/vocabulary";
import { adminErrorMessages } from "@/lib/admin-path/errors";
import { ApiError } from "@/lib/api-error";
import {
    useCancelSyncMutation,
    useRetrySyncMutation,
    useSyncItemsQuery,
    useSyncJobQuery,
} from "@/queries/admin-dictionary-sync.query";
import type { SyncItemStatus, SyncJob } from "@/types/admin-dictionary-sync/admin-dictionary-sync.type";
import { ArrowLeft, ChevronLeft, ChevronRight, RefreshCw, RotateCcw, Square } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { SyncProgressBar } from "./sync-progress";

const back = (
    <Link
        href="/admin/vocabulary/sync"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
    >
        <ArrowLeft className="h-4 w-4" />
        All syncs
    </Link>
);

/** `/admin/vocabulary/sync/[id]`: one run, live while it runs, and what happened to each word. */
export function SyncRunDetail({ jobId }: Readonly<{ jobId: string }>) {
    const router = useRouter();
    const { data: job, isFetching, error, refetch } = useSyncJobQuery(jobId);
    const [confirmCancel, setConfirmCancel] = useState(false);
    const cancel = useCancelSyncMutation();
    const retry = useRetrySyncMutation();

    if (!job && isFetching) return <Skeleton aria-busy className="h-64 w-full rounded-2xl" />;
    if (!job) {
        const gone = error instanceof ApiError && (error.status === 404 || error.status === 400);
        return (
            <div className="space-y-4">
                {back}
                {gone ? (
                    <EmptyState icon={RefreshCw} title="No such sync" description="Check the link." />
                ) : (
                    <ErrorState message="Couldn't load this sync." onRetry={() => void refetch()} />
                )}
            </div>
        );
    }

    const active = isActiveJob(job);
    const retryable = retryableCount(job);
    const target = scopeHref(job);
    const onError = (err: unknown) => toast.error(adminErrorMessages(err)[0]);

    return (
        <div className="space-y-6">
            {back}

            <header className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                    <h1 className="min-w-0 break-words text-2xl font-bold">{job.scopeLabel}</h1>
                    <Badge variant={JOB_STATUS_BADGES[job.status]}>{JOB_STATUS_LABELS[job.status]}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{statusLine(job)}</p>
            </header>

            <DetailSection title="Progress">
                <div className="space-y-2">
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                        <span className="font-medium">{jobSummary(job)}</span>
                        <span className="tabular-nums text-muted-foreground">{job.percent}%</span>
                    </div>
                    <SyncProgressBar percent={job.percent} label="Sync progress" />
                </div>
                <div className="mt-5">
                    <Facts>
                        <Fact label="Fields">{fieldList(job.fields)}</Fact>
                        <Fact label="Existing values">{job.mode === "overwrite" ? "Replaced" : "Kept"}</Fact>
                        <Fact label="Started">{formatRelative(job.startedAt)}</Fact>
                        <Fact label="Finished">{job.finishedAt ? formatRelative(job.finishedAt) : "Not yet"}</Fact>
                        {target ? (
                            <Fact label={job.scope === "retry" ? "Retry of" : "Learner"}>
                                <Link href={target} className="text-primary hover:underline">
                                    {job.scope === "retry" ? "The earlier sync" : "Their vocabulary"}
                                </Link>
                            </Fact>
                        ) : null}
                    </Facts>
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                    {active ? (
                        <Button variant="outline" onClick={() => setConfirmCancel(true)}>
                            <Square className="h-4 w-4" />
                            Stop
                        </Button>
                    ) : null}
                    {retryable > 0 ? (
                        <Button
                            onClick={() =>
                                retry.mutate(
                                    { jobId },
                                    {
                                        onSuccess: (next) => {
                                            toast.success(`Retrying ${countOf(next.total, "word")}`);
                                            router.push(`/admin/vocabulary/sync/${next.id}`);
                                        },
                                        onError,
                                    },
                                )
                            }
                            disabled={retry.isPending}
                        >
                            <RotateCcw className="h-4 w-4" />
                            Retry {countOf(retryable, "word")}
                        </Button>
                    ) : null}
                </div>
            </DetailSection>

            <SyncItemsSection jobId={jobId} live={active} />

            <ConfirmDialog
                isOpen={confirmCancel}
                onClose={() => setConfirmCancel(false)}
                title="Stop this sync?"
                description="Words already done keep their new data. The rest stay as they are; you can retry them later."
                confirmText="Stop sync"
                cancelText="Keep running"
                loadingText="Stopping…"
                isLoading={cancel.isPending}
                onConfirm={() =>
                    cancel.mutate(
                        { jobId },
                        {
                            onSuccess: () => toast.success("Sync stopped"),
                            onError,
                            onSettled: () => setConfirmCancel(false),
                        },
                    )
                }
            />
        </div>
    );
}

function statusLine(job: SyncJob): string {
    switch (job.status) {
        case "running":
            return "Running in the background. This page updates by itself.";
        case "completed":
            return "Done. Every word was checked against Langeek.";
        case "cancelled":
            return "Stopped before the end. Words not reached kept their data.";
        case "failed":
            return "Couldn't be queued. Nothing was changed; start it again.";
    }
}

const ITEMS_PAGE_SIZE = 25;

function SyncItemsSection({ jobId, live }: Readonly<{ jobId: string; live: boolean }>) {
    const [status, setStatus] = useState<SyncItemStatus | null>(null);
    const [page, setPage] = useState(1);
    const { data, isFetching, refetch } = useSyncItemsQuery(
        jobId,
        { page, limit: ITEMS_PAGE_SIZE, status: status ?? undefined },
        live,
    );

    return (
        <DetailSection title="Words" description="Most recent first. Waiting words haven't been reached yet.">
            <div className="mb-4 overflow-x-auto">
                <div className="w-max">
                    <FilterToggle
                        label="Word status"
                        value={status}
                        options={ITEM_STATUS_FILTERS}
                        onChange={(value) => {
                            setStatus(value);
                            setPage(1);
                        }}
                    />
                </div>
            </div>
            {!data && isFetching ? (
                <Skeleton aria-busy className="h-40 w-full rounded-xl" />
            ) : !data ? (
                <ErrorState message="Couldn't load the words." onRetry={() => void refetch()} />
            ) : data.items.length === 0 ? (
                <p className="text-sm text-muted-foreground">No words here.</p>
            ) : (
                <ul className="divide-y divide-border/50">
                    {data.items.map((item) => {
                        const reason = reasonLabel(item.reason);
                        return (
                            <li
                                key={item.wordId}
                                className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3"
                            >
                                <div className="min-w-0">
                                    <p className="flex flex-wrap items-baseline gap-x-2">
                                        <span className="font-medium">{item.word}</span>
                                        {item.partOfSpeech ? (
                                            <span className="text-xs text-muted-foreground">{item.partOfSpeech}</span>
                                        ) : null}
                                    </p>
                                    {item.changedFields.length > 0 ? (
                                        <p className="text-sm text-muted-foreground">
                                            {item.changedFields.map((field) => FIELD_LABELS[field]).join(", ")}
                                        </p>
                                    ) : reason ? (
                                        <p className="break-words text-sm text-muted-foreground">{reason}</p>
                                    ) : null}
                                </div>
                                <span className="flex shrink-0 items-center gap-2">
                                    {item.processedAt ? (
                                        <span className="text-xs text-muted-foreground">
                                            {formatRelative(item.processedAt)}
                                        </span>
                                    ) : null}
                                    <Badge variant={ITEM_STATUS_BADGES[item.status]}>
                                        {ITEM_STATUS_LABELS[item.status]}
                                    </Badge>
                                </span>
                            </li>
                        );
                    })}
                </ul>
            )}
            {data && data.totalPages > 1 ? (
                <div className="mt-4 flex items-center justify-between gap-2 text-sm">
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
        </DetailSection>
    );
}
