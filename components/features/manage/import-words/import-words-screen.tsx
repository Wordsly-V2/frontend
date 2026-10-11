"use client";

import { BackLink } from "@/components/common/back-link/back-link";
import { PageHeader, PageShell } from "@/components/common/page";
import { EmptyState, ErrorState, Skeleton } from "@/components/common/states";
import { Button } from "@/components/ui/button";
import { useUnsavedWarning } from "@/hooks/useUnsavedWarning.hook";
import {
    applyLookup,
    applySenseToRow,
    enrichWordRow,
    type ImportWordRow,
    mapWithConcurrency,
    parseImportText,
    rowToCreateMyWord,
    type WordSense,
} from "@/lib/word-import";
import { lessonRoom, reviewImport, wordCount } from "@/lib/word-import-review";
import { useGetCourseDetailByIdQuery } from "@/queries/courses.query";
import { useCreateMyWordsBulkMutation } from "@/queries/words.query";
import type { ILesson } from "@/types/courses/courses.type";
import { BookOpen } from "lucide-react";
import Link from "next/link";
import { parseAsString, useQueryState } from "nuqs";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ImportDoneStep } from "./import-done-step";
import { ImportReviewStep } from "./import-review-step";
import { type ImportSource, ImportSourceStep, type ParsedSource } from "./import-source-step";
import { type ImportStep, ImportSteps } from "./import-steps";
import type { WordCardActions } from "./import-word-card";

/** Two lookups per word against a 60-a-minute limit: a few at a time, retried when told to slow down. */
const LOOKUP_CONCURRENCY = 3;

const EMPTY_SOURCE: ImportSource = { mode: "paste", text: "", fileName: "" };

/** The lesson to start in: the one asked for, else the first with room. */
function startLesson(lessons: ILesson[], wanted: string | null): string {
    if (wanted && lessons.some((l) => l.id === wanted)) return wanted;
    return (lessons.find((l) => lessonRoom(l) !== 0) ?? lessons[0])?.id ?? "";
}

/**
 * `/manage/courses/[id]/import`: add many words to a lesson at once. Add words
 * (paste or a file, parsed as you type) → Review (dictionary lookup, repeats,
 * lesson room, per-word fixes) → Done. Leaving with work in progress asks first.
 */
export function ImportWordsScreen({ courseId }: Readonly<{ courseId: string }>) {
    const { data: course, isFetching, refetch } = useGetCourseDetailByIdQuery(courseId);
    const [lessonParam] = useQueryState("lesson", parseAsString);
    const lessons = useMemo(() => course?.lessons ?? [], [course]);
    const bulk = useCreateMyWordsBulkMutation();

    const [step, setStep] = useState<ImportStep>("source");
    const [lessonId, setLessonId] = useState("");
    const [source, setSource] = useState<ImportSource>(EMPTY_SOURCE);
    const [autoFill, setAutoFill] = useState(true);
    const [rows, setRows] = useState<ImportWordRow[]>([]);
    const [lookingUp, setLookingUp] = useState(false);
    const [busyRows, setBusyRows] = useState<ReadonlySet<string>>(new Set());
    const [result, setResult] = useState<{ added: number; leftOut: number; lessonId: string } | null>(null);
    const stopRef = useRef(false);
    const rowsRef = useRef(rows);
    rowsRef.current = rows;

    useEffect(() => {
        if (!lessonId && lessons.length > 0) setLessonId(startLesson(lessons, lessonParam));
    }, [lessons, lessonId, lessonParam]);

    // Stop a running lookup when the page goes away.
    useEffect(() => () => void (stopRef.current = true), []);

    const parsed = useMemo<ParsedSource | null>(() => {
        if (!source.text.trim()) return null;
        try {
            return { ok: true, ...parseImportText(source.text, source.fileName) };
        } catch (err) {
            return { ok: false, error: `This doesn't look like a word list: ${(err as Error).message}` };
        }
    }, [source]);

    const lesson = lessons.find((l) => l.id === lessonId);
    const review = useMemo(
        () =>
            reviewImport(rows, {
                existingWords: lesson?.words?.map((w) => w.word) ?? [],
                remaining: lessonRoom(lesson),
            }),
        [rows, lesson],
    );

    const dirty = step === "review" ? rows.length > 0 : step === "source" && source.text.trim().length > 0;
    useUnsavedWarning(dirty && !bulk.isPending, "Your words aren't added yet. Leave and lose them?");

    const setBusy = (id: string, on: boolean) =>
        setBusyRows((prev) => {
            const next = new Set(prev);
            if (on) next.add(id);
            else next.delete(id);
            return next;
        });

    /** Look up the given rows a few at a time; each result lands on the row as it is by then. */
    const lookUp = useCallback(async (targets: ImportWordRow[]) => {
        if (targets.length === 0) return;
        stopRef.current = false;
        setLookingUp(true);
        try {
            await mapWithConcurrency(
                targets,
                LOOKUP_CONCURRENCY,
                async (target) => {
                    setBusy(target.id, true);
                    try {
                        const looked = await enrichWordRow(target);
                        setRows((prev) => prev.map((r) => (r.id === target.id ? applyLookup(r, looked) : r)));
                    } finally {
                        setBusy(target.id, false);
                    }
                },
                undefined,
                () => stopRef.current,
            );
        } finally {
            setLookingUp(false);
        }
    }, []);

    const goToReview = () => {
        if (!parsed?.ok || parsed.rows.length === 0) return;
        setRows(parsed.rows);
        setStep("review");
        globalThis.scrollTo?.({ top: 0 });
        if (autoFill) void lookUp(parsed.rows);
    };

    const actions = useMemo<WordCardActions>(
        () => ({
            update: (id, patch) => setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r))),
            remove: (id) => setRows((prev) => prev.filter((r) => r.id !== id)),
            lookUp: async (id, word) => {
                const current = rowsRef.current.find((r) => r.id === id);
                if (!current) return;
                const target = word ? { ...current, word } : current;
                setRows((prev) => prev.map((r) => (r.id === id ? { ...target, lookup: undefined } : r)));
                setBusy(id, true);
                try {
                    // A picked suggestion or a retry: refresh what the dictionary gives.
                    const looked = await enrichWordRow(target, { overwrite: Boolean(word) });
                    setRows((prev) => prev.map((r) => (r.id === id ? { ...looked, skipped: r.skipped } : r)));
                } finally {
                    setBusy(id, false);
                }
            },
            chooseSense: async (id, sense: WordSense) => {
                const current = rowsRef.current.find((r) => r.id === id);
                if (!current) return;
                setBusy(id, true);
                try {
                    const next = await applySenseToRow(current, sense);
                    setRows((prev) => prev.map((r) => (r.id === id ? { ...next, senses: r.senses } : r)));
                } catch {
                    toast.error("Couldn't switch to that meaning. Try again.");
                } finally {
                    setBusy(id, false);
                }
            },
        }),
        [],
    );

    const importWords = () => {
        const words = review.importable.map(rowToCreateMyWord);
        if (!lessonId || words.length === 0) return;
        bulk.mutate(
            { courseId, lessonId, words },
            {
                onSuccess: (res: { count?: number } | undefined) => {
                    setResult({ added: res?.count ?? words.length, leftOut: rows.length - words.length, lessonId });
                    setStep("done");
                    setRows([]);
                    setSource(EMPTY_SOURCE);
                    globalThis.scrollTo?.({ top: 0 });
                },
                onError: (err) => toast.error(`Couldn't add the words: ${err.message}`),
            },
        );
    };

    const courseHref = `/manage/courses/${courseId}`;
    const back = <BackLink href={courseHref}>{course?.name ?? "Back to course"}</BackLink>;

    if (!course && isFetching) {
        return (
            <PageShell width="medium">
                <Skeleton aria-busy className="h-96 w-full rounded-3xl" />
            </PageShell>
        );
    }
    if (!course) {
        return (
            <PageShell width="medium">
                <ErrorState message="Couldn't load this course." onRetry={() => void refetch()} />
            </PageShell>
        );
    }

    return (
        <PageShell width="medium">
            <PageHeader
                back={back}
                eyebrow="Import words"
                title={step === "review" ? `Check ${wordCount(rows.length)}` : "Import words"}
                description={
                    step === "review"
                        ? "Fix anything marked, then add them. Nothing is saved until you do."
                        : `Add many words to ${course.name} at once.`
                }
            />
            <div className="mb-6">
                <ImportSteps current={step} />
            </div>

            {lessons.length === 0 ? (
                <EmptyState
                    icon={BookOpen}
                    title="Add a lesson first"
                    description="Words go into a lesson. Make one, then come back to import."
                    action={
                        <Button asChild>
                            <Link href={courseHref}>Go to the course</Link>
                        </Button>
                    }
                />
            ) : step === "source" ? (
                <ImportSourceStep
                    lessons={lessons}
                    lessonId={lessonId}
                    onLessonChange={setLessonId}
                    source={source}
                    onSourceChange={setSource}
                    parsed={parsed}
                    autoFill={autoFill}
                    onAutoFillChange={setAutoFill}
                    onContinue={goToReview}
                />
            ) : step === "review" ? (
                <ImportReviewStep
                    rows={rows}
                    review={review}
                    lessons={lessons}
                    lessonId={lessonId}
                    onLessonChange={setLessonId}
                    lookingUp={lookingUp}
                    busyRows={busyRows}
                    actions={actions}
                    onStopLookup={() => (stopRef.current = true)}
                    onRetryFailed={() => void lookUp(rows.filter((r) => r.lookup === "failed"))}
                    onLookUpAll={() => void lookUp(rows.filter((r) => r.lookup !== "found" && r.lookup !== "not-found"))}
                    onSkip={(ids) => setRows((prev) => prev.map((r) => (ids.includes(r.id) ? { ...r, skipped: true } : r)))}
                    onBack={() => {
                        stopRef.current = true;
                        setStep("source");
                    }}
                    onImport={importWords}
                    importing={bulk.isPending}
                />
            ) : (
                result && (
                    <ImportDoneStep
                        added={result.added}
                        leftOut={result.leftOut}
                        lessonName={lessons.find((l) => l.id === result.lessonId)?.name ?? "the lesson"}
                        lessonHref={`${courseHref}?lessonId=${result.lessonId}`}
                        onImportMore={() => {
                            setResult(null);
                            setStep("source");
                        }}
                    />
                )
            )}
        </PageShell>
    );
}
