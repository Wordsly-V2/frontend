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
    Row,
    Section,
    useUnsavedWarning,
} from "@/components/features/admin-path/admin-form-parts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminErrorMessages } from "@/lib/admin-path/errors";
import {
    emptyItemForm,
    ITEM_TYPES,
    itemFormSchema,
    itemFormToRecord,
    recordToItemForm,
    type ItemFormValues,
} from "@/lib/admin-path/item-form";
import {
    useAdminPathOverviewQuery,
    useAdminRecordQuery,
    useSaveAdminRecordMutation,
} from "@/queries/admin-path.query";
import type { AdminValidation } from "@/types/admin-path/admin-path.type";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";


/**
 * /admin/path/item/[slug] (or `new?unit=`): one learn item in seed shape.
 * Saving makes it a draft; learners see it after the next publish.
 */
export function AdminItemEditor({ slug, unit }: Readonly<{ slug: string; unit?: string }>) {
    const isNew = slug === "new";
    const record = useAdminRecordQuery("item", isNew ? null : slug);

    if (!isNew && !record.data) {
        if (record.isFetching) return <Skeleton aria-busy className="h-96 w-full rounded-2xl" />;
        return <ErrorState message={`Couldn't load item ${slug}.`} onRetry={() => void record.refetch()} />;
    }

    return (
        <ItemForm
            key={slug}
            slug={isNew ? null : slug}
            initial={record.data ? recordToItemForm(record.data.record) : emptyItemForm(unit)}
            status={record.data?.status}
            origin={record.data?.origin}
        />
    );
}

function ItemForm({
    slug,
    initial,
    status,
    origin,
}: Readonly<{
    slug: string | null;
    initial: ItemFormValues;
    status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
    origin?: "seed" | "edited" | "admin";
}>) {
    const router = useRouter();
    const overview = useAdminPathOverviewQuery();
    const save = useSaveAdminRecordMutation();
    const [serverErrors, setServerErrors] = useState<string[]>([]);
    const [validation, setValidation] = useState<AdminValidation | null>(null);
    const archived = status === "ARCHIVED";

    const form = useForm<ItemFormValues>({ resolver: zodResolver(itemFormSchema), defaultValues: initial });
    const { register, control, handleSubmit, formState } = form;
    const errors = formState.errors;
    const type = useWatch({ control, name: "type" });
    const examples = useFieldArray({ control, name: "examples" });
    const slots = useFieldArray({ control, name: "pattern.slots" });
    const forms = useFieldArray({ control, name: "grammar.forms" });


    useUnsavedWarning(formState.isDirty);

    const submit = handleSubmit((values) => {
        setServerErrors([]);
        save.mutate(
            { kind: "item", slug, body: itemFormToRecord(values) },
            {
                onSuccess: (result) => {
                    setValidation(result.validation);
                    form.reset(recordToItemForm(result.record));
                    toast.success(slug ? "Saved as a draft" : "Item created as a draft");
                    if (!slug) router.replace(`/admin/path/item/${result.slug}`);
                },
                onError: (error) => setServerErrors(adminErrorMessages(error)),
            },
        );
    });

    const units = overview.data?.stages.flatMap((stage) =>
        stage.units.map((u) => ({ slug: u.slug, label: `${stage.title} · ${u.order}. ${u.title}` })),
    );

    return (
        <form onSubmit={submit} className="space-y-6" noValidate>
            <EditorHeader title={slug ? `Item ${slug}` : "New item"} status={status} origin={origin} />

            {archived && (
                <p className="rounded-xl bg-muted p-3 text-sm">
                    This item is archived: learners don&apos;t get it in new releases. Restore it to edit.
                </p>
            )}

            <fieldset disabled={archived} className="space-y-6">
                <Section title="Basics">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Slug (the item's id, can't change later)" error={errors.slug?.message}>
                            <Input {...register("slug")} disabled={!!slug} className="font-mono" autoComplete="off" />
                        </Field>
                        <Field label="Type" error={errors.type?.message}>
                            <select {...register("type")} className={FIELD}>
                                {ITEM_TYPES.map((t) => (
                                    <option key={t} value={t}>
                                        {t}
                                    </option>
                                ))}
                            </select>
                        </Field>
                        <Field label="Unit" error={errors.unit?.message}>
                            <select {...register("unit")} className={FIELD}>
                                <option value="">Choose a unit…</option>
                                {units?.map((u) => (
                                    <option key={u.slug} value={u.slug}>
                                        {u.label}
                                    </option>
                                ))}
                            </select>
                        </Field>
                        <Field label="English (text)" error={errors.text?.message}>
                            <Input {...register("text")} autoComplete="off" />
                        </Field>
                        <Field label="Meaning (Vietnamese)" error={errors.meaningVi?.message}>
                            <Input {...register("meaningVi")} autoComplete="off" />
                        </Field>
                        <Field label="IPA" error={errors.ipa?.message}>
                            <Input {...register("ipa")} placeholder="/raɪs/" autoComplete="off" />
                        </Field>
                        <Field label="Audio URL" error={errors.audioUrl?.message}>
                            <Input {...register("audioUrl")} placeholder="https://…" autoComplete="off" />
                        </Field>
                    </div>
                    <Field label="Note for Vietnamese learners (common mistake)" error={errors.noteVi?.message}>
                        <textarea {...register("noteVi")} rows={2} className={FIELD} />
                    </Field>
                    <Field label="Collocations (one per line)" error={errors.collocations?.message}>
                        <textarea {...register("collocations")} rows={2} className={FIELD} />
                    </Field>
                </Section>

                <Section
                    title="Examples"
                    action={
                        <AddButton onClick={() => examples.append({ en: "", vi: "", highlight: "" })} label="Add example" />
                    }
                >
                    {examples.fields.length === 0 && <p className="text-sm text-muted-foreground">No examples.</p>}
                    {examples.fields.map((field, i) => (
                        <Row key={field.id} onRemove={() => examples.remove(i)}>
                            <Field label="English" error={errors.examples?.[i]?.en?.message}>
                                <Input {...register(`examples.${i}.en`)} />
                            </Field>
                            <Field label="Vietnamese" error={errors.examples?.[i]?.vi?.message}>
                                <Input {...register(`examples.${i}.vi`)} />
                            </Field>
                            <Field label="Highlight (part of the English)" error={errors.examples?.[i]?.highlight?.message}>
                                <Input {...register(`examples.${i}.highlight`)} />
                            </Field>
                        </Row>
                    ))}
                </Section>

                {type === "PATTERN" && (
                    <Section
                        title="Pattern"
                        action={<AddButton onClick={() => slots.append({ name: "", hintVi: "", options: "" })} label="Add slot" />}
                    >
                        <Field label="Template, with {slots}" error={errors.pattern?.template?.message}>
                            <Input {...register("pattern.template")} placeholder="I'd like {thing}, please." />
                        </Field>
                        {errors.pattern?.slots?.message && <FieldError message={errors.pattern.slots.message} />}
                        {slots.fields.map((field, i) => (
                            <Row key={field.id} onRemove={() => slots.remove(i)}>
                                <Field label="Slot name" error={errors.pattern?.slots?.[i]?.name?.message}>
                                    <Input {...register(`pattern.slots.${i}.name`)} className="font-mono" />
                                </Field>
                                <Field label="Hint (Vietnamese)" error={errors.pattern?.slots?.[i]?.hintVi?.message}>
                                    <Input {...register(`pattern.slots.${i}.hintVi`)} />
                                </Field>
                                <Field label="Sample fillers (comma-separated)" error={errors.pattern?.slots?.[i]?.options?.message}>
                                    <Input {...register(`pattern.slots.${i}.options`)} />
                                </Field>
                            </Row>
                        ))}
                    </Section>
                )}

                {type === "GRAMMAR" && (
                    <Section
                        title="Grammar"
                        action={<AddButton onClick={() => forms.append({ label: "", example: "" })} label="Add form" />}
                    >
                        <Field label="Rule (Vietnamese)" error={errors.grammar?.ruleVi?.message}>
                            <textarea {...register("grammar.ruleVi")} rows={3} className={FIELD} />
                        </Field>
                        {errors.grammar?.forms?.message && <FieldError message={errors.grammar.forms.message} />}
                        {forms.fields.map((field, i) => (
                            <Row key={field.id} onRemove={() => forms.remove(i)}>
                                <Field label="Form" error={errors.grammar?.forms?.[i]?.label?.message}>
                                    <Input {...register(`grammar.forms.${i}.label`)} />
                                </Field>
                                <Field label="Example" error={errors.grammar?.forms?.[i]?.example?.message}>
                                    <Input {...register(`grammar.forms.${i}.example`)} />
                                </Field>
                            </Row>
                        ))}
                        <Field label="Pitfalls (Vietnamese, one per line)" error={errors.grammar?.pitfallsVi?.message}>
                            <textarea {...register("grammar.pitfallsVi")} rows={3} className={FIELD} />
                        </Field>
                    </Section>
                )}
            </fieldset>

            <Feedback serverErrors={serverErrors} validation={validation} hasClientErrors={Object.keys(errors).length > 0} />

            <div className="flex flex-wrap items-center gap-3">
                {!archived && (
                    <Button type="submit" variant="play" disabled={save.isPending}>
                        {save.isPending ? "Saving…" : slug ? "Save draft" : "Create item"}
                    </Button>
                )}
                {slug && (
                    <ArchiveRestoreButtons kind="item" slug={slug} archived={archived} onValidation={setValidation} />
                )}
            </div>
        </form>
    );
}
