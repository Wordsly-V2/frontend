"use client";

import {
    ArchiveRestoreButtons,
    EditorHeader,
    FIELD,
    Feedback,
    Field,
    ListField,
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
    emptyUnitForm,
    recordToUnitForm,
    unitFormSchema,
    unitFormToRecord,
    type UnitFormValues,
} from "@/lib/admin-path/stage-form";
import { useSaveAdminRecordMutation } from "@/queries/admin-path.query";
import type { AdminStageNode, AdminValidation, ContentStatus, RowOrigin } from "@/types/admin-path/admin-path.type";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";

/**
 * /admin/path/unit/[slug] (or `new?stage=`): a unit's own fields. Its lessons,
 * items, dialogues and test have their own editors.
 */
export function AdminUnitEditor({ slug, stage }: Readonly<{ slug: string; stage?: string }>) {
    const load = useEditorLoad("unit", slug);
    if (load.gate) return load.gate;
    // A new unit goes after the last one of its stage.
    const inStage = load.tree.stages.find((s) => s.slug === stage)?.units ?? [];
    const nextOrder = Math.max(0, ...inStage.map((u) => u.order)) + 1;
    return (
        <UnitForm
            key={slug}
            slug={load.record ? slug : null}
            initial={load.record ? recordToUnitForm(load.record.record) : emptyUnitForm(stage, nextOrder)}
            status={load.record?.status}
            origin={load.record?.origin}
            stages={load.tree.stages}
        />
    );
}

function UnitForm({
    slug,
    initial,
    status,
    origin,
    stages,
}: Readonly<{
    slug: string | null;
    initial: UnitFormValues;
    status?: ContentStatus;
    origin?: RowOrigin;
    stages: AdminStageNode[];
}>) {
    const router = useRouter();
    const save = useSaveAdminRecordMutation();
    const [serverErrors, setServerErrors] = useState<string[]>([]);
    const [validation, setValidation] = useState<AdminValidation | null>(null);
    const archived = status === "ARCHIVED";

    const form = useForm<UnitFormValues>({ resolver: zodResolver(unitFormSchema), defaultValues: initial });
    const { register, control, handleSubmit, formState } = form;
    const errors = formState.errors;
    const canDo = useFieldArray({ control, name: "canDo" });
    useUnsavedWarning(formState.isDirty);

    const submit = handleSubmit((values) => {
        setServerErrors([]);
        save.mutate(
            { kind: "unit", slug, body: unitFormToRecord(values) },
            {
                onSuccess: (result) => {
                    setValidation(result.validation);
                    form.reset(recordToUnitForm(result.record));
                    toast.success(slug ? "Saved as a draft" : "Unit created as a draft");
                    if (!slug) router.replace(`/admin/path/unit/${result.slug}`);
                },
                onError: (error) => setServerErrors(adminErrorMessages(error)),
            },
        );
    });

    // Archived stages stay listed only when the unit is already in one.
    const stageOptions = stages
        .filter((s) => s.status !== "ARCHIVED" || s.slug === initial.stage)
        .map((s) => ({ value: s.slug, label: `${s.order}. ${s.title} (${s.cefr.replace("_", "-")})` }));

    return (
        <form onSubmit={submit} className="space-y-6" noValidate>
            <EditorHeader title={slug ? `Unit ${slug}` : "New unit"} status={status} origin={origin} />

            {archived && (
                <p className="rounded-xl bg-muted p-3 text-sm">
                    This unit is archived: it leaves the path at the next publish. Restore it to edit.
                </p>
            )}

            <fieldset disabled={archived} className="space-y-6">
                <Section title="Unit">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <SlugField what="unit" locked={!!slug} error={errors.slug?.message} registration={register("slug")} />
                        <SelectField
                            label="Stage"
                            error={errors.stage?.message}
                            options={stageOptions}
                            placeholder="Choose a stage…"
                            registration={register("stage")}
                        />
                        <Field label="Title (English)" error={errors.title?.message}>
                            <Input {...register("title")} />
                        </Field>
                        <Field label="Title (Vietnamese)" error={errors.titleVi?.message}>
                            <Input {...register("titleVi")} />
                        </Field>
                        <Field label="Position in the stage" error={errors.order?.message}>
                            <Input {...register("order")} inputMode="numeric" />
                        </Field>
                    </div>
                    <Field label="Description (Vietnamese, optional)" error={errors.descriptionVi?.message}>
                        <textarea {...register("descriptionVi")} rows={3} className={FIELD} />
                    </Field>
                </Section>

                <Section title="What learners can do after it">
                    <p className="text-sm text-muted-foreground">One statement per box, in Vietnamese, like &quot;Tôi gọi được đồ uống ở quán.&quot;</p>
                    <ListField
                        label="Can-do"
                        addLabel="Add statement"
                        fields={canDo.fields}
                        registration={(i) => register(`canDo.${i}.text`)}
                        errors={canDo.fields.map((_, i) => errors.canDo?.[i]?.text?.message)}
                        error={errors.canDo?.message ?? errors.canDo?.root?.message}
                        onAdd={() => canDo.append({ text: "" })}
                        onRemove={(i) => canDo.remove(i)}
                    />
                </Section>
            </fieldset>

            <Feedback serverErrors={serverErrors} validation={validation} hasClientErrors={Object.keys(errors).length > 0} />

            <div className="flex flex-wrap items-center gap-3">
                {!archived && (
                    <Button type="submit" variant="play" disabled={save.isPending}>
                        {save.isPending ? "Saving…" : slug ? "Save draft" : "Create unit"}
                    </Button>
                )}
                {slug && <ArchiveRestoreButtons kind="unit" slug={slug} archived={archived} onValidation={setValidation} />}
            </div>
        </form>
    );
}
