"use client";

import { MyWordsSearchDialog } from "@/components/common/my-words-search/my-words-search-dialog";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import { useState } from "react";

interface SearchWordsButtonProps {
    /** `row`: a search-box look with a label (open sidebar). `icon`: a round icon button. */
    variant?: "row" | "icon";
    className?: string;
}

/** Opens the "search your words" dialog. Used by the sidebar and the mobile top bar. */
export function SearchWordsButton({ variant = "icon", className }: Readonly<SearchWordsButtonProps>) {
    const [open, setOpen] = useState(false);

    return (
        <>
            {variant === "row" ? (
                <button
                    type="button"
                    onClick={() => setOpen(true)}
                    className={cn(
                        "flex h-10 w-full items-center gap-2.5 rounded-xl border border-border/70 bg-muted/40 px-3 text-sm text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        className,
                    )}
                >
                    <Search className="h-4 w-4 shrink-0" aria-hidden />
                    <span className="truncate">Search your words</span>
                </button>
            ) : (
                <button
                    type="button"
                    onClick={() => setOpen(true)}
                    aria-label="Search your words"
                    className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        className,
                    )}
                >
                    <Search className="h-5 w-5" aria-hidden />
                </button>
            )}
            <MyWordsSearchDialog open={open} onOpenChange={setOpen} />
        </>
    );
}
