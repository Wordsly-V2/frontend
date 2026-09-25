"use client";

import { Mascot } from "@/components/common/motion";
import { EmptyState, ErrorState, Skeleton } from "@/components/common/states";
import { PracticeStep } from "@/components/features/path/lesson-player/practice-step";
import { Button } from "@/components/ui/button";
import { useIsOffline } from "@/hooks/useOnlineStatus.hook";
import { PATH_REVIEW_SESSION_SIZE } from "@/lib/path/path-tree";
import { queryKeys } from "@/lib/query-keys";
import {
    type PathDueItems,
    usePathDueCountQuery,
    usePathMeQuery,
    usePathReviewQuery,
    usePathTreeQuery,
} from "@/queries/path.query";
import { buildDailyPlan } from "@/lib/path/daily-plan";
import type { SessionCompletePayload } from "@/types/practice/practice.type";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, WifiOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const BACK_TO_PATH = (
    <Button variant="play" asChild>
        <Link href="/path">Back to the path</Link>
    </Button>
);

/**
 * /path/review: one session over the Path items FSRS says are due, most
 * overdue first. New items never come in here (they are introduced by
 * lessons), and the session counts against the shared `dailyReviewLimit`.
 * "Review more" starts a fresh session on the same page.
 */
export function PathReviewScreen() {
    const queryClient = useQueryClient();
    const [round, setRound] = useState(0);

    return (
        <ReviewSession
            key={round}
            onAgain={() => {
                // The next round must ask the server again, not reuse this one.
                queryClient.removeQueries({
                    queryKey: queryKeys.path.review(PATH_REVIEW_SESSION_SIZE),
                });
                setRound((r) => r + 1);
            }}
        />
    );
}

function ReviewSession({ onAgain }: Readonly<{ onAgain: () => void }>) {
    const router = useRouter();
    const isOffline = useIsOffline();
    const review = usePathReviewQuery(PATH_REVIEW_SESSION_SIZE);
    // The first result is the session: a refetch must not swap the items (or
    // the empty state) in under the engine.
    const [session, setSession] = useState<PathDueItems | null>(null);
    const [result, setResult] = useState<SessionCompletePayload | null>(null);
    const [finished, setFinished] = useState(false);
    if (!session && review.data) setSession(review.data);

    if (finished) {
        return <ReviewSummary result={result} onAgain={onAgain} />;
    }

    if (!session) {
        if (review.isPending && !isOffline) {
            return (
                <div aria-busy className="space-y-5">
                    <Skeleton className="h-16 w-full rounded-2xl" />
                    <Skeleton className="h-96 w-full rounded-3xl" />
                </div>
            );
        }
        if (isOffline) {
            return (
                <EmptyState
                    icon={WifiOff}
                    title="You're offline"
                    description="Path reviews need a connection to pick the items that are due. Lessons you've already opened still work offline."
                    action={BACK_TO_PATH}
                />
            );
        }
        return <ErrorState message="Couldn't load your review." onRetry={() => void review.refetch()} />;
    }

    if (session.items.length === 0) {
        const limitReached = session.dueTotal > 0 && session.reviewsRemainingToday === 0;
        return (
            <EmptyState
                icon={CheckCircle2}
                title={limitReached ? "That's today's reviews" : "All caught up"}
                description={
                    limitReached
                        ? `You've reached your daily review limit. ${session.dueTotal} Path items will wait for tomorrow.`
                        : "Nothing from the path is due right now. Come back later, or take the next lesson."
                }
                action={BACK_TO_PATH}
            />
        );
    }

    return (
        <PracticeStep
            items={session.items}
            lessonTitle="Wordsly Path"
            subtitle={`Review · ${session.items.length} of ${session.dueTotal} due`}
            onExit={() => router.push("/path")}
            onDone={(payload) => {
                setResult(payload ?? null);
                setFinished(true);
            }}
        />
    );
}

function ReviewSummary({
    result,
    onAgain,
}: Readonly<{ result: SessionCompletePayload | null; onAgain: () => void }>) {
    const reviewed = result ? new Set(result.wordResults.map((r) => r.wordId)).size : 0;
    // Refetched once this session's answers are saved (the save invalidates it).
    const due = usePathDueCountQuery();
    const moreDue = due.data?.sessionCount ?? 0;
    // The daily session goes on to new material once reviews are done.
    const tree = usePathTreeQuery();
    const me = usePathMeQuery();
    const upNext =
        tree.data && me.data
            ? buildDailyPlan({ tree: tree.data, me: me.data, dueSessionCount: undefined }).find(
                  (step) => step.kind !== "review",
              )
            : undefined;

    return (
        <section className="glass-surface flex flex-col items-center gap-5 rounded-3xl p-6 text-center sm:p-10">
            <Mascot mood="celebrate" />
            <div className="space-y-1">
                <h1 className="font-display text-3xl font-bold">Review done!</h1>
                <p className="text-muted-foreground">
                    FSRS will bring these back when they&apos;re due again.
                </p>
            </div>

            <dl className="grid w-full max-w-sm grid-cols-2 gap-3">
                <div className="rounded-2xl border-2 border-border bg-card p-4">
                    <dt className="text-xs font-semibold uppercase text-muted-foreground">Reviewed</dt>
                    <dd className="font-display text-2xl font-bold">{reviewed}</dd>
                </div>
                <div className="rounded-2xl border-2 border-border bg-card p-4">
                    <dt className="text-xs font-semibold uppercase text-muted-foreground">Accuracy</dt>
                    <dd className="font-display text-2xl font-bold">
                        {result ? `${result.score}%` : "–"}
                    </dd>
                </div>
            </dl>

            <div className="flex flex-col gap-3 sm:flex-row">
                {upNext && (
                    <Button variant="play" size="lg" asChild>
                        <Link href={upNext.href}>
                            {upNext.kind === "lesson" ? `Up next: ${upNext.title}` : "Up next: unit test"}
                        </Link>
                    </Button>
                )}
                {moreDue > 0 && !due.isFetching && (
                    <Button variant={upNext ? "playOutline" : "play"} size="lg" onClick={onAgain}>
                        Review {moreDue} more
                    </Button>
                )}
                <Button variant="playOutline" size="lg" asChild>
                    <Link href="/path">Back to the path</Link>
                </Button>
            </div>
        </section>
    );
}
