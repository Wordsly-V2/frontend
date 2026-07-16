"use client";

import { WordAutocomplete } from "@/components/common/word-autocomplete";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAudio } from "@/hooks/useAudio.hook";
import { getWordExampleObjects, serializeExamples } from "@/lib/practice-utils";
import { useLangeekWordDetailsQuery } from "@/queries/dictionary.query";
import { IWord, IWordExample, IWordSearchResult, WordDetailView } from "@/types/courses/courses.type";
import { ImageIcon, Plus, Trash2, Volume2, VolumeX } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

interface WordFormDialogProps {
    isLoading: boolean;
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (word: Omit<IWord, 'id' | 'lessonId' | 'createdAt' | 'updatedAt'>) => void;
    word?: IWord;
    /** Pre-fill form when in add mode (no word). Applied once when dialog opens. */
    initialData?: WordDetailView | null;
    title: string;
}

type WordFormData = {
    word: string;
    meaning: string;
    pronunciation: string;
    partOfSpeech: string;
    audioUrl: string;
    imageUrl: string;
    examples: IWordExample[];
};

function buildInitialFormData(word?: IWord, initialData?: WordDetailView | null): WordFormData {
    if (word) {
        return {
            word: word.word,
            meaning: word.meaning,
            pronunciation: word.pronunciation || "",
            partOfSpeech: word.partOfSpeech || "",
            audioUrl: word.audioUrl || "",
            imageUrl: word.imageUrl || "",
            examples: getWordExampleObjects(word),
        };
    }
    if (initialData) {
        return {
            word: initialData.word,
            meaning: initialData.meaning,
            pronunciation: initialData.pronunciation || "",
            partOfSpeech: initialData.partOfSpeech || "",
            audioUrl: initialData.audioUrl || "",
            imageUrl: initialData.imageUrl || "",
            examples: getWordExampleObjects(initialData),
        };
    }
    return {
        word: "",
        meaning: "",
        pronunciation: "",
        partOfSpeech: "",
        audioUrl: "",
        imageUrl: "",
        examples: [],
    };
}

function WordFormDialogForm({
    isLoading,
    onClose,
    onSubmit,
    word,
    initialData,
    title,
}: Readonly<Omit<WordFormDialogProps, "isOpen">>) {
    const exampleIdRef = useRef(0);
    const makeExampleId = () => `ex-${++exampleIdRef.current}`;
    // Re-key parsed examples with a monotonic counter so ids never collide with
    // rows added later in the session.
    const initial = (() => {
        const data = buildInitialFormData(word, initialData);
        return {
            ...data,
            examples: data.examples.map((e) => ({ ...e, id: makeExampleId() })),
        };
    })();
    const [formData, setFormData] = useState<WordFormData>(() => initial);
    const { isPlaying, error: audioError, play, stop, clearError } = useAudio();
    // Separate audio instance for example previews so its play/error state does
    // not bleed into the word-level audio field.
    const exampleAudio = useAudio();

    const updateExample = (id: string, patch: Partial<IWordExample>) => {
        setFormData((prev) => ({
            ...prev,
            examples: prev.examples.map((ex) => (ex.id === id ? { ...ex, ...patch } : ex)),
        }));
    };

    const [pendingWordDetails, setPendingWordDetails] = useState<{
        word: string;
        partOfSpeech: string;
    } | null>(null);

    const {
        data: langeekWordDetails,
        isLoading: isFetchingLangeekDetails,
        isSuccess: langeekDetailsSuccess,
    } = useLangeekWordDetailsQuery(
        pendingWordDetails?.word ?? "",
        pendingWordDetails?.partOfSpeech ?? "",
        !!pendingWordDetails
    );

    const [imageLoadError, setImageLoadError] = useState(false);

    useEffect(() => {
        if (!pendingWordDetails || !langeekDetailsSuccess || !langeekWordDetails) return;
        const patch = langeekWordDetails;

        const id = setTimeout(() => {
            setPendingWordDetails(null);
            const hasPatch =
                patch.word ||
                patch.meaning ||
                patch.partOfSpeech ||
                patch.pronunciation ||
                patch.audioUrl ||
                patch.examples.length > 0 ||
                patch.imageUrl;
            if (hasPatch) {
                setFormData((prev) => {
                    const existingTexts = new Set(
                        prev.examples.map((e) => e.text.trim().toLowerCase()),
                    );
                    const newExamples: IWordExample[] = patch.examples
                        .filter((e) => {
                            const key = e.text.trim().toLowerCase();
                            if (!key || existingTexts.has(key)) return false;
                            existingTexts.add(key);
                            return true;
                        })
                        .map((e) => ({
                            id: makeExampleId(),
                            text: e.text,
                            ...(e.translation ? { translation: e.translation } : {}),
                            ...(e.audioUrl ? { audioUrl: e.audioUrl } : {}),
                        }));
                    return {
                        ...prev,
                        ...(patch.word && { word: patch.word }),
                        ...(patch.meaning && { meaning: patch.meaning }),
                        ...(patch.partOfSpeech && { partOfSpeech: patch.partOfSpeech }),
                        ...(patch.pronunciation && { pronunciation: patch.pronunciation }),
                        ...(patch.audioUrl && { audioUrl: patch.audioUrl }),
                        ...(newExamples.length > 0 && {
                            examples: [...prev.examples, ...newExamples],
                        }),
                    };
                });
            }
        }, 0);
        return () => clearTimeout(id);
    }, [langeekDetailsSuccess, pendingWordDetails, langeekWordDetails]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Don't submit while dictionary autofill is still populating fields.
        if (isFetchingLangeekDetails) return;
        if (formData.word.trim() && formData.meaning.trim()) {
            onSubmit({
                word: formData.word.trim() ,
                meaning: formData.meaning.trim(),
                pronunciation: formData.pronunciation.trim() || '',
                partOfSpeech: formData.partOfSpeech.trim() || '',
                audioUrl: formData.audioUrl.trim() || '',
                imageUrl: formData.imageUrl.trim() || '',
                example: serializeExamples(formData.examples),
            });
        }
    };

    const handleClose = () => {
        stop();
        clearError();
        exampleAudio.stop();
        exampleAudio.clearError();
        onClose();
    };

    const handlePlayAudio = () => {
        play(formData.audioUrl);
    };


    const handleSelectWordSuggestion = (item: IWordSearchResult) => {
        setFormData((prev) => ({
            ...prev,
            word: item.word,
            ...(item.meaning != null && item.meaning !== "" && { meaning: item.meaning }),
            ...(item.partOfSpeech != null && item.partOfSpeech !== "" && { partOfSpeech: item.partOfSpeech }),
            ...(item.imageUrl != null && item.imageUrl !== "" && { imageUrl: item.imageUrl }),
        }));
        if (item.langeekWordId != null && item.word.trim()) {
            setPendingWordDetails({ word: item.word, partOfSpeech: item.partOfSpeech.trim() });
        }
    };

    return (
        <form onSubmit={handleSubmit} className="min-w-0">
                    <DialogHeader>
                        <DialogTitle className="text-lg sm:text-xl">{title}</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-3 sm:space-y-4 py-3 sm:py-4">
                        <div className="grid grid-cols-1 gap-3 sm:gap-4">
                            <div className="space-y-1">
                                <WordAutocomplete
                                    id="word"
                                    label={
                                        <>
                                            Word <span className="text-destructive">*</span>
                                        </>
                                    }
                                    placeholder="e.g., hello"
                                    value={formData.word}
                                    onChange={(word) => setFormData({ ...formData, word })}
                                    onSelect={handleSelectWordSuggestion}
                                    required
                                />
                                {isFetchingLangeekDetails && (
                                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                        <LoadingSpinner size="sm" />
                                        Loading word details…
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="meaning" className="text-sm">
                                    Meaning <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="meaning"
                                    placeholder="e.g., xin chào"
                                    value={formData.meaning}
                                    onChange={(e) => setFormData({ ...formData, meaning: e.target.value })}
                                    required
                                    className="text-sm sm:text-base"
                                    inputMode="text"
                                    autoComplete="off"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:gap-4">
                            <Label htmlFor="partOfSpeech" className="text-sm">Part of Speech</Label>
                            <Input
                                id="partOfSpeech"
                                placeholder="e.g., noun, verb"
                                value={formData.partOfSpeech}
                                onChange={(e) => setFormData({ ...formData, partOfSpeech: e.target.value })}
                                className="text-sm sm:text-base"
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:gap-4">
                            <Label htmlFor="pronunciation" className="text-sm">Pronunciation (IPA)</Label>
                            <Input
                                id="pronunciation"
                                placeholder="e.g., həˈloʊ"
                                value={formData.pronunciation}
                                onChange={(e) => setFormData({ ...formData, pronunciation: e.target.value })}
                                className="text-sm sm:text-base"
                            />
                        </div>

                        <div className="space-y-2 min-w-0">
                            <Label htmlFor="audioUrl" className="text-sm">Audio URL</Label>
                            <div className="flex gap-1.5 sm:gap-2 min-w-0">
                                <Input
                                    id="audioUrl"
                                    type="url"
                                    placeholder="https://..."
                                    value={formData.audioUrl}
                                    onChange={(e) => {
                                        setFormData({ ...formData, audioUrl: e.target.value });
                                        clearError();
                                    }}
                                    className={`flex-1 min-w-0 text-sm sm:text-base ${audioError ? 'border-destructive' : ''}`}
                                    inputMode="url"
                                    autoComplete="url"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={handlePlayAudio}
                                    disabled={!formData.audioUrl.trim() || isPlaying}
                                    title="Play audio"
                                    className="flex-shrink-0 h-9 w-9 sm:h-10 sm:w-10"
                                >
                                    {audioError ? (
                                        <VolumeX className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-destructive" />
                                    ) : (
                                        <Volume2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                    )}
                                </Button>
                            </div>
                            {audioError ? (
                                <p className="text-xs text-destructive">{audioError}</p>
                            ) : (
                                <p className="text-xs text-muted-foreground">
                                    URL to pronunciation audio file (from word details when you select a word)
                                </p>
                            )}
                        </div>

                        <div className="space-y-2 min-w-0">
                            <Label className="text-sm">Examples</Label>
                            <p className="text-xs text-muted-foreground">
                                Example sentences using this word — each can have its own translation and audio.
                            </p>
                            <div className="space-y-3 max-h-64 sm:max-h-80 overflow-y-auto overflow-x-hidden">
                                {formData.examples.map((example) => (
                                    <div
                                        key={example.id}
                                        className="space-y-1.5 rounded-md border border-border/60 p-2 sm:p-2.5 min-w-0"
                                    >
                                        <div className="flex gap-1.5 sm:gap-2 items-start min-w-0">
                                            <Input
                                                placeholder="e.g., I said hello to my neighbor."
                                                value={example.text}
                                                onChange={(e) => updateExample(example.id, { text: e.target.value })}
                                                className="flex-1 min-w-0 text-sm sm:text-base"
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                onClick={() =>
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        examples: prev.examples.filter((ex) => ex.id !== example.id),
                                                    }))
                                                }
                                                title="Remove example"
                                                className="flex-shrink-0 h-9 w-9 sm:h-10 sm:w-10 text-muted-foreground hover:text-destructive"
                                            >
                                                <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                            </Button>
                                        </div>
                                        <Input
                                            placeholder="Translation (optional)"
                                            value={example.translation ?? ""}
                                            onChange={(e) => updateExample(example.id, { translation: e.target.value })}
                                            className="text-sm min-w-0"
                                        />
                                        <div className="flex gap-1.5 sm:gap-2 items-center min-w-0">
                                            <Input
                                                type="url"
                                                inputMode="url"
                                                placeholder="Audio URL (optional)"
                                                value={example.audioUrl ?? ""}
                                                onChange={(e) => {
                                                    updateExample(example.id, { audioUrl: e.target.value });
                                                    exampleAudio.clearError();
                                                }}
                                                className="flex-1 min-w-0 text-sm"
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                onClick={() => exampleAudio.play(example.audioUrl ?? "")}
                                                disabled={!example.audioUrl?.trim() || exampleAudio.isPlaying}
                                                title="Play example audio"
                                                className="flex-shrink-0 h-9 w-9 sm:h-10 sm:w-10"
                                            >
                                                <Volume2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                            </Button>
                                            {example.audioUrl?.trim() && (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="icon"
                                                    onClick={() => {
                                                        exampleAudio.stop();
                                                        exampleAudio.clearError();
                                                        updateExample(example.id, { audioUrl: "" });
                                                    }}
                                                    title="Remove audio"
                                                    className="flex-shrink-0 h-9 w-9 sm:h-10 sm:w-10 text-muted-foreground hover:text-destructive"
                                                >
                                                    <VolumeX className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {exampleAudio.error && (
                                    <p className="text-xs text-destructive">{exampleAudio.error}</p>
                                )}
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            examples: [...prev.examples, { id: makeExampleId(), text: "" }],
                                        }))
                                    }
                                    className="w-full text-sm"
                                >
                                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                                    Add example
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-2 min-w-0">
                            <Label htmlFor="imageUrl" className="text-sm flex items-center gap-1.5">
                                <ImageIcon className="h-3.5 w-3.5" />
                                Image URL
                            </Label>
                            <Input
                                id="imageUrl"
                                type="url"
                                placeholder="https://..."
                                value={formData.imageUrl}
                                onChange={(e) => {
                                    setFormData({ ...formData, imageUrl: e.target.value });
                                    setImageLoadError(false);
                                }}
                                className="text-sm sm:text-base"
                            />
                            {formData.imageUrl.trim() && (
                                <div className="relative rounded-md border overflow-hidden bg-muted/30 max-w-[200px] aspect-video flex items-center justify-center">
                                    {imageLoadError ? (
                                        <span className="text-xs text-muted-foreground px-2 text-center">Could not load image</span>
                                    ) : (
                                        <Image
                                            src={formData.imageUrl}
                                            alt="Preview"
                                            fill
                                            loading="lazy"
                                            className="object-contain"
                                            onError={() => setImageLoadError(true)}
                                            onLoad={() => setImageLoadError(false)}
                                        />
                                    )}
                                </div>
                            )}
                            <p className="text-xs text-muted-foreground">Optional image for the word card</p>
                        </div>
                    </div>

                    <DialogFooter className="gap-2">
                        <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading} className="w-full sm:w-auto text-sm">
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading || isFetchingLangeekDetails} className="w-full sm:w-auto text-sm">
                            {
                                (isLoading || isFetchingLangeekDetails) ? (
                                    <LoadingSpinner size="sm" />
                                ) : (
                                    word ? 'Update Word' : 'Add Word'
                                )
                            }
                        </Button>
                    </DialogFooter>
        </form>
    );
}

export default function WordFormDialog({
    isLoading,
    isOpen,
    onClose,
    onSubmit,
    word,
    initialData,
    title,
}: Readonly<WordFormDialogProps>) {
    const formKey = word?.id ?? initialData?.word ?? "new";

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
            <DialogContent
                className="max-w-lg w-[calc(100vw-1.5rem)] sm:w-full max-h-[85dvh] overflow-y-auto overflow-x-hidden mx-auto"
                onOpenAutoFocus={(e) => (word || initialData) ? e.preventDefault() : undefined}
            >
                {isOpen && (
                    <WordFormDialogForm
                        key={formKey}
                        isLoading={isLoading}
                        onClose={onClose}
                        onSubmit={onSubmit}
                        word={word}
                        initialData={initialData}
                        title={title}
                    />
                )}
            </DialogContent>
        </Dialog>
    );
}
