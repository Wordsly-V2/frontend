"use client";

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { IWord } from "@/types/courses/courses.type";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

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
        setFormData({
            word: "",
            meaning: "",
            pronunciation: "",
            partOfSpeech: "",
            audioUrl: "",
        });
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-lg">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>{title}</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="word">
                                    Word <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="word"
                                    placeholder="e.g., hello"
                                    value={formData.word}
                                    onChange={(e) => setFormData({ ...formData, word: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="meaning">
                                    Meaning <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="meaning"
                                    placeholder="e.g., xin chào"
                                    value={formData.meaning}
                                    onChange={(e) => setFormData({ ...formData, meaning: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="pronunciation">Pronunciation (IPA)</Label>
                                <Input
                                    id="pronunciation"
                                    placeholder="e.g., həˈloʊ"
                                    value={formData.pronunciation}
                                    onChange={(e) => setFormData({ ...formData, pronunciation: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="partOfSpeech">Part of Speech</Label>
                                <Input
                                    id="partOfSpeech"
                                    placeholder="e.g., noun, verb"
                                    value={formData.partOfSpeech}
                                    onChange={(e) => setFormData({ ...formData, partOfSpeech: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="audioUrl">Audio URL</Label>
                            <Input
                                id="audioUrl"
                                type="url"
                                placeholder="https://..."
                                value={formData.audioUrl}
                                onChange={(e) => setFormData({ ...formData, audioUrl: e.target.value })}
                            />
                            <p className="text-xs text-muted-foreground">
                                URL to pronunciation audio file
                            </p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                        {
                                isLoading ? (
                                    <LoadingSpinner size="sm" />
                                ) : (
                                    word ? 'Update' : 'Add'
                                )
                            }
                            Word
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
