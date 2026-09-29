"use client";

import { EmptyState, Skeleton } from "@/components/common/states";
import { AdminCheckpointEditor } from "@/components/features/admin-path/checkpoint-editor";
import { AdminDialogueEditor } from "@/components/features/admin-path/dialogue-editor";
import { AdminLessonEditor } from "@/components/features/admin-path/lesson-editor";
import { AdminPlacementEditor } from "@/components/features/admin-path/placement-editor";
import { AdminRecordJsonEditor } from "@/components/features/admin-path/record-json-editor";
import { AdminStageEditor } from "@/components/features/admin-path/stage-editor";
import { AdminUnitEditor } from "@/components/features/admin-path/unit-editor";
import { ADMIN_KINDS, type AdminKind } from "@/types/admin-path/admin-path.type";
import { useSearchParams } from "next/navigation";
import { Suspense, use } from "react";

/** /admin/path/[kind]/[slug]: every kind has a form (items have their own route). */
export default function AdminRecordPage({ params }: Readonly<{ params: Promise<{ kind: string; slug: string }> }>) {
    const { kind, slug } = use(params);
    const known = (ADMIN_KINDS as readonly string[]).includes(kind);

    return (
        <main className="min-h-dvh px-4 pb-24 pt-6 md:px-8 md:pt-10">
            <div className="mx-auto max-w-4xl">
                {known ? (
                    <Suspense fallback={<Skeleton className="h-96 w-full rounded-2xl" />}>
                        <Editor kind={kind as AdminKind} slug={slug} />
                    </Suspense>
                ) : (
                    <EmptyState title="Unknown content type" description={`There is no "${kind}" to edit.`} />
                )}
            </div>
        </main>
    );
}

/** `?unit=` preselects the unit of a new record, `?stage=` the stage of a new unit. */
function Editor({ kind, slug }: Readonly<{ kind: AdminKind; slug: string }>) {
    const params = useSearchParams();
    const unit = params.get("unit") ?? undefined;
    if (kind === "stage") return <AdminStageEditor slug={slug} />;
    if (kind === "unit") return <AdminUnitEditor slug={slug} stage={params.get("stage") ?? undefined} />;
    if (kind === "checkpoint") return <AdminCheckpointEditor slug={slug} unit={unit} />;
    if (kind === "placement") return <AdminPlacementEditor slug={slug} />;
    if (kind === "lesson") return <AdminLessonEditor slug={slug} unit={unit} />;
    if (kind === "dialogue") return <AdminDialogueEditor slug={slug} unit={unit} />;
    return <AdminRecordJsonEditor kind={kind} slug={slug} />;
}
