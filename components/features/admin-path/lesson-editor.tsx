"use client";

import {
    AddButton,
    ArchiveRestoreButtons,
    EditorHeader,
    FIELD,
    Feedback,
    Field,
    FieldError,
    Section,
    useEditorLoad,
    useUnsavedWarning,
} from "@/components/features/admin-path/admin-form-parts";
import { jsonBridge, JsonToolsButton } from "@/components/features/admin-path/json-tools";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StepListEditor, type LinkedItem } from "@/components/features/admin-path/step-editor";
import { adminErrorMessages } from "@/lib/admin-path/errors";
import {
    emptyLessonForm,
    LESSON_ITEM_ROLES,
    lessonFormSchema,
    lessonFormToRecord,
    recordToLessonForm,
    type LessonFormValues,
} from "@/lib/admin-path/lesson-form";
import {
    useAdminPathOverviewQuery,
    useSaveAdminRecordMutation,
} from "@/queries/admin-path.query";
import type { AdminValidation, ContentStatus, RowOrigin } from "@/types/admin-path/admin-path.type";
import { zodResolver } from "@hookform/resolvers/zod";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

/**
 * /admin/path/lesson/[slug] (or `new?unit=`): a lesson as a whole, the way it
 * is hashed and published: its fields, the items it links, and its steps.
 * Each step type has its own form; the server checks what crosses records.
 */
export function AdminLessonEditor({ slug, unit }: Readonly<{ slug: string; unit?: string }>) {
    const load = useEditorLoad("lesson", slug);
    if (load.gate) return load.gate;
    return (
        <LessonForm
            key={slug}
            slug={load.record ? slug : null}
            initial={load.record ? recordToLessonForm(load.record.record) : emptyLessonForm(unit)}
            status={load.record?.status}
            origin={load.record?.origin}
        />
    );
}

function LessonForm({
    slug,
    initial,
    status,
    origin,
}: Readonly<{ slug: string | null; initial: LessonFormValues; status?: ContentStatus; origin?: RowOrigin }>) {
    const router = useRouter();
    const overview = useAdminPathOverviewQuery();
    const save = useSaveAdminRecordMutation();
    const [serverErrors, setServerErrors] = useState<string[]>([]);
    const [validation, setValidation] = useState<AdminValidation | null>(null);
    const archived = status === "ARCHIVED";

    const form = useForm<LessonFormValues>({ resolver: zodResolver(lessonFormSchema), defaultValues: initial });
    const { register, control, handleSubmit, formState } = form;
    const errors = formState.errors;
    const links = useFieldArray({ control, name: "items" });
    const linkedItems = useWatch({ control, name: "items" });
    const lessonUnit = useWatch({ control, name: "unit" });
    useUnsavedWarning(formState.isDirty);

    const submit = handleSubmit((values) => {
        setServerErrors([]);
        save.mutate(
            { kind: "lesson", slug, body: lessonFormToRecord(values) },
            {
                onSuccess: (result) => {
                    setValidation(result.validation);
                    form.reset(recordToLessonForm(result.record));
                    toast.success(slug ? "Saved as a draft" : "Lesson created as a draft");
                    if (!slug) router.replace(`/admin/path/lesson/${result.slug}`);
                },
                onError: (error) => setServerErrors(adminErrorMessages(error)),
            },
        );
    });

    const stages = overview.data?.stages ?? [];
    const units = stages.flatMap((stage) =>
        stage.units.map((u) => ({ slug: u.slug, label: `${stage.title} · ${u.order}. ${u.title}` })),
    );
    // Any item can be recycled, so the picker lists them all.
    const allItems = stages.flatMap((stage) => stage.units.flatMap((u) => u.itemList));
    const itemBySlug = new Map(allItems.map((item) => [item.slug, item]));
    // What the steps may use: the items linked above, and the unit's dialogues.
    const linked: LinkedItem[] = (linkedItems ?? [])
        .filter((link) => link.item.trim())
        .map((link) => {
            const item = itemBySlug.get(link.item.trim());
            return { slug: link.item.trim(), text: item?.text ?? "(unknown item)", type: item?.type ?? "", introduced: link.role === "INTRODUCE" };
        });
    const dialogues = (stages.flatMap((stage) => stage.units).find((u) => u.slug === lessonUnit)?.dialogues ?? [])
        .filter((d) => d.status !== "ARCHIVED")
        .map((d) => ({ value: d.slug, label: `${d.slug} · ${d.title}` }));

    return (
        <form onSubmit={submit} className="space-y-6" noValidate>
            <EditorHeader title={slug ? `Lesson ${slug}` : "New lesson"} status={status} origin={origin} />

            {archived && (
                <p className="rounded-xl bg-muted p-3 text-sm">
                    This lesson is archived: it leaves the path at the next publish. Restore it to edit.
                </p>
            )}

            <fieldset disabled={archived} className="space-y-6">
                <Section title="Basics">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Slug (the lesson's id, can't change later)" error={errors.slug?.message}>
                            <Input {...register("slug")} disabled={!!slug} className="font-mono" autoComplete="off" />
                        </Field>
                        <Field label="Unit" error={errors.unit?.message}>
                            <select {...register("unit")} className={FIELD}>
                                <option value="">Choose a unit…</option>
                                {units.map((u) => (
                                    <option key={u.slug} value={u.slug}>
                                        {u.label}
                                    </option>
                                ))}
                            </select>
                        </Field>
                        <Field label="Title (English)" error={errors.title?.message}>
                            <Input {...register("title")} />
                        </Field>
                        <Field label="Title (Vietnamese)" error={errors.titleVi?.message}>
                            <Input {...register("titleVi")} />
                        </Field>
                        <Field label="Position in the unit" error={errors.order?.message}>
                            <Input {...register("order")} inputMode="numeric" />
                        </Field>
                        <Field label="Minutes" error={errors.estimatedMinutes?.message}>
                            <Input {...register("estimatedMinutes")} inputMode="numeric" />
                        </Field>
                    </div>
                </Section>

                <Section
                    title="Items"
                    action={<AddButton onClick={() => links.append({ item: "", role: "INTRODUCE" })} label="Link item" />}
                >
                    <p className="text-sm text-muted-foreground">
                        Introduce each of the unit&apos;s items in exactly one lesson; recycle items taught earlier.
                    </p>
                    <datalist id="admin-item-slugs">
                        {allItems.map((item) => (
                            <option key={item.id} value={item.slug}>
                                {item.text}
                            </option>
                        ))}
                    </datalist>
                    <ul className="space-y-2">
                        {links.fields.map((field, i) => (
                            <li key={field.id} className="flex flex-wrap items-start gap-2">
                                <div className="min-w-48 flex-1">
                                    <Input
                                        {...register(`items.${i}.item`)}
                                        list="admin-item-slugs"
                                        placeholder="item slug"
                                        aria-label={`Item ${i + 1}`}
                                        className="font-mono"
                                    />
                                    {errors.items?.[i]?.item && <FieldError message={errors.items[i].item.message ?? ""} />}
                                </div>
                                <select {...register(`items.${i}.role`)} aria-label={`Role of item ${i + 1}`} className={`${FIELD} w-auto`}>
                                    {LESSON_ITEM_ROLES.map((role) => (
                                        <option key={role} value={role}>
                                            {role}
                                        </option>
                                    ))}
                                </select>
                                <Button type="button" variant="ghost" size="icon" onClick={() => links.remove(i)} aria-label="Unlink">
                                    <Trash2 className="h-4 w-4" aria-hidden />
                                </Button>
                            </li>
                        ))}
                    </ul>
                </Section>

                <Section title="Steps">
                    <StepListEditor form={form} linked={linked} dialogues={dialogues} />
                </Section>
            </fieldset>

            <Feedback serverErrors={serverErrors} validation={validation} hasClientErrors={Object.keys(errors).length > 0} />

            <div className="flex flex-wrap items-center gap-3">
                {!archived && (
                    <Button type="submit" variant="play" disabled={save.isPending}>
                        {save.isPending ? "Saving…" : slug ? "Save draft" : "Create lesson"}
                    </Button>
                )}
                <JsonToolsButton
                    bridge={jsonBridge(form, lessonFormSchema, lessonFormToRecord, recordToLessonForm)}
                    slug={slug}
                    disabled={archived}
                />
                {slug && <ArchiveRestoreButtons kind="lesson" slug={slug} archived={archived} onValidation={setValidation} />}
            </div>
        </form>
    );
}
