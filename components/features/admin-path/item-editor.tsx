"use client";

import ConfirmDialog from "@/components/common/confirm-dialog/confirm-dialog";
import { ErrorState, Skeleton } from "@/components/common/states";
import { OriginBadge, StatusBadge } from "@/components/features/admin-path/admin-badges";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminErrorMessages } from "@/lib/admin-path/errors";
import {
    emptyItemForm,
    ITEM_TYPES,
    itemFormSchema,
    itemFormToRecord,
    recordToItemForm,
    type ItemFormValues,
} from "@/lib/admin-path/item-form";
import { cn } from "@/lib/utils";
import {
    useAdminPathOverviewQuery,
    useAdminRecordQuery,
    useArchiveAdminRecordMutation,
    useRestoreAdminRecordMutation,
    useSaveAdminRecordMutation,
} from "@/queries/admin-path.query";
import type { AdminValidation } from "@/types/admin-path/admin-path.type";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { type FieldErrors, useFieldArray, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

const FIELD =
    "w-full rounded-xl border-2 border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none";

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
    const archive = useArchiveAdminRecordMutation();
    const restore = useRestoreAdminRecordMutation();
    const [serverErrors, setServerErrors] = useState<string[]>([]);
    const [validation, setValidation] = useState<AdminValidation | null>(null);
    const [confirmArchive, setConfirmArchive] = useState(false);
    const archived = status === "ARCHIVED";

    const form = useForm<ItemFormValues>({ resolver: zodResolver(itemFormSchema), defaultValues: initial });
    const { register, control, handleSubmit, formState } = form;
    const errors = formState.errors;
    const type = useWatch({ control, name: "type" });
    const examples = useFieldArray({ control, name: "examples" });
    const slots = useFieldArray({ control, name: "pattern.slots" });
    const forms = useFieldArray({ control, name: "grammar.forms" });

    // Leaving with unsaved edits loses them; say so.
    useEffect(() => {
        if (!formState.isDirty) return;
        const warn = (e: BeforeUnloadEvent) => e.preventDefault();
        globalThis.addEventListener("beforeunload", warn);
        return () => globalThis.removeEventListener("beforeunload", warn);
    }, [formState.isDirty]);

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

    const doArchive = () =>
        slug &&
        archive.mutate(
            { kind: "item", slug },
            {
                onSuccess: (result) => {
                    setConfirmArchive(false);
                    setValidation(result.validation);
                    toast.success("Archived");
                },
                onError: (error) => toast.error(adminErrorMessages(error)[0]),
            },
        );

    const doRestore = () =>
        slug &&
        restore.mutate(
            { kind: "item", slug },
            {
                onSuccess: (result) => {
                    setValidation(result.validation);
                    toast.success("Restored as a draft");
                },
                onError: (error) => toast.error(adminErrorMessages(error)[0]),
            },
        );

    const units = overview.data?.stages.flatMap((stage) =>
        stage.units.map((u) => ({ slug: u.slug, label: `${stage.title} · ${u.order}. ${u.title}` })),
    );

    return (
        <form onSubmit={submit} className="space-y-6" noValidate>
            <header className="space-y-2">
                <Link href="/admin/path" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="h-4 w-4" aria-hidden /> All content
                </Link>
                <div className="flex flex-wrap items-center gap-2">
                    <h1 className="font-display text-2xl font-bold">{slug ? `Item ${slug}` : "New item"}</h1>
                    {status && <StatusBadge status={status} />}
                    {origin && <OriginBadge origin={origin} />}
                </div>
            </header>

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

            <Feedback serverErrors={serverErrors} validation={validation} clientErrors={errors} />

            <div className="flex flex-wrap items-center gap-3">
                {!archived && (
                    <Button type="submit" variant="play" disabled={save.isPending}>
                        {save.isPending ? "Saving…" : slug ? "Save draft" : "Create item"}
                    </Button>
                )}
                {slug && !archived && (
                    <Button type="button" variant="outline" onClick={() => setConfirmArchive(true)}>
                        Archive
                    </Button>
                )}
                {slug && archived && (
                    <Button type="button" variant="play" onClick={doRestore} disabled={restore.isPending}>
                        Restore
                    </Button>
                )}
            </div>

            <ConfirmDialog
                isOpen={confirmArchive}
                onClose={() => setConfirmArchive(false)}
                onConfirm={() => void doArchive()}
                title="Archive this item?"
                description="Lessons that still link it will block publishing until they drop it. After the next publish, learners lose their review cards for it."
                confirmText="Archive"
                variant="destructive"
                isLoading={archive.isPending}
            />
        </form>
    );
}

function Feedback({
    serverErrors,
    validation,
    clientErrors,
}: Readonly<{ serverErrors: string[]; validation: AdminValidation | null; clientErrors: FieldErrors<ItemFormValues> }>) {
    const clientCount = Object.keys(clientErrors).length;
    return (
        <div aria-live="polite" className="space-y-3">
            {clientCount > 0 && <FieldError message="Some fields need fixing (marked above)." />}
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

function Section({ title, action, children }: Readonly<{ title: string; action?: React.ReactNode; children: React.ReactNode }>) {
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

function Field({ label, error, children }: Readonly<{ label: string; error?: string; children: React.ReactNode }>) {
    return (
        <div className="space-y-1.5">
            <Label className="text-sm">{label}</Label>
            {children}
            {error && <FieldError message={error} />}
        </div>
    );
}

function FieldError({ message }: Readonly<{ message: string }>) {
    return <p className="text-xs text-destructive">{message}</p>;
}

function Row({ onRemove, children }: Readonly<{ onRemove: () => void; children: React.ReactNode }>) {
    return (
        <div className={cn("grid items-end gap-3 rounded-xl border-2 border-border p-3 sm:grid-cols-[1fr_1fr_1fr_auto]")}>
            {children}
            <Button type="button" variant="ghost" size="icon" onClick={onRemove} aria-label="Remove">
                <Trash2 className="h-4 w-4" aria-hidden />
            </Button>
        </div>
    );
}

function AddButton({ onClick, label }: Readonly<{ onClick: () => void; label: string }>) {
    return (
        <Button type="button" size="sm" variant="outline" onClick={onClick} className="gap-1">
            <Plus className="h-3.5 w-3.5" aria-hidden /> {label}
        </Button>
    );
}
