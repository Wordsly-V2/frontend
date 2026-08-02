"use client";

import { MyWordsSearchResults, useMyWordsSearchRows } from "@/components/common/my-words-search/search-results";
import { useWordDetailDialogs } from "@/components/common/my-words-search/use-word-detail-dialogs";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/useDebounce.hook";
import { IUserWordSearchResult, IWordSearchResult } from "@/types/courses/courses.type";
import { Search } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

/** Breathing room kept between the dropdown and the left edge of the viewport. */
const VIEWPORT_GUTTER = 12;

/** useLayoutEffect warns during SSR; the panel only ever renders client-side. */
const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

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

    /* The panel is right-anchored to a nav input that can sit far from the
       viewport edge, so a purely CSS width (92vw) spills off the left on
       medium screens. Clamp it to the space actually left of the input. */
    const anchorRef = useRef<HTMLDivElement>(null);
    const [maxWidth, setMaxWidth] = useState<number>();

    useIsomorphicLayoutEffect(() => {
        if (!showList) return;
        const update = () => {
            const right = anchorRef.current?.getBoundingClientRect().right;
            if (right != null) setMaxWidth(Math.max(right - VIEWPORT_GUTTER, 0));
        };
        update();
        window.addEventListener("resize", update);
        return () => window.removeEventListener("resize", update);
    }, [showList]);

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
            <div ref={anchorRef} className="relative">
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
                       right-anchored so the panel never overflows the viewport.
                       `maxWidth` keeps it inside the left edge too (see above). */
                    style={{ maxWidth }}
                    className="absolute top-full right-0 z-50 mt-1 w-[min(92vw,24rem)] min-w-full rounded-lg border bg-popover shadow-lg overflow-hidden"
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
