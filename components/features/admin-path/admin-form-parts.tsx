"use client";

import ConfirmDialog from "@/components/common/confirm-dialog/confirm-dialog";
import { OriginBadge, StatusBadge } from "@/components/features/admin-path/admin-badges";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { adminErrorMessages } from "@/lib/admin-path/errors";
import { useArchiveAdminRecordMutation, useRestoreAdminRecordMutation } from "@/queries/admin-path.query";
import type { AdminKind, AdminValidation, ContentStatus, RowOrigin } from "@/types/admin-path/admin-path.type";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

/** Pieces shared by the admin editors (item, lesson, raw record). */

export const FIELD =
    "w-full rounded-xl border-2 border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none";

export function Feedback({
    serverErrors,
    validation,
    hasClientErrors = false,
}: Readonly<{ serverErrors: string[]; validation: AdminValidation | null; hasClientErrors?: boolean }>) {
    return (
        <div aria-live="polite" className="space-y-3">
            {hasClientErrors && <FieldError message="Some fields need fixing (marked above)." />}
            {serverErrors.length > 0 && (
                <div role="alert" className="space-y-1 rounded-xl bg-destructive/10 p-3 text-sm">
                    <p className="font-semibold text-destructive">{serverErrors[0]}</p>
                    <ul className="list-disc pl-5">
                        {serverErrors.slice(1).map((e) => (
                            <li key={e}>{e}</li>
                        ))}
                    </ul>
                </div>
            )}
            {validation && !validation.ok && (
                <div className="space-y-1 rounded-xl bg-[var(--brand-warning)]/15 p-3 text-sm">
                    <p className="font-semibold">Saved. Before the next publish, fix:</p>
                    <ul className="max-h-40 list-disc overflow-y-auto pl-5">
                        {validation.errors.map((e) => (
                            <li key={e}>{e}</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

export function Section({ title, action, children }: Readonly<{ title: string; action?: React.ReactNode; children: React.ReactNode }>) {
    return (
        <section className="glass-surface space-y-4 rounded-2xl p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2">
                <h2 className="font-semibold">{title}</h2>
                {action}
            </div>
            {children}
        </section>
    );
}

export function Field({ label, error, children }: Readonly<{ label: string; error?: string; children: React.ReactNode }>) {
    return (
        <div className="space-y-1.5">
            <Label className="text-sm">{label}</Label>
            {children}
            {error && <FieldError message={error} />}
        </div>
    );
}

export function FieldError({ message }: Readonly<{ message: string }>) {
    return <p className="text-xs text-destructive">{message}</p>;
}

export function Row({ onRemove, children }: Readonly<{ onRemove: () => void; children: React.ReactNode }>) {
    return (
        <div className="grid items-end gap-3 rounded-xl border-2 border-border p-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
            {children}
            <Button type="button" variant="ghost" size="icon" onClick={onRemove} aria-label="Remove">
                <Trash2 className="h-4 w-4" aria-hidden />
            </Button>
        </div>
    );
}

export function AddButton({ onClick, label }: Readonly<{ onClick: () => void; label: string }>) {
    return (
        <Button type="button" size="sm" variant="outline" onClick={onClick} className="gap-1">
            <Plus className="h-3.5 w-3.5" aria-hidden /> {label}
        </Button>
    );
}

/**
 * Archive (with a confirmation that says what it costs) or restore one record.
 * Reports the working copy's validation after the change.
 */
export function ArchiveRestoreButtons({
    kind,
    slug,
    archived,
    onValidation,
}: Readonly<{
    kind: AdminKind;
    slug: string;
    archived: boolean;
    onValidation: (validation: AdminValidation) => void;
}>) {
    const archive = useArchiveAdminRecordMutation();
    const restore = useRestoreAdminRecordMutation();
    const [confirming, setConfirming] = useState(false);

    const doArchive = () =>
        archive.mutate(
            { kind, slug },
            {
                onSuccess: (result) => {
                    setConfirming(false);
                    onValidation(result.validation);
                    toast.success("Archived");
                },
                onError: (error) => toast.error(adminErrorMessages(error)[0]),
            },
        );

    const doRestore = () =>
        restore.mutate(
            { kind, slug },
            {
                onSuccess: (result) => {
                    onValidation(result.validation);
                    toast.success("Restored as a draft");
                },
                onError: (error) => toast.error(adminErrorMessages(error)[0]),
            },
        );

    return (
        <>
            {archived ? (
                <Button type="button" variant="play" onClick={doRestore} disabled={restore.isPending}>
                    Restore
                </Button>
            ) : (
                <Button type="button" variant="outline" onClick={() => setConfirming(true)}>
                    Archive
                </Button>
            )}
            <ConfirmDialog
                isOpen={confirming}
                onClose={() => setConfirming(false)}
                onConfirm={doArchive}
                title={`Archive this ${kind}?`}
                description={ARCHIVE_NOTE[kind]}
                confirmText="Archive"
                variant="destructive"
                isLoading={archive.isPending}
            />
        </>
    );
}

const ARCHIVE_NOTE: Record<AdminKind, string> = {
    item: "Lessons that still link it will block publishing until they drop it. After the next publish, learners lose their review cards for it.",
    lesson: "It leaves the path at the next publish. Items it introduces then need another lesson to introduce them, or publishing is blocked.",
    dialogue: "Steps that play it will block publishing until they drop it.",
    checkpoint: "The unit will open the next one when its lessons are done, without a test, from the next publish.",
    unit: "Only an empty unit can be archived: archive its lessons, items, dialogues and test first.",
    placement: "Learners lose the placement test from the next publish (their past results stay). Only one test can be live, so archive this one before creating another.",
};

/** Header of an editor page: back link, title, status. */
export function EditorHeader({
    title,
    status,
    origin,
}: Readonly<{ title: string; status?: ContentStatus; origin?: RowOrigin }>) {
    return (
        <header className="space-y-2">
            <Link href="/admin/path" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" aria-hidden /> All content
            </Link>
            <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-2xl font-bold">{title}</h1>
                {status && <StatusBadge status={status} />}
                {origin && <OriginBadge origin={origin} />}
            </div>
        </header>
    );
}

/** Warns before leaving the page with unsaved edits. */
export function useUnsavedWarning(dirty: boolean): void {
    useEffect(() => {
        if (!dirty) return;
        const warn = (e: BeforeUnloadEvent) => e.preventDefault();
        globalThis.addEventListener("beforeunload", warn);
        return () => globalThis.removeEventListener("beforeunload", warn);
    }, [dirty]);
}
