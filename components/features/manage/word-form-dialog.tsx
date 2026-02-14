"use client";

import { WordAutocomplete } from "@/components/common/word-autocomplete";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAudio } from "@/hooks/useAudio.hook";
import { useDebounce } from "@/hooks/useDebounce";
import { useFetchWordDetailsDictionaryQuery, useGetWordExamplesQuery } from "@/queries/dictionary.query";
import { IWord } from "@/types/courses/courses.type";
import { Check, ImageIcon, Plus, Trash2, Volume2, VolumeX } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

interface WordFormDialogProps {
    isLoading: boolean;
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (word: Omit<IWord, 'id' | 'lessonId' | 'createdAt' | 'updatedAt'>) => void;
    word?: IWord;
    title: string;
}

export default function WordFormDialog({
    isLoading,
    isOpen,
    onClose,
    onSubmit,
    word,
    title,
}: Readonly<WordFormDialogProps>) {
    const [formData, setFormData] = useState({
        word: "",
        meaning: "",
        pronunciation: "",
        partOfSpeech: "",
        audioUrl: "",
        imageUrl: "",
        examples: [] as string[],
    });
    const { isPlaying, error: audioError, play, stop, clearError } = useAudio();

    const debouncedWord = useDebounce(formData.word.trim(), 1000);
    const { data: pronunciations, isLoading: isFetchingPronunciations, error: fetchErrorPronunciations } = useFetchWordDetailsDictionaryQuery(debouncedWord, !!debouncedWord);
    const { data: examples, isLoading: isFetchingExamples, error: fetchErrorExamples } = useGetWordExamplesQuery(debouncedWord, !!debouncedWord);

    const [imageLoadError, setImageLoadError] = useState(false);
    const [exampleIds, setExampleIds] = useState<string[]>([]);
    const exampleIdRef = useRef(0);

    useEffect(() => {
        const _setFormData = () => {
            if (word) {
                setFormData({
                    word: word.word,
                    meaning: word.meaning,
                    pronunciation: word.pronunciation || "",
                    partOfSpeech: word.partOfSpeech || "",
                    audioUrl: word.audioUrl || "",
                    imageUrl: word.imageUrl || "",
                    examples: JSON.parse(word.example || "[]"),
                });
                setExampleIds(
                    JSON.parse(word.example || "[]").map(() => `ex-${++exampleIdRef.current}`)
                );
            } else {
                setFormData({
                    word: "",
                    meaning: "",
                    pronunciation: "",
                    partOfSpeech: "",
                    audioUrl: "",
                    imageUrl: "",
                    examples: [],
                });
                setExampleIds([]);
            }
        }

        _setFormData();
    }, [word, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.word.trim() && formData.meaning.trim()) {
            onSubmit({
                word: formData.word.trim(),
                meaning: formData.meaning.trim(),
                pronunciation: formData.pronunciation.trim() || undefined,
                partOfSpeech: formData.partOfSpeech.trim() || undefined,
                audioUrl: formData.audioUrl.trim() || undefined,
                imageUrl: formData.imageUrl.trim() || undefined,
                example: JSON.stringify(formData.examples.map((ex) => ex.trim()).filter(Boolean))
            });
        }
    };

    const handleClose = () => {
        stop();
        clearError();
        setImageLoadError(false);
        setFormData({
            word: "",
            meaning: "",
            pronunciation: "",
            partOfSpeech: "",
            audioUrl: "",
            imageUrl: "",
            examples: [],
        });
        setExampleIds([]);
        onClose();
    };

    const handlePlayAudio = () => {
        play(formData.audioUrl);
    };


    const handleSelectAudioUrl = (url: string) => {
        setFormData({ ...formData, audioUrl: url });
        clearError();
    };

    const handlePlayPreviewAudio = (url: string) => {
        play(url);
    };

    const handleSelectWordSuggestion = (item: { word: string; meaning?: string; partOfSpeech?: string; imageUrl?: string }) => {
        setFormData((prev) => ({
            ...prev,
            word: item.word,
            ...(item.meaning != null && item.meaning !== "" && { meaning: item.meaning }),
            ...(item.partOfSpeech != null && item.partOfSpeech !== "" && { partOfSpeech: item.partOfSpeech }),
            ...(item.imageUrl != null && item.imageUrl !== "" && { imageUrl: item.imageUrl }),
        }));
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-lg w-[calc(100vw-1.5rem)] sm:w-full max-h-[85dvh] overflow-y-auto overflow-x-hidden mx-auto" onOpenAutoFocus={(e) => word ? e.preventDefault() : undefined}>
                <form onSubmit={handleSubmit} className="min-w-0">
                    <DialogHeader>
                        <DialogTitle className="text-lg sm:text-xl">{title}</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-3 sm:space-y-4 py-3 sm:py-4">
                        <div className="grid grid-cols-1 gap-3 sm:gap-4">
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

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="pronunciation" className="text-sm">Pronunciation (IPA)</Label>
                                <Input
                                    id="pronunciation"
                                    placeholder="e.g., həˈloʊ"
                                    value={formData.pronunciation}
                                    onChange={(e) => setFormData({ ...formData, pronunciation: e.target.value })}
                                    className="text-sm sm:text-base"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="partOfSpeech" className="text-sm">Part of Speech</Label>
                                <Input
                                    id="partOfSpeech"
                                    placeholder="e.g., noun, verb"
                                    value={formData.partOfSpeech}
                                    onChange={(e) => setFormData({ ...formData, partOfSpeech: e.target.value })}
                                    className="text-sm sm:text-base"
                                />
                            </div>
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
                            ) : fetchErrorPronunciations ? (
                                <p className="text-xs text-destructive">{fetchErrorPronunciations.message}</p>
                            ) : (
                                <p className="text-xs text-muted-foreground">
                                    URL to pronunciation audio file
                                </p>
                            )}

                            {isFetchingPronunciations && (
                                <LoadingSpinner size="sm" />)}

                            {!isFetchingPronunciations && pronunciations && pronunciations.length > 0 && (
                                <div className="mt-2 sm:mt-3 w-full min-w-0 overflow-hidden rounded-md border p-2 sm:p-3 bg-muted/30">
                                    <p className="text-xs sm:text-sm font-medium">Available pronunciations:</p>
                                    <div className="mt-2 space-y-2 max-h-40 sm:max-h-48 overflow-y-auto overflow-x-hidden">
                                        {pronunciations.map((audio) => (
                                            <div
                                                key={audio.url}
                                                className="flex items-center gap-1.5 sm:gap-2 rounded-md border bg-background p-2 min-w-0 w-full"
                                            >
                                                <span
                                                    className="flex-1 min-w-0 truncate text-xs text-muted-foreground"
                                                    title={audio.url}
                                                >
                                                    {audio.url}
                                                </span>
                                                <div className="flex gap-1 sm:gap-2 flex-shrink-0">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handlePlayPreviewAudio(audio.url)}
                                                        disabled={isPlaying}
                                                        title="Play audio"
                                                        className="h-7 w-7 min-w-7 p-0 sm:h-8 sm:w-8 sm:min-w-8"
                                                    >
                                                        <Volume2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant={formData.audioUrl === audio.url ? "default" : "outline"}
                                                        size="sm"
                                                        onClick={() => handleSelectAudioUrl(audio.url)}
                                                        title="Use this audio"
                                                        className="h-7 min-w-[2.5rem] px-2 text-xs sm:h-8 sm:min-w-10"
                                                    >
                                                        {formData.audioUrl === audio.url ? (
                                                            <>
                                                                <Check className="h-3 w-3 mr-1 shrink-0" />
                                                                <span className="hidden sm:inline">Selected</span>
                                                                <span className="sm:hidden">✓</span>
                                                            </>
                                                        ) : (
                                                            "Use"
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-2 min-w-0">
                            <Label className="text-sm">Examples</Label>
                            <p className="text-xs text-muted-foreground">Example sentences using this word</p>
                            <div className="space-y-2 max-h-40 sm:max-h-48 overflow-y-auto overflow-x-hidden">
                                {formData.examples.map((example, index) => (
                                    <div key={exampleIds[index] ?? `ex-${index}`} className="flex gap-1.5 sm:gap-2 items-center min-w-0">
                                        <Input
                                            placeholder="e.g., I said hello to my neighbor."
                                            value={example}
                                            onChange={(e) => {
                                                const next = [...formData.examples];
                                                next[index] = e.target.value;
                                                setFormData({ ...formData, examples: next });
                                            }}
                                            className="flex-1 min-w-0 text-sm sm:text-base"
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            onClick={() => {
                                                const nextExamples = formData.examples.filter((_, i) => i !== index);
                                                const nextIds = exampleIds.filter((_, i) => i !== index);
                                                setFormData({ ...formData, examples: nextExamples });
                                                setExampleIds(nextIds);
                                            }}
                                            title="Remove example"
                                            className="flex-shrink-0 h-9 w-9 sm:h-10 sm:w-10 text-muted-foreground hover:text-destructive"
                                        >
                                            <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                        </Button>
                                    </div>
                                ))}
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        const id = `ex-${++exampleIdRef.current}`;
                                        setFormData({ ...formData, examples: [...formData.examples, ""] });
                                        setExampleIds([...exampleIds, id]);
                                    }}
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
                        <Button type="submit" disabled={isLoading} className="w-full sm:w-auto text-sm">
                            {
                                isLoading ? (
                                    <LoadingSpinner size="sm" />
                                ) : (
                                    word ? 'Update Word' : 'Add Word'
                                )
                            }
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
