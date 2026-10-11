"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { IMPORT_TEMPLATE_CSV, type ImportFormat, type ImportWordRow } from "@/lib/word-import";
import { lessonRoom, wordCount } from "@/lib/word-import-review";
import type { ILesson } from "@/types/courses/courses.type";
import { ArrowRight, ChevronDown, ClipboardPaste, Download, FileText, FileUp, Sparkles, X } from "lucide-react";
import { type DragEvent, useId, useRef, useState } from "react";

export type SourceMode = "paste" | "file";

export interface ImportSource {
    mode: SourceMode;
    text: string;
    /** The uploaded file's name, while `mode` is `file`. */
    fileName: string;
}

export type ParsedSource =
    | { ok: true; rows: ImportWordRow[]; format: ImportFormat }
    | { ok: false; error: string };

const FORMAT_LABELS: Record<ImportFormat, string> = {
    json: "JSON list",
    csv: "comma-separated",
    tsv: "tab-separated (from a spreadsheet)",
    lines: "one word per line",
};

const SAMPLE = "resilient, kiên cường\nanxiety, lo âu, /æŋˈzaɪəti/, noun\nserendipity";

const ACCEPT = ".csv,.tsv,.txt,.json,text/csv,text/tab-separated-values,text/plain,application/json";

/** Step 1: which lesson, the words (pasted or a file), and whether to fill details in. */
export function ImportSourceStep({
    lessons,
    lessonId,
    onLessonChange,
    source,
    onSourceChange,
    parsed,
    autoFill,
    onAutoFillChange,
    onContinue,
}: Readonly<{
    lessons: ILesson[];
    lessonId: string;
    onLessonChange: (id: string) => void;
    source: ImportSource;
    onSourceChange: (source: ImportSource) => void;
    parsed: ParsedSource | null;
    autoFill: boolean;
    onAutoFillChange: (on: boolean) => void;
    onContinue: () => void;
}>) {
    const count = parsed?.ok ? parsed.rows.length : 0;

    return (
        <div className="space-y-5">
            <LessonPicker lessons={lessons} value={lessonId} onChange={onLessonChange} />

            <section className="surface-card space-y-4 p-4 sm:p-6" aria-labelledby="import-words-heading">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 id="import-words-heading" className="text-base font-bold">
                        Your words
                    </h2>
                    <SourceToggle value={source.mode} onChange={(mode) => onSourceChange({ ...source, mode })} />
                </div>

                {source.mode === "paste" ? (
                    <PasteArea
                        value={source.text}
                        onChange={(text) => onSourceChange({ mode: "paste", text, fileName: "" })}
                    />
                ) : (
                    <FileDrop
                        fileName={source.fileName}
                        onFile={(fileName, text) => onSourceChange({ mode: "file", text, fileName })}
                        onClear={() => onSourceChange({ mode: "file", text: "", fileName: "" })}
                    />
                )}

                <ParseStatus parsed={parsed} />
                <FormatHelp />
            </section>

            <section className="surface-card flex items-start gap-3 p-4 sm:p-6">
                <Switch id="import-autofill" checked={autoFill} onCheckedChange={onAutoFillChange} className="mt-0.5" />
                <div className="min-w-0">
                    <Label htmlFor="import-autofill" className="flex cursor-pointer items-center gap-1.5 text-sm font-semibold">
                        <Sparkles className="h-4 w-4 text-primary" aria-hidden />
                        Fill in missing details from the dictionary
                    </Label>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Meaning, pronunciation, audio, a picture and examples. What you typed is never replaced.
                    </p>
                </div>
            </section>

            <div className="flex justify-end">
                <Button size="lg" onClick={onContinue} disabled={count === 0} className="w-full sm:w-auto">
                    {count > 0 ? `Review ${wordCount(count)}` : "Review words"}
                    <ArrowRight className="h-4 w-4" aria-hidden />
                </Button>
            </div>
        </div>
    );
}

/** The lessons as cards, with the room each has left; a full lesson can't be picked. */
function LessonPicker({
    lessons,
    value,
    onChange,
}: Readonly<{ lessons: ILesson[]; value: string; onChange: (id: string) => void }>) {
    return (
        <section className="surface-card p-4 sm:p-6" aria-labelledby="import-lesson-heading">
            <h2 id="import-lesson-heading" className="text-base font-bold">
                Add them to
            </h2>
            <div
                role="radiogroup"
                aria-labelledby="import-lesson-heading"
                className="mt-3 grid max-h-72 grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2"
            >
                {lessons.map((lesson) => {
                    const room = lessonRoom(lesson);
                    const full = room === 0;
                    const active = lesson.id === value;
                    const words = lesson.words?.length ?? 0;
                    return (
                        <button
                            key={lesson.id}
                            type="button"
                            role="radio"
                            aria-checked={active}
                            disabled={full}
                            onClick={() => onChange(lesson.id)}
                            className={cn(
                                "flex min-h-14 items-center justify-between gap-3 rounded-2xl border-2 px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/45",
                                active ? "border-primary bg-primary/8" : "border-border/70 hover:border-primary/40 hover:bg-muted/40",
                                full && "cursor-not-allowed opacity-55 hover:border-border/70 hover:bg-transparent",
                            )}
                        >
                            <span className="min-w-0">
                                <span className="block truncate font-semibold">{lesson.name}</span>
                                <span className="text-xs text-muted-foreground">
                                    {lesson.maxWords ? `${words} of ${lesson.maxWords} words` : wordCount(words)}
                                </span>
                            </span>
                            {full ? (
                                <Badge variant="muted">Full</Badge>
                            ) : room != null ? (
                                <Badge variant="secondary">{room} left</Badge>
                            ) : null}
                        </button>
                    );
                })}
            </div>
        </section>
    );
}

function SourceToggle({ value, onChange }: Readonly<{ value: SourceMode; onChange: (mode: SourceMode) => void }>) {
    const options: { value: SourceMode; label: string; icon: typeof FileUp }[] = [
        { value: "paste", label: "Paste", icon: ClipboardPaste },
        { value: "file", label: "Upload a file", icon: FileUp },
    ];
    return (
        <div role="radiogroup" aria-label="How to add words" className="flex rounded-xl border border-border/70 bg-muted/40 p-0.5">
            {options.map((option) => {
                const active = option.value === value;
                const Icon = option.icon;
                return (
                    <Button
                        key={option.value}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        variant={active ? "default" : "ghost"}
                        size="sm"
                        onClick={() => onChange(option.value)}
                        className="rounded-lg px-3"
                    >
                        <Icon className="h-4 w-4" aria-hidden />
                        {option.label}
                    </Button>
                );
            })}
        </div>
    );
}

function PasteArea({ value, onChange }: Readonly<{ value: string; onChange: (text: string) => void }>) {
    const id = useId();
    return (
        <div className="space-y-2">
            <label htmlFor={id} className="sr-only">
                Words to import
            </label>
            <textarea
                id={id}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                rows={9}
                spellCheck={false}
                placeholder={"One word per line, for example:\n\n" + SAMPLE}
                aria-describedby={`${id}-hint`}
                className="block min-h-48 w-full resize-y rounded-2xl border border-input bg-background px-4 py-3 text-base leading-relaxed shadow-xs placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/45 sm:text-sm"
            />
            <p id={`${id}-hint`} className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span>Copy rows straight from a spreadsheet, or type a word with its meaning after a comma.</span>
                {!value.trim() && (
                    <button
                        type="button"
                        onClick={() => onChange(SAMPLE)}
                        className="font-semibold text-primary underline-offset-4 hover:underline"
                    >
                        Try an example
                    </button>
                )}
            </p>
        </div>
    );
}

/** A drop zone that is also a button: click, Enter or Space opens the picker; dropping a file works too. */
function FileDrop({
    fileName,
    onFile,
    onClear,
}: Readonly<{ fileName: string; onFile: (name: string, text: string) => void; onClear: () => void }>) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [dragging, setDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const read = async (file: File | undefined) => {
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) {
            setError("That file is over 2 MB. Split it into smaller files.");
            return;
        }
        setError(null);
        onFile(file.name, await file.text());
    };

    const onDrop = (event: DragEvent) => {
        event.preventDefault();
        setDragging(false);
        void read(event.dataTransfer.files?.[0]);
    };

    if (fileName) {
        return (
            <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-muted/30 px-4 py-3">
                <FileText className="h-5 w-5 shrink-0 text-primary" aria-hidden />
                <span className="min-w-0 flex-1 truncate text-sm font-semibold">{fileName}</span>
                <Button variant="ghost" size="sm" onClick={() => inputRef.current?.click()}>
                    Choose another
                </Button>
                <Button variant="ghost" size="icon-sm" onClick={onClear} aria-label="Remove file">
                    <X className="h-4 w-4" />
                </Button>
                <HiddenInput inputRef={inputRef} onPick={read} />
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <button
                type="button"
                onClick={() => inputRef.current?.click()}
                onDragOver={(event) => {
                    event.preventDefault();
                    setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                className={cn(
                    "flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/45",
                    dragging ? "border-primary bg-primary/8" : "border-border hover:border-primary/50 hover:bg-muted/30",
                )}
            >
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <FileUp className="h-6 w-6" aria-hidden />
                </span>
                <span className="text-sm font-semibold">
                    {dragging ? "Drop it here" : "Choose a file or drop it here"}
                </span>
                <span className="text-xs text-muted-foreground">CSV, TSV, TXT or JSON, up to 2 MB</span>
            </button>
            {error && (
                <p role="alert" className="text-sm font-medium text-destructive">
                    {error}
                </p>
            )}
            <HiddenInput inputRef={inputRef} onPick={read} />
        </div>
    );
}

function HiddenInput({
    inputRef,
    onPick,
}: Readonly<{ inputRef: React.RefObject<HTMLInputElement | null>; onPick: (file: File | undefined) => void }>) {
    return (
        <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            className="sr-only"
            tabIndex={-1}
            aria-hidden
            onChange={(event) => {
                onPick(event.target.files?.[0]);
                event.target.value = "";
            }}
        />
    );
}

/** Live feedback on what was understood, announced politely as it changes. */
function ParseStatus({ parsed }: Readonly<{ parsed: ParsedSource | null }>) {
    if (!parsed) return null;
    if (!parsed.ok) {
        return (
            <p role="alert" className="rounded-xl bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
                {parsed.error}
            </p>
        );
    }
    if (parsed.rows.length === 0) {
        return (
            <p aria-live="polite" className="text-sm text-muted-foreground">
                No words found yet. Put each word on its own line.
            </p>
        );
    }
    const preview = parsed.rows.slice(0, 8);
    return (
        <div aria-live="polite" className="space-y-2">
            <p className="text-sm">
                <span className="font-bold text-primary">{wordCount(parsed.rows.length)}</span>{" "}
                <span className="text-muted-foreground">found · {FORMAT_LABELS[parsed.format]}</span>
            </p>
            <ul className="flex flex-wrap gap-1.5" aria-label="First words found">
                {preview.map((row) => (
                    <li key={row.id} className="max-w-full truncate rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
                        {row.word}
                    </li>
                ))}
                {parsed.rows.length > preview.length && (
                    <li className="rounded-full px-2 py-1 text-xs text-muted-foreground">
                        +{parsed.rows.length - preview.length} more
                    </li>
                )}
            </ul>
        </div>
    );
}

function FormatHelp() {
    const download = () => {
        const url = URL.createObjectURL(new Blob([IMPORT_TEMPLATE_CSV], { type: "text/csv;charset=utf-8" }));
        const link = document.createElement("a");
        link.href = url;
        link.download = "wordsly-import-template.csv";
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <details className="group rounded-2xl border border-border/70 bg-muted/20">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-sm font-semibold [&::-webkit-details-marker]:hidden">
                What can I paste?
                <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" aria-hidden />
            </summary>
            <div className="space-y-3 border-t border-border/60 px-4 py-3 text-sm">
                <dl className="space-y-3">
                    <div>
                        <dt className="font-semibold">Just the words</dt>
                        <dd className="text-muted-foreground">One per line. The dictionary can fill in the rest.</dd>
                    </div>
                    <div>
                        <dt className="font-semibold">Words with details</dt>
                        <dd className="text-muted-foreground">
                            In this order, separated by commas or tabs: word, meaning, pronunciation, part of speech.
                        </dd>
                        <pre className="mt-1.5 overflow-x-auto rounded-xl bg-background px-3 py-2 text-xs">
                            {"anxiety, lo âu, /æŋˈzaɪəti/, noun"}
                        </pre>
                    </div>
                    <div>
                        <dt className="font-semibold">A table with a header row</dt>
                        <dd className="text-muted-foreground">
                            Columns can be in any order. Also understood: example, exampleTranslation, exampleAudio,
                            audioUrl, imageUrl. A JSON list exported from Wordsly works too.
                        </dd>
                    </div>
                </dl>
                <Button variant="outline" size="sm" onClick={download}>
                    <Download className="h-4 w-4" aria-hidden />
                    Download a template
                </Button>
            </div>
        </details>
    );
}
