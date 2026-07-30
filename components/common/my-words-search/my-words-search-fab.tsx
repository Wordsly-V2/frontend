"use client";

import { MyWordsSearchDialog } from "@/components/common/my-words-search/my-words-search-dialog";
import { Button } from "@/components/ui/button";
import { useTextSelection } from "@/hooks/useTextSelection.hook";
import { useUser } from "@/hooks/useUser.hook";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/** True while a page renders its own bottom-right `FloatingActionMenu`. */
function usePageFabPresent() {
    const pathname = usePathname();
    const [present, setPresent] = useState(false);

    useEffect(() => {
        const check = () => setPresent(!!document.querySelector("[data-page-fab]"));
        check();
        // Page FABs mount with their page and can appear after data loads.
        const observer = new MutationObserver(check);
        observer.observe(document.body, { childList: true, subtree: true });
        return () => observer.disconnect();
    }, [pathname]);

    return present;
}

/**
 * Floating search button, bottom-right.
 *
 * - Below `sm` it replaces the nav's inline search box (too narrow there for a
 *   useful dropdown) and opens the results in a dialog instead. Like that nav
 *   search box, it stays available on every screen (practice included).
 * - At any size, highlighting a word turns it into a "Search <word>" pill that
 *   opens the dialog already searching for that word.
 */
export function MyWordsSearchFab() {
    const pathname = usePathname() ?? "";
    const { profile } = useUser();
    const { selectedText, clearSelection } = useTextSelection();
    const pageFabPresent = usePageFabPresent();
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    /** Selection captured at press time — it may be gone by the click. */
    const pendingQueryRef = useRef("");

    if (!profile || pathname.startsWith("/auth")) return null;

    /** The bottom tab bar hides itself during the immersive practice flow. */
    const tabBarPresent = !pathname.startsWith("/learn/practice");

    const openWith = (nextQuery: string) => {
        setQuery(nextQuery);
        setOpen(true);
        if (nextQuery) clearSelection();
    };

    return (
        <>
            <div
                className={cn(
                    // Above the bottom tab bar's own z-40: the bar is full-width
                    // (only its card looks narrow) and renders later in the DOM,
                    // so at equal z-index it would swallow taps on this button.
                    "fixed right-4 z-50",
                    /* Two offsets to clear: the bottom tab bar (visible until `lg`,
                       and absent entirely during practice) and the page's own FAB,
                       above which this one stacks by a button height. */
                    tabBarPresent
                        ? pageFabPresent
                            ? "bottom-[calc(4.75rem+4.25rem+env(safe-area-inset-bottom))] lg:bottom-[calc(4.25rem+max(1rem,env(safe-area-inset-bottom)))]"
                            : "bottom-[calc(4.75rem+env(safe-area-inset-bottom))] lg:bottom-[max(1rem,env(safe-area-inset-bottom))]"
                        : pageFabPresent
                          ? "bottom-[calc(4.25rem+max(1rem,env(safe-area-inset-bottom)))]"
                          : "bottom-[max(1rem,env(safe-area-inset-bottom))]",
                )}
            >
                {/* One button in both states, never two: on touch, tapping the pill
                    collapses the selection, and swapping in a different element
                    between pointerdown and click would eat the tap. */}
                <Button
                    type="button"
                    onPointerDown={(e) => {
                        // Read the selection while it still exists…
                        pendingQueryRef.current = selectedText;
                        // …and on desktop keep it, so the highlight survives the press.
                        if (e.pointerType === "mouse") e.preventDefault();
                    }}
                    onClick={() => {
                        openWith(pendingQueryRef.current || selectedText);
                        pendingQueryRef.current = "";
                    }}
                    aria-label={selectedText ? `Search ${selectedText}` : "Search words"}
                    className={cn(
                        "rounded-full shadow-2xl shadow-primary/25 gradient-brand text-white hover:opacity-95",
                        selectedText
                            ? "h-12 max-w-[min(18rem,calc(100vw-2rem))] gap-2 px-4"
                            : // Without a selection the nav's inline search covers sm+.
                              "h-14 w-14 sm:hidden",
                    )}
                >
                    <Search className={selectedText ? "h-4 w-4 shrink-0" : "h-5 w-5"} />
                    {selectedText && <span className="truncate font-semibold">{selectedText}</span>}
                </Button>
            </div>

            <MyWordsSearchDialog open={open} onOpenChange={setOpen} initialQuery={query} />
        </>
    );
}
