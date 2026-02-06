"use client";

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { IWord } from "@/types/courses/courses.type";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Volume2, VolumeX, Search, Check } from "lucide-react";
import { useAudio } from "@/hooks/useAudio.hook";
import { useWords } from "@/hooks/useWords.hook";

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
    });
    const { isPlaying, error: audioError, play, stop, clearError } = useAudio();
    const { mutationFetchWordDetailsDictionary } = useWords();
    const [availableAudioUrls, setAvailableAudioUrls] = useState<string[]>([]);
    const [fetchError, setFetchError] = useState<string>("");

    useEffect(() => {
        const _setFormData = () => {
            if (word) {
                setFormData({
                    word: word.word,
                    meaning: word.meaning,
                    pronunciation: word.pronunciation || "",
                    partOfSpeech: word.partOfSpeech || "",
                    audioUrl: word.audioUrl || "",
                });
            } else {
                setFormData({
                    word: "",
                    meaning: "",
                    pronunciation: "",
                    partOfSpeech: "",
                    audioUrl: "",
                });
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
            });
        }
    };

    const handleClose = () => {
        stop();
        clearError();
        setAvailableAudioUrls([]);
        setFetchError("");
        setFormData({
            word: "",
            meaning: "",
            pronunciation: "",
            partOfSpeech: "",
            audioUrl: "",
        });
        onClose();
    };

    const handlePlayAudio = () => {
        play(formData.audioUrl);
    };

    const handleFetchAudioUrls = async () => {
        if (!formData.word.trim()) {
            setFetchError("Please enter a word first");
            return;
        }

        setFetchError("");
        setAvailableAudioUrls([]);

        mutationFetchWordDetailsDictionary.mutate(formData.word.trim(), {
            onSuccess: (dictionaryData) => {
                const audioUrls = dictionaryData.phonetics
                    .map(p => p.audio)
                    .filter((url): url is string => !!url && url.trim() !== "");

                if (audioUrls.length === 0) {
                    setFetchError("No audio found for this word");
                } else {
                    setAvailableAudioUrls(audioUrls);
                }
            },
            onError: () => {
                setFetchError("Could not fetch audio. Please check the word or try again later.");
            }
        });
    };

    const handleSelectAudioUrl = (url: string) => {
        setFormData({ ...formData, audioUrl: url });
        clearError();
    };

    const handlePlayPreviewAudio = (url: string) => {
        play(url);
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-lg w-[calc(100vw-1.5rem)] sm:w-full max-h-[85vh] overflow-y-auto overflow-x-hidden mx-auto">
                <form onSubmit={handleSubmit} className="min-w-0">
                    <DialogHeader>
                        <DialogTitle className="text-lg sm:text-xl">{title}</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-3 sm:space-y-4 py-3 sm:py-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="word" className="text-sm">
                                    Word <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="word"
                                    placeholder="e.g., hello"
                                    value={formData.word}
                                    onChange={(e) => {
                                        setFormData({ ...formData, word: e.target.value });
                                        setAvailableAudioUrls([]);
                                        setFetchError("");
                                    }}
                                    required
                                    className="text-sm sm:text-base"
                                />
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
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={handleFetchAudioUrls}
                                    disabled={!formData.word.trim() || mutationFetchWordDetailsDictionary.isPending}
                                    title="Fetch audio from dictionary"
                                    className="flex-shrink-0 h-9 w-9 sm:h-10 sm:w-10"
                                >
                                    {mutationFetchWordDetailsDictionary.isPending ? (
                                        <LoadingSpinner size="sm" />
                                    ) : (
                                        <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                    )}
                                </Button>
                            </div>
                            {audioError ? (
                                <p className="text-xs text-destructive">{audioError}</p>
                            ) : fetchError ? (
                                <p className="text-xs text-destructive">{fetchError}</p>
                            ) : (
                                <p className="text-xs text-muted-foreground">
                                    URL to pronunciation audio file
                                </p>
                            )}

                            {availableAudioUrls.length > 0 && (
                                <div className="mt-2 sm:mt-3 w-full min-w-0 overflow-hidden rounded-md border p-2 sm:p-3 bg-muted/30">
                                    <p className="text-xs sm:text-sm font-medium">Available pronunciations:</p>
                                    <div className="mt-2 space-y-2 max-h-40 sm:max-h-48 overflow-y-auto overflow-x-hidden">
                                        {availableAudioUrls.map((url, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center gap-1.5 sm:gap-2 rounded-md border bg-background p-2 min-w-0 w-full"
                                            >
                                                <span
                                                    className="flex-1 min-w-0 truncate text-xs text-muted-foreground"
                                                    title={url}
                                                >
                                                    {url}
                                                </span>
                                                <div className="flex gap-1 sm:gap-2 flex-shrink-0">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handlePlayPreviewAudio(url)}
                                                        disabled={isPlaying}
                                                        title="Play audio"
                                                        className="h-7 w-7 min-w-7 p-0 sm:h-8 sm:w-8 sm:min-w-8"
                                                    >
                                                        <Volume2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant={formData.audioUrl === url ? "default" : "outline"}
                                                        size="sm"
                                                        onClick={() => handleSelectAudioUrl(url)}
                                                        title="Use this audio"
                                                        className="h-7 min-w-[2.5rem] px-2 text-xs sm:h-8 sm:min-w-10"
                                                    >
                                                        {formData.audioUrl === url ? (
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
                    </div>

                    <DialogFooter className="gap-2 sm:gap-2">
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
