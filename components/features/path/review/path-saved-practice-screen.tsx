"use client";

import { Mascot } from "@/components/common/motion";
import { EmptyState, ErrorState, Skeleton } from "@/components/common/states";
import { PracticeStep } from "@/components/features/path/lesson-player/practice-step";
import { Button } from "@/components/ui/button";
import { useIsOffline } from "@/hooks/useOnlineStatus.hook";
import { usePathSavedPracticeQuery } from "@/queries/path.query";
import type { PathItem } from "@/types/path/path.type";
import type { SessionCompletePayload } from "@/types/practice/practice.type";
import { Bookmark, WifiOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const BACK_TO_DIFFICULT = (
    <Button variant="play" asChild>
        <Link href="/learn/difficult">Back to difficult words</Link>
    </Button>
);

/**
 * /path/review/saved: the Wordsly Path items the learner saved as hard, drilled
 * in the embedded engine whether or not they are due. Answers go in with
 * `source: 'path'`, and the off-schedule rule in learning-service keeps a
 * correct early answer from pushing a card's review back.
 */
export function PathSavedPracticeScreen() {
    const router = useRouter();
    const isOffline = useIsOffline();
    const query = usePathSavedPracticeQuery();
    // The first result is the session, as on /path/review.
    const [items, setItems] = useState<PathItem[] | null>(null);
    const [result, setResult] = useState<SessionCompletePayload | null>(null);
    const [finished, setFinished] = useState(false);
    if (!items && query.data) setItems(query.data);

    if (finished) {
        const practised = result ? new Set(result.wordResults.map((r) => r.wordId)).size : 0;
        return (
            <section className="surface-card flex flex-col items-center gap-5 p-6 text-center sm:p-10">
                <Mascot mood="celebrate" />
                <div className="space-y-1">
                    <h1 className="font-display text-3xl font-bold">Nice work!</h1>
                    <p className="text-muted-foreground">
                        {practised} saved item{practised === 1 ? "" : "s"} practised
                        {result ? ` · ${result.score}% correct` : ""}.
                    </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                    {BACK_TO_DIFFICULT}
                    <Button variant="playOutline" asChild>
                        <Link href="/path">Back to the path</Link>
                    </Button>
                </div>
            </section>
        );
    }

    if (!items) {
        if (query.isPending && !isOffline) {
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
                    description="Saved Path items need a connection to load."
                    action={BACK_TO_DIFFICULT}
                />
            );
        }
        return <ErrorState message="Couldn't load your saved items." onRetry={() => void query.refetch()} />;
    }

    if (items.length === 0) {
        return (
            <EmptyState
                icon={Bookmark}
                title="No saved Path items"
                description="Tap the bookmark during a Path lesson to save an item you find hard."
                action={BACK_TO_DIFFICULT}
            />
        );
    }

    return (
        <PracticeStep
            items={items}
            lessonTitle="Wordsly Path"
            subtitle={`Saved items · ${items.length}`}
            onExit={() => router.push("/learn/difficult")}
            onDone={(payload) => {
                setResult(payload ?? null);
                setFinished(true);
            }}
        />
    );
}
