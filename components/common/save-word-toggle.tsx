"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
    useGetSavedWordsQuery,
    useToggleSavedWordMutation,
} from "@/queries/saved-words.query";
import { useAppSelector } from "@/store/hooks";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { toast } from "sonner";

interface SaveWordToggleProps {
    wordId: string;
    /** Compact icon-only form, for a crowded practice header. */
    iconOnly?: boolean;
    className?: string;
}

/**
 * Flag the word on screen as difficult, so it lands on the learner's own list.
 *
 * Deliberately separate from the scheduler's automatic leech detection: that
 * one notices a word after enough lapses, this one lets the learner say so the
 * moment they feel it — including for a word they got right but only barely.
 * Both feed the same "Difficult words" screen.
 *
 * The list is fetched unscoped so the flag reads the same whichever course the
 * word is being practised from.
 */
export function SaveWordToggle({
    wordId,
    iconOnly,
    className,
}: Readonly<SaveWordToggleProps>) {
    const userLoginId = useAppSelector(
        (state) => state.user.profile?.userLoginId ?? null,
    );
    const { data } = useGetSavedWordsQuery();
    const toggle = useToggleSavedWordMutation({}, userLoginId);

    const isSaved =
        data?.savedWords.some((word) => word.wordId === wordId) ?? false;

    const handleClick = () => {
        toggle.mutate(
            { wordId, saved: !isSaved },
            {
                onSuccess: () => {
                    toast.success(
                        isSaved
                            ? "Removed from your difficult words"
                            : "Saved — you can practice it any time",
                    );
                },
                onError: () => toast.error("Couldn't save that word"),
            },
        );
    };

    return (
        <Button
            type="button"
            variant="ghost"
            size={iconOnly ? "icon" : "sm"}
            onClick={handleClick}
            disabled={toggle.isPending}
            aria-pressed={isSaved}
            aria-label={
                isSaved ? "Remove from difficult words" : "Save as a difficult word"
            }
            className={cn(
                "shrink-0 rounded-xl",
                isSaved && "text-amber-600 dark:text-amber-400",
                className,
            )}
        >
            {isSaved ? (
                <BookmarkCheck className="h-4 w-4" aria-hidden />
            ) : (
                <Bookmark className="h-4 w-4" aria-hidden />
            )}
            {!iconOnly && (
                <span className="ml-1.5">{isSaved ? "Saved" : "Hard word"}</span>
            )}
        </Button>
    );
}
