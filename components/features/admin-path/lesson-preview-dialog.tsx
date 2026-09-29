"use client";

import { ErrorState, Skeleton } from "@/components/common/states";
import { LessonPlayer } from "@/components/features/path/lesson-player/lesson-player";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { buildLessonPreview, lessonPreviewRefs } from "@/lib/admin-path/lesson-preview";
import { useAdminRecordsQueries } from "@/queries/admin-path.query";
import type { AdminRecordBody } from "@/types/admin-path/admin-path.type";
import { useMemo } from "react";

/**
 * The lesson as a learner would play it, from the editor's current values
 * (saved or not). Items and dialogues are read from the working copy; nothing
 * is written (see `LessonPlayer`'s `preview`).
 */
export function LessonPreviewDialog({
    record,
    onClose,
}: Readonly<{ record: AdminRecordBody | null; onClose: () => void }>) {
    return (
        <Dialog open={!!record} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
                <DialogTitle className="sr-only">Lesson preview</DialogTitle>
                <DialogDescription className="text-xs">Preview: answers and progress are not saved.</DialogDescription>
                {/* The player's forms (quiz, drills) must not submit the editor
                    behind the dialog: React events bubble through the portal. */}
                <div onSubmit={(e) => e.stopPropagation()}>{record && <PreviewBody record={record} onClose={onClose} />}</div>
            </DialogContent>
        </Dialog>
    );
}

function PreviewBody({ record, onClose }: Readonly<{ record: AdminRecordBody; onClose: () => void }>) {
    const refs = useMemo(() => lessonPreviewRefs(record), [record]);
    const items = useAdminRecordsQueries("item", refs.items);
    const dialogues = useAdminRecordsQueries("dialogue", refs.dialogues);
    const all = [...items, ...dialogues];
    const loading = all.some((q) => q.isPending);
    const failed = all.some((q) => q.isError && !q.isFetching);

    // Rebuilt only when a result changes, so the player's steps keep their identity.
    const loaded = loading ? null : all.map((q) => q.dataUpdatedAt).join();
    const built = useMemo(() => {
        if (loaded === null) return null;
        const bySlug = (list: typeof items) =>
            new Map(list.flatMap((q) => (q.data && q.data.status !== "ARCHIVED" ? [[q.data.slug, q.data.record]] : [])));
        return buildLessonPreview(record, bySlug(items), bySlug(dialogues));
        // `items` and `dialogues` are new arrays every render; `loaded` stands for their data.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loaded, record]);

    if (!built) return <Skeleton aria-busy className="h-72 w-full rounded-2xl" />;
    if (failed && built.missing.length === 0) {
        return <ErrorState message="Couldn't load the lesson's items." onRetry={() => all.forEach((q) => void q.refetch())} />;
    }
    return (
        <div className="space-y-3">
            {built.missing.length > 0 && (
                <p className="rounded-xl bg-muted p-3 text-sm">
                    Not found or archived, so left out: {built.missing.join(", ")}.
                </p>
            )}
            <LessonPlayer lesson={built.lesson} preview={{ onExit: onClose }} />
        </div>
    );
}
