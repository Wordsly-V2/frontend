"use client";

import type { LangeekWordDetailsResponse } from "@/apis/dictionary.api";
import QuickAddWordDialog from "@/components/features/manage/quick-add-word-dialog";
import WordDetailDialog from "@/components/features/manage/word-detail-dialog";
import { useLangeekWordDetailsQuery } from "@/queries/dictionary.query";
import { useGetWordsByIdsQuery } from "@/queries/words.query";
import { IUserWordSearchResult, IWordSearchResult, WordDetailView } from "@/types/courses/courses.type";
import { useState } from "react";

function langeekToWordDetailView(d: LangeekWordDetailsResponse): WordDetailView {
    return {
        word: d.word,
        meaning: d.meaning,
        partOfSpeech: d.partOfSpeech,
        pronunciation: d.pronunciation || undefined,
        audioUrl: d.audioUrl || undefined,
        imageUrl: d.imageUrl || undefined,
        // Examples are persisted as a JSON array of { text, translation?, audioUrl? }.
        example: d.examples?.length ? JSON.stringify(d.examples) : undefined,
    };
}

/**
 * Owns the "word detail" + "quick add" dialogs opened from a search result, so
 * every search surface (nav dropdown, mobile dialog) behaves identically.
 */
export function useWordDetailDialogs() {
    const [detailUserWord, setDetailUserWord] = useState<IUserWordSearchResult | null>(null);
    const [detailDictWord, setDetailDictWord] = useState<IWordSearchResult | null>(null);
    const [quickAddWord, setQuickAddWord] = useState<WordDetailView | null>(null);

    const { data: fullUserWord, isError: isUserWordError } = useGetWordsByIdsQuery(
        detailUserWord?.courseId ?? "",
        detailUserWord ? [detailUserWord.id] : [],
        !!detailUserWord
    );
    const {
        data: langeekDetails,
        isSuccess: isLangeekSuccess,
        isError: isLangeekError,
    } = useLangeekWordDetailsQuery(
        detailDictWord?.word ?? "",
        detailDictWord?.partOfSpeech ?? "",
        !!detailDictWord
    );

    const dialogOpen = !!detailUserWord || !!detailDictWord;
    /* A failed lookup has to end the spinner too. Now that the dialog mounts
       while the fetch is in flight, treating only "fetched, but empty" as an
       answer would leave an error spinning until the learner closed it. */
    const dialogNotFound =
        (!!detailDictWord && ((isLangeekSuccess && langeekDetails == null) || isLangeekError)) ||
        (!!detailUserWord && isUserWordError);
    const dialogWord: WordDetailView | null = (() => {
        if (detailUserWord && fullUserWord?.[0]) {
            return { ...fullUserWord[0], courseId: detailUserWord.courseId, lessonId: detailUserWord.lessonId };
        }
        if (detailDictWord && langeekDetails) {
            return langeekToWordDetailView(langeekDetails);
        }
        return null;
    })();
    const dialogLoadingSpinner =
        !dialogNotFound &&
        ((!!detailUserWord && !fullUserWord?.length) ||
            (!!detailDictWord && !isLangeekSuccess));

    const closeDialog = () => {
        setDetailUserWord(null);
        setDetailDictWord(null);
    };

    const openUserWord = (item: IUserWordSearchResult) => {
        setDetailUserWord(item);
        setDetailDictWord(null);
    };

    const openDictWord = (item: IWordSearchResult) => {
        setDetailDictWord(item);
        setDetailUserWord(null);
    };

    const dialogs = (
        <>
            {/* Mounted as soon as a word is picked, not once its details land:
                the dialog renders its own spinner and "not available" states,
                and gating on `dialogWord` made both unreachable — a click on a
                dictionary result showed nothing at all until the (external,
                multi-hop) lookup returned. */}
            {dialogOpen && (
                <WordDetailDialog
                    word={dialogWord}
                    isOpen={dialogOpen}
                    onClose={closeDialog}
                    courseId={detailUserWord?.courseId}
                    lessonId={detailUserWord?.lessonId}
                    isLoading={dialogLoadingSpinner}
                    isNotFound={dialogNotFound}
                    onQuickAdd={
                        detailDictWord
                            ? (word) => {
                                  closeDialog();
                                  setQuickAddWord(word);
                              }
                            : undefined
                    }
                />
            )}
            <QuickAddWordDialog
                isOpen={!!quickAddWord}
                onClose={() => setQuickAddWord(null)}
                initialWord={quickAddWord}
            />
        </>
    );

    return { openUserWord, openDictWord, dialogs };
}
