"use client";

import { ErrorState, Skeleton } from "@/components/common/states";
import {
    AddButton,
    ArchiveRestoreButtons,
    EditorHeader,
    FIELD,
    Feedback,
    Field,
    FieldError,
    Section,
    useUnsavedWarning,
} from "@/components/features/admin-path/admin-form-parts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminErrorMessages } from "@/lib/admin-path/errors";
import {
    emptyLessonForm,
    LESSON_ITEM_ROLES,
    lessonFormSchema,
    lessonFormToRecord,
    recordToLessonForm,
    STEP_TEMPLATES,
    STEP_TYPES,
    type LessonFormValues,
} from "@/lib/admin-path/lesson-form";
import {
    useAdminPathOverviewQuery,
    useAdminRecordQuery,
    useSaveAdminRecordMutation,
} from "@/queries/admin-path.query";
import type { AdminValidation, ContentStatus, RowOrigin } from "@/types/admin-path/admin-path.type";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";

/**
 * /admin/path/lesson/[slug] (or `new?unit=`): a lesson as a whole, the way it
 * is hashed and published: its fields, the items it links, and its steps.
 * Step payloads are JSON; the server checks each against its step type.
 */
export function AdminLessonEditor({ slug, unit }: Readonly<{ slug: string; unit?: string }>) {
    const isNew = slug === "new";
    const record = useAdminRecordQuery("lesson", isNew ? null : slug);

    if (!isNew && !record.data) {
        if (record.isFetching) return <Skeleton aria-busy className="h-96 w-full rounded-2xl" />;
        return <ErrorState message={`Couldn't load lesson ${slug}.`} onRetry={() => void record.refetch()} />;
    }

    return (
        <LessonForm
            key={slug}
            slug={isNew ? null : slug}
            initial={record.data ? recordToLessonForm(record.data.record) : emptyLessonForm(unit)}
            status={record.data?.status}
            origin={record.data?.origin}
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
    const { register, control, handleSubmit, formState, getValues, setValue } = form;
    const errors = formState.errors;
    const links = useFieldArray({ control, name: "items" });
    const steps = useFieldArray({ control, name: "steps" });
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

                <Section
                    title="Steps"
                    action={
                        <AddButton
                            onClick={() => steps.append({ type: "EXPLAIN", payload: JSON.stringify(STEP_TEMPLATES.EXPLAIN, null, 2) })}
                            label="Add step"
                        />
                    }
                >
                    {errors.steps?.message && <FieldError message={errors.steps.message} />}
                    <ol className="space-y-3">
                        {steps.fields.map((field, i) => (
                            <li key={field.id} className="space-y-2 rounded-xl border-2 border-border p-3">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-sm font-semibold tabular-nums">{i + 1}.</span>
                                    <select
                                        {...register(`steps.${i}.type`, {
                                            // A new type starts from its template, unless the payload was edited.
                                            onChange: (e: React.ChangeEvent<HTMLSelectElement>) => {
                                                const type = e.target.value as keyof typeof STEP_TEMPLATES;
                                                if (!formState.dirtyFields.steps?.[i]?.payload) {
                                                    setValue(`steps.${i}.payload`, JSON.stringify(STEP_TEMPLATES[type], null, 2));
                                                }
                                            },
                                        })}
                                        aria-label={`Type of step ${i + 1}`}
                                        className={`${FIELD} w-auto`}
                                    >
                                        {STEP_TYPES.map((t) => (
                                            <option key={t} value={t}>
                                                {t}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="ml-auto flex gap-1">
                                        <Button type="button" variant="ghost" size="icon" disabled={i === 0} onClick={() => steps.move(i, i - 1)} aria-label="Move up">
                                            <ArrowUp className="h-4 w-4" aria-hidden />
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            disabled={i === steps.fields.length - 1}
                                            onClick={() => steps.move(i, i + 1)}
                                            aria-label="Move down"
                                        >
                                            <ArrowDown className="h-4 w-4" aria-hidden />
                                        </Button>
                                        <Button type="button" variant="ghost" size="icon" onClick={() => steps.remove(i)} aria-label="Remove step">
                                            <Trash2 className="h-4 w-4" aria-hidden />
                                        </Button>
                                    </div>
                                </div>
                                <textarea
                                    {...register(`steps.${i}.payload`)}
                                    rows={Math.min(16, Math.max(3, getValues(`steps.${i}.payload`).split("\n").length))}
                                    spellCheck={false}
                                    aria-label={`Payload of step ${i + 1}`}
                                    className={`${FIELD} font-mono text-xs`}
                                />
                                {errors.steps?.[i]?.payload && <FieldError message={errors.steps[i].payload.message ?? ""} />}
                            </li>
                        ))}
                    </ol>
                </Section>
            </fieldset>

            <Feedback serverErrors={serverErrors} validation={validation} hasClientErrors={Object.keys(errors).length > 0} />

            <div className="flex flex-wrap items-center gap-3">
                {!archived && (
                    <Button type="submit" variant="play" disabled={save.isPending}>
                        {save.isPending ? "Saving…" : slug ? "Save draft" : "Create lesson"}
                    </Button>
                )}
                {slug && <ArchiveRestoreButtons kind="lesson" slug={slug} archived={archived} onValidation={setValidation} />}
            </div>
        </form>
    );
}
