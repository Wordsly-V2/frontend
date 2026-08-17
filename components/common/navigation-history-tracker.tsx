"use client";

import { recordVisit } from "@/lib/navigation-history";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Feeds `lib/navigation-history` from the router. Mounted once in the root
 * layout; renders nothing.
 */
export function NavigationHistoryTracker() {
    const pathname = usePathname();

    useEffect(() => {
        recordVisit(pathname);
    }, [pathname]);

    return null;
}
