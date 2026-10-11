"use client";

import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { cn } from "@/lib/utils";
import type { ImportWordRow } from "@/lib/word-import";
import {
    type ImportReview,
    lessonRoom,
    lookupCounts,
    matchesFilter,
    REVIEW_FILTERS,
    type ReviewFilter,
    wordCount,
} from "@/lib/word-import-review";
import type { ILesson } from "@/types/courses/courses.type";
import { ArrowLeft, Check, RotateCcw, Sparkles, Square } from "lucide-react";
import { useId, useState } from "react";
import { ImportWordCard, type WordCardActions } from "./import-word-card";

const FILTER_LABELS: Record<ReviewFilter, string> = {
    all: "All",
    attention: "Needs a look",
    ready: "Ready",
    skipped: "Left out",
};

/** Step 2: every staged word, what will happen to it, and the fixes; import from the bar at the bottom. */
export function ImportReviewStep({
    rows,
    review,
    lessons,
    lessonId,
    onLessonChange,
    lookingUp,
    busyRows,
    actions,
    onStopLookup,
    onRetryFailed,
    onLookUpAll,
    onSkip,
    onBack,
    onImport,
    importing,
}: Readonly<{
    rows: ImportWordRow[];
    review: ImportReview;
    lessons: ILesson[];
    lessonId: string;
    onLessonChange: (id: string) => void;
    lookingUp: boolean;
    busyRows: ReadonlySet<string>;
    actions: WordCardActions;
    onStopLookup: () => void;
    onRetryFailed: () => void;
    onLookUpAll: () => void;
    onSkip: (ids: string[]) => void;
    onBack: () => void;
    onImport: () => void;
    importing: boolean;
}>) {
    const [filter, setFilter] = useState<ReviewFilter>("all");
    const lessonSelectId = useId();
    const { counts, status } = review;
    const attention = counts["needs-meaning"] + counts.duplicate + counts["in-lesson"] + counts["over-limit"];
    const filterCounts: Record<ReviewFilter, number> = {
        all: rows.length,
        attention,
        ready: counts.ready,
        skipped: counts.skipped,
    };
    const shown = rows.filter((row) => matchesFilter(status[row.id], filter));
    const lesson = lessons.find((l) => l.id === lessonId);
    const room = lessonRoom(lesson);
    const lookups = lookupCounts(rows);
    const notLookedUp = rows.length - lookups.done;
    const idsWith = (wanted: string) => rows.filter((row) => status[row.id] === wanted).map((row) => row.id);
    const leftOut = rows.length - counts.ready;

    return (
        <div className="space-y-4">
            <section className="surface-card space-y-4 p-4 sm:p-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 flex-wrap items-center gap-2 text-sm">
                        <label htmlFor={lessonSelectId} className="font-semibold">
                            Adding to
                        </label>
                        <select
                            id={lessonSelectId}
                            value={lessonId}
                            onChange={(event) => onLessonChange(event.target.value)}
                            className="h-9 min-w-0 max-w-full rounded-xl border border-input bg-background px-3 text-sm font-semibold shadow-xs focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/45"
                        >
                            {lessons.map((l) => {
                                const r = lessonRoom(l);
                                return (
                                    <option key={l.id} value={l.id} disabled={r === 0}>
                                        {l.name}
                                        {r === 0 ? " (full)" : r != null ? ` (${r} left)` : ""}
                                    </option>
                                );
                            })}
                        </select>
                    </div>
                    {room != null && (
                        <p className="text-sm text-muted-foreground">Room for {wordCount(room)} in this lesson</p>
                    )}
                </div>

                <LookupBar
                    lookingUp={lookingUp}
                    lookups={lookups}
                    notLookedUp={notLookedUp}
                    onStop={onStopLookup}
                    onRetryFailed={onRetryFailed}
                    onLookUpAll={onLookUpAll}
                />

                <QuickFixes
                    counts={counts}
                    onSkipRepeats={() => onSkip([...idsWith("duplicate"), ...idsWith("in-lesson")])}
                    onSkipNoMeaning={() => onSkip(idsWith("needs-meaning"))}
                    onSkipOverLimit={() => onSkip(idsWith("over-limit"))}
                    room={room}
                />

                <div className="overflow-x-auto">
                    <div role="radiogroup" aria-label="Show words" className="flex w-max gap-1.5">
                        {REVIEW_FILTERS.map((key) => {
                            const active = key === filter;
                            return (
                                <button
                                    key={key}
                                    type="button"
                                    role="radio"
                                    aria-checked={active}
                                    onClick={() => setFilter(key)}
                                    className={cn(
                                        "inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/45",
                                        active
                                            ? "border-primary bg-primary text-primary-foreground"
                                            : "border-border bg-background hover:bg-muted/50",
                                    )}
                                >
                                    {FILTER_LABELS[key]}
                                    <span
                                        className={cn(
                                            "rounded-full px-1.5 text-xs tabular-nums",
                                            active ? "bg-primary-foreground/20" : "bg-muted",
                                        )}
                                    >
                                        {filterCounts[key]}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </section>

            {shown.length === 0 ? (
                <p className="surface-card px-4 py-10 text-center text-sm text-muted-foreground">
                    {filter === "attention" ? "Nothing needs a look. 🎉" : "No words here."}
                </p>
            ) : (
                <ul className="space-y-2.5" aria-label="Words to import">
                    {shown.map((row) => (
                        <ImportWordCard
                            key={row.id}
                            row={row}
                            status={status[row.id]}
                            busy={busyRows.has(row.id)}
                            actions={actions}
                        />
                    ))}
                </ul>
            )}

            {/* Pinned above the tab bar on phones, so Import is always one tap away. */}
            <div className="sticky bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] z-30 lg:bottom-4">
                <div className="flex flex-col gap-2 rounded-2xl border border-border/70 bg-card/95 p-3 shadow-lg backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
                    <p className="px-1 text-sm" aria-live="polite">
                        <span className="font-bold">{wordCount(counts.ready)}</span>
                        <span className="text-muted-foreground"> ready</span>
                        {leftOut > 0 && <span className="text-muted-foreground"> · {leftOut} won&apos;t be added</span>}
                    </p>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={onBack} disabled={importing} className="flex-1 sm:flex-none">
                            <ArrowLeft className="h-4 w-4" aria-hidden />
                            Back
                        </Button>
                        <Button
                            onClick={onImport}
                            disabled={counts.ready === 0 || lookingUp || importing}
                            className="flex-[2] sm:flex-none"
                        >
                            {importing ? <LoadingSpinner size="sm" showLabel={false} /> : <Check className="h-4 w-4" aria-hidden />}
                            {importing ? "Adding…" : `Add ${wordCount(counts.ready)}`}
                        </Button>
                    </div>
                </div>
                {lookingUp && (
                    <p className="mt-1 px-2 text-center text-xs text-muted-foreground">
                        Wait for the lookup to finish, or stop it to add the words as they are.
                    </p>
                )}
            </div>
        </div>
    );
}

function LookupBar({
    lookingUp,
    lookups,
    notLookedUp,
    onStop,
    onRetryFailed,
    onLookUpAll,
}: Readonly<{
    lookingUp: boolean;
    lookups: ReturnType<typeof lookupCounts>;
    notLookedUp: number;
    onStop: () => void;
    onRetryFailed: () => void;
    onLookUpAll: () => void;
}>) {
    const percent = lookups.total ? Math.round((lookups.done / lookups.total) * 100) : 0;

    if (lookingUp) {
        return (
            <div className="space-y-2 rounded-2xl bg-primary/8 p-3">
                <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="flex items-center gap-2 font-semibold" aria-live="polite">
                        <Sparkles className="h-4 w-4 text-primary" aria-hidden />
                        Looking up {lookups.done} of {wordCount(lookups.total)}…
                    </span>
                    <Button variant="outline" size="sm" onClick={onStop}>
                        <Square className="h-3.5 w-3.5" aria-hidden />
                        Stop
                    </Button>
                </div>
                <div
                    role="progressbar"
                    aria-valuenow={percent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="Dictionary lookup progress"
                    className="h-2 overflow-hidden rounded-full bg-background"
                >
                    <div
                        className="h-full rounded-full bg-primary transition-[width] duration-300 motion-reduce:transition-none"
                        style={{ width: `${percent}%` }}
                    />
                </div>
            </div>
        );
    }

    if (lookups.done === 0) {
        return (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-muted/40 p-3 text-sm">
                <span className="text-muted-foreground">Want pictures, audio and examples filled in?</span>
                <Button variant="outline" size="sm" onClick={onLookUpAll}>
                    <Sparkles className="h-4 w-4" aria-hidden />
                    Fill in from the dictionary
                </Button>
            </div>
        );
    }

    return (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-muted/40 p-3 text-sm">
            <span className="text-muted-foreground">
                <span className="font-semibold text-foreground">{lookups.found}</span> found in the dictionary
                {lookups.notFound > 0 && <> · {lookups.notFound} not found</>}
                {lookups.failed > 0 && <> · {lookups.failed} couldn&apos;t be looked up</>}
            </span>
            <span className="flex gap-1.5">
                {lookups.failed > 0 && (
                    <Button variant="outline" size="sm" onClick={onRetryFailed}>
                        <RotateCcw className="h-4 w-4" aria-hidden />
                        Try again
                    </Button>
                )}
                {notLookedUp > lookups.failed && (
                    <Button variant="outline" size="sm" onClick={onLookUpAll}>
                        <Sparkles className="h-4 w-4" aria-hidden />
                        Look up the rest
                    </Button>
                )}
            </span>
        </div>
    );
}

/** One click for the common clean-ups, only when they apply. */
function QuickFixes({
    counts,
    room,
    onSkipRepeats,
    onSkipNoMeaning,
    onSkipOverLimit,
}: Readonly<{
    counts: ImportReview["counts"];
    room: number | null;
    onSkipRepeats: () => void;
    onSkipNoMeaning: () => void;
    onSkipOverLimit: () => void;
}>) {
    const repeats = counts.duplicate + counts["in-lesson"];
    const fixes = [
        counts["over-limit"] > 0 && {
            text: `This lesson has room for ${wordCount(room ?? 0)}; ${wordCount(counts["over-limit"])} won't fit.`,
            label: `Leave out the last ${counts["over-limit"]}`,
            run: onSkipOverLimit,
        },
        repeats > 0 && {
            text: `${wordCount(repeats)} repeat${repeats === 1 ? "s" : ""} a word you already have.`,
            label: "Leave repeats out",
            run: onSkipRepeats,
        },
        counts["needs-meaning"] > 0 && {
            text: `${wordCount(counts["needs-meaning"])} still need${counts["needs-meaning"] === 1 ? "s" : ""} a meaning.`,
            label: "Leave them out",
            run: onSkipNoMeaning,
        },
    ].filter(Boolean) as { text: string; label: string; run: () => void }[];

    if (fixes.length === 0) return null;
    return (
        <ul className="space-y-1.5">
            {fixes.map((fix) => (
                <li
                    key={fix.label}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-[var(--brand-warning)]/12 px-3 py-2 text-sm"
                >
                    <span>{fix.text}</span>
                    <Button variant="ghost" size="sm" onClick={fix.run} className="h-8">
                        {fix.label}
                    </Button>
                </li>
            ))}
        </ul>
    );
}
