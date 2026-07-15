"use client";

import { WordAutocomplete } from "@/components/common/word-autocomplete";
import WordDetailCard, {
    type WordDetailCardWord,
} from "@/components/features/vocabulary/word-detail-card";
import QuickAddWordDialog from "@/components/features/manage/quick-add-word-dialog";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
    useFetchWordDetailsDictionaryQuery,
    useLangeekWordDetailsQuery,
} from "@/queries/dictionary.query";
import type { WordDetailView } from "@/types/courses/courses.type";
import { BookOpen, Plus } from "lucide-react";
import { useMemo, useState } from "react";

export interface DictionaryLookupDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

/** Find an audio url whose pronunciation type mentions the given accent. */
function findAccentAudio(
    pronunciation: { type: string; url: string }[],
    accent: "uk" | "us",
): string | undefined {
    return pronunciation.find((p) => p.type?.toLowerCase().includes(accent))?.url;
}

/**
 * Learner dictionary lookup: search a word, preview its rich detail card
 * (pronunciation, examples, image), and add it to one of your lessons.
 */
export function DictionaryLookupDialog({
    open,
    onOpenChange,
}: Readonly<DictionaryLookupDialogProps>) {
    const [inputValue, setInputValue] = useState("");
    const [selected, setSelected] = useState<{
        word: string;
        partOfSpeech: string;
    } | null>(null);
    const [quickAddOpen, setQuickAddOpen] = useState(false);

    const { data: details, isLoading: isDetailsLoading } = useLangeekWordDetailsQuery(
        selected?.word ?? "",
        selected?.partOfSpeech ?? "",
        !!selected && open,
    );

    const { data: pronunciationData } = useFetchWordDetailsDictionaryQuery(
        selected?.word ?? "",
        !!selected && open,
    );

    // Build a WordDetailCard-shaped word from the dictionary responses.
    const cardWord = useMemo<WordDetailCardWord | null>(() => {
        if (!details) return null;
        const pronunciation = pronunciationData?.pronunciation ?? [];
        const ipas = pronunciationData?.ipas ?? [];
        const ipa =
            ipas.find(
                (i) =>
                    i.partOfSpeech?.toLowerCase() ===
                    details.partOfSpeech?.toLowerCase(),
            ) ?? ipas[0];
        return {
            word: details.word,
            meaning: details.meaning,
            partOfSpeech: details.partOfSpeech,
            pronunciation: details.pronunciation,
            audioUrl: details.audioUrl,
            imageUrl: details.imageUrl,
            example: JSON.stringify(details.examples ?? []),
            ukAudioUrl: findAccentAudio(pronunciation, "uk"),
            usAudioUrl: findAccentAudio(pronunciation, "us"),
            ukIpa: ipa?.uk ?? undefined,
            usIpa: ipa?.us ?? undefined,
        };
    }, [details, pronunciationData]);

    const quickAddWord = useMemo<WordDetailView | null>(() => {
        if (!details) return null;
        return {
            word: details.word,
            meaning: details.meaning,
            pronunciation: details.pronunciation,
            partOfSpeech: details.partOfSpeech,
            audioUrl: details.audioUrl,
            imageUrl: details.imageUrl,
            example: JSON.stringify(details.examples ?? []),
        };
    }, [details]);

    const handleSelect = (item: { word: string; partOfSpeech: string }) => {
        setSelected({ word: item.word, partOfSpeech: item.partOfSpeech ?? "" });
    };

    const handleOpenChange = (next: boolean) => {
        if (!next) {
            setInputValue("");
            setSelected(null);
            setQuickAddOpen(false);
        }
        onOpenChange(next);
    };

    return (
        <>
            <Dialog open={open} onOpenChange={handleOpenChange}>
                <DialogContent className="max-w-2xl max-h-[85dvh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
                            <BookOpen className="h-5 w-5 text-primary" aria-hidden />
                            Look up a word
                        </DialogTitle>
                        <DialogDescription>
                            Search the dictionary to see meaning, examples, and how to say
                            it.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <WordAutocomplete
                            value={inputValue}
                            onChange={setInputValue}
                            onSelect={handleSelect}
                            placeholder="Search a word, e.g. curious"
                            id="dictionary-lookup"
                        />

                        {selected && isDetailsLoading && (
                            <div className="flex justify-center py-8">
                                <LoadingSpinner label="Loading details…" />
                            </div>
                        )}

                        {selected && !isDetailsLoading && !cardWord && (
                            <p className="py-6 text-center text-sm text-muted-foreground">
                                No details found for &ldquo;{selected.word}&rdquo;.
                            </p>
                        )}

                        {cardWord && (
                            <div className="space-y-4">
                                <WordDetailCard word={cardWord} layout="stack" />
                                <div className="flex justify-end">
                                    <Button onClick={() => setQuickAddOpen(true)}>
                                        <Plus className="h-4 w-4 sm:mr-2" />
                                        <span className="hidden sm:inline">Add to a lesson</span>
                                        <span className="sm:hidden">Add</span>
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <QuickAddWordDialog
                isOpen={quickAddOpen}
                onClose={() => setQuickAddOpen(false)}
                initialWord={quickAddWord}
            />
        </>
    );
}
