"use client";

import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useDebounce } from "@/hooks/useDebounce";
import { useSearchMyWordsQuery } from "@/queries/words.query";
import { IUserWordSearchResult } from "@/types/courses/courses.type";
import { Search } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";

export interface MyWordsSearchProps {
    onSelect: (item: IUserWordSearchResult) => void;
    placeholder?: string;
    className?: string;
    inputClassName?: string;
}

export function MyWordsSearch({
    onSelect,
    placeholder = "Search your words...",
    className,
    inputClassName,
}: Readonly<MyWordsSearchProps>) {
    const [value, setValue] = useState("");
    const debouncedQuery = useDebounce(value.trim(), 300);
    const { data: results, isLoading } = useSearchMyWordsQuery(debouncedQuery, true);
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const showList = open && value.trim().length > 0 && (isLoading || results !== undefined);

    const handleSelect = (item: IUserWordSearchResult) => {
        onSelect(item);
        setValue("");
        setOpen(false);
    };

    return (
        <div className={`relative min-w-0 max-w-[220px] sm:max-w-[280px] ${className ?? ""}`} ref={containerRef}>
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
                <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-lg border bg-popover shadow-lg max-h-72 overflow-y-auto">
                    {isLoading && (
                        <div className="flex items-center justify-center gap-2 p-4 text-sm text-muted-foreground">
                            <LoadingSpinner size="sm" label="Searching..." />
                        </div>
                    )}
                    {!isLoading && results && results.length > 0 && (
                        <ul className="py-1">
                            {results.map((item) => (
                                <li key={item.id}>
                                    <button
                                        type="button"
                                        className="w-full px-3 py-2.5 text-left text-sm hover:bg-muted focus:bg-muted focus:outline-none border-b border-border/50 last:border-b-0 flex gap-2.5"
                                        onClick={() => handleSelect(item)}
                                    >
                                        {item.imageUrl && (
                                            <span className="relative flex-shrink-0 w-9 h-9 rounded-md overflow-hidden bg-muted border">
                                                <Image
                                                    src={item.imageUrl}
                                                    alt=""
                                                    fill
                                                    loading="lazy"
                                                    className="object-cover"
                                                    sizes="36px"
                                                />
                                            </span>
                                        )}
                                        <span className="min-w-0 flex-1">
                                            <div className="flex items-baseline gap-2 flex-wrap">
                                                <span className="font-medium">{item.word}</span>
                                                {item.partOfSpeech && (
                                                    <span className="text-xs text-muted-foreground italic">
                                                        {item.partOfSpeech}
                                                    </span>
                                                )}
                                            </div>
                                            {item.meaning && (
                                                <p className="mt-0.5 text-muted-foreground text-xs line-clamp-2">
                                                    {item.meaning}
                                                </p>
                                            )}
                                            <p className="mt-1 text-xs text-muted-foreground/80">
                                                {item.courseName} · {item.lessonName}
                                            </p>
                                        </span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                    {!isLoading && results?.length === 0 && (
                        <div className="px-3 py-3 text-sm text-muted-foreground">No words found</div>
                    )}
                </div>
            )}
        </div>
    );
}
