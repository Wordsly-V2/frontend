"use client";

import { AddButton, FIELD, Field, FieldError, ListField, SelectField } from "@/components/features/admin-path/admin-form-parts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    emptyQuestionForm,
    orderTiles,
    QUESTION_KIND_LABEL,
    QUESTION_KINDS,
    type QuestionFormValues,
} from "@/lib/admin-path/question-form";
import { ArrowDown, ArrowUp, Copy, Trash2 } from "lucide-react";
import { useEffect, useRef } from "react";
import { get, useFieldArray, useWatch, type FieldError as RhfFieldError, type FieldErrors, type UseFormReturn } from "react-hook-form";

/**
 * The part of a form this editor owns. A unit test or placement form passes
 * its own `useForm` cast to this shape (`form as unknown as QuestionListForm`):
 * react-hook-form types can't say "any form with a `questions` array". A form
 * whose array lives deeper (a lesson's quiz step) passes its path as `name`.
 */
export type QuestionListForm = UseFormReturn<{
    questions: QuestionFormValues[];
}>;

export interface PickOption {
    value: string;
    label: string;
}

const KIND_OPTIONS = QUESTION_KINDS.map((k) => ({
    value: k,
    label: QUESTION_KIND_LABEL[k],
}));

/**
 * A list of questions (choice, gap, order), each folded to a one-line summary
 * until opened. `units` (placement questions) adds a unit picker and groups
 * consecutive questions of one unit under a header with its own add button.
 */
export function QuestionListEditor({
    form,
    name: path = "questions",
    items,
    units,
}: Readonly<{
    form: QuestionListForm;
    /** Where the questions array is in the form, like `steps.3.questions`. */
    name?: string;
    /** Item slugs offered for "item tested", with their text. */
    items: readonly PickOption[];
    /** Units in path order; given only for placement questions. */
    units?: readonly PickOption[];
}>) {
    const { control, formState } = form;
    // Typed as the default path; at runtime it can be any path to such an array.
    const name = path as "questions";
    const list = useFieldArray({ control, name });
    const watched = useWatch({ control, name });
    const listError = get(formState.errors, name) as RhfFieldError | undefined;
    const unitLabel = new Map(units?.map((u) => [u.value, u.label]));

    const insert = (index: number, question: QuestionFormValues) => list.insert(index, question);

    return (
        <div className="space-y-3">
            {listError?.message && <FieldError message={listError.message} />}
            <datalist id={`${name}-items`}>
                {items.map((item) => (
                    <option key={item.value} value={item.value}>
                        {item.label}
                    </option>
                ))}
            </datalist>
            <ol className="space-y-2">
                {list.fields.map((field, i) => {
                    const unit = watched?.[i]?.unit ?? "";
                    const groupStart = !!units && (i === 0 || watched?.[i - 1]?.unit !== unit);
                    let groupEnd = i;
                    while (units && groupStart && watched?.[groupEnd + 1]?.unit === unit) groupEnd++;
                    return (
                        <li key={field.id} className="space-y-2">
                            {groupStart && (
                                <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                                    <h3 className="text-sm font-semibold">
                                        {unit ? (unitLabel.get(unit) ?? unit) : "No unit yet"}{" "}
                                        <span className="font-normal text-muted-foreground">({groupEnd - i + 1})</span>
                                    </h3>
                                    <AddButton
                                        onClick={() => insert(groupEnd + 1, emptyQuestionForm("choice", unit))}
                                        label="Add to this unit"
                                    />
                                </div>
                            )}
                            <QuestionCard
                                form={form}
                                name={name}
                                index={i}
                                count={list.fields.length}
                                units={units}
                                onMove={(to) => list.move(i, to)}
                                onDuplicate={() => insert(i + 1, structuredClone(watched[i]))}
                                onRemove={() => list.remove(i)}
                            />
                        </li>
                    );
                })}
            </ol>
            <AddButton
                onClick={() => insert(list.fields.length, emptyQuestionForm("choice", watched?.at(-1)?.unit ?? ""))}
                label="Add question"
            />
        </div>
    );
}

function summary(q: QuestionFormValues | undefined): string {
    if (!q) return "";
    const text = q.kind === "choice" ? q.prompt : q.kind === "gap" ? q.sentence : q.vi;
    return text.trim() || "(empty)";
}

function QuestionCard({
    form,
    name,
    index: i,
    count,
    units,
    onMove,
    onDuplicate,
    onRemove,
}: Readonly<{
    form: QuestionListForm;
    name: "questions";
    index: number;
    count: number;
    units?: readonly PickOption[];
    onMove: (to: number) => void;
    onDuplicate: () => void;
    onRemove: () => void;
}>) {
    const { register, control, formState, getValues, setValue } = form;
    const q = useWatch({ control, name: `${name}.${i}` });
    const errors = get(formState.errors, `${name}.${i}`) as FieldErrors<QuestionFormValues> | undefined;
    const options = useFieldArray({ control, name: `${name}.${i}.options` });
    const answers = useFieldArray({ control, name: `${name}.${i}.answers` });

    // Folded by default; a new (blank) question opens, and so does one with errors.
    // Opened through the element, so fixing the errors doesn't fold it mid-edit.
    const details = useRef<HTMLDetailsElement>(null);
    const blank = summary(q) === "(empty)";
    useEffect(() => {
        if (details.current && blank) details.current.open = true;
        // Only on mount: a question emptied while editing stays as it is.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    useEffect(() => {
        if (details.current && errors) details.current.open = true;
    }, [errors]);

    // Keep the right answer on the same option when one above it goes.
    const removeOption = (j: number) => {
        const answer = getValues(`${name}.${i}.answer`);
        if (answer !== "") {
            const picked = Number(answer);
            if (picked === j) setValue(`${name}.${i}.answer`, "", { shouldDirty: true });
            else if (picked > j)
                setValue(`${name}.${i}.answer`, String(picked - 1), {
                    shouldDirty: true,
                });
        }
        options.remove(j);
    };

    return (
        <details ref={details} className="rounded-xl border-2 border-border">
            <summary className="flex cursor-pointer list-none flex-wrap items-center gap-2 p-3 text-sm">
                <span className="font-semibold tabular-nums">{i + 1}.</span>
                <Badge variant="muted">{q?.kind}</Badge>
                <span className="min-w-0 flex-1 truncate">{summary(q)}</span>
                {errors && <Badge variant="destructive">Needs fixing</Badge>}
            </summary>

            <div className="space-y-4 border-t border-border p-3">
                <div className="flex flex-wrap items-end gap-3">
                    <div className="min-w-48 flex-1">
                        <SelectField label="Kind" options={KIND_OPTIONS} registration={register(`${name}.${i}.kind`)} />
                    </div>
                    {units && (
                        <div className="min-w-48 flex-1">
                            <SelectField
                                label="Unit it probes"
                                error={errors?.unit?.message}
                                options={units}
                                placeholder="Choose a unit…"
                                registration={register(`${name}.${i}.unit`)}
                            />
                        </div>
                    )}
                    <div className="flex gap-1">
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            disabled={i === 0}
                            onClick={() => onMove(i - 1)}
                            aria-label="Move up"
                        >
                            <ArrowUp className="h-4 w-4" aria-hidden />
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            disabled={i === count - 1}
                            onClick={() => onMove(i + 1)}
                            aria-label="Move down"
                        >
                            <ArrowDown className="h-4 w-4" aria-hidden />
                        </Button>
                        <Button type="button" variant="ghost" size="icon" onClick={onDuplicate} aria-label="Duplicate">
                            <Copy className="h-4 w-4" aria-hidden />
                        </Button>
                        <Button type="button" variant="ghost" size="icon" onClick={onRemove} aria-label="Remove question">
                            <Trash2 className="h-4 w-4" aria-hidden />
                        </Button>
                    </div>
                </div>

                {q?.kind === "choice" && (
                    <>
                        <Field label="Prompt (what the learner reads)" error={errors?.prompt?.message}>
                            <Input {...register(`${name}.${i}.prompt`)} />
                        </Field>
                        <Field label="Audio text (optional: played aloud before the options)" error={errors?.audioText?.message}>
                            <Input {...register(`${name}.${i}.audioText`)} />
                        </Field>
                        <fieldset className="space-y-2">
                            <div className="flex items-center justify-between gap-2">
                                <legend className="text-sm font-medium">Options (pick the right one)</legend>
                                {options.fields.length < 6 && <AddButton onClick={() => options.append({ text: "" })} label="Add option" />}
                            </div>
                            <ul className="space-y-2">
                                {options.fields.map((option, j) => (
                                    <li key={option.id} className="flex items-start gap-2">
                                        <input
                                            type="radio"
                                            value={String(j)}
                                            {...register(`${name}.${i}.answer`)}
                                            aria-label={`Option ${j + 1} is right`}
                                            className="mt-3 h-4 w-4 accent-primary"
                                        />
                                        <div className="flex-1">
                                            <Input {...register(`${name}.${i}.options.${j}.text`)} aria-label={`Option ${j + 1}`} />
                                            {errors?.options?.[j]?.text && <FieldError message={errors.options[j].text.message ?? ""} />}
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeOption(j)}
                                            aria-label="Remove option"
                                        >
                                            <Trash2 className="h-4 w-4" aria-hidden />
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                            {errors?.options?.message && <FieldError message={errors.options.message} />}
                            {errors?.answer?.message && <FieldError message={errors.answer.message} />}
                        </fieldset>
                    </>
                )}

                {q?.kind === "gap" && (
                    <>
                        <Field label="Sentence, with the gap written as ___" error={errors?.sentence?.message}>
                            <Input {...register(`${name}.${i}.sentence`)} placeholder="Can I ___ some water, please?" />
                        </Field>
                        <Field label="Hint (Vietnamese, optional)" error={errors?.hintVi?.message}>
                            <Input {...register(`${name}.${i}.hintVi`)} />
                        </Field>
                        <ListField
                            label="Accepted answer"
                            addLabel="Add answer"
                            fields={answers.fields}
                            registration={(j) => register(`${name}.${i}.answers.${j}.text`)}
                            errors={answers.fields.map((_, j) => errors?.answers?.[j]?.text?.message)}
                            error={errors?.answers?.message}
                            onAdd={() => answers.append({ text: "" })}
                            onRemove={(j) => answers.remove(j)}
                        />
                    </>
                )}

                {q?.kind === "order" && (
                    <>
                        <Field label="Meaning (Vietnamese)" error={errors?.vi?.message}>
                            <Input {...register(`${name}.${i}.vi`)} />
                        </Field>
                        <Field label="Answer (the English sentence; its words get shuffled)" error={errors?.orderAnswer?.message}>
                            <Input {...register(`${name}.${i}.orderAnswer`)} />
                        </Field>
                        {orderTiles(q.orderAnswer).length > 0 && (
                            <p className="flex flex-wrap gap-1.5" aria-label="Word tiles">
                                {orderTiles(q.orderAnswer).map((tile, j) => (
                                    <span key={`${tile}-${j}`} className="rounded-lg border-2 border-border px-2 py-0.5 text-sm">
                                        {tile}
                                    </span>
                                ))}
                            </p>
                        )}
                    </>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Item tested (optional, for per-item scoring)" error={errors?.item?.message}>
                        <Input {...register(`${name}.${i}.item`)} list={`${name}-items`} className="font-mono" autoComplete="off" />
                    </Field>
                    <Field label="Explanation (Vietnamese, optional)" error={errors?.explanationVi?.message}>
                        <textarea {...register(`${name}.${i}.explanationVi`)} rows={1} className={FIELD} />
                    </Field>
                </div>
            </div>
        </details>
    );
}
