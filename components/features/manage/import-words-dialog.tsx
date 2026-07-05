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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
    enrichWordRow,
    ImportWordRow,
    isRowValid,
    mapWithConcurrency,
    parseWordsDelimited,
    parseWordsJson,
} from "@/lib/word-import";
import { ILesson } from "@/types/courses/courses.type";
import { AlertTriangle, FileUp, Sparkles, Trash2, Wand2 } from "lucide-react";
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
    const fileInputRef = useRef<HTMLInputElement>(null);

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
                                {lesson.maxWords ? ` (${lesson.words?.length ?? 0}/${lesson.maxWords})` : ""}
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
                        <div className="flex flex-wrap items-center justify-between gap-2">
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

                        <ScrollArea className="flex-1 min-h-[200px] rounded-md border">
                            <div className="divide-y">
                                {rows.map((row) => {
                                    const valid = isRowValid(row);
                                    return (
                                        <div
                                            key={row.id}
                                            className={cn(
                                                "grid grid-cols-[1fr_1fr_auto] gap-2 p-2 items-center",
                                                !valid && "bg-amber-50/50 dark:bg-amber-950/10",
                                            )}
                                        >
                                            <Input
                                                value={row.word}
                                                onChange={(e) => updateRow(row.id, { word: e.target.value })}
                                                placeholder="word"
                                                className="h-8 text-sm"
                                            />
                                            <Input
                                                value={row.meaning}
                                                onChange={(e) => updateRow(row.id, { meaning: e.target.value })}
                                                placeholder="meaning *"
                                                className={cn("h-8 text-sm", !row.meaning.trim() && "border-amber-300")}
                                            />
                                            <div className="flex items-center gap-1">
                                                {row.enriched && (row.pronunciation || row.audioUrl || row.imageUrl) && (
                                                    <Sparkles className="h-3.5 w-3.5 text-primary" aria-label="Enriched" />
                                                )}
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
                                    );
                                })}
                            </div>
                        </ScrollArea>

                        {isEnriching && enrichDone != null && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                <LoadingSpinner size="sm" />
                                Fetching dictionary details… {enrichDone}/{rows.length}
                            </p>
                        )}

                        {willExceed && (
                            <p className="text-xs text-amber-600 flex items-center gap-1.5">
                                <AlertTriangle className="h-3.5 w-3.5" />
                                This lesson allows {remaining} more word{remaining === 1 ? "" : "s"}. Remove some rows or pick another lesson.
                            </p>
                        )}

                        <div className="flex items-center gap-2">
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
