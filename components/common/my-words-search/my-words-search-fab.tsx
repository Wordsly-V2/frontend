"use client";

import { MyWordsSearchDialog } from "@/components/common/my-words-search/my-words-search-dialog";
import { Button } from "@/components/ui/button";
import { useTextSelection } from "@/hooks/useTextSelection.hook";
import { useUser } from "@/hooks/useUser.hook";
import { appChromeFor } from "@/lib/app-nav";
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
 * Highlighting a word anywhere turns into a floating "Search <word>" pill,
 * bottom-right, that opens the search dialog already searching for it. The
 * plain search button lives in the app frame (sidebar, mobile top bar).
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
    /**
     * The same text, as state: on touch the press itself collapses the
     * selection, and the pill must stay mounted until the click lands.
     */
    const [heldText, setHeldText] = useState("");
    const shownText = selectedText || heldText;

    if (!profile || pathname.startsWith("/auth")) return null;

    /** The mobile tab bar is only part of the app frame, never of a session. */
    const tabBarPresent = appChromeFor(pathname) === "app";

    const openWith = (nextQuery: string) => {
        setQuery(nextQuery);
        setOpen(true);
        if (nextQuery) clearSelection();
    };

    return (
        <>
            <div
                hidden={!shownText}
                className={cn(
                    // Above the bottom tab bar's own z-40, which is full-width and
                    // would otherwise swallow taps on this button.
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
                <Button
                    type="button"
                    onPointerDown={(e) => {
                        // Read the selection while it still exists…
                        pendingQueryRef.current = selectedText;
                        setHeldText(selectedText);
                        // …and on desktop keep it, so the highlight survives the press.
                        if (e.pointerType === "mouse") e.preventDefault();
                    }}
                    onClick={() => {
                        openWith(pendingQueryRef.current || selectedText);
                        pendingQueryRef.current = "";
                        setHeldText("");
                    }}
                    onPointerCancel={() => setHeldText("")}
                    aria-label={`Search ${shownText}`}
                    className="h-12 max-w-[min(18rem,calc(100vw-2rem))] gap-2 rounded-full px-4 text-white shadow-2xl shadow-primary/25 gradient-brand hover:opacity-95"
                >
                    <Search className="h-4 w-4 shrink-0" />
                    <span className="truncate font-semibold">{shownText}</span>
                </Button>
            </div>

            <MyWordsSearchDialog open={open} onOpenChange={setOpen} initialQuery={query} />
        </>
    );
}
