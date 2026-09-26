"use client";

import { FormDialog } from "@/components/common/form-dialog";
import { Label } from "@/components/ui/label";
import { adminErrorMessages } from "@/lib/admin-path/errors";
import { usePublishAdminReleaseMutation } from "@/queries/admin-path.query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

/**
 * Publishing makes the whole working copy what learners see. It is all or
 * nothing: an invalid working copy comes back with the reasons and nothing
 * changes. Items archived since the live release are retired, which deletes
 * the learners' review cards for them, so the dialog says so up front.
 */
export function PublishDialog({
    isOpen,
    onClose,
    archivedCount,
}: Readonly<{ isOpen: boolean; onClose: () => void; archivedCount: number }>) {
    const publish = usePublishAdminReleaseMutation();
    const { register, handleSubmit, reset } = useForm<{ note: string }>({ defaultValues: { note: "" } });
    const [errors, setErrors] = useState<string[]>([]);

    const close = () => {
        setErrors([]);
        onClose();
    };

    const submit = handleSubmit(({ note }) => {
        setErrors([]);
        publish.mutate(note.trim() || undefined, {
            onSuccess: (release) => {
                toast.success(`Release v${release.version} is live`, {
                    description:
                        release.retiredItemIds.length > 0
                            ? `${release.retiredItemIds.length} archived items were retired.`
                            : undefined,
                });
                reset();
                close();
            },
            onError: (error) => setErrors(adminErrorMessages(error)),
        });
    });

    return (
        <FormDialog
            isOpen={isOpen}
            onClose={close}
            title="Publish to learners"
            onSubmit={submit}
            submitLabel="Publish"
            isLoading={publish.isPending}
        >
            <p className="text-sm text-muted-foreground">
                Everything in the working copy that isn&apos;t archived goes live now. Drafts become live.
            </p>
            {archivedCount > 0 && (
                <p className="rounded-xl bg-[var(--brand-warning)]/15 p-3 text-sm">
                    Archived items that learners have now will be retired: their review cards are deleted.
                    Rolling back later brings the items back, but not those cards.
                </p>
            )}
            <div className="space-y-2">
                <Label htmlFor="release-note">What changed (optional)</Label>
                <textarea
                    id="release-note"
                    maxLength={500}
                    {...register("note")}
                    rows={3}
                    className="w-full rounded-xl border-2 border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                />
            </div>
            {errors.length > 0 && (
                <div role="alert" className="space-y-1 rounded-xl bg-destructive/10 p-3 text-sm">
                    <p className="font-semibold text-destructive">{errors[0]}</p>
                    <ul className="max-h-40 list-disc overflow-y-auto pl-5">
                        {errors.slice(1).map((e) => (
                            <li key={e}>{e}</li>
                        ))}
                    </ul>
                </div>
            )}
        </FormDialog>
    );
}
