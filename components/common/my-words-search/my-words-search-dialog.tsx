"use client";

import { MyWordsSearchResults, useMyWordsSearchRows } from "@/components/common/my-words-search/search-results";
import { useWordDetailDialogs } from "@/components/common/my-words-search/use-word-detail-dialogs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/useDebounce.hook";
import { IUserWordSearchResult, IWordSearchResult } from "@/types/courses/courses.type";
import { Search } from "lucide-react";
import { useState } from "react";

export interface MyWordsSearchDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** Prefills the box and searches straight away (e.g. a highlighted word). */
    initialQuery?: string;
    onSelect?: (item: IUserWordSearchResult) => void;
}

/** Full-width search surface for small screens. */
export function MyWordsSearchDialog({
    open,
    onOpenChange,
    initialQuery = "",
    onSelect,
}: Readonly<MyWordsSearchDialogProps>) {
    const { openUserWord, openDictWord, dialogs } = useWordDetailDialogs();

    const handleSelectUserWord = (item: IUserWordSearchResult) => {
        onSelect?.(item);
        openUserWord(item);
        onOpenChange(false);
    };

    const handleSelectDictWord = (item: IWordSearchResult) => {
        openDictWord(item);
        onOpenChange(false);
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="top-[8%] translate-y-0 gap-3 p-4 sm:max-w-lg">
                    <DialogHeader className="text-left">
                        <DialogTitle className="text-base">Search words</DialogTitle>
                        <DialogDescription className="text-xs">
                            Your words and the dictionary.
                        </DialogDescription>
                    </DialogHeader>
                    {/* Keyed on the seed query so each opening starts fresh —
                        the body unmounts on close, so no reset effect is needed. */}
                    <SearchBody
                        key={initialQuery}
                        initialQuery={initialQuery}
                        onSelectUserWord={handleSelectUserWord}
                        onSelectDictWord={handleSelectDictWord}
                    />
                </DialogContent>
            </Dialog>
            {dialogs}
        </>
    );
}

function SearchBody({
    initialQuery,
    onSelectUserWord,
    onSelectDictWord,
}: Readonly<{
    initialQuery: string;
    onSelectUserWord: (item: IUserWordSearchResult) => void;
    onSelectDictWord: (item: IWordSearchResult) => void;
}>) {
    const [value, setValue] = useState(initialQuery);
    const debouncedQuery = useDebounce(value.trim(), 300);
    const { rows, isLoading, hasAnswer, hasResults } = useMyWordsSearchRows(debouncedQuery);

    const hasQuery = value.trim().length > 0;
    const showList = hasQuery && (isLoading || hasResults || hasAnswer);

    return (
        <>
            <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                    autoFocus
                    placeholder="Search a word..."
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="pl-8 h-10 text-base bg-muted/50 border-border/80"
                    autoComplete="off"
                />
            </div>
            {showList ? (
                <MyWordsSearchResults
                    rows={rows}
                    isLoading={isLoading}
                    onSelectUserWord={onSelectUserWord}
                    onSelectDictWord={onSelectDictWord}
                    className="max-h-[55dvh] rounded-lg border"
                />
            ) : (
                <p className="px-1 py-6 text-center text-sm text-muted-foreground">
                    Type a word to start, or highlight one on the page.
                </p>
            )}
        </>
    );
}
