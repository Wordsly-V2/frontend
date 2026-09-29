"use client";

import {
    ArchiveRestoreButtons,
    EditorHeader,
    FIELD,
    Feedback,
    Field,
    Section,
    SelectField,
    SlugField,
    useEditorLoad,
    useUnsavedWarning,
} from "@/components/features/admin-path/admin-form-parts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminErrorMessages } from "@/lib/admin-path/errors";
import {
    emptyStageForm,
    recordToStageForm,
    stageFormSchema,
    stageFormToRecord,
    type StageFormValues,
} from "@/lib/admin-path/stage-form";
import { useSaveAdminRecordMutation } from "@/queries/admin-path.query";
import { CEFR_LEVELS, type AdminValidation, type ContentStatus, type RowOrigin } from "@/types/admin-path/admin-path.type";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

const CEFR_OPTIONS = CEFR_LEVELS.map((level) => ({ value: level, label: level.replace("_", "-") }));

/** /admin/path/stage/[slug] (or `new`): a stage's own fields; its units have their own editors. */
export function AdminStageEditor({ slug }: Readonly<{ slug: string }>) {
    const load = useEditorLoad("stage", slug);
    if (load.gate) return load.gate;
    // A new stage goes after the last one.
    const nextOrder = Math.max(0, ...load.tree.stages.map((s) => s.order)) + 1;
    return (
        <StageForm
            key={slug}
            slug={load.record ? slug : null}
            initial={load.record ? recordToStageForm(load.record.record) : emptyStageForm(nextOrder)}
            status={load.record?.status}
            origin={load.record?.origin}
        />
    );
}

function StageForm({
    slug,
    initial,
    status,
    origin,
}: Readonly<{ slug: string | null; initial: StageFormValues; status?: ContentStatus; origin?: RowOrigin }>) {
    const router = useRouter();
    const save = useSaveAdminRecordMutation();
    const [serverErrors, setServerErrors] = useState<string[]>([]);
    const [validation, setValidation] = useState<AdminValidation | null>(null);
    const archived = status === "ARCHIVED";

    const form = useForm<StageFormValues>({ resolver: zodResolver(stageFormSchema), defaultValues: initial });
    const { register, handleSubmit, formState } = form;
    const errors = formState.errors;
    useUnsavedWarning(formState.isDirty);

    const submit = handleSubmit((values) => {
        setServerErrors([]);
        save.mutate(
            { kind: "stage", slug, body: stageFormToRecord(values) },
            {
                onSuccess: (result) => {
                    setValidation(result.validation);
                    form.reset(recordToStageForm(result.record));
                    toast.success(slug ? "Saved as a draft" : "Stage created as a draft");
                    if (!slug) router.replace(`/admin/path/stage/${result.slug}`);
                },
                onError: (error) => setServerErrors(adminErrorMessages(error)),
            },
        );
    });

    return (
        <form onSubmit={submit} className="space-y-6" noValidate>
            <EditorHeader title={slug ? `Stage ${slug}` : "New stage"} status={status} origin={origin} />

            {archived && (
                <p className="rounded-xl bg-muted p-3 text-sm">
                    This stage is archived: it leaves the path at the next publish. Restore it to edit.
                </p>
            )}

            <fieldset disabled={archived} className="space-y-6">
                <Section title="Stage">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <SlugField what="stage" locked={!!slug} error={errors.slug?.message} registration={register("slug")} />
                        <SelectField label="CEFR level" error={errors.cefr?.message} options={CEFR_OPTIONS} registration={register("cefr")} />
                        <Field label="Title (English)" error={errors.title?.message}>
                            <Input {...register("title")} />
                        </Field>
                        <Field label="Title (Vietnamese)" error={errors.titleVi?.message}>
                            <Input {...register("titleVi")} />
                        </Field>
                        <Field label="Position on the path (1 = first)" error={errors.order?.message}>
                            <Input {...register("order")} inputMode="numeric" />
                        </Field>
                    </div>
                    <Field label="Description (Vietnamese, optional)" error={errors.descriptionVi?.message}>
                        <textarea {...register("descriptionVi")} rows={3} className={FIELD} />
                    </Field>
                </Section>
            </fieldset>

            <Feedback serverErrors={serverErrors} validation={validation} hasClientErrors={Object.keys(errors).length > 0} />

            <div className="flex flex-wrap items-center gap-3">
                {!archived && (
                    <Button type="submit" variant="play" disabled={save.isPending}>
                        {save.isPending ? "Saving…" : slug ? "Save draft" : "Create stage"}
                    </Button>
                )}
                {slug && <ArchiveRestoreButtons kind="stage" slug={slug} archived={archived} onValidation={setValidation} />}
            </div>
        </form>
    );
}
