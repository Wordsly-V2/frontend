"use client";

import { leavesPageInApp } from "@/lib/admin-path/leave-guard";
import { useEffect } from "react";

const LEAVE_WARNING = "You have unsaved changes. Leave this page and lose them?";

/**
 * Warns before leaving the page with unsaved work: a reload or another site
 * through `beforeunload`, and a link inside the app by catching its click
 * before Next's `<Link>` sees it (the App Router has no navigation event to
 * cancel). Back and forward are not caught.
 */
export function useUnsavedWarning(dirty: boolean, message = LEAVE_WARNING): void {
    useEffect(() => {
        if (!dirty) return;
        const warn = (e: BeforeUnloadEvent) => e.preventDefault();
        const onClick = (e: MouseEvent) => {
            if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
            const link = e.target instanceof Element ? e.target.closest("a[href]") : null;
            if (!(link instanceof HTMLAnchorElement) || link.hasAttribute("download")) return;
            if (link.target && link.target !== "_self") return;
            if (!leavesPageInApp(link.href, globalThis.location.href)) return;
            if (globalThis.confirm(message)) return;
            // Capture on document runs before React's root listener: the Link never hears of it.
            e.preventDefault();
            e.stopPropagation();
        };
        globalThis.addEventListener("beforeunload", warn);
        document.addEventListener("click", onClick, true);
        return () => {
            globalThis.removeEventListener("beforeunload", warn);
            document.removeEventListener("click", onClick, true);
        };
    }, [dirty, message]);
}
