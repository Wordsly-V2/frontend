"use client";

import { WordAutocomplete } from "@/components/common/word-autocomplete";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { playAudioUrl } from "@/lib/practice-audio";
import { cn } from "@/lib/utils";
import { type ImportWordRow, isSenseActive, nextExampleId, type WordSense } from "@/lib/word-import";
import type { RowStatus } from "@/lib/word-import-review";
import type { IWordExample, IWordSearchResult } from "@/types/courses/courses.type";
import {
    AlertCircle,
    CheckCircle2,
    ChevronDown,
    ImageIcon,
    Plus,
    RotateCcw,
    SearchX,
    Trash2,
    Undo2,
    Volume2,
    WifiOff,
} from "lucide-react";
import Image from "next/image";
import { memo, useId, useState } from "react";

const STATUS_BADGES: Record<RowStatus, { label: string; variant: "success" | "warning" | "muted" | "secondary" }> = {
    ready: { label: "Ready", variant: "success" },
    "needs-meaning": { label: "Needs a meaning", variant: "warning" },
    duplicate: { label: "Repeated", variant: "warning" },
    "in-lesson": { label: "Already in lesson", variant: "secondary" },
    "over-limit": { label: "No room", variant: "warning" },
    skipped: { label: "Left out", variant: "muted" },
};

export interface WordCardActions {
    update: (id: string, patch: Partial<ImportWordRow>) => void;
    remove: (id: string) => void;
    lookUp: (id: string, word?: string) => void;
    chooseSense: (id: string, sense: WordSense) => void;
}

/**
 * One staged word in review: the word and its meaning up front (meaning is the
 * only thing the server requires), what the dictionary found, the problem if
 * there is one with the action that fixes it, and the rest behind "Details".
 */
export const ImportWordCard = memo(function ImportWordCard({
    row,
    status,
    busy,
    actions,
}: Readonly<{ row: ImportWordRow; status: RowStatus; busy: boolean; actions: WordCardActions }>) {
    const [open, setOpen] = useState(false);
    const [imageBroken, setImageBroken] = useState(false);
    const meaningId = useId();
    const problemId = useId();
    const detailsId = useId();
    const badge = STATUS_BADGES[status];
    const skipped = status === "skipped";
    const senses = row.senses ?? [];
    const image = !imageBroken && row.imageUrl.trim() ? row.imageUrl : "";

    return (
        <li
            className={cn(
                "rounded-2xl border bg-card p-3 transition-colors sm:p-4",
                status === "ready" ? "border-border/70" : "border-border",
                skipped && "bg-muted/30",
            )}
        >
            <div className={cn("flex gap-3", skipped && "opacity-60")}>
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-muted sm:h-16 sm:w-16">
                    {image ? (
                        <Image
                            src={image}
                            alt=""
                            fill
                            sizes="64px"
                            loading="lazy"
                            className="object-cover"
                            onError={() => setImageBroken(true)}
                        />
                    ) : (
                        <span className="flex h-full w-full items-center justify-center text-muted-foreground/60">
                            {busy ? <LoadingSpinner size="sm" showLabel={false} /> : <ImageIcon className="h-5 w-5" aria-hidden />}
                        </span>
                    )}
                </div>

                <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <div className="min-w-0 flex-1 basis-40">
                            <WordAutocomplete
                                id={`${row.id}-word`}
                                value={row.word}
                                onChange={(word) => actions.update(row.id, { word })}
                                onSelect={(item: IWordSearchResult) => actions.lookUp(row.id, item.word)}
                                placeholder="Word"
                                className="!space-y-0"
                                inputClassName="h-9 border-transparent bg-transparent px-2 text-base font-bold shadow-none hover:border-input focus-visible:border-input"
                            />
                        </div>
                        <Badge variant={badge.variant} className="shrink-0">
                            {badge.label}
                        </Badge>
                    </div>

                    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 px-2 text-sm text-muted-foreground">
                        {row.partOfSpeech && (
                            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                                {row.partOfSpeech}
                            </span>
                        )}
                        {row.pronunciation && <span className="font-mono text-xs">{row.pronunciation}</span>}
                        {row.audioUrl && (
                            <button
                                type="button"
                                onClick={() => playAudioUrl(row.audioUrl)}
                                className="inline-flex h-7 w-7 items-center justify-center rounded-full text-primary hover:bg-primary/10"
                                aria-label={`Play ${row.word}`}
                            >
                                <Volume2 className="h-4 w-4" />
                            </button>
                        )}
                        {row.examples.length > 0 && (
                            <span className="text-xs">
                                {row.examples.length} example{row.examples.length === 1 ? "" : "s"}
                            </span>
                        )}
                        <LookupNote row={row} busy={busy} onRetry={() => actions.lookUp(row.id)} />
                    </p>

                    <div>
                        <label htmlFor={meaningId} className="sr-only">
                            Meaning of {row.word || "this word"}
                        </label>
                        <Input
                            id={meaningId}
                            value={row.meaning}
                            onChange={(event) => actions.update(row.id, { meaning: event.target.value })}
                            placeholder="Meaning (required)"
                            aria-invalid={status === "needs-meaning" || undefined}
                            aria-describedby={status === "needs-meaning" ? problemId : undefined}
                            className="h-10 text-base sm:text-sm"
                        />
                    </div>

                    {senses.length > 1 && !skipped && (
                        <div className="space-y-1">
                            <p className="px-1 text-xs font-semibold text-muted-foreground">Other meanings</p>
                            <div className="flex flex-wrap gap-1.5">
                                {senses.map((sense) => {
                                    const active = isSenseActive(row, sense);
                                    return (
                                        <button
                                            key={`${sense.partOfSpeech}-${sense.meaning}`}
                                            type="button"
                                            aria-pressed={active}
                                            disabled={busy}
                                            onClick={() => actions.chooseSense(row.id, sense)}
                                            className={cn(
                                                "max-w-full truncate rounded-full border px-3 py-1 text-left text-xs transition-colors",
                                                active
                                                    ? "border-primary bg-primary/10 font-semibold text-primary"
                                                    : "border-border hover:border-primary/40 hover:bg-muted/50",
                                            )}
                                        >
                                            <span className="font-semibold">{sense.partOfSpeech}</span>
                                            {sense.meaning && <span> · {sense.meaning}</span>}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <Problem id={problemId} row={row} status={status} actions={actions} />

            <div className="mt-2 flex flex-wrap items-center justify-between gap-1 border-t border-border/50 pt-2">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setOpen(!open)}
                    aria-expanded={open}
                    aria-controls={detailsId}
                    className="text-muted-foreground"
                >
                    <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} aria-hidden />
                    Details
                </Button>
                <span className="flex gap-1">
                    {skipped ? (
                        <Button variant="ghost" size="sm" onClick={() => actions.update(row.id, { skipped: false })}>
                            <Undo2 className="h-4 w-4" aria-hidden />
                            Put back
                        </Button>
                    ) : (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => actions.update(row.id, { skipped: true })}
                            className="text-muted-foreground"
                        >
                            Leave out
                        </Button>
                    )}
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => actions.remove(row.id)}
                        aria-label={`Remove ${row.word || "word"} from the list`}
                        className="text-muted-foreground hover:text-destructive"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </span>
            </div>

            {open && (
                <div id={detailsId} className="mt-2">
                    <WordDetails row={row} update={(patch) => actions.update(row.id, patch)} onImageEdit={() => setImageBroken(false)} />
                </div>
            )}
        </li>
    );
});

/** What the dictionary lookup did for this row, with a retry when it couldn't ask. */
function LookupNote({ row, busy, onRetry }: Readonly<{ row: ImportWordRow; busy: boolean; onRetry: () => void }>) {
    if (busy) {
        return (
            <span className="inline-flex items-center gap-1 text-xs text-primary">
                <LoadingSpinner size="sm" showLabel={false} />
                Looking up…
            </span>
        );
    }
    if (row.lookup === "found") {
        return (
            <span className="inline-flex items-center gap-1 text-xs">
                <CheckCircle2 className="h-3.5 w-3.5 text-[var(--brand-success)]" aria-hidden />
                From the dictionary
            </span>
        );
    }
    if (row.lookup === "not-found") {
        return (
            <span className="inline-flex items-center gap-1 text-xs">
                <SearchX className="h-3.5 w-3.5" aria-hidden />
                Not in the dictionary
            </span>
        );
    }
    if (row.lookup === "failed") {
        return (
            <span className="inline-flex items-center gap-1 text-xs">
                <WifiOff className="h-3.5 w-3.5" aria-hidden />
                Couldn&apos;t look it up
                <button
                    type="button"
                    onClick={onRetry}
                    className="ml-1 inline-flex items-center gap-1 font-semibold text-primary underline-offset-4 hover:underline"
                >
                    <RotateCcw className="h-3 w-3" aria-hidden />
                    Try again
                </button>
            </span>
        );
    }
    return null;
}

/** The row's problem in words, next to the button that fixes it. */
function Problem({
    id,
    row,
    status,
    actions,
}: Readonly<{ id: string; row: ImportWordRow; status: RowStatus; actions: WordCardActions }>) {
    const messages: Partial<Record<RowStatus, { text: string; action?: { label: string; run: () => void } }>> = {
        "needs-meaning": {
            text:
                row.lookup === "not-found"
                    ? "The dictionary doesn't know this word. Type a meaning to add it."
                    : "Add a meaning to import this word.",
        },
        duplicate: {
            text: "This word is already higher up in your list.",
            action: { label: "Import it twice", run: () => actions.update(row.id, { keepDuplicate: true }) },
        },
        "in-lesson": {
            text: "This lesson already has this word, so it will be left out.",
            action: { label: "Add it again", run: () => actions.update(row.id, { keepDuplicate: true }) },
        },
        "over-limit": { text: "The lesson is full before this word. Pick another lesson or leave some words out." },
    };
    const message = messages[status];
    if (!message) return null;
    return (
        <div
            id={id}
            className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl bg-[var(--brand-warning)]/12 px-3 py-2 text-sm"
        >
            <AlertCircle className="h-4 w-4 shrink-0 text-[var(--brand-orange)]" aria-hidden />
            <span className="min-w-0 flex-1">{message.text}</span>
            {message.action && (
                <Button variant="ghost" size="sm" onClick={message.action.run} className="h-7 px-2">
                    {message.action.label}
                </Button>
            )}
        </div>
    );
}

function WordDetails({
    row,
    update,
    onImageEdit,
}: Readonly<{ row: ImportWordRow; update: (patch: Partial<ImportWordRow>) => void; onImageEdit: () => void }>) {
    const setExample = (exampleId: string, patch: Partial<IWordExample>) =>
        update({ examples: row.examples.map((ex) => (ex.id === exampleId ? { ...ex, ...patch } : ex)) });

    return (
        <div className="space-y-3 rounded-xl bg-muted/30 p-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Part of speech">
                    {(id) => (
                        <Input
                            id={id}
                            value={row.partOfSpeech}
                            onChange={(e) => update({ partOfSpeech: e.target.value })}
                            placeholder="noun, verb…"
                        />
                    )}
                </Field>
                <Field label="Pronunciation (IPA)">
                    {(id) => (
                        <Input
                            id={id}
                            value={row.pronunciation}
                            onChange={(e) => update({ pronunciation: e.target.value })}
                            placeholder="/ˈæp.əl/"
                        />
                    )}
                </Field>
                <Field label="Audio link">
                    {(id) => (
                        <div className="flex gap-1.5">
                            <Input
                                id={id}
                                type="url"
                                inputMode="url"
                                value={row.audioUrl}
                                onChange={(e) => update({ audioUrl: e.target.value })}
                                placeholder="https://…"
                            />
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => playAudioUrl(row.audioUrl)}
                                disabled={!row.audioUrl.trim()}
                                aria-label="Play audio"
                            >
                                <Volume2 className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </Field>
                <Field label="Picture link">
                    {(id) => (
                        <Input
                            id={id}
                            type="url"
                            inputMode="url"
                            value={row.imageUrl}
                            onChange={(e) => {
                                onImageEdit();
                                update({ imageUrl: e.target.value });
                            }}
                            placeholder="https://…"
                        />
                    )}
                </Field>
            </div>

            <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">Examples</p>
                {row.examples.map((example, i) => (
                    <div key={example.id} className="space-y-1.5 rounded-xl border border-border/60 bg-background p-2">
                        <div className="flex gap-1.5">
                            <Input
                                value={example.text}
                                onChange={(e) => setExample(example.id, { text: e.target.value })}
                                placeholder="Example sentence"
                                aria-label={`Example ${i + 1}`}
                            />
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => update({ examples: row.examples.filter((ex) => ex.id !== example.id) })}
                                aria-label={`Remove example ${i + 1}`}
                                className="shrink-0 text-muted-foreground hover:text-destructive"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                        <Input
                            value={example.translation ?? ""}
                            onChange={(e) => setExample(example.id, { translation: e.target.value })}
                            placeholder="Translation (optional)"
                            aria-label={`Translation of example ${i + 1}`}
                        />
                    </div>
                ))}
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => update({ examples: [...row.examples, { id: nextExampleId(), text: "" }] })}
                >
                    <Plus className="h-4 w-4" aria-hidden />
                    Add example
                </Button>
            </div>
        </div>
    );
}

function Field({ label, children }: Readonly<{ label: string; children: (id: string) => React.ReactNode }>) {
    const id = useId();
    return (
        <div className="space-y-1">
            <Label htmlFor={id} className="text-xs text-muted-foreground">
                {label}
            </Label>
            {children(id)}
        </div>
    );
}
