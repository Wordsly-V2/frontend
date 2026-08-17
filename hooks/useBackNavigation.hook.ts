"use client";

import { getPreviousPathname, toPathname } from "@/lib/navigation-history";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

interface UseBackNavigationOptions {
    /**
     * Decide from the previous route whether `history.back()` reaches the same
     * place `href` names. Defaults to "the previous route had this pathname".
     */
    matchPrevious?: (previousPathname: string) => boolean;
}

/**
 * A back affordance that actually goes back — when going back is right.
 *
 * A "Back to courses" button that always pushes `/learn/courses` throws away
 * everything the list had in its URL: the learner returns to page 1 of an
 * unfiltered list, at the top, having come from page 2. `history.back()` keeps
 * all of it (and Next restores the scroll position), but only if the previous
 * entry really is that list — otherwise it's a jump to somewhere unrelated, or
 * out of the app.
 *
 * So: back when the previous route matches, a normal navigation when it does
 * not, which also covers deep links and hard refreshes.
 */
export function useBackNavigation(
    href: string,
    { matchPrevious }: UseBackNavigationOptions = {},
) {
    const router = useRouter();

    const shouldGoBack = useCallback(() => {
        const previous = getPreviousPathname();
        if (previous === null) return false;
        return matchPrevious
            ? matchPrevious(previous)
            : previous === toPathname(href);
    }, [href, matchPrevious]);

    /** For `onClick`/`onBack` callbacks that aren't anchors. */
    const navigate = useCallback(() => {
        if (shouldGoBack()) router.back();
        else router.push(href);
    }, [href, router, shouldGoBack]);

    /**
     * For a real `<Link href={href}>`: intercepts a plain left click into
     * `history.back()` and otherwise lets the link navigate itself — so
     * ctrl/cmd-click and "open in new tab" keep working.
     */
    const onClick = useCallback(
        (event: React.MouseEvent) => {
            if (
                event.defaultPrevented ||
                event.button !== 0 ||
                event.metaKey ||
                event.ctrlKey ||
                event.shiftKey ||
                event.altKey
            ) {
                return;
            }
            if (!shouldGoBack()) return;
            event.preventDefault();
            router.back();
        },
        [router, shouldGoBack],
    );

    return { href, navigate, onClick };
}
