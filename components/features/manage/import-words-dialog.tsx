"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
    applySenseToRow,
    enrichWordRow,
    ImportWordRow,
    isRowValid,
    isSenseActive,
    mapWithConcurrency,
    parseWordsDelimited,
    parseWordsJson,
    WordSense,
} from "@/lib/word-import";
import { WordAutocomplete } from "@/components/common/word-autocomplete";
import { playAudioUrl } from "@/lib/practice-audio";
import { ILesson, IWordSearchResult } from "@/types/courses/courses.type";
import { AlertTriangle, ChevronDown, FileUp, ImageIcon, Plus, Sparkles, Trash2, Volume2, Wand2 } from "lucide-react";
import Image from "next/image";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";

const ENRICH_CONCURRENCY = 4;

interface ImportWordsDialogProps {
    isOpen: boolean;
    onClose: () => void;
    lessons: ILesson[];
    defaultLessonId?: string;
    isImporting: boolean;
    onImport: (lessonId: string, rows: ImportWordRow[]) => void;
}

const PASTE_PLACEHOLDER = `Paste one word per line. Examples:

resilient, kiên cường
anxiety, lo âu, /æŋˈzaɪəti/, noun
serendipity

Tip: columns are word, meaning, pronunciation, part of speech
(comma, tab, or a CSV/JSON file all work).`;

export default function ImportWordsDialog({
    isOpen,
    onClose,
    lessons,
    defaultLessonId,
    isImporting,
    onImport,
}: Readonly<ImportWordsDialogProps>) {
    const [targetLessonId, setTargetLessonId] = useState<string>("");
    const [pasteText, setPasteText] = useState("");
    const [rows, setRows] = useState<ImportWordRow[]>([]);
    const [phase, setPhase] = useState<"input" | "review">("input");
    const [autoEnrich, setAutoEnrich] = useState(true);
    const [enrichDone, setEnrichDone] = useState<number | null>(null);
    const [isEnriching, setIsEnriching] = useState(false);
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
    const [applyingSenseRows, setApplyingSenseRows] = useState<Set<string>>(new Set());
    const [enrichingRows, setEnrichingRows] = useState<Set<string>>(new Set());
    const fileInputRef = useRef<HTMLInputElement>(null);

    const toggleRow = (id: string) => {
        setExpandedRows((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    // Resolve the effective target lesson (falls back to the default / first lesson).
    const effectiveLessonId =
        targetLessonId || defaultLessonId || lessons[0]?.id || "";
    const targetLesson = lessons.find((l) => l.id === effectiveLessonId);

    const validRows = useMemo(() => rows.filter(isRowValid), [rows]);
    const invalidCount = rows.length - validRows.length;

    const currentWordCount = targetLesson?.words?.length ?? 0;
    const maxWords = targetLesson?.maxWords ?? null;
    const remaining = maxWords != null ? maxWords - currentWordCount : null;
    const willExceed = remaining != null && validRows.length > remaining;

    const reset = () => {
        setPasteText("");
        setRows([]);
        setPhase("input");
        setEnrichDone(null);
        setIsEnriching(false);
    };

    const handleClose = () => {
        reset();
        setTargetLessonId("");
        onClose();
    };

    const goToReview = (parsed: ImportWordRow[]) => {
        if (parsed.length === 0) {
            toast.error("No words found — check the format and try again.");
            return;
        }
        setRows(parsed);
        setEnrichDone(null);
        setPhase("review");
    };

    const handleParsePaste = () => {
        const text = pasteText.trim();
        if (!text) {
            toast.error("Paste some words first.");
            return;
        }
        try {
            const parsed = text.startsWith("[") ? parseWordsJson(text) : parseWordsDelimited(text);
            goToReview(parsed);
        } catch (err) {
            toast.error("Could not parse: " + (err as Error).message);
        }
    };

    const handleFile = async (file: File) => {
        try {
            const text = await file.text();
            const isJson = file.name.toLowerCase().endsWith(".json") || text.trim().startsWith("[");
            const parsed = isJson ? parseWordsJson(text) : parseWordsDelimited(text);
            goToReview(parsed);
        } catch (err) {
            toast.error("Could not read file: " + (err as Error).message);
        }
    };

    const updateRow = (id: string, patch: Partial<ImportWordRow>) => {
        setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    };

    const removeRow = (id: string) => {
        setRows((prev) => prev.filter((r) => r.id !== id));
    };

    const updateExample = (id: string, index: number, value: string) => {
        setRows((prev) =>
            prev.map((r) =>
                r.id === id
                    ? { ...r, examples: r.examples.map((ex, i) => (i === index ? value : ex)) }
                    : r,
            ),
        );
    };

    const addExample = (id: string) => {
        setRows((prev) =>
            prev.map((r) => (r.id === id ? { ...r, examples: [...r.examples, ""] } : r)),
        );
    };

    const removeExample = (id: string, index: number) => {
        setRows((prev) =>
            prev.map((r) =>
                r.id === id ? { ...r, examples: r.examples.filter((_, i) => i !== index) } : r,
            ),
        );
    };

    const markImageError = (id: string) => {
        setImageErrors((prev) => new Set(prev).add(id));
    };

    const enrichSingleRow = async (row: ImportWordRow) => {
        if (!row.word.trim()) {
            toast.error("Add a word first.");
            return;
        }
        setEnrichingRows((prev) => new Set(prev).add(row.id));
        try {
            const updated = await enrichWordRow(row, { overwrite: true });
            updateRow(row.id, updated);
            setImageErrors((prev) => {
                if (!prev.has(row.id)) return prev;
                const next = new Set(prev);
                next.delete(row.id);
                return next;
            });
        } catch {
            toast.error("Couldn't enrich this word. Try again.");
        } finally {
            setEnrichingRows((prev) => {
                const next = new Set(prev);
                next.delete(row.id);
                return next;
            });
        }
    };

    const handleSelectSuggestion = (row: ImportWordRow, item: IWordSearchResult) => {
        // Adopt the picked word and pull its full dictionary details for this row.
        updateRow(row.id, { word: item.word });
        enrichSingleRow({ ...row, word: item.word });
    };

    const chooseSense = async (row: ImportWordRow, sense: WordSense) => {
        setApplyingSenseRows((prev) => new Set(prev).add(row.id));
        try {
            const updated = await applySenseToRow(row, sense);
            // Preserve senses list and clear any stale image error.
            updateRow(row.id, { ...updated, senses: row.senses });
            setImageErrors((prev) => {
                if (!prev.has(row.id)) return prev;
                const next = new Set(prev);
                next.delete(row.id);
                return next;
            });
        } catch {
            toast.error("Couldn't switch sense. Try again.");
        } finally {
            setApplyingSenseRows((prev) => {
                const next = new Set(prev);
                next.delete(row.id);
                return next;
            });
        }
    };

    const runEnrich = async () => {
        setIsEnriching(true);
        setEnrichDone(0);
        try {
            const enriched = await mapWithConcurrency(
                rows,
                ENRICH_CONCURRENCY,
                (row) => enrichWordRow(row),
                (done) => setEnrichDone(done),
            );
            setRows(enriched);
            const filled = enriched.filter((r) => r.enriched).length;
            toast.success(`Enriched ${filled} word${filled === 1 ? "" : "s"} from the dictionary.`);
        } catch {
            toast.error("Auto-enrich failed. You can still import what you have.");
        } finally {
            setIsEnriching(false);
        }
    };

    const handleImport = async () => {
        if (!effectiveLessonId) {
            toast.error("Pick a lesson to import into.");
            return;
        }
        if (validRows.length === 0) {
            toast.error("Add at least one word with a meaning.");
            return;
        }
        let toImport = validRows;
        if (autoEnrich && !toImport.every((r) => r.enriched)) {
            // Enrich only the rows that haven't been enriched yet.
            setIsEnriching(true);
            setEnrichDone(0);
            try {
                const enriched = await mapWithConcurrency(
                    rows,
                    ENRICH_CONCURRENCY,
                    (row) => (row.enriched ? Promise.resolve(row) : enrichWordRow(row)),
                    (done) => setEnrichDone(done),
                );
                setRows(enriched);
                toImport = enriched.filter(isRowValid);
            } catch {
                // fall back to un-enriched rows
            } finally {
                setIsEnriching(false);
            }
        }
        onImport(effectiveLessonId, toImport);
    };

    const busy = isImporting || isEnriching;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
            <DialogContent className="max-w-2xl w-[calc(100vw-1.5rem)] sm:w-full max-h-[88dvh] overflow-hidden flex flex-col mx-auto">
                <DialogHeader>
                    <DialogTitle className="text-lg sm:text-xl flex items-center gap-2">
                        <FileUp className="h-5 w-5 text-primary" />
                        Import words
                    </DialogTitle>
                </DialogHeader>

                {/* Target lesson */}
                <div className="space-y-1.5">
                    <Label htmlFor="import-lesson" className="text-sm">Import into lesson</Label>
                    <select
                        id="import-lesson"
                        value={effectiveLessonId}
                        onChange={(e) => setTargetLessonId(e.target.value)}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                        {lessons.map((lesson) => (
                            <option key={lesson.id} value={lesson.id}>
                                {lesson.name}
                                {lesson.maxWords
                                    ? ` (${lesson.words?.length ?? 0}/${lesson.maxWords} words)`
                                    : ` (${lesson.words?.length ?? 0} words)`}
                            </option>
                        ))}
                    </select>
                </div>

                {phase === "input" ? (
                    <div className="flex-1 min-h-0 flex flex-col gap-3 py-1">
                        <textarea
                            value={pasteText}
                            onChange={(e) => setPasteText(e.target.value)}
                            placeholder={PASTE_PLACEHOLDER}
                            className="flex-1 min-h-[180px] w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        />
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".csv,.json,.txt,text/csv,application/json,text/plain"
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleFile(file);
                                e.target.value = "";
                            }}
                        />
                        <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => fileInputRef.current?.click()}
                                className="text-sm"
                            >
                                <FileUp className="h-4 w-4 mr-1.5" />
                                Upload CSV / JSON
                            </Button>
                            <Button type="button" onClick={handleParsePaste} className="text-sm">
                                Preview words
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 min-h-0 flex flex-col gap-3 py-1">
                        <div className="flex flex-wrap items-center justify-between gap-2 shrink-0">
                            <div className="flex items-center gap-2 text-sm">
                                <Badge variant="secondary">{validRows.length} ready</Badge>
                                {invalidCount > 0 && (
                                    <Badge variant="outline" className="text-amber-600 border-amber-300">
                                        {invalidCount} need a meaning
                                    </Badge>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <Switch
                                    id="auto-enrich"
                                    checked={autoEnrich}
                                    onCheckedChange={setAutoEnrich}
                                    disabled={busy}
                                />
                                <Label htmlFor="auto-enrich" className="text-xs sm:text-sm flex items-center gap-1 cursor-pointer">
                                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                                    Auto-fill from dictionary
                                </Label>
                            </div>
                        </div>

                        <div className="flex-1 min-h-0 overflow-y-auto rounded-md border">
                            <div className="divide-y">
                                {rows.map((row) => {
                                    const valid = isRowValid(row);
                                    const isExpanded = expandedRows.has(row.id);
                                    const hasDetails =
                                        !!row.pronunciation ||
                                        !!row.audioUrl ||
                                        !!row.imageUrl ||
                                        row.examples.length > 0;
                                    return (
                                        <div
                                            key={row.id}
                                            className={cn(
                                                "p-2",
                                                !valid && "bg-amber-50/50 dark:bg-amber-950/10",
                                            )}
                                        >
                                            <div className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
                                                <WordAutocomplete
                                                    value={row.word}
                                                    onChange={(word) => updateRow(row.id, { word })}
                                                    onSelect={(item) => handleSelectSuggestion(row, item)}
                                                    placeholder="word"
                                                    className="!space-y-0"
                                                    inputClassName="h-8 !text-sm"
                                                />
                                                <Input
                                                    value={row.meaning}
                                                    onChange={(e) => updateRow(row.id, { meaning: e.target.value })}
                                                    placeholder="meaning *"
                                                    className={cn("h-8 text-sm", !row.meaning.trim() && "border-amber-300")}
                                                />
                                                <div className="flex items-center gap-0.5">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => toggleRow(row.id)}
                                                        className="h-8 w-8 text-muted-foreground"
                                                        aria-label={isExpanded ? "Hide details" : "Show details"}
                                                        aria-expanded={isExpanded}
                                                    >
                                                        <ChevronDown
                                                            className={cn(
                                                                "h-4 w-4 transition-transform",
                                                                isExpanded && "rotate-180",
                                                            )}
                                                        />
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => removeRow(row.id)}
                                                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                        aria-label="Remove word"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* At-a-glance summary of the details filled in (esp. after enrich). */}
                                            <div className="flex flex-wrap items-center gap-1.5 mt-1 pl-1 text-xs text-muted-foreground">
                                                {enrichingRows.has(row.id) ? (
                                                    <span className="inline-flex items-center gap-1 text-primary">
                                                        <LoadingSpinner size="sm" />
                                                        Fetching details…
                                                    </span>
                                                ) : (
                                                    row.enriched && (
                                                        <Sparkles className="h-3 w-3 text-primary" aria-label="Enriched" />
                                                    )
                                                )}
                                                {row.partOfSpeech ? (
                                                    <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-medium">
                                                        {row.partOfSpeech}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-muted-foreground/60">no part of speech</span>
                                                )}
                                                {row.pronunciation && <span>{row.pronunciation}</span>}
                                                {row.audioUrl && (
                                                    <button
                                                        type="button"
                                                        onClick={() => playAudioUrl(row.audioUrl)}
                                                        className="inline-flex items-center hover:text-foreground"
                                                        aria-label="Play audio"
                                                    >
                                                        <Volume2 className="h-3.5 w-3.5" />
                                                    </button>
                                                )}
                                                {row.imageUrl && <ImageIcon className="h-3.5 w-3.5" aria-label="Has image" />}
                                                {row.examples.length > 0 && (
                                                    <span>{row.examples.length} example{row.examples.length === 1 ? "" : "s"}</span>
                                                )}
                                                {row.senses && row.senses.length > 1 && (
                                                    <Badge variant="outline" className="px-1.5 py-0 text-[10px] font-medium text-primary border-primary/40">
                                                        {row.senses.length} senses — choose ▾
                                                    </Badge>
                                                )}
                                            </div>

                                            {isExpanded && (
                                                <div className="mt-2 space-y-2 rounded-md border bg-muted/30 p-2">
                                                    {row.senses && row.senses.length > 1 && (
                                                        <div className="space-y-1">
                                                            <Label className="text-[11px] text-muted-foreground flex items-center gap-1">
                                                                Sense
                                                                {applyingSenseRows.has(row.id) && <LoadingSpinner size="sm" />}
                                                            </Label>
                                                            <div className="flex flex-wrap gap-1.5">
                                                                {row.senses.map((sense, si) => {
                                                                    const active = isSenseActive(row, sense);
                                                                    return (
                                                                        <button
                                                                            key={`${row.id}-sense-${si}`}
                                                                            type="button"
                                                                            onClick={() => chooseSense(row, sense)}
                                                                            disabled={applyingSenseRows.has(row.id)}
                                                                            className={cn(
                                                                                "text-left rounded-md border px-2 py-1 text-xs transition-colors max-w-full",
                                                                                active
                                                                                    ? "border-primary bg-primary/10 text-foreground"
                                                                                    : "border-border hover:bg-muted",
                                                                                applyingSenseRows.has(row.id) && "opacity-60",
                                                                            )}
                                                                        >
                                                                            <span className="font-semibold">{sense.partOfSpeech}</span>
                                                                            {sense.meaning && (
                                                                                <span className="text-muted-foreground"> — {sense.meaning}</span>
                                                                            )}
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                            <p className="text-[11px] text-muted-foreground/70">
                                                                This word has multiple meanings — pick the sense you want to learn.
                                                            </p>
                                                        </div>
                                                    )}
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div className="space-y-1">
                                                            <Label className="text-[11px] text-muted-foreground">Part of speech</Label>
                                                            <Input
                                                                value={row.partOfSpeech}
                                                                onChange={(e) => updateRow(row.id, { partOfSpeech: e.target.value })}
                                                                placeholder="noun, verb…"
                                                                className="h-8 text-sm"
                                                            />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <Label className="text-[11px] text-muted-foreground">Pronunciation (IPA)</Label>
                                                            <Input
                                                                value={row.pronunciation}
                                                                onChange={(e) => updateRow(row.id, { pronunciation: e.target.value })}
                                                                placeholder="/…/"
                                                                className="h-8 text-sm"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-[11px] text-muted-foreground">Audio URL</Label>
                                                        <div className="flex gap-1.5">
                                                            <Input
                                                                value={row.audioUrl}
                                                                onChange={(e) => updateRow(row.id, { audioUrl: e.target.value })}
                                                                placeholder="https://…"
                                                                className="h-8 text-sm flex-1"
                                                            />
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="icon"
                                                                onClick={() => playAudioUrl(row.audioUrl)}
                                                                disabled={!row.audioUrl.trim()}
                                                                className="h-8 w-8 shrink-0"
                                                                aria-label="Play audio"
                                                            >
                                                                <Volume2 className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-[11px] text-muted-foreground">Image URL</Label>
                                                        <Input
                                                            value={row.imageUrl}
                                                            onChange={(e) => {
                                                                setImageErrors((prev) => {
                                                                    if (!prev.has(row.id)) return prev;
                                                                    const next = new Set(prev);
                                                                    next.delete(row.id);
                                                                    return next;
                                                                });
                                                                updateRow(row.id, { imageUrl: e.target.value });
                                                            }}
                                                            placeholder="https://…"
                                                            className="h-8 text-sm"
                                                        />
                                                        {row.imageUrl.trim() && !imageErrors.has(row.id) && (
                                                            <div className="relative mt-1 h-20 w-20 overflow-hidden rounded border bg-muted">
                                                                <Image
                                                                    src={row.imageUrl}
                                                                    alt=""
                                                                    fill
                                                                    loading="lazy"
                                                                    className="object-cover"
                                                                    onError={() => markImageError(row.id)}
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-[11px] text-muted-foreground">Examples</Label>
                                                        {row.examples.map((example, index) => (
                                                            <div key={`${row.id}-ex-${index}`} className="flex gap-1.5">
                                                                <Input
                                                                    value={example}
                                                                    onChange={(e) => updateExample(row.id, index, e.target.value)}
                                                                    placeholder="Example sentence"
                                                                    className="h-8 text-sm flex-1"
                                                                />
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => removeExample(row.id, index)}
                                                                    className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                                                                    aria-label="Remove example"
                                                                >
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                </Button>
                                                            </div>
                                                        ))}
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => addExample(row.id)}
                                                            className="w-full text-xs"
                                                        >
                                                            <Plus className="h-3.5 w-3.5 mr-1.5" />
                                                            Add example
                                                        </Button>
                                                    </div>
                                                    {!hasDetails && (
                                                        <p className="text-[11px] text-muted-foreground/70">
                                                            No extra details yet — turn on auto-fill or “Enrich now”.
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {isEnriching && enrichDone != null && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1.5 shrink-0">
                                <LoadingSpinner size="sm" />
                                Fetching dictionary details… {enrichDone}/{rows.length}
                            </p>
                        )}

                        {willExceed && (
                            <p className="text-xs text-amber-600 flex items-center gap-1.5 shrink-0">
                                <AlertTriangle className="h-3.5 w-3.5" />
                                This lesson allows {remaining} more word{remaining === 1 ? "" : "s"}. Remove some rows or pick another lesson.
                            </p>
                        )}

                        <div className="flex items-center gap-2 shrink-0">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={runEnrich}
                                disabled={busy || rows.length === 0}
                                className="text-xs"
                            >
                                <Wand2 className="h-3.5 w-3.5 mr-1.5" />
                                Enrich now
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={reset}
                                disabled={busy}
                                className="text-xs"
                            >
                                Start over
                            </Button>
                        </div>
                    </div>
                )}

                <DialogFooter className="gap-2">
                    <Button type="button" variant="outline" onClick={handleClose} disabled={busy} className="w-full sm:w-auto text-sm">
                        Cancel
                    </Button>
                    {phase === "review" && (
                        <Button
                            type="button"
                            onClick={handleImport}
                            disabled={busy || validRows.length === 0 || willExceed}
                            className="w-full sm:w-auto text-sm"
                        >
                            {busy ? (
                                <LoadingSpinner size="sm" />
                            ) : (
                                `Import ${validRows.length} word${validRows.length === 1 ? "" : "s"}`
                            )}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
