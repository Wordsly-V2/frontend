"use client";

import {
    ArchiveRestoreButtons,
    EditorHeader,
    Feedback,
    Field,
    Section,
    SelectField,
    SlugField,
    useEditorLoad,
    useUnsavedWarning,
} from "@/components/features/admin-path/admin-form-parts";
import { QuestionListEditor, type QuestionListForm } from "@/components/features/admin-path/question-editor";
import { jsonBridge, JsonToolsButton } from "@/components/features/admin-path/json-tools";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminErrorMessages } from "@/lib/admin-path/errors";
import { pathOptions } from "@/lib/admin-path/path-options";
import {
    checkpointFormSchema,
    checkpointFormToRecord,
    emptyCheckpointForm,
    recordToCheckpointForm,
    type CheckpointFormValues,
} from "@/lib/admin-path/question-form";
import { useAdminPathOverviewQuery, useSaveAdminRecordMutation } from "@/queries/admin-path.query";
import type { AdminValidation, ContentStatus, RowOrigin } from "@/types/admin-path/admin-path.type";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

/** /admin/path/checkpoint/[slug] (or `new?unit=`): a unit's end-of-unit test. */
export function AdminCheckpointEditor({ slug, unit }: Readonly<{ slug: string; unit?: string }>) {
    const load = useEditorLoad("checkpoint", slug, "unit test");
    if (load.gate) return load.gate;
    return (
        <CheckpointForm
            key={slug}
            slug={load.record ? slug : null}
            initial={load.record ? recordToCheckpointForm(load.record.record) : emptyCheckpointForm(unit)}
            status={load.record?.status}
            origin={load.record?.origin}
        />
    );
}

function CheckpointForm({
    slug,
    initial,
    status,
    origin,
}: Readonly<{
    slug: string | null;
    initial: CheckpointFormValues;
    status?: ContentStatus;
    origin?: RowOrigin;
}>) {
    const router = useRouter();
    const overview = useAdminPathOverviewQuery();
    const save = useSaveAdminRecordMutation();
    const [serverErrors, setServerErrors] = useState<string[]>([]);
    const [validation, setValidation] = useState<AdminValidation | null>(null);
    const archived = status === "ARCHIVED";

    const form = useForm<CheckpointFormValues>({
        resolver: zodResolver(checkpointFormSchema),
        defaultValues: initial,
    });
    const { register, handleSubmit, formState } = form;
    const errors = formState.errors;
    useUnsavedWarning(formState.isDirty);

    const submit = handleSubmit((values) => {
        setServerErrors([]);
        save.mutate(
            { kind: "checkpoint", slug, body: checkpointFormToRecord(values) },
            {
                onSuccess: (result) => {
                    setValidation(result.validation);
                    form.reset(recordToCheckpointForm(result.record));
                    toast.success(slug ? "Saved as a draft" : "Unit test created as a draft");
                    if (!slug) router.replace(`/admin/path/checkpoint/${result.slug}`);
                },
                onError: (error) => setServerErrors(adminErrorMessages(error)),
            },
        );
    });

    const { units, items } = pathOptions(overview.data, initial.unit);

    return (
        <form onSubmit={submit} className="space-y-6" noValidate>
            <EditorHeader title={slug ? `Unit test ${slug}` : "New unit test"} status={status} origin={origin} />

            {archived && (
                <p className="rounded-xl bg-muted p-3 text-sm">
                    This unit test is archived: from the next publish the unit opens the next one without a test. Restore it to edit.
                </p>
            )}

            <fieldset disabled={archived} className="space-y-6">
                <Section title="Unit test">
                    <div className="grid gap-4 sm:grid-cols-3">
                        <SlugField what="unit test" locked={!!slug} error={errors.slug?.message} registration={register("slug")} />
                        <SelectField
                            label="Unit"
                            error={errors.unit?.message}
                            options={units}
                            placeholder="Choose a unit…"
                            registration={register("unit")}
                        />
                        <Field label="Pass mark (%)" error={errors.passPercent?.message}>
                            <Input {...register("passPercent")} inputMode="numeric" />
                        </Field>
                    </div>
                </Section>

                <Section title="Questions">
                    <QuestionListEditor form={form as unknown as QuestionListForm} items={items} />
                </Section>
            </fieldset>

            <Feedback serverErrors={serverErrors} validation={validation} hasClientErrors={Object.keys(errors).length > 0} />

            <div className="flex flex-wrap items-center gap-3">
                {!archived && (
                    <Button type="submit" variant="play" disabled={save.isPending}>
                        {save.isPending ? "Saving…" : slug ? "Save draft" : "Create unit test"}
                    </Button>
                )}
                <JsonToolsButton
                    bridge={jsonBridge(form, checkpointFormSchema, checkpointFormToRecord, recordToCheckpointForm)}
                    slug={slug}
                    disabled={archived}
                />
                {slug && <ArchiveRestoreButtons kind="checkpoint" slug={slug} archived={archived} onValidation={setValidation} />}
            </div>
        </form>
    );
}
