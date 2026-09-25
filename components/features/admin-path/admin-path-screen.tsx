"use client";

import { ErrorState, Skeleton } from "@/components/common/states";
import { OriginBadge, StatusBadge } from "@/components/features/admin-path/admin-badges";
import { PublishDialog } from "@/components/features/admin-path/publish-dialog";
import { ReleasesCard } from "@/components/features/admin-path/releases-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
    useAdminPathOverviewQuery,
    useAdminSeedPlanQuery,
    useAdminValidateQuery,
} from "@/queries/admin-path.query";
import type { AdminUnitNode } from "@/types/admin-path/admin-path.type";
import { AlertTriangle, CheckCircle2, Plus, RefreshCw, Rocket } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

/** /admin/path: the working copy, its health, and releases. */
export function AdminPathScreen() {
    const overview = useAdminPathOverviewQuery();
    const [publishing, setPublishing] = useState(false);

    if (!overview.data && overview.isFetching) {
        return (
            <div aria-busy className="space-y-4">
                <Skeleton className="h-20 w-full rounded-2xl" />
                <Skeleton className="h-64 w-full rounded-2xl" />
            </div>
        );
    }
    if (!overview.data) {
        return <ErrorState message="Couldn't load the content." onRetry={() => void overview.refetch()} />;
    }

    const { stages, totals } = overview.data;

    return (
        <div className="space-y-6">
            <header className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <p className="text-sm font-semibold text-muted-foreground">Admin</p>
                    <h1 className="font-display text-2xl font-bold">Wordsly Path content</h1>
                    <p className="mt-1 flex flex-wrap gap-2 text-sm">
                        <Badge variant="success">{totals.PUBLISHED} live</Badge>
                        <Badge variant="warning">{totals.DRAFT} draft</Badge>
                        <Badge variant="muted">{totals.ARCHIVED} archived</Badge>
                        <Badge variant="outline">{totals.edited + totals.admin} changed here</Badge>
                    </p>
                </div>
                <Button variant="play" onClick={() => setPublishing(true)} className="gap-2">
                    <Rocket className="h-4 w-4" aria-hidden />
                    Publish
                </Button>
            </header>

            <div className="grid gap-4 md:grid-cols-2">
                <ValidationCard />
                <SeedPlanCard />
            </div>

            <section aria-label="Content" className="space-y-6">
                {stages.map((stage) => (
                    <div key={stage.id} className="space-y-2">
                        <h2 className="flex items-center gap-2 font-display text-lg font-bold">
                            {stage.title}
                            <Badge variant="muted">{stage.cefr}</Badge>
                        </h2>
                        {stage.units.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No units yet.</p>
                        ) : (
                            stage.units.map((unit) => <UnitRow key={unit.id} unit={unit} />)
                        )}
                    </div>
                ))}
            </section>

            <ReleasesCard />
            <PublishDialog isOpen={publishing} onClose={() => setPublishing(false)} archivedCount={totals.ARCHIVED} />
        </div>
    );
}

function ValidationCard() {
    const validate = useAdminValidateQuery();
    const data = validate.data;

    return (
        <section className="glass-surface space-y-2 rounded-2xl p-4" aria-label="Validation">
            <div className="flex items-center justify-between gap-2">
                <h2 className="font-semibold">Ready to publish?</h2>
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => void validate.refetch()}
                    disabled={validate.isFetching}
                    aria-label="Check again"
                >
                    <RefreshCw className={cn("h-4 w-4", validate.isFetching && "animate-spin")} aria-hidden />
                </Button>
            </div>
            {!data && <p className="text-sm text-muted-foreground">Checking…</p>}
            {data?.ok && (
                <p className="flex items-center gap-2 text-sm text-[var(--brand-success)]">
                    <CheckCircle2 className="h-4 w-4" aria-hidden /> Everything checks out.
                </p>
            )}
            {data && !data.ok && (
                <>
                    <p className="flex items-center gap-2 text-sm font-semibold text-destructive">
                        <AlertTriangle className="h-4 w-4" aria-hidden />
                        {data.errors.length} problem{data.errors.length === 1 ? "" : "s"} block publishing
                    </p>
                    <ul className="max-h-48 list-disc space-y-1 overflow-y-auto pl-5 text-sm">
                        {data.errors.map((error) => (
                            <li key={error}>{error}</li>
                        ))}
                    </ul>
                </>
            )}
        </section>
    );
}

function SeedPlanCard() {
    const plan = useAdminSeedPlanQuery();
    const data = plan.data;
    const conflicts = data?.changes.filter((c) => c.action === "conflict") ?? [];

    return (
        <section className="glass-surface space-y-2 rounded-2xl p-4" aria-label="Seed files">
            <h2 className="font-semibold">Seed files (content/)</h2>
            {!data && <p className="text-sm text-muted-foreground">Comparing…</p>}
            {data && !data.available && (
                <p className="text-sm text-muted-foreground">The seed files aren&apos;t readable here, so nothing to compare.</p>
            )}
            {data?.available && data.summary && (
                <p className="text-sm text-muted-foreground">
                    The next import would add {data.summary.insert}, update {data.summary.update}
                    {conflicts.length > 0 ? ` and clash on ${conflicts.length}` : ""}.
                </p>
            )}
            {conflicts.length > 0 && (
                <>
                    <p className="text-sm">
                        Both an admin and the seed changed these. The admin version stays until someone merges by hand:
                    </p>
                    <ul className="max-h-40 list-disc space-y-1 overflow-y-auto pl-5 text-sm">
                        {conflicts.map((c) => (
                            <li key={`${c.kind}:${c.slug}`}>
                                <span className="font-mono">{c.kind}:{c.slug}</span>
                            </li>
                        ))}
                    </ul>
                </>
            )}
        </section>
    );
}

function UnitRow({ unit }: Readonly<{ unit: AdminUnitNode }>) {
    return (
        <details className="glass-surface group rounded-2xl">
            <summary className="flex cursor-pointer list-none flex-wrap items-center gap-2 p-4">
                <span className="font-semibold">
                    {unit.order}. {unit.title}
                </span>
                <StatusBadge status={unit.status} />
                <OriginBadge origin={unit.origin} />
                <span className="ml-auto text-xs text-muted-foreground">
                    {unit.lessons.length} lessons · {unit.items.total} items
                    {unit.items.draft > 0 && ` (${unit.items.draft} draft)`} · {unit.dialogueCount} dialogues
                </span>
            </summary>

            <div className="space-y-4 border-t border-border p-4">
                <div>
                    <h3 className="mb-1 text-sm font-semibold">Lessons</h3>
                    <ul className="space-y-1 text-sm">
                        {unit.lessons.map((lesson) => (
                            <li key={lesson.id} className="flex flex-wrap items-center gap-2">
                                <span>
                                    {lesson.order}. {lesson.title}
                                </span>
                                <StatusBadge status={lesson.status} />
                                <OriginBadge origin={lesson.origin} />
                            </li>
                        ))}
                    </ul>
                </div>

                <div>
                    <div className="mb-1 flex items-center justify-between">
                        <h3 className="text-sm font-semibold">Items</h3>
                        <Button size="sm" variant="outline" asChild className="gap-1">
                            <Link href={`/admin/path/item/new?unit=${unit.slug}`}>
                                <Plus className="h-3.5 w-3.5" aria-hidden /> New item
                            </Link>
                        </Button>
                    </div>
                    <ul className="divide-y divide-border text-sm">
                        {unit.itemList.map((item) => (
                            <li key={item.id}>
                                <Link
                                    href={`/admin/path/item/${item.slug}`}
                                    className="flex flex-wrap items-center gap-2 py-1.5 hover:text-primary"
                                >
                                    <span className={cn("font-medium", item.status === "ARCHIVED" && "line-through")}>
                                        {item.text}
                                    </span>
                                    <span className="font-mono text-xs text-muted-foreground">{item.slug}</span>
                                    <Badge variant="muted">{item.type}</Badge>
                                    {item.status !== "PUBLISHED" && <StatusBadge status={item.status} />}
                                    <OriginBadge origin={item.origin} />
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>

                {(unit.dialogues.length > 0 || unit.checkpoint) && (
                    <p className="text-sm text-muted-foreground">
                        Dialogues: {unit.dialogues.map((d) => d.title).join(", ") || "none"}
                        {unit.checkpoint && ` · Unit test: ${unit.checkpoint.slug}`}
                    </p>
                )}
            </div>
        </details>
    );
}
