"use client";

import { adminUsersSearchParams } from "@/lib/search-params/admin-users";
import type { AssignableRole, UserStatus } from "@/types/admin-users/admin-users.type";
import { useQueryStates } from "nuqs";
import { useCallback, useEffect, useState } from "react";

/**
 * URL-owned state for `/admin/users`, with the history rules of
 * `useCoursesListParams`: a page is pushed, typing replaces on a debounce, and
 * any filter change goes back to page 1.
 */
export function useAdminUsersParams(searchDebounceMs = 350) {
    const [{ q, role, status, page }, setParams] = useQueryStates(adminUsersSearchParams);

    const [searchInput, setSearchInput] = useState(q);
    const [syncedSearch, setSyncedSearch] = useState(q);

    // `?q=` moved without us typing (Back/forward, a shared link, our own write).
    if (q !== syncedSearch) {
        setSyncedSearch(q);
        setSearchInput(q);
    }

    useEffect(() => {
        if (searchInput === q) return;
        const timer = setTimeout(() => {
            void setParams({ q: searchInput, page: 1 }, { history: "replace" });
        }, searchDebounceMs);
        return () => clearTimeout(timer);
    }, [searchInput, q, searchDebounceMs, setParams]);

    const setPage = useCallback(
        (next: number) => void setParams({ page: next }, { history: "push" }),
        [setParams],
    );
    const setRole = useCallback(
        (next: AssignableRole | null) => void setParams({ role: next, page: 1 }, { history: "replace" }),
        [setParams],
    );
    const setStatus = useCallback(
        (next: UserStatus | null) => void setParams({ status: next, page: 1 }, { history: "replace" }),
        [setParams],
    );

    return { q, searchInput, setSearchInput, role, setRole, status, setStatus, page, setPage };
}
