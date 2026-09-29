"use client";

import {
    ArchiveRestoreButtons,
    EditorHeader,
    Feedback,
    Field,
    Section,
    SlugField,
    useEditorLoad,
    useUnsavedWarning,
} from "@/components/features/admin-path/admin-form-parts";
import { QuestionListEditor, type QuestionListForm } from "@/components/features/admin-path/question-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminErrorMessages } from "@/lib/admin-path/errors";
import { pathOptions } from "@/lib/admin-path/path-options";
import {
    emptyPlacementForm,
    placementFormSchema,
    placementFormToRecord,
    placementWarnings,
    recordToPlacementForm,
    type PlacementFormValues,
} from "@/lib/admin-path/question-form";
import { useAdminPathOverviewQuery, useSaveAdminRecordMutation } from "@/queries/admin-path.query";
import type { AdminValidation, ContentStatus, RowOrigin } from "@/types/admin-path/admin-path.type";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

/** /admin/path/placement/[slug] (or `new`): the one placement test, questions grouped by the unit they probe. */
export function AdminPlacementEditor({ slug }: Readonly<{ slug: string }>) {
    const load = useEditorLoad("placement", slug, "placement test");
    if (load.gate) return load.gate;
    return (
        <PlacementForm
            key={slug}
            slug={load.record ? slug : null}
            initial={load.record ? recordToPlacementForm(load.record.record) : emptyPlacementForm()}
            status={load.record?.status}
            origin={load.record?.origin}
        />
    );
}

function PlacementForm({
    slug,
    initial,
    status,
    origin,
}: Readonly<{
    slug: string | null;
    initial: PlacementFormValues;
    status?: ContentStatus;
    origin?: RowOrigin;
}>) {
    const router = useRouter();
    const overview = useAdminPathOverviewQuery();
    const save = useSaveAdminRecordMutation();
    const [serverErrors, setServerErrors] = useState<string[]>([]);
    const [validation, setValidation] = useState<AdminValidation | null>(null);
    const archived = status === "ARCHIVED";

    const form = useForm<PlacementFormValues>({
        resolver: zodResolver(placementFormSchema),
        defaultValues: initial,
    });
    const { register, control, handleSubmit, formState } = form;
    const errors = formState.errors;
    const questions = useWatch({ control, name: "questions" });
    useUnsavedWarning(formState.isDirty);

    const submit = handleSubmit((values) => {
        setServerErrors([]);
        save.mutate(
            { kind: "placement", slug, body: placementFormToRecord(values) },
            {
                onSuccess: (result) => {
                    setValidation(result.validation);
                    form.reset(recordToPlacementForm(result.record));
                    toast.success(slug ? "Saved as a draft" : "Placement test created as a draft");
                    if (!slug) router.replace(`/admin/path/placement/${result.slug}`);
                },
                onError: (error) => setServerErrors(adminErrorMessages(error)),
            },
        );
    });

    const { units, items } = pathOptions(overview.data);
    const warnings = placementWarnings(
        questions ?? [],
        units.map((u) => u.value),
    );

    return (
        <form onSubmit={submit} className="space-y-6" noValidate>
            <EditorHeader title={slug ? `Placement test ${slug}` : "New placement test"} status={status} origin={origin} />

            {archived && (
                <p className="rounded-xl bg-muted p-3 text-sm">
                    This placement test is archived: learners lose it from the next publish. Restore it to edit.
                </p>
            )}

            <fieldset disabled={archived} className="space-y-6">
                <Section title="Placement test">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <SlugField what="placement test" locked={!!slug} error={errors.slug?.message} registration={register("slug")} />
                        <Field label="Title" error={errors.title?.message}>
                            <Input {...register("title")} />
                        </Field>
                    </div>
                </Section>

                <Section title={`Questions (${questions?.length ?? 0})`}>
                    <p className="text-sm text-muted-foreground">
                        Each question probes one unit: a learner who gets a unit&apos;s questions right starts after it. Keep them in path
                        order, at least 2 per unit.
                    </p>
                    {warnings.length > 0 && (
                        <ul className="list-disc space-y-1 rounded-xl bg-[var(--brand-warning)]/15 p-3 pl-8 text-sm">
                            {warnings.map((w) => (
                                <li key={w}>{w}</li>
                            ))}
                        </ul>
                    )}
                    <QuestionListEditor form={form as unknown as QuestionListForm} items={items} units={units} />
                </Section>
            </fieldset>

            <Feedback serverErrors={serverErrors} validation={validation} hasClientErrors={Object.keys(errors).length > 0} />

            <div className="flex flex-wrap items-center gap-3">
                {!archived && (
                    <Button type="submit" variant="play" disabled={save.isPending}>
                        {save.isPending ? "Saving…" : slug ? "Save draft" : "Create placement test"}
                    </Button>
                )}
                {slug && <ArchiveRestoreButtons kind="placement" slug={slug} archived={archived} onValidation={setValidation} />}
            </div>
        </form>
    );
}
