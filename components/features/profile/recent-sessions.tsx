"use client";

import { EmptyState } from "@/components/common/states";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    getSessionHistorySnapshot,
    type SessionHistoryEntry,
} from "@/lib/session-history";
import { History, Sparkles } from "lucide-react";
import { useSyncExternalStore } from "react";

const EMPTY: SessionHistoryEntry[] = [];
// History only changes across navigations (written on session finish), so a
// no-op subscribe is sufficient; this reads localStorage client-side without
// a hydration mismatch (server snapshot is empty).
const subscribe = () => () => {};

function relativeDay(iso: string): string {
    const d = new Date(iso);
    const today = new Date();
    const diffDays = Math.floor(
        (today.setHours(0, 0, 0, 0) - new Date(d).setHours(0, 0, 0, 0)) /
            86_400_000,
    );
    if (diffDays <= 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function RecentSessions() {
    const history = useSyncExternalStore(
        subscribe,
        getSessionHistorySnapshot,
        () => EMPTY,
    );

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5 text-primary" />
                    Recent sessions
                </CardTitle>
                <CardDescription>Your last practice sessions</CardDescription>
            </CardHeader>
            <CardContent>
                {history.length === 0 ? (
                    <EmptyState
                        title="No sessions yet"
                        description="Finish a practice session and it'll show up here."
                    />
                ) : (
                    <ul className="space-y-2">
                        {history.slice(0, 8).map((s) => (
                            <li
                                key={s.at}
                                className="flex items-center justify-between gap-3 rounded-2xl border-2 border-border bg-card/60 p-3"
                            >
                                <div className="min-w-0">
                                    <p className="truncate font-semibold">
                                        {s.courseName ?? "Practice session"}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {relativeDay(s.at)} · {s.words} words ·{" "}
                                        {s.score}%
                                    </p>
                                </div>
                                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[var(--brand-warning)]/20 px-2.5 py-1 text-xs font-bold tabular-nums text-[var(--brand-orange)]">
                                    <Sparkles className="h-3 w-3" />+{s.xp}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </CardContent>
        </Card>
    );
}
