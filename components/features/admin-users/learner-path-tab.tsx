"use client";

import { MiniTable, SectionGate } from "@/components/features/admin-reports/report-parts";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { affectedTotal, describePathReset } from "@/lib/admin/learners";
import { formatDate } from "@/lib/admin/users";
import { adminErrorMessages } from "@/lib/admin-path/errors";
import { PathCardsResetError, useLearnerPathQuery, useResetLearnerPathMutation } from "@/queries/admin-learners.query";
import type { LearnerPath } from "@/types/admin-learners/admin-learners.type";
import { RotateCcw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ActionRow, DetailSection, Fact, Facts } from "./detail-parts";
import { ResetDialog } from "./reset-dialog";

/** The Path tab: one learner's Wordsly Path progress (curriculum-service), and its reset. */
export function LearnerPathTab({ userLoginId, name }: Readonly<{ userLoginId: string; name: string }>) {
    const path = useLearnerPathQuery(userLoginId);

    return (
        <div className="space-y-6">
            <SectionGate data={path.data} isFetching={path.isFetching} onRetry={() => void path.refetch()}>
                {(data) => <PathProgress path={data} />}
            </SectionGate>
            <PathReset userLoginId={userLoginId} name={name} />
        </div>
    );
}

function PathProgress({ path }: Readonly<{ path: LearnerPath }>) {
    const { enrollment, progress } = path;
    const percent = progress.lessonsTotal > 0 ? Math.round((progress.lessonsDone / progress.lessonsTotal) * 100) : 0;

    return (
        <div className="space-y-4">
            <DetailSection title="Enrollment">
                <Facts>
                    <Fact label="Enrolled">{enrollment ? formatDate(enrollment.enrolledAt) : "Not enrolled"}</Fact>
                    <Fact label="Started at">{enrollment?.startUnit?.title ?? (enrollment ? "The first unit" : "—")}</Fact>
                    <Fact label="Current stage">
                        {progress.stage ? `${progress.stage.cefr} · ${progress.stage.title}` : "—"}
                    </Fact>
                </Facts>
                <div className="mt-5">
                    <div className="mb-1.5 flex justify-between text-sm">
                        <span className="text-muted-foreground">Lessons done</span>
                        <span className="font-medium tabular-nums">
                            {progress.lessonsDone} of {progress.lessonsTotal}
                        </span>
                    </div>
                    <div
                        role="progressbar"
                        aria-label="Lessons done"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={percent}
                        className="h-2 overflow-hidden rounded-full bg-muted"
                    >
                        <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
                    </div>
                </div>
            </DetailSection>

            <DetailSection title="Completed lessons" description="Newest first.">
                <MiniTable
                    head={[
                        { label: "Lesson" },
                        { label: "Unit" },
                        { label: "Times", numeric: true },
                        { label: "Best", numeric: true },
                        { label: "Last done", numeric: true },
                    ]}
                    rows={path.completions.map((c) => [
                        c.title,
                        c.unitTitle ?? "—",
                        c.timesCompleted,
                        c.bestScore == null ? "—" : `${c.bestScore}%`,
                        formatDate(c.lastCompletedAt),
                    ])}
                    empty="No lessons completed."
                />
            </DetailSection>

            <div className="grid gap-4 lg:grid-cols-2">
                <DetailSection title="Unit tests" description="The latest 50 attempts.">
                    <MiniTable
                        head={[{ label: "Unit" }, { label: "Score", numeric: true }, { label: "Result" }, { label: "Date", numeric: true }]}
                        rows={path.checkpointAttempts.map((a) => [
                            a.unitTitle ?? "—",
                            `${a.scorePercent}%`,
                            a.passed ? "Passed" : <span className="text-muted-foreground">Not passed</span>,
                            formatDate(a.createdAt),
                        ])}
                        empty="No unit tests taken."
                    />
                </DetailSection>
                <DetailSection title="Placement tests" description="The latest 50 results.">
                    <MiniTable
                        head={[{ label: "Placed in" }, { label: "Score", numeric: true }, { label: "Date", numeric: true }]}
                        rows={path.placements.map((p) => [
                            p.placedUnitTitle ?? "The first unit",
                            `${p.scorePercent}%`,
                            formatDate(p.createdAt),
                        ])}
                        empty="No placement test taken."
                    />
                </DetailSection>
            </div>
        </div>
    );
}

function PathReset({ userLoginId, name }: Readonly<{ userLoginId: string; name: string }>) {
    const [withCards, setWithCards] = useState(false);
    const [confirming, setConfirming] = useState(false);
    const reset = useResetLearnerPathMutation();
    const description = describePathReset(withCards);

    const confirm = () =>
        reset.mutate(
            { userLoginId, withCards },
            {
                onSuccess: ({ path, cards }) => {
                    const rows = affectedTotal(path.affected) + (cards ? affectedTotal(cards.affected) : 0);
                    toast.success(`Reset ${description.name} for ${name} (${rows} ${rows === 1 ? "row" : "rows"})`);
                    setConfirming(false);
                },
                onError: (error) => {
                    toast.error(error instanceof PathCardsResetError ? error.message : adminErrorMessages(error)[0]);
                    if (error instanceof PathCardsResetError) setConfirming(false);
                },
            },
        );

    return (
        <DetailSection title="Reset Path" description="Takes them back to the start of Wordsly Path.">
            <ActionRow
                title="Un-enroll and clear Path progress"
                description={
                    <div className="mt-2 flex items-center gap-2">
                        <Checkbox
                            id="reset-path-cards"
                            checked={withCards}
                            onCheckedChange={(checked) => setWithCards(checked === true)}
                        />
                        <Label htmlFor="reset-path-cards" className="font-normal text-foreground">
                            Also remove their Path cards
                        </Label>
                    </div>
                }
            >
                <Button variant="destructive" onClick={() => setConfirming(true)}>
                    <RotateCcw className="h-4 w-4" />
                    Reset Path
                </Button>
            </ActionRow>
            {confirming ? (
                <ResetDialog
                    title={`Reset ${description.name} for ${name}?`}
                    reset={description}
                    onClose={() => setConfirming(false)}
                    onConfirm={confirm}
                    isLoading={reset.isPending}
                />
            ) : null}
        </DetailSection>
    );
}
