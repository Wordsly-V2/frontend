"use client";

import {
    AddButton,
    ArchiveRestoreButtons,
    EditorHeader,
    Feedback,
    Field,
    FieldError,
    Section,
    SelectField,
    SlugField,
    useEditorLoad,
    useUnsavedWarning,
} from "@/components/features/admin-path/admin-form-parts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    dialogueFormSchema,
    dialogueFormToRecord,
    dialogueSpeakers,
    emptyDialogueForm,
    nextSpeaker,
    recordToDialogueForm,
    type DialogueFormValues,
} from "@/lib/admin-path/dialogue-form";
import { adminErrorMessages } from "@/lib/admin-path/errors";
import { pathOptions } from "@/lib/admin-path/path-options";
import { cn } from "@/lib/utils";
import { useAdminPathOverviewQuery, useSaveAdminRecordMutation } from "@/queries/admin-path.query";
import type { AdminValidation, ContentStatus, RowOrigin } from "@/types/admin-path/admin-path.type";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

/** /admin/path/dialogue/[slug] (or `new?unit=`): a unit's dialogue, line by line. */
export function AdminDialogueEditor({ slug, unit }: Readonly<{ slug: string; unit?: string }>) {
    const load = useEditorLoad("dialogue", slug);
    if (load.gate) return load.gate;
    return (
        <DialogueForm
            key={slug}
            slug={load.record ? slug : null}
            initial={load.record ? recordToDialogueForm(load.record.record) : emptyDialogueForm(unit)}
            status={load.record?.status}
            origin={load.record?.origin}
        />
    );
}

function DialogueForm({
    slug,
    initial,
    status,
    origin,
}: Readonly<{ slug: string | null; initial: DialogueFormValues; status?: ContentStatus; origin?: RowOrigin }>) {
    const router = useRouter();
    const overview = useAdminPathOverviewQuery();
    const save = useSaveAdminRecordMutation();
    const [serverErrors, setServerErrors] = useState<string[]>([]);
    const [validation, setValidation] = useState<AdminValidation | null>(null);
    const archived = status === "ARCHIVED";

    const form = useForm<DialogueFormValues>({ resolver: zodResolver(dialogueFormSchema), defaultValues: initial });
    const { register, control, handleSubmit, formState } = form;
    const errors = formState.errors;
    const lines = useFieldArray({ control, name: "lines" });
    const watched = useWatch({ control, name: "lines" }) ?? [];
    useUnsavedWarning(formState.isDirty);

    const submit = handleSubmit((values) => {
        setServerErrors([]);
        save.mutate(
            { kind: "dialogue", slug, body: dialogueFormToRecord(values) },
            {
                onSuccess: (result) => {
                    setValidation(result.validation);
                    form.reset(recordToDialogueForm(result.record));
                    toast.success(slug ? "Saved as a draft" : "Dialogue created as a draft");
                    if (!slug) router.replace(`/admin/path/dialogue/${result.slug}`);
                },
                onError: (error) => setServerErrors(adminErrorMessages(error)),
            },
        );
    });

    const { units } = pathOptions(overview.data, initial.unit);
    const speakers = dialogueSpeakers(watched);
    const learnerLines = watched.filter((l) => l.learnerTurn).length;

    return (
        <form onSubmit={submit} className="space-y-6" noValidate>
            <EditorHeader title={slug ? `Dialogue ${slug}` : "New dialogue"} status={status} origin={origin} />

            {archived && (
                <p className="rounded-xl bg-muted p-3 text-sm">
                    This dialogue is archived: steps that still play it block the next publish. Restore it to edit.
                </p>
            )}

            <fieldset disabled={archived} className="space-y-6">
                <Section title="Basics">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <SlugField what="dialogue" locked={!!slug} error={errors.slug?.message} registration={register("slug")} />
                        <SelectField
                            label="Unit"
                            error={errors.unit?.message}
                            options={units}
                            placeholder="Choose a unit…"
                            registration={register("unit")}
                        />
                        <Field label="Title (English)" error={errors.title?.message}>
                            <Input {...register("title")} />
                        </Field>
                        <Field label="Situation (Vietnamese: who, where, what happens)" error={errors.situationVi?.message}>
                            <Input {...register("situationVi")} />
                        </Field>
                    </div>
                </Section>

                <Section title="Lines" action={<AddButton onClick={() => lines.append(nextSpeaker(watched))} label="Add line" />}>
                    <p className="text-sm text-muted-foreground">
                        Tick &quot;Learner says this&quot; on the lines the learner speaks in role-play ({learnerLines} now). In listen mode every
                        line is played.
                    </p>
                    {errors.lines?.message && <FieldError message={errors.lines.message} />}
                    <datalist id="admin-dialogue-speakers">
                        {speakers.map((name) => (
                            <option key={name} value={name} />
                        ))}
                    </datalist>
                    <ol className="space-y-2">
                        {lines.fields.map((field, i) => {
                            const e = errors.lines?.[i];
                            const learner = watched[i]?.learnerTurn;
                            return (
                                <li
                                    key={field.id}
                                    className={cn("space-y-2 rounded-xl border-2 p-3", learner ? "border-primary/60 bg-primary/5" : "border-border")}
                                >
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-sm font-semibold tabular-nums">{i + 1}.</span>
                                        <div className="w-40">
                                            <Input
                                                {...register(`lines.${i}.speaker`)}
                                                list="admin-dialogue-speakers"
                                                placeholder="Speaker"
                                                aria-label={`Speaker of line ${i + 1}`}
                                                autoComplete="off"
                                            />
                                        </div>
                                        <label className="flex items-center gap-2 text-sm">
                                            <input type="checkbox" {...register(`lines.${i}.learnerTurn`)} className="h-4 w-4 accent-primary" />
                                            Learner says this
                                        </label>
                                        <div className="ml-auto flex gap-1">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                disabled={i === 0}
                                                onClick={() => lines.move(i, i - 1)}
                                                aria-label="Move up"
                                            >
                                                <ArrowUp className="h-4 w-4" aria-hidden />
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                disabled={i === lines.fields.length - 1}
                                                onClick={() => lines.move(i, i + 1)}
                                                aria-label="Move down"
                                            >
                                                <ArrowDown className="h-4 w-4" aria-hidden />
                                            </Button>
                                            <Button type="button" variant="ghost" size="icon" onClick={() => lines.remove(i)} aria-label="Remove line">
                                                <Trash2 className="h-4 w-4" aria-hidden />
                                            </Button>
                                        </div>
                                    </div>
                                    {e?.speaker && <FieldError message={e.speaker.message ?? ""} />}
                                    <div className="grid gap-2 sm:grid-cols-2">
                                        <div>
                                            <Input {...register(`lines.${i}.en`)} placeholder="English" aria-label={`Line ${i + 1} (English)`} />
                                            {e?.en && <FieldError message={e.en.message ?? ""} />}
                                        </div>
                                        <div>
                                            <Input {...register(`lines.${i}.vi`)} placeholder="Vietnamese" aria-label={`Line ${i + 1} (Vietnamese)`} />
                                            {e?.vi && <FieldError message={e.vi.message ?? ""} />}
                                        </div>
                                    </div>
                                </li>
                            );
                        })}
                    </ol>
                </Section>
            </fieldset>

            <Feedback serverErrors={serverErrors} validation={validation} hasClientErrors={Object.keys(errors).length > 0} />

            <div className="flex flex-wrap items-center gap-3">
                {!archived && (
                    <Button type="submit" variant="play" disabled={save.isPending}>
                        {save.isPending ? "Saving…" : slug ? "Save draft" : "Create dialogue"}
                    </Button>
                )}
                {slug && <ArchiveRestoreButtons kind="dialogue" slug={slug} archived={archived} onValidation={setValidation} />}
            </div>
        </form>
    );
}
