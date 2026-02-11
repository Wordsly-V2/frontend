"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useDebounce } from "@/hooks/useDebounce";
import { useSearchWordsQuery } from "@/queries/dictionary.query";
import { IWordSearchResult } from "@/types/courses/courses.type";
import { useRef, useState } from "react";

export interface WordAutocompleteProps {
    value: string;
    onChange: (value: string) => void;
    onSelect?: (item: IWordSearchResult) => void;
    label?: React.ReactNode;
    id?: string;
    placeholder?: string;
    required?: boolean;
    className?: string;
    inputClassName?: string;
    autoComplete?: "on" | "off";
}

export function WordAutocomplete({
    value,
    onChange,
    onSelect,
    label,
    id = "word",
    placeholder = "e.g., hello",
    required = false,
    className,
    inputClassName,
    autoComplete = "off",
}: Readonly<WordAutocompleteProps>) {
    const debouncedQuery = useDebounce(value.trim(), 300);
    const { data: searchWords, isLoading: isSearchWordsLoading } = useSearchWordsQuery(
        debouncedQuery,
        debouncedQuery.length > 0
    );
    const [suggestionsOpen, setSuggestionsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const showSuggestions =
        suggestionsOpen &&
        value.trim().length > 0 &&
        (isSearchWordsLoading || searchWords !== undefined);

    const handleSelect = (item: IWordSearchResult) => {
        onChange(item.word);
        onSelect?.(item);
        setSuggestionsOpen(false);
    };

    return (
        <div className={`space-y-2 relative min-w-0 ${className ?? ""}`} ref={containerRef}>
            {label != null && (
                <Label htmlFor={id} className="text-sm">
                    {label}
                </Label>
            )}
            <Input
                id={id}
                placeholder={placeholder}
                value={value}
                onChange={(e) => {
                    onChange(e.target.value);
                    setSuggestionsOpen(true);
                }}
                onFocus={() => value.trim() && setSuggestionsOpen(true)}
                onBlur={() => setTimeout(() => setSuggestionsOpen(false), 150)}
                required={required}
                className={`text-sm sm:text-base min-w-0 ${inputClassName ?? ""}`}
                autoComplete={autoComplete}
            />
            {showSuggestions && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-md border bg-popover shadow-md max-h-56 overflow-y-auto">
                    {isSearchWordsLoading && (
                        <div className="flex items-center justify-center gap-2 p-3 text-sm text-muted-foreground">
                            <LoadingSpinner size="sm" />
                            <span>Searching...</span>
                        </div>
                    )}
                    {!isSearchWordsLoading && searchWords && searchWords.length > 0 && (
                        <ul className="py-1">
                            {searchWords.map((item, idx) => (
                                <li
                                    key={`${item.word}-${item.meaning ?? ""}-${item.partOfSpeech ?? ""}-${idx}`}
                                >
                                    <button
                                        type="button"
                                        className="w-full px-3 py-2.5 text-left text-sm hover:bg-muted focus:bg-muted focus:outline-none border-b border-border/50 last:border-b-0"
                                        onClick={() => handleSelect(item)}
                                    >
                                        <div className="flex items-baseline gap-2 flex-wrap">
                                            <span className="font-medium">{item.word}</span>
                                            {item.partOfSpeech && (
                                                <span className="text-xs text-muted-foreground italic">
                                                    {item.partOfSpeech}
                                                </span>
                                            )}
                                        </div>
                                        {item.meaning && (
                                            <p className="mt-0.5 text-muted-foreground text-xs sm:text-sm line-clamp-2">
                                                {item.meaning}
                                            </p>
                                        )}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                    {!isSearchWordsLoading && searchWords?.length === 0 && (
                        <div className="px-3 py-2 text-sm text-muted-foreground">No words found</div>
                    )}
                </div>
            )}
        </div>
    );
}
