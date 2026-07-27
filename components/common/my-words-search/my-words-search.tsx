"use client";

import { MyWordsSearchResults, useMyWordsSearchRows } from "@/components/common/my-words-search/search-results";
import { useWordDetailDialogs } from "@/components/common/my-words-search/use-word-detail-dialogs";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/useDebounce.hook";
import { IUserWordSearchResult, IWordSearchResult } from "@/types/courses/courses.type";
import { Search } from "lucide-react";
import { useState } from "react";

export interface MyWordsSearchProps {
    onSelect?: (item: IUserWordSearchResult) => void;
    placeholder?: string;
    className?: string;
    inputClassName?: string;
}

/**
 * Inline search box with a dropdown of results — used in the desktop nav.
 * On small screens use `MyWordsSearchFab`, which opens the same search in a
 * dialog instead of squeezing a dropdown under a ~150px input.
 */
export function MyWordsSearch({
    onSelect,
    placeholder = "Search your words...",
    className,
    inputClassName,
}: Readonly<MyWordsSearchProps>) {
    const [value, setValue] = useState("");
    const debouncedQuery = useDebounce(value.trim(), 300);
    const [open, setOpen] = useState(false);
    const { rows, isLoading, hasAnswer, hasResults } = useMyWordsSearchRows(debouncedQuery);
    const { openUserWord, openDictWord, dialogs } = useWordDetailDialogs();

    const hasQuery = value.trim().length > 0;
    const showList = open && hasQuery && (isLoading || hasResults || hasAnswer);

    const handleSelectUserWord = (item: IUserWordSearchResult) => {
        onSelect?.(item);
        openUserWord(item);
        setValue("");
        setOpen(false);
    };

    const handleSelectDictWord = (item: IWordSearchResult) => {
        openDictWord(item);
        setValue("");
        setOpen(false);
    };

    return (
        <div className={`relative min-w-0 max-w-[220px] sm:max-w-[280px] ${className ?? ""}`}>
            <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => {
                        setValue(e.target.value);
                        setOpen(true);
                    }}
                    onFocus={() => value.trim() && setOpen(true)}
                    onBlur={() => setTimeout(() => setOpen(false), 180)}
                    className={`pl-8 h-8 sm:h-9 text-sm bg-muted/50 border-border/80 ${inputClassName ?? ""}`}
                    autoComplete="off"
                />
            </div>
            {showList && (
                <div
                    /* Width is intentionally decoupled from the narrow nav input, and
                       right-anchored so the panel never overflows the viewport. */
                    className="absolute top-full right-0 z-50 mt-1 w-[min(92vw,24rem)] min-w-full rounded-lg border bg-popover shadow-lg"
                >
                    <MyWordsSearchResults
                        rows={rows}
                        isLoading={isLoading}
                        onSelectUserWord={handleSelectUserWord}
                        onSelectDictWord={handleSelectDictWord}
                        className="max-h-[min(70vh,26rem)]"
                    />
                </div>
            )}
            {dialogs}
        </div>
    );
}
