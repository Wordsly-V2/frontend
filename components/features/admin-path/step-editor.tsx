"use client";

import { AddButton, FIELD, Field, FieldError, SelectField } from "@/components/features/admin-path/admin-form-parts";
import { QuestionListEditor, type PickOption, type QuestionListForm } from "@/components/features/admin-path/question-editor";
import { MiniMarkdown } from "@/components/features/path/mini-markdown";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { LessonFormValues } from "@/lib/admin-path/lesson-form";
import { PRACTICE_MODE_META } from "@/lib/practice-mode-meta";
import {
    DIALOGUE_MODES,
    emptyStepForm,
    PRACTICE_MODES,
    STEP_TYPE_LABEL,
    STEP_TYPES,
    stepSummary,
    templateSlots,
} from "@/lib/admin-path/step-forms";
import { cn } from "@/lib/utils";
import { useAdminRecordQuery } from "@/queries/admin-path.query";
import { ArrowDown, ArrowUp, Copy, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { Controller, useFieldArray, useWatch, type UseFormReturn } from "react-hook-form";

type LessonForm = UseFormReturn<LessonFormValues>;

/** An item the lesson links, as the step pickers offer it. */
export interface LinkedItem {
    slug: string;
    text: string;
    type: string;
    introduced: boolean;
}

const TYPE_OPTIONS = STEP_TYPES.map((t) => ({ value: t, label: STEP_TYPE_LABEL[t] }));
const DIALOGUE_MODE_OPTIONS = DIALOGUE_MODES.map((m) => ({
    value: m,
    label: m === "listen" ? "Listen (the learner only listens)" : "Role-play (the learner says their lines)",
}));

/**
 * A lesson's steps, each folded to a one-line summary until opened. Items are
 * picked from the ones the lesson links, dialogues from the lesson's unit.
 */
export function StepListEditor({
    form,
    linked,
    dialogues,
}: Readonly<{ form: LessonForm; linked: readonly LinkedItem[]; dialogues: readonly PickOption[] }>) {
    const { control, formState } = form;
    const steps = useFieldArray({ control, name: "steps" });
    const watched = useWatch({ control, name: "steps" });

    return (
        <div className="space-y-3">
            {formState.errors.steps?.message && <FieldError message={formState.errors.steps.message} />}
            <ol className="space-y-2">
                {steps.fields.map((field, i) => (
                    <li key={field.id}>
                        <StepCard
                            form={form}
                            index={i}
                            count={steps.fields.length}
                            linked={linked}
                            dialogues={dialogues}
                            onMove={(to) => steps.move(i, to)}
                            onDuplicate={() => steps.insert(i + 1, structuredClone(watched[i]))}
                            onRemove={() => steps.remove(i)}
                        />
                    </li>
                ))}
            </ol>
            <AddButton onClick={() => steps.append(emptyStepForm("EXPLAIN"))} label="Add step" />
        </div>
    );
}

function StepCard({
    form,
    index: i,
    count,
    linked,
    dialogues,
    onMove,
    onDuplicate,
    onRemove,
}: Readonly<{
    form: LessonForm;
    index: number;
    count: number;
    linked: readonly LinkedItem[];
    dialogues: readonly PickOption[];
    onMove: (to: number) => void;
    onDuplicate: () => void;
    onRemove: () => void;
}>) {
    const { register, control, formState } = form;
    const step = useWatch({ control, name: `steps.${i}` });
    const errors = formState.errors.steps?.[i];

    // Folded by default; a step added in this session opens, and so does one with errors.
    const details = useRef<HTMLDetailsElement>(null);
    const isNew = !formState.defaultValues?.steps?.[i];
    useEffect(() => {
        if (details.current && isNew) details.current.open = true;
        // Only on mount.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    useEffect(() => {
        if (details.current && errors) details.current.open = true;
    }, [errors]);

    const introduced = linked.filter((item) => item.introduced);
    const patterns = linked.filter((item) => item.type === "PATTERN");

    return (
        <details ref={details} className="rounded-xl border-2 border-border">
            <summary className="flex cursor-pointer list-none flex-wrap items-center gap-2 p-3 text-sm">
                <span className="font-semibold tabular-nums">{i + 1}.</span>
                <Badge variant="muted">{step?.type}</Badge>
                <span className="min-w-0 flex-1 truncate">{stepSummary(step)}</span>
                {errors && <Badge variant="destructive">Needs fixing</Badge>}
            </summary>

            <div className="space-y-4 border-t border-border p-3">
                <div className="flex flex-wrap items-end gap-3">
                    <div className="min-w-56 flex-1">
                        <SelectField label="Type" options={TYPE_OPTIONS} registration={register(`steps.${i}.type`)} />
                    </div>
                    <div className="flex gap-1">
                        <Button type="button" variant="ghost" size="icon" disabled={i === 0} onClick={() => onMove(i - 1)} aria-label="Move up">
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
                        <Button type="button" variant="ghost" size="icon" onClick={onRemove} aria-label="Remove step">
                            <Trash2 className="h-4 w-4" aria-hidden />
                        </Button>
                    </div>
                </div>

                {step?.type === "WARMUP" && (
                    <Field label="Most due items to review (1 to 30)" error={errors?.maxItems?.message}>
                        <Input {...register(`steps.${i}.maxItems`)} inputMode="numeric" className="max-w-32" />
                    </Field>
                )}

                {step?.type === "INTRO" && (
                    <ItemPicker
                        form={form}
                        index={i}
                        label="Items to present, in order (only items this lesson introduces)"
                        options={introduced}
                        linked={linked}
                    />
                )}

                {step?.type === "PRACTICE" && (
                    <>
                        <Controller
                            control={control}
                            name={`steps.${i}.modes`}
                            render={({ field }) => (
                                <fieldset className="space-y-2">
                                    <legend className="text-sm font-medium">Practice modes</legend>
                                    <div className="flex flex-wrap gap-x-4 gap-y-2">
                                        {PRACTICE_MODES.map((mode) => (
                                            <label key={mode} className="flex items-center gap-2 text-sm">
                                                <input
                                                    type="checkbox"
                                                    checked={field.value.includes(mode)}
                                                    // A mode ticked later goes last: the order of the others is kept.
                                                    onChange={(e) =>
                                                        field.onChange(
                                                            e.target.checked ? [...field.value, mode] : field.value.filter((m) => m !== mode),
                                                        )
                                                    }
                                                    className="h-4 w-4 accent-primary"
                                                />
                                                {PRACTICE_MODE_META[mode].label}
                                            </label>
                                        ))}
                                    </div>
                                    {errors?.modes?.message && <FieldError message={errors.modes.message} />}
                                </fieldset>
                            )}
                        />
                        <ItemPicker
                            form={form}
                            index={i}
                            label="Items to drill (words and phrases get drilled; patterns and grammar are skipped)"
                            options={linked}
                            linked={linked}
                        />
                    </>
                )}

                {step?.type === "EXPLAIN" && <ExplainFields form={form} index={i} linked={linked} />}

                {step?.type === "PATTERN_DRILL" && <PatternDrillFields form={form} index={i} patterns={patterns} />}

                {step?.type === "SPEAK" && <SpeakFields form={form} index={i} />}

                {step?.type === "DIALOGUE" && (
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <SelectField
                                label="Dialogue (from this lesson's unit)"
                                error={errors?.dialogue?.message}
                                options={keepCurrent(dialogues, step.dialogue)}
                                placeholder="Choose a dialogue…"
                                registration={register(`steps.${i}.dialogue`)}
                            />
                            {step.dialogue && (
                                <Link href={`/admin/path/dialogue/${step.dialogue}`} className="text-xs text-primary underline">
                                    Edit this dialogue
                                </Link>
                            )}
                        </div>
                        <SelectField label="Mode" options={DIALOGUE_MODE_OPTIONS} registration={register(`steps.${i}.mode`)} />
                    </div>
                )}

                {step?.type === "QUIZ" && (
                    <QuestionListEditor
                        form={form as unknown as QuestionListForm}
                        name={`steps.${i}.questions`}
                        items={linked.map((item) => ({ value: item.slug, label: item.text }))}
                    />
                )}
            </div>
        </details>
    );
}

/** The options, plus the current value if it isn't one (so the select still shows it). */
function keepCurrent(options: readonly PickOption[], value: string): readonly PickOption[] {
    if (!value || options.some((o) => o.value === value)) return options;
    return [...options, { value, label: `${value} (not in this unit)` }];
}

/**
 * An ordered list of item slugs, as chips: remove one, or add from `options`.
 * A slug that isn't linked to the lesson stays (the server will name it) but
 * is marked.
 */
function ItemPicker({
    form,
    index: i,
    label,
    options,
    linked,
}: Readonly<{ form: LessonForm; index: number; label: string; options: readonly LinkedItem[]; linked: readonly LinkedItem[] }>) {
    const { control, formState } = form;
    const items = useFieldArray({ control, name: `steps.${i}.items` });
    const chosen = useWatch({ control, name: `steps.${i}.items` }) ?? [];
    const errors = formState.errors.steps?.[i]?.items;
    const text = new Map(linked.map((item) => [item.slug, item.text]));
    const offer = new Set(options.map((o) => o.slug));
    const left = options.filter((o) => !chosen.some((c) => c.slug === o.slug));

    return (
        <div className="space-y-2">
            <Label className="text-sm">{label}</Label>
            <ul className="flex flex-wrap gap-1.5">
                {items.fields.map((field, j) => {
                    const slug = chosen[j]?.slug ?? "";
                    const ok = offer.has(slug);
                    return (
                        <li
                            key={field.id}
                            title={ok ? text.get(slug) : "Not offered here: link it to the lesson (or introduce it) first"}
                            className={cn(
                                "flex items-center gap-1 rounded-full border-2 py-0.5 pl-2.5 pr-1 text-sm",
                                ok ? "border-border" : "border-destructive text-destructive",
                            )}
                        >
                            <span className="font-mono text-xs">{slug}</span>
                            <button
                                type="button"
                                onClick={() => items.remove(j)}
                                aria-label={`Remove ${slug}`}
                                className="rounded-full p-0.5 hover:bg-muted"
                            >
                                <X className="h-3.5 w-3.5" aria-hidden />
                            </button>
                        </li>
                    );
                })}
                {items.fields.length === 0 && <li className="text-sm text-muted-foreground">None yet.</li>}
            </ul>
            <div className="flex flex-wrap items-center gap-2">
                <select
                    value=""
                    onChange={(e) => e.target.value && items.append({ slug: e.target.value })}
                    disabled={left.length === 0}
                    aria-label="Add an item"
                    className={`${FIELD} w-auto max-w-full`}
                >
                    <option value="">{left.length ? "Add an item…" : "Every item is in"}</option>
                    {left.map((item) => (
                        <option key={item.slug} value={item.slug}>
                            {item.slug} · {item.text}
                        </option>
                    ))}
                </select>
                {left.length > 1 && (
                    <Button type="button" size="sm" variant="ghost" onClick={() => items.append(left.map((item) => ({ slug: item.slug })))}>
                        Add all
                    </Button>
                )}
            </div>
            {errors?.message && <FieldError message={errors.message} />}
        </div>
    );
}

function ExplainFields({ form, index: i, linked }: Readonly<{ form: LessonForm; index: number; linked: readonly LinkedItem[] }>) {
    const { register, control, formState } = form;
    const errors = formState.errors.steps?.[i];
    const examples = useFieldArray({ control, name: `steps.${i}.examples` });
    const body = useWatch({ control, name: `steps.${i}.bodyVi` });

    return (
        <>
            <Field label="Title (Vietnamese)" error={errors?.titleVi?.message}>
                <Input {...register(`steps.${i}.titleVi`)} />
            </Field>
            <div className="grid gap-4 lg:grid-cols-2">
                <Field label="Note (Vietnamese; **bold**, - lists, 1. lists and | tables |)" error={errors?.bodyVi?.message}>
                    <textarea {...register(`steps.${i}.bodyVi`)} rows={10} className={`${FIELD} font-mono text-xs`} />
                </Field>
                <div className="space-y-1.5">
                    <Label className="text-sm">What the learner sees</Label>
                    <div className="max-h-72 overflow-y-auto rounded-xl bg-muted/50 p-3">
                        {body?.trim() ? <MiniMarkdown source={body} /> : <p className="text-sm text-muted-foreground">Nothing yet.</p>}
                    </div>
                </div>
            </div>
            <ItemPicker form={form} index={i} label="Items it explains (optional)" options={linked} linked={linked} />
            <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                    <Label className="text-sm">Examples (optional)</Label>
                    <AddButton onClick={() => examples.append({ en: "", vi: "", highlight: "" })} label="Add example" />
                </div>
                <ul className="space-y-2">
                    {examples.fields.map((field, j) => {
                        const e = errors?.examples?.[j];
                        return (
                            <li key={field.id} className="grid items-start gap-2 rounded-xl border-2 border-border p-3 sm:grid-cols-[1fr_1fr_12rem_auto]">
                                <Field label="English" error={e?.en?.message}>
                                    <Input {...register(`steps.${i}.examples.${j}.en`)} />
                                </Field>
                                <Field label="Vietnamese" error={e?.vi?.message}>
                                    <Input {...register(`steps.${i}.examples.${j}.vi`)} />
                                </Field>
                                <Field label="Highlight (optional)" error={e?.highlight?.message}>
                                    <Input {...register(`steps.${i}.examples.${j}.highlight`)} />
                                </Field>
                                <Button type="button" variant="ghost" size="icon" onClick={() => examples.remove(j)} aria-label="Remove example" className="sm:mt-6">
                                    <Trash2 className="h-4 w-4" aria-hidden />
                                </Button>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </>
    );
}

function PatternDrillFields({ form, index: i, patterns }: Readonly<{ form: LessonForm; index: number; patterns: readonly LinkedItem[] }>) {
    const { register, control, formState } = form;
    const errors = formState.errors.steps?.[i];
    const prompts = useFieldArray({ control, name: `steps.${i}.prompts` });
    const pattern = useWatch({ control, name: `steps.${i}.pattern` });
    // The pattern's template names the slots a prompt fills.
    const item = useAdminRecordQuery("item", pattern || null);
    const record = item.data?.record as { pattern?: { template?: string } } | undefined;
    const template = record?.pattern?.template ?? "";
    const slots = templateSlots(template);
    const options = patterns.map((p) => ({ value: p.slug, label: `${p.slug} · ${p.text}` }));

    return (
        <>
            <div className="space-y-1.5">
                <SelectField
                    label="Pattern (a PATTERN item the lesson links)"
                    error={errors?.pattern?.message}
                    options={keepCurrent(options, pattern ?? "")}
                    placeholder="Choose a pattern…"
                    registration={register(`steps.${i}.pattern`)}
                />
                {template && (
                    <p className="text-sm text-muted-foreground">
                        Template: <span className="font-mono text-foreground">{template}</span>
                    </p>
                )}
            </div>
            <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                    <Label className="text-sm">Prompts</Label>
                    <AddButton
                        onClick={() => prompts.append({ cueVi: "", slots: slots.map((name) => ({ name, value: "" })), answer: "" })}
                        label="Add prompt"
                    />
                </div>
                {errors?.prompts?.message && <FieldError message={errors.prompts.message} />}
                <ol className="space-y-2">
                    {prompts.fields.map((field, j) => (
                        <li key={field.id} className="space-y-3 rounded-xl border-2 border-border p-3">
                            <div className="flex items-start gap-2">
                                <div className="grid flex-1 gap-3 sm:grid-cols-2">
                                    <Field label={`Cue ${j + 1} (Vietnamese: what to say)`} error={errors?.prompts?.[j]?.cueVi?.message}>
                                        <Input {...register(`steps.${i}.prompts.${j}.cueVi`)} />
                                    </Field>
                                    <Field label="Answer (the whole English sentence)" error={errors?.prompts?.[j]?.answer?.message}>
                                        <Input {...register(`steps.${i}.prompts.${j}.answer`)} />
                                    </Field>
                                </div>
                                <Button type="button" variant="ghost" size="icon" onClick={() => prompts.remove(j)} aria-label="Remove prompt" className="mt-6">
                                    <Trash2 className="h-4 w-4" aria-hidden />
                                </Button>
                            </div>
                            <SlotList form={form} step={i} prompt={j} slots={slots} />
                        </li>
                    ))}
                </ol>
            </div>
        </>
    );
}

/** The `{slot}` fillers of one prompt: the learner fills them, then says the answer. */
function SlotList({ form, step: i, prompt: j, slots }: Readonly<{ form: LessonForm; step: number; prompt: number; slots: readonly string[] }>) {
    const { register, control, formState } = form;
    const list = useFieldArray({ control, name: `steps.${i}.prompts.${j}.slots` });
    const filled = useWatch({ control, name: `steps.${i}.prompts.${j}.slots` }) ?? [];
    const errors = formState.errors.steps?.[i]?.prompts?.[j]?.slots;
    const missing = slots.filter((name) => !filled.some((s) => s.name.trim() === name));

    return (
        <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
                <Label className="text-sm">Slots</Label>
                {missing.map((name) => (
                    <Button key={name} type="button" size="sm" variant="outline" onClick={() => list.append({ name, value: "" })}>
                        + {`{${name}}`}
                    </Button>
                ))}
                {slots.length === 0 && <AddButton onClick={() => list.append({ name: "", value: "" })} label="Add slot" />}
            </div>
            <ul className="space-y-2">
                {list.fields.map((field, k) => (
                    <li key={field.id} className="flex flex-wrap items-start gap-2">
                        <div className="w-36">
                            <Input
                                {...register(`steps.${i}.prompts.${j}.slots.${k}.name`)}
                                aria-label="Slot name"
                                placeholder="slot"
                                className={cn("font-mono", slots.length > 0 && !slots.includes(filled[k]?.name.trim() ?? "") && "border-destructive")}
                            />
                            {errors?.[k]?.name && <FieldError message={errors[k].name.message ?? ""} />}
                        </div>
                        <div className="min-w-40 flex-1">
                            <Input {...register(`steps.${i}.prompts.${j}.slots.${k}.value`)} aria-label="Filled with" placeholder="filled with" />
                            {errors?.[k]?.value && <FieldError message={errors[k].value.message ?? ""} />}
                        </div>
                        <Button type="button" variant="ghost" size="icon" onClick={() => list.remove(k)} aria-label="Remove slot">
                            <Trash2 className="h-4 w-4" aria-hidden />
                        </Button>
                    </li>
                ))}
            </ul>
        </div>
    );
}

function SpeakFields({ form, index: i }: Readonly<{ form: LessonForm; index: number }>) {
    const { register, control, formState } = form;
    const errors = formState.errors.steps?.[i];
    const lines = useFieldArray({ control, name: `steps.${i}.lines` });

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
                <Label className="text-sm">Sentences to listen to and repeat</Label>
                <AddButton onClick={() => lines.append({ en: "", vi: "" })} label="Add sentence" />
            </div>
            {errors?.lines?.message && <FieldError message={errors.lines.message} />}
            <ol className="space-y-2">
                {lines.fields.map((field, j) => (
                    <li key={field.id} className="grid items-start gap-2 sm:grid-cols-[1fr_1fr_auto]">
                        <div>
                            <Input {...register(`steps.${i}.lines.${j}.en`)} aria-label={`Sentence ${j + 1} (English)`} placeholder="English" />
                            {errors?.lines?.[j]?.en && <FieldError message={errors.lines[j].en.message ?? ""} />}
                        </div>
                        <div>
                            <Input {...register(`steps.${i}.lines.${j}.vi`)} aria-label={`Sentence ${j + 1} (Vietnamese)`} placeholder="Vietnamese" />
                            {errors?.lines?.[j]?.vi && <FieldError message={errors.lines[j].vi.message ?? ""} />}
                        </div>
                        <Button type="button" variant="ghost" size="icon" onClick={() => lines.remove(j)} aria-label="Remove sentence">
                            <Trash2 className="h-4 w-4" aria-hidden />
                        </Button>
                    </li>
                ))}
            </ol>
        </div>
    );
}
