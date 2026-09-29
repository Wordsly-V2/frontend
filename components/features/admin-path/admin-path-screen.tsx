"use client";

import { ErrorState, Skeleton } from "@/components/common/states";
import { OriginBadge, StatusBadge } from "@/components/features/admin-path/admin-badges";
import { PublishDialog } from "@/components/features/admin-path/publish-dialog";
import { ReleasesCard } from "@/components/features/admin-path/releases-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { adminErrorMessages } from "@/lib/admin-path/errors";
import { liveSlugs, moveSlug } from "@/lib/admin-path/reorder";
import { cn } from "@/lib/utils";
import {
    useAdminPathOverviewQuery,
    useAdminSeedPlanQuery,
    useAdminValidateQuery,
    useReorderAdminPathMutation,
} from "@/queries/admin-path.query";
import type { AdminPlacementNode, AdminReorderBody, AdminUnitNode } from "@/types/admin-path/admin-path.type";
import { AlertTriangle, ArrowDown, ArrowUp, CheckCircle2, Plus, RefreshCw, Rocket, Upload } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

/** Moves one row among its live siblings; one move at a time for the whole screen. */
interface Mover {
    move: (kind: AdminReorderBody["kind"], parent: string, siblings: string[], slug: string, by: -1 | 1) => void;
    busy: boolean;
}

/** /admin/path: the working copy, its health, and releases. */
export function AdminPathScreen() {
    const overview = useAdminPathOverviewQuery();
    const seedPlan = useAdminSeedPlanQuery();
    const [publishing, setPublishing] = useState(false);
    const reorder = useReorderAdminPathMutation();
    const mover: Mover = {
        busy: reorder.isPending,
        move: (kind, parent, siblings, slug, by) => {
            const slugs = moveSlug(siblings, slug, by);
            if (!slugs || reorder.isPending) return;
            reorder.mutate(
                { kind, parent, slugs },
                { onError: (error) => toast.error(adminErrorMessages(error).join(" ")) },
            );
        },
    };
    const clashes = new Set(
        seedPlan.data?.changes.filter((c) => c.action === "conflict").map((c) => `${c.kind}:${c.slug}`),
    );

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

    const { stages, placements, totals } = overview.data;

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
                <div className="flex items-center justify-between gap-2">
                    <h2 className="font-semibold">Stages</h2>
                    <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" asChild className="gap-1">
                            <Link href="/admin/path/import">
                                <Upload className="h-3.5 w-3.5" aria-hidden /> Import unit file
                            </Link>
                        </Button>
                        <NewLink href="/admin/path/stage/new" label="New stage" />
                    </div>
                </div>
                {stages.map((stage) => (
                    <div key={stage.id} className="space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <h2 className="flex flex-wrap items-center gap-2 font-display text-lg font-bold">
                                <RecordLink kind="stage" slug={stage.slug}>
                                    <span className={cn(stage.status === "ARCHIVED" && "line-through")}>{stage.title}</span>
                                </RecordLink>
                                <Badge variant="muted">{stage.cefr}</Badge>
                                {stage.status !== "PUBLISHED" && <StatusBadge status={stage.status} />}
                                <OriginBadge origin={stage.origin} />
                                <ClashBadge kind="stage" slug={stage.slug} clashes={clashes} />
                            </h2>
                            {stage.status !== "ARCHIVED" && <NewLink href={`/admin/path/unit/new?stage=${stage.slug}`} label="New unit" />}
                        </div>
                        {stage.units.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No units yet.</p>
                        ) : (
                            stage.units.map((unit) => (
                                <UnitRow
                                    key={unit.id}
                                    unit={unit}
                                    stage={stage.slug}
                                    siblings={liveSlugs(stage.units)}
                                    mover={mover}
                                    clashes={clashes}
                                />
                            ))
                        )}
                    </div>
                ))}
            </section>

            <PlacementCard placements={placements} clashes={clashes} />

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

/** The placement test(s): questions tagged with the unit they probe, edited as JSON. */
function PlacementCard({
    placements,
    clashes,
}: Readonly<{ placements: AdminPlacementNode[]; clashes: Set<string> }>) {
    const live = placements.some((p) => p.status !== "ARCHIVED");
    return (
        <section aria-label="Placement test" className="glass-surface space-y-2 rounded-2xl p-4">
            <div className="flex items-center justify-between gap-2">
                <h2 className="font-semibold">Placement test</h2>
                {!live && <NewLink href="/admin/path/placement/new" label="New placement test" />}
            </div>
            {placements.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                    None: learners can only start from the beginning.
                </p>
            ) : (
                <ul className="space-y-1 text-sm">
                    {placements.map((p) => (
                        <li key={p.id} className="flex flex-wrap items-center gap-2">
                            <RecordLink kind="placement" slug={p.slug}>
                                <span className="font-semibold">{p.title}</span>
                            </RecordLink>
                            <span className="text-muted-foreground">
                                {p.slug} · {p.questionCount} questions
                            </span>
                            <StatusBadge status={p.status} />
                            <OriginBadge origin={p.origin} />
                            <ClashBadge kind="placement" slug={p.slug} clashes={clashes} />
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}

function NewLink({ href, label }: Readonly<{ href: string; label: string }>) {
    return (
        <Button size="sm" variant="outline" asChild className="gap-1">
            <Link href={href}>
                <Plus className="h-3.5 w-3.5" aria-hidden /> {label}
            </Link>
        </Button>
    );
}

/** Both an admin and the seed changed this row; `seed-plan` lists it. */
function ClashBadge({ kind, slug, clashes }: Readonly<{ kind: string; slug: string; clashes: Set<string> }>) {
    if (!clashes.has(`${kind}:${slug}`)) return null;
    return (
        <Badge variant="destructive" title="The seed file changed too; the admin version is kept">
            Clash
        </Badge>
    );
}

/** A record's name, linking to its editor. */
function RecordLink({ kind, slug, children }: Readonly<{ kind: string; slug: string; children: React.ReactNode }>) {
    return (
        <Link href={`/admin/path/${kind}/${slug}`} className="hover:text-primary hover:underline">
            {children}
        </Link>
    );
}

/** Up and down buttons for a live row; archived rows keep their place and don't move. */
function MoveButtons({
    kind,
    parent,
    siblings,
    slug,
    title,
    mover,
}: Readonly<{
    kind: AdminReorderBody["kind"];
    parent: string;
    siblings: string[];
    slug: string;
    title: string;
    mover: Mover;
}>) {
    const at = siblings.indexOf(slug);
    if (at < 0 || siblings.length < 2) return null;
    const button = (by: -1 | 1, Icon: typeof ArrowUp, label: string, disabled: boolean) => (
        <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            aria-label={`${label}: ${title}`}
            title={label}
            disabled={disabled || mover.busy}
            onClick={(e) => {
                // Inside a <summary> a click would also fold the unit.
                e.preventDefault();
                mover.move(kind, parent, siblings, slug, by);
            }}
        >
            <Icon className="h-3.5 w-3.5" aria-hidden />
        </Button>
    );
    return (
        <span className="inline-flex">
            {button(-1, ArrowUp, "Move up", at === 0)}
            {button(1, ArrowDown, "Move down", at === siblings.length - 1)}
        </span>
    );
}

function UnitRow({
    unit,
    stage,
    siblings,
    mover,
    clashes,
}: Readonly<{ unit: AdminUnitNode; stage: string; siblings: string[]; mover: Mover; clashes: Set<string> }>) {
    const newFor = (kind: string) => `/admin/path/${kind}/new?unit=${unit.slug}`;
    const lessons = liveSlugs(unit.lessons);
    return (
        <details className="glass-surface group rounded-2xl">
            <summary className="flex cursor-pointer list-none flex-wrap items-center gap-2 p-4">
                <MoveButtons kind="unit" parent={stage} siblings={siblings} slug={unit.slug} title={unit.title} mover={mover} />
                <span className="font-semibold">
                    {unit.order}. {unit.title}
                </span>
                <StatusBadge status={unit.status} />
                <OriginBadge origin={unit.origin} />
                <ClashBadge kind="unit" slug={unit.slug} clashes={clashes} />
                <span className="ml-auto text-xs text-muted-foreground">
                    {unit.lessons.length} lessons · {unit.items.total} items
                    {unit.items.draft > 0 && ` (${unit.items.draft} draft)`} · {unit.dialogueCount} dialogues
                </span>
            </summary>

            <div className="space-y-4 border-t border-border p-4">
                <p className="text-sm">
                    <RecordLink kind="unit" slug={unit.slug}>
                        Edit the unit itself
                    </RecordLink>{" "}
                    <span className="font-mono text-xs text-muted-foreground">{unit.slug}</span>
                </p>
                <div>
                    <div className="mb-1 flex items-center justify-between">
                        <h3 className="text-sm font-semibold">Lessons</h3>
                        <NewLink href={newFor("lesson")} label="New lesson" />
                    </div>
                    <ul className="space-y-1 text-sm">
                        {unit.lessons.map((lesson) => (
                            <li key={lesson.id} className="flex flex-wrap items-center gap-2">
                                <MoveButtons
                                    kind="lesson"
                                    parent={unit.slug}
                                    siblings={lessons}
                                    slug={lesson.slug}
                                    title={lesson.title}
                                    mover={mover}
                                />
                                <RecordLink kind="lesson" slug={lesson.slug}>
                                    {lesson.order}. {lesson.title}
                                </RecordLink>
                                <StatusBadge status={lesson.status} />
                                <OriginBadge origin={lesson.origin} />
                                <ClashBadge kind="lesson" slug={lesson.slug} clashes={clashes} />
                            </li>
                        ))}
                    </ul>
                </div>

                <div>
                    <div className="mb-1 flex items-center justify-between">
                        <h3 className="text-sm font-semibold">Items</h3>
                        <NewLink href={newFor("item")} label="New item" />
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
                                    <ClashBadge kind="item" slug={item.slug} clashes={clashes} />
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>

                <div>
                    <div className="mb-1 flex items-center justify-between">
                        <h3 className="text-sm font-semibold">Dialogues</h3>
                        <NewLink href={newFor("dialogue")} label="New dialogue" />
                    </div>
                    <ul className="space-y-1 text-sm">
                        {unit.dialogues.map((d) => (
                            <li key={d.id} className="flex flex-wrap items-center gap-2">
                                <RecordLink kind="dialogue" slug={d.slug}>
                                    {d.title}
                                </RecordLink>
                                {d.status !== "PUBLISHED" && <StatusBadge status={d.status} />}
                                <OriginBadge origin={d.origin} />
                                <ClashBadge kind="dialogue" slug={d.slug} clashes={clashes} />
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-sm">
                    <h3 className="font-semibold">Unit test</h3>
                    {unit.checkpoint ? (
                        <>
                            <RecordLink kind="checkpoint" slug={unit.checkpoint.slug}>
                                {unit.checkpoint.slug}
                            </RecordLink>
                            {unit.checkpoint.status !== "PUBLISHED" && <StatusBadge status={unit.checkpoint.status} />}
                            <OriginBadge origin={unit.checkpoint.origin} />
                            <ClashBadge kind="checkpoint" slug={unit.checkpoint.slug} clashes={clashes} />
                        </>
                    ) : (
                        <NewLink href={newFor("checkpoint")} label="New unit test" />
                    )}
                </div>
            </div>
        </details>
    );
}
