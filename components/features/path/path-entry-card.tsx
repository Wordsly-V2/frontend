"use client";

import { Bounce } from "@/components/common/motion";
import { findLesson } from "@/lib/path/path-tree";
import { usePathMeQuery, usePathTreeQuery } from "@/queries/path.query";
import { ArrowRight, Route } from "lucide-react";
import Link from "next/link";

/**
 * The way into Wordsly Path from /learn: where the learner is, or an invitation
 * to start. Renders nothing until the path exists.
 */
export function PathEntryCard() {
    const { data: tree } = usePathTreeQuery();
    const { data: me } = usePathMeQuery();

    if (!tree || !me) return null;

    const { completedLessonCount: done, totalLessonCount: total, currentLessonId } =
        me.progress;
    const next = findLesson(tree, currentLessonId);

    let subtitle = "Short lessons from your first words to real conversations.";
    if (me.enrolled) {
        subtitle = next
            ? `Up next: ${next.lesson.title} · ${done} of ${total} lessons done`
            : `${done} of ${total} lessons done`;
    }

    return (
        <section aria-label="Wordsly Path" className="mb-8">
            <Bounce>
                <Link
                    href="/path"
                    className="glass-surface flex items-center gap-4 rounded-3xl p-5 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl gradient-brand text-primary-foreground shadow-md">
                        <Route className="h-6 w-6" aria-hidden />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h2 className="font-display text-base font-bold sm:text-lg">
                            {me.enrolled ? "Continue Wordsly Path" : "Try Wordsly Path"}
                        </h2>
                        <p className="truncate text-sm text-muted-foreground">{subtitle}</p>
                    </div>
                    <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
                </Link>
            </Bounce>
        </section>
    );
}
