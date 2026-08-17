"use client";

import { coursesListSearchParams } from "@/lib/search-params/courses-list";
import { useQueryStates } from "nuqs";
import { useCallback, useEffect, useState } from "react";

interface UseCoursesListParamsOptions {
    /** Runs after a page change so the caller can bring its list back into view. */
    onPageChange?: (page: number) => void;
    searchDebounceMs?: number;
}

/**
 * URL-owned state for a course library list.
 *
 * Two history rules, and they are the whole point of this hook:
 *
 * - **A page is a destination — it is pushed.** The list previously replaced the
 *   current entry, so opening a course from page 2 and pressing Back returned to
 *   page 1: the entry Back restored had never recorded `?page=2`.
 * - **Typing is not a destination — it replaces, on a debounce.** Pushing per
 *   keystroke would bury the previous screen under one entry per character, and
 *   writing the URL per keystroke fires a request per character.
 *
 * The search box therefore keeps its own immediate draft while the URL (and the
 * query key built from it) lags by `searchDebounceMs`. A Back/forward that
 * changes `?q=` behind our back wins over the draft.
 */
export function useCoursesListParams({
    onPageChange,
    searchDebounceMs = 350,
}: UseCoursesListParamsOptions = {}) {
    const [{ q: searchQuery, page }, setParams] = useQueryStates(coursesListSearchParams);

    const [searchInput, setSearchInput] = useState(searchQuery);
    const [syncedSearch, setSyncedSearch] = useState(searchQuery);

    // `?q=` moved without us typing — a Back/forward, a shared link, or our own
    // debounced write landing. Re-seed the draft from the URL. Adjusting state
    // during render is React's recommended alternative to a syncing effect.
    if (searchQuery !== syncedSearch) {
        setSyncedSearch(searchQuery);
        setSearchInput(searchQuery);
    }

    useEffect(() => {
        if (searchInput === searchQuery) return;
        const timer = setTimeout(() => {
            // A new search invalidates the current page number.
            void setParams({ q: searchInput, page: 1 }, { history: "replace" });
        }, searchDebounceMs);
        return () => clearTimeout(timer);
    }, [searchInput, searchQuery, searchDebounceMs, setParams]);

    const setPage = useCallback(
        (nextPage: number) => {
            void setParams({ page: nextPage }, { history: "push" });
            onPageChange?.(nextPage);
        },
        [onPageChange, setParams],
    );

    /** After a create/delete shifts the list, go back to the top of it. */
    const resetPage = useCallback(() => {
        void setParams({ page: 1 }, { history: "replace" });
    }, [setParams]);

    /**
     * Pull an out-of-range `?page=` back into range once the server has said how
     * many pages exist — a bookmarked `?page=9` on a 3-page list otherwise shows
     * a permanently empty grid. Replaces, because the bad page is not somewhere
     * the learner should be able to press Back into.
     */
    const clampPage = useCallback(
        (totalPages: number | undefined) => {
            if (totalPages === undefined) return;
            const target = Math.min(Math.max(page, 1), Math.max(totalPages, 1));
            if (target !== page) {
                void setParams({ page: target }, { history: "replace" });
            }
        },
        [page, setParams],
    );

    return {
        /** Debounced/URL value — feed this to the query. */
        searchQuery,
        /** Immediate value — feed this to the input. */
        searchInput,
        setSearchInput,
        page,
        setPage,
        resetPage,
        clampPage,
    };
}

/** Companion to `clampPage`, for callers that only know `totalPages` after the query. */
export function useClampPage(
    clampPage: (totalPages: number | undefined) => void,
    totalPages: number | undefined,
) {
    useEffect(() => {
        clampPage(totalPages);
    }, [clampPage, totalPages]);
}
